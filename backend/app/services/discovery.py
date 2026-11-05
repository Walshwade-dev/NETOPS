import ipaddress
import os
import platform
import re
import shutil
import socket
import subprocess
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.device import Device
from ..models.event import Event
from .device_classifier import classify_device
from .event_service import create_event
from .lan_intelligence import (
    get_default_gateway_ip,
    lookup_mac_vendor,
    probe_host_services,
)
from .vlan_policy import get_vlan_for_device_type

MAC_REGEX = re.compile(r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")
IPV4_REGEX = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def is_valid_ip_address(ip_address: str | None) -> bool:
    if not ip_address:
        return False

    try:
        ipaddress.ip_address(ip_address)
        return True
    except ValueError:
        return False


def normalize_mac(raw_mac: str | None) -> str | None:
    """Normalize any MAC representation (aa-bb-cc... or aabb.ccdd...) to AA:BB:CC:DD:EE:FF."""
    if not raw_mac:
        return None
    cleaned = raw_mac.strip().replace("-", ":").upper()
    # Handle single-digit hex octets occasionally emitted by BSD/macOS arp (e.g. 0:1a:2b:...)
    parts = cleaned.split(":")
    if len(parts) == 6 and all(1 <= len(p) <= 2 for p in parts):
        cleaned = ":".join(p.zfill(2) for p in parts)
    if not MAC_REGEX.match(cleaned):
        return None
    if cleaned in ("FF:FF:FF:FF:FF:FF", "00:00:00:00:00:00"):
        return None
    # Ignore IPv4 multicast MAC range (01:00:5E:...) and IPv6 multicast (33:33:...)
    if cleaned.startswith("01:00:5E:") or cleaned.startswith("33:33:"):
        return None
    return cleaned


def get_local_ip() -> str:
    """
    Platform-independent way to determine the primary local IPv4 address
    routed toward the default gateway (works on Linux, Windows, macOS).
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        local_ip = sock.getsockname()[0]
        if local_ip and not local_ip.startswith("127."):
            return local_ip
    except Exception:
        pass
    finally:
        sock.close()

    try:
        hostname = socket.gethostname()
        for addr in socket.gethostbyname_ex(hostname)[2]:
            if not addr.startswith("127."):
                return addr
    except Exception:
        pass

    return "127.0.0.1"


def get_active_interface() -> str | None:
    """
    Auto-detect the active network interface name across Linux, macOS, and Windows.
    Returns interface identifier (e.g. 'wlp1s0', 'eth0', 'en0') or None if unknown.
    """
    env_iface = os.environ.get("NETOPS_INTERFACE", "").strip()
    if env_iface:
        return env_iface

    system = platform.system().lower()
    local_ip = get_local_ip()

    if system == "linux" and shutil.which("ip"):
        # 1. Try matching the interface that owns local_ip
        try:
            res = subprocess.run(
                ["ip", "-o", "-4", "addr", "show"],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in res.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 4 and parts[1] != "lo":
                    cidr = parts[3]
                    if cidr.split("/")[0] == local_ip:
                        return parts[1]
        except Exception:
            pass

        # 2. Fallback to default route interface
        try:
            res = subprocess.run(
                ["ip", "-4", "route", "show", "default"],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in res.stdout.splitlines():
                parts = line.split()
                if "dev" in parts:
                    idx = parts.index("dev")
                    if idx + 1 < len(parts):
                        return parts[idx + 1]
        except Exception:
            pass

    elif system == "darwin" and shutil.which("route"):
        try:
            res = subprocess.run(
                ["route", "-n", "get", "default"],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in res.stdout.splitlines():
                line = line.strip()
                if line.startswith("interface:"):
                    return line.split(":", 1)[1].strip()
        except Exception:
            pass

    return None


def get_active_network_cidr() -> str:
    """
    Auto-detect the active IPv4 subnet in CIDR notation (e.g. '192.168.8.0/24')
    across Linux, Windows, and macOS, regardless of router or interface changes.
    """
    local_ip = get_local_ip()
    system = platform.system().lower()

    # 1. Linux via `ip -o -4 addr show`
    if system == "linux" and shutil.which("ip"):
        try:
            res = subprocess.run(
                ["ip", "-o", "-4", "addr", "show"],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in res.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 4 and parts[1] != "lo":
                    cidr = parts[3]
                    if cidr.split("/")[0] == local_ip:
                        return str(ipaddress.ip_network(cidr, strict=False))
        except Exception:
            pass

    # 2. Windows via `ipconfig`
    if system == "windows" and shutil.which("ipconfig"):
        try:
            res = subprocess.run(
                ["ipconfig"],
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )
            lines = res.stdout.splitlines()
            matched_ip = False
            for line in lines:
                if local_ip in line:
                    matched_ip = True
                elif matched_ip and "Subnet Mask" in line:
                    mask_match = IPV4_REGEX.search(line)
                    if mask_match:
                        mask = mask_match.group(0)
                        net = ipaddress.IPv4Network(
                            f"{local_ip}/{mask}", strict=False
                        )
                        return str(net)
        except Exception:
            pass

    # 3. macOS / BSD via `ifconfig`
    if system in ("darwin", "freebsd") and shutil.which("ifconfig"):
        try:
            res = subprocess.run(
                ["ifconfig"],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in res.stdout.splitlines():
                line = line.strip()
                if line.startswith(f"inet {local_ip} ") and "netmask" in line:
                    parts = line.split()
                    mask_raw = parts[parts.index("netmask") + 1]
                    if mask_raw.startswith("0x"):
                        mask_int = int(mask_raw, 16)
                        mask = str(ipaddress.IPv4Address(mask_int))
                    else:
                        mask = mask_raw
                    return str(
                        ipaddress.IPv4Network(
                            f"{local_ip}/{mask}", strict=False
                        )
                    )
        except Exception:
            pass

    # 4. Universal fallback from local IPv4 address
    if local_ip and not local_ip.startswith("127."):
        try:
            return str(ipaddress.ip_network(f"{local_ip}/24", strict=False))
        except ValueError:
            pass

    return "192.168.0.0/24"


def get_local_mac() -> str | None:
    """
    Platform-independent MAC address lookup for the active network interface.
    Works across Linux (/sys/class/net or `ip link`), Windows (`getmac`),
    macOS (`ifconfig`), and falls back to Python's cross-platform `uuid.getnode()`.
    """
    iface = get_active_interface()
    system = platform.system().lower()

    # 1. Linux sysfs (fastest, zero subprocess overhead)
    if system == "linux" and iface:
        sysfs_mac = Path(f"/sys/class/net/{iface}/address")
        if sysfs_mac.exists():
            try:
                mac = normalize_mac(sysfs_mac.read_text(encoding="utf-8").strip())
                if mac:
                    return mac
            except Exception:
                pass

    # 2. Linux `ip link`
    if system == "linux" and shutil.which("ip"):
        cmd = ["ip", "link", "show", iface] if iface else ["ip", "link", "show"]
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if line.startswith("link/ether"):
                    mac = normalize_mac(line.split()[1])
                    if mac:
                        return mac
        except Exception:
            pass

    # 3. Universal Python stdlib fallback (works on Windows, macOS, Linux)
    try:
        node = uuid.getnode()
        # If bit 40 is 0, it is a genuine hardware MAC address
        if (node >> 40) % 2 == 0:
            raw = ":".join(f"{(node >> ele) & 0xff:02X}" for ele in range(40, -1, -8))
            return normalize_mac(raw)
    except Exception:
        pass

    return None


def get_neighbor_devices() -> list[dict]:
    """
    Read devices from the operating system's ARP / neighbor cache in a
    platform-independent manner:
      - Linux: `ip -4 neigh show` (on active interface or all interfaces)
      - Windows / macOS / BSD: `arp -a`
    """
    devices_by_mac: dict[str, dict] = {}
    system = platform.system().lower()
    iface = get_active_interface()

    # 1. Try `ip -4 neigh show` on Linux
    if system == "linux" and shutil.which("ip"):
        cmds = []
        if iface:
            cmds.append(["ip", "-4", "neigh", "show", "dev", iface])
        cmds.append(["ip", "-4", "neigh", "show"])

        for cmd in cmds:
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    check=False,
                    timeout=5,
                )
                if result.returncode != 0:
                    continue

                for line in result.stdout.splitlines():
                    parts = line.split()
                    if not parts or "lladdr" not in parts:
                        continue
                    ip_address = parts[0]
                    if not is_valid_ip_address(ip_address):
                        continue
                    lladdr_index = parts.index("lladdr")
                    if lladdr_index + 1 >= len(parts):
                        continue
                    mac_address = normalize_mac(parts[lladdr_index + 1])
                    if not mac_address:
                        continue

                    devices_by_mac[mac_address] = {
                        "ip_address": ip_address,
                        "mac_address": mac_address,
                        "hostname": None,
                        "vendor": None,
                        "device_type": "unknown",
                    }
                if devices_by_mac:
                    break
            except Exception:
                pass

    # 2. Cross-platform `arp -a` fallback (Windows, macOS, BSD, or Linux without iproute2)
    if not devices_by_mac and shutil.which("arp"):
        try:
            result = subprocess.run(
                ["arp", "-a"],
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )
            for line in result.stdout.splitlines():
                ip_match = IPV4_REGEX.search(line)
                if not ip_match:
                    continue
                ip_address = ip_match.group(0)
                if not is_valid_ip_address(ip_address):
                    continue

                # Find any token looking like a MAC address (with : or -)
                mac_address = None
                for token in line.replace("(", " ").replace(")", " ").split():
                    candidate = normalize_mac(token)
                    if candidate:
                        mac_address = candidate
                        break

                if not mac_address:
                    continue

                devices_by_mac[mac_address] = {
                    "ip_address": ip_address,
                    "mac_address": mac_address,
                    "hostname": None,
                    "vendor": None,
                    "device_type": "unknown",
                }
        except Exception:
            pass

    return list(devices_by_mac.values())


def _pure_python_subnet_probe(parsed_network: ipaddress.IPv4Network) -> dict[str, dict]:
    """
    Platform-independent, zero-dependency active subnet probe used when `nmap`
    is not installed (e.g. on Windows, macOS, or minimal Linux).
    Sends non-blocking UDP/TCP probes across the subnet to trigger the OS kernel
    to populate its Layer-2 ARP/neighbor table (`ip neigh` / `arp -a`).
    """
    from concurrent.futures import ThreadPoolExecutor

    hosts = list(parsed_network.hosts())
    # Cap probe to at most 512 hosts so large /16 networks don't stall
    if len(hosts) > 512:
        hosts = hosts[:512]

    resolved_by_ip: dict[str, dict] = {}

    def _probe_ip(ip_obj: ipaddress.IPv4Address) -> None:
        ip_str = str(ip_obj)
        # 1. Trigger kernel ARP resolution via fast UDP datagram + brief TCP connect attempt
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as usock:
                usock.settimeout(0.15)
                usock.sendto(b"", (ip_str, 5353))
        except Exception:
            pass

        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as tsock:
                tsock.settimeout(0.25)
                tsock.connect_ex((ip_str, 80))
        except Exception:
            pass

    with ThreadPoolExecutor(max_workers=64) as pool:
        list(pool.map(_probe_ip, hosts))

    # Resolve hostnames, vendor OUI/LAA, and open TCP services for any responder in the ARP table
    gateway_ip = get_default_gateway_ip()
    for neighbor in get_neighbor_devices():
        ip_str = neighbor.get("ip_address")
        mac_str = neighbor.get("mac_address")
        if not ip_str:
            continue
        hostname = None
        try:
            host_info = socket.gethostbyaddr(ip_str)
            if host_info and host_info[0]:
                hostname = host_info[0]
        except Exception:
            pass

        vendor = lookup_mac_vendor(
            mac_address=mac_str,
            hostname=hostname,
            ip_address=ip_str,
            gateway_ip=gateway_ip,
        )
        svc_intel = probe_host_services(ip_str)
        role_tag = "Gateway Router" if (gateway_ip and ip_str == gateway_ip) else "LAN Host"
        rtt_str = f"{svc_intel['latency_ms']}ms" if svc_intel.get("latency_ms") is not None else "n/a"
        notes_str = f"[LAN-INTEL] Role: {role_tag} | RTT: {rtt_str} | Services: {svc_intel['services_summary']}"

        resolved_by_ip[ip_str] = {
            "hostname": hostname,
            "vendor": vendor,
            "notes": notes_str,
            "open_ports": svc_intel["open_ports"],
            "latency_ms": svc_intel["latency_ms"],
        }

    return resolved_by_ip


def discover_devices(network: str):
    """
    Discover LAN devices across any OS and router subnet using Nmap discovery
    (when available) or a platform-independent pure-Python ARP/TCP sweep fallback,
    combined with the OS ARP/neighbor table (`ip neigh` on Linux, `arp -a` on
    Windows/macOS).
    """
    if not isinstance(network, str) or "/" not in network:
        raise ValueError("A network range in CIDR notation is required.")

    try:
        parsed_network = ipaddress.ip_network(network, strict=False)
    except ValueError as exc:
        raise ValueError(
            "A valid IPv4 or IPv6 network range is required."
        ) from exc

    if parsed_network.version != 4:
        raise ValueError(
            "Only IPv4 network ranges are supported for discovery."
        )

    network = str(parsed_network)

    local_ip = get_local_ip()
    local_mac = get_local_mac()

    command = [
        "nmap",
        "-sn",
        "-PR",
        "--max-retries",
        "3",
        network,
        "-oX",
        "-",
    ]

    discovered_by_mac: dict[str, dict] = {}
    nmap_hosts_by_ip: dict[str, dict] = {}

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            timeout=60,
        )
        root = ET.fromstring(result.stdout)

        # ---------------------------------------------------------
        # Process Nmap results
        # ---------------------------------------------------------
        for host in root.findall("host"):
            status = host.find("status")

            if status is None or status.get("state") != "up":
                continue

            ip_address = None
            mac_address = None
            vendor = None
            hostname = None

            for address in host.findall("address"):
                addr_type = address.get("addrtype")

                if addr_type == "ipv4":
                    ip_address = address.get("addr")
                elif addr_type == "mac":
                    mac_address = normalize_mac(address.get("addr"))
                    vendor = address.get("vendor")

            hostnames = host.find("hostnames")
            if hostnames is not None:
                hostname_entry = hostnames.find("hostname")
                if hostname_entry is not None:
                    hostname = hostname_entry.get("name")

            if ip_address:
                nmap_hosts_by_ip[ip_address] = {
                    "hostname": hostname,
                    "vendor": vendor,
                }

            if ip_address == local_ip and not mac_address:
                mac_address = local_mac
                vendor = vendor or "Local Machine"
                hostname = hostname or socket.gethostname()

            if not mac_address:
                continue

            discovered_by_mac[mac_address] = {
                "ip_address": ip_address,
                "mac_address": mac_address,
                "hostname": hostname,
                "vendor": vendor,
                "device_type": classify_device(
                    hostname=hostname,
                    vendor=vendor,
                    mac_address=mac_address,
                ),
            }
    except (FileNotFoundError, subprocess.CalledProcessError):
        # Platform-independent fallback when `nmap` binary is not installed
        nmap_hosts_by_ip = _pure_python_subnet_probe(parsed_network)
        if (
            local_ip
            and local_mac
            and ipaddress.ip_address(local_ip) in parsed_network
        ):
            hw_vendor = lookup_mac_vendor(mac_address=local_mac)
            discovered_by_mac[local_mac] = {
                "ip_address": local_ip,
                "mac_address": local_mac,
                "hostname": socket.gethostname(),
                "vendor": f"Local Machine ({hw_vendor})" if hw_vendor else "Local Machine",
                "notes": "[LAN-INTEL] Role: NETOPS Sensor Host | Canary Trap: TCP :8899 Active",
                "device_type": "computer",
            }

    # ---------------------------------------------------------
    # Process OS ARP / neighbour-table fallback (filtered to target subnet)
    # ---------------------------------------------------------

    neighbor_devices = get_neighbor_devices()

    for neighbor in neighbor_devices:
        mac_address = neighbor["mac_address"]
        ip_address = neighbor.get("ip_address")

        if ip_address:
            try:
                if ipaddress.ip_address(ip_address) not in parsed_network:
                    continue
            except ValueError:
                continue

        # Enrich neighbor entry with any hostname/vendor/notes resolved for this IP
        if ip_address and ip_address in nmap_hosts_by_ip:
            nmap_meta = nmap_hosts_by_ip[ip_address]
            if not neighbor.get("hostname") and nmap_meta.get("hostname"):
                neighbor["hostname"] = nmap_meta["hostname"]
            if not neighbor.get("vendor") and nmap_meta.get("vendor"):
                neighbor["vendor"] = nmap_meta["vendor"]
            if not neighbor.get("notes") and nmap_meta.get("notes"):
                neighbor["notes"] = nmap_meta["notes"]

        if not neighbor.get("vendor"):
            neighbor["vendor"] = lookup_mac_vendor(
                mac_address=mac_address,
                hostname=neighbor.get("hostname"),
                ip_address=ip_address,
            )

        if mac_address in discovered_by_mac:
            existing = discovered_by_mac[mac_address]
            if not existing.get("ip_address") and ip_address:
                existing["ip_address"] = ip_address
            if not existing.get("hostname") and neighbor.get("hostname"):
                existing["hostname"] = neighbor["hostname"]
            if not existing.get("vendor") and neighbor.get("vendor"):
                existing["vendor"] = neighbor["vendor"]
            if not existing.get("notes") and neighbor.get("notes"):
                existing["notes"] = neighbor["notes"]
            continue

        if ip_address == local_ip and mac_address == local_mac:
            oled_vendor = lookup_mac_vendor(mac_address=mac_address)
            neighbor["vendor"] = f"Local Machine ({oled_vendor})" if oled_vendor else "Local Machine"
            neighbor["hostname"] = neighbor.get("hostname") or socket.gethostname()
            neighbor["device_type"] = "computer"
        else:
            neighbor["device_type"] = classify_device(
                hostname=neighbor.get("hostname"),
                vendor=neighbor.get("vendor"),
                mac_address=mac_address,
            )

        discovered_by_mac[mac_address] = neighbor

    return list(discovered_by_mac.values())


def save_discovered_devices(
    devices: list[dict],
    db: Session,
):
    """
    Save discovered devices and update their state.
    """
    saved_devices = []

    discovered_macs = {
        device.get("mac_address", "").upper()
        for device in devices
        if device.get("mac_address")
    }

    existing_devices = db.scalars(select(Device)).all()

    for existing_device in existing_devices:
        if (
            existing_device.status == "online"
            and existing_device.mac_address.upper() not in discovered_macs
        ):
            existing_device.status = "offline"

    for discovered in devices:
        mac_address = discovered.get("mac_address")
        if not mac_address:
            continue

        mac_address = mac_address.upper()
        ip_address = discovered.get("ip_address")

        if ip_address and not is_valid_ip_address(ip_address):
            continue

        existing_device = db.scalar(
            select(Device).where(Device.mac_address == mac_address)
        )

        hostname = discovered.get("hostname")
        vendor = discovered.get("vendor")
        notes = discovered.get("notes")

        if existing_device:
            if not hostname:
                hostname = existing_device.hostname
            if not vendor:
                vendor = existing_device.vendor

        detected_type = classify_device(
            hostname=hostname,
            vendor=vendor,
            mac_address=mac_address,
        )

        if existing_device:
            existing_device.ip_address = discovered.get("ip_address")
            if hostname:
                existing_device.hostname = hostname
            if vendor:
                existing_device.vendor = vendor
            if notes and (
                not existing_device.notes
                or existing_device.notes.startswith("[LAN-INTEL]")
            ):
                existing_device.notes = notes

            existing_type = existing_device.device_type

            if detected_type != "unknown" and existing_type in (
                None,
                "unknown",
            ):
                existing_device.device_type = detected_type
                existing_device.vlan_id = get_vlan_for_device_type(
                    detected_type
                )
                existing_device.classification_status = "reviewed"

                create_event(
                    db,
                    "device_classification",
                    (
                        f"Device classified as {detected_type}: "
                        f"{existing_device.ip_address} ({existing_device.mac_address})"
                    ),
                    existing_device.id,
                )

            elif (
                detected_type != "unknown"
                and existing_type not in (None, "unknown")
                and existing_type != detected_type
            ):
                existing_device.classification_status = "review_required"

                mismatch_message = (
                    f"Classification mismatch for device "
                    f"{existing_device.ip_address} "
                    f"({existing_device.mac_address}): "
                    f"existing={existing_type}, "
                    f"detected={detected_type}. "
                    f"Manual review required."
                )

                latest_mismatch = db.scalar(
                    select(Event)
                    .where(
                        Event.device_id == existing_device.id,
                        Event.event_type == "classification_mismatch",
                    )
                    .order_by(Event.id.desc())
                    .limit(1)
                )

                if (
                    latest_mismatch is None
                    or latest_mismatch.message != mismatch_message
                ):
                    create_event(
                        db,
                        "classification_mismatch",
                        mismatch_message,
                        existing_device.id,
                    )

            elif (
                detected_type != "unknown" and existing_type == detected_type
            ):
                existing_device.vlan_id = get_vlan_for_device_type(
                    detected_type
                )
                if (
                    existing_device.classification_status
                    != "review_required"
                ):
                    existing_device.classification_status = "normal"

            existing_device.status = "online"
            saved_devices.append(existing_device)

        else:
            device_type = (
                None if detected_type == "unknown" else detected_type
            )

            new_device = Device(
                mac_address=mac_address,
                ip_address=discovered.get("ip_address"),
                hostname=hostname,
                vendor=vendor,
                notes=notes,
                device_type=device_type,
                classification_status="normal",
                status="online",
                approval_status="pending",
                vlan_id=get_vlan_for_device_type(detected_type),
            )

            db.add(new_device)
            db.flush()

            saved_devices.append(new_device)

            create_event(
                db,
                "new_device",
                (
                    f"New device discovered: "
                    f"{new_device.ip_address} ({new_device.mac_address})"
                ),
                new_device.id,
            )

            if detected_type != "unknown":
                create_event(
                    db,
                    "device_classification",
                    (
                        f"New device classified as {detected_type}: "
                        f"{new_device.ip_address} ({new_device.mac_address})"
                    ),
                    new_device.id,
                )

    db.commit()

    for device in saved_devices:
        db.refresh(device)

    return saved_devices
