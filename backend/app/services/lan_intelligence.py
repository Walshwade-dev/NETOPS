"""
Platform-independent Deep LAN Intelligence service for NETOPS.

Provides:
1. Default Gateway auto-detection across Linux, Windows, and macOS.
2. IEEE OUI MAC vendor lookup + Locally Administered Address (LAA / Randomized MAC) detection.
3. Fast concurrent TCP port & service fingerprinting + HTTP banner/title extraction + RTT latency measurement.
"""

from __future__ import annotations

import ipaddress
import platform
import re
import shutil
import socket
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

IPV4_REGEX = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
TITLE_REGEX = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SERVER_HEADER_REGEX = re.compile(r"^Server:\s*(.+)$", re.IGNORECASE | re.MULTILINE)

# Curated IEEE OUI prefixes (first 3 bytes XX:XX:XX) for common enterprise & consumer vendors
OUI_VENDOR_MAP: dict[str, str] = {
    # Intel Corporation (including user's wlp1s0 4C:D5:77)
    "4C:D5:77": "Intel Corporate",
    "00:1B:21": "Intel Corporate",
    "3C:97:0E": "Intel Corporate",
    "8C:8D:28": "Intel Corporate",
    "A4:34:D9": "Intel Corporate",
    "DC:41:A9": "Intel Corporate",
    "F8:63:3F": "Intel Corporate",
    # Huawei / CPE Routers
    "00:E0:FC": "Huawei Technologies",
    "00:46:4B": "Huawei Technologies",
    "28:6E:D4": "Huawei Technologies",
    "48:8E:EF": "Huawei Technologies",
    "70:72:3C": "Huawei Technologies",
    "88:53:D4": "Huawei Technologies",
    "C8:D1:5E": "Huawei Technologies",
    # ZTE / ISP CPEs
    "00:19:C6": "ZTE Corporation",
    "34:4B:50": "ZTE Corporation",
    "F8:DF:A8": "ZTE Corporation",
    # TP-Link
    "50:C7:BF": "TP-Link Technologies",
    "14:CC:20": "TP-Link Technologies",
    "C0:25:E9": "TP-Link Technologies",
    # Cisco
    "00:00:0C": "Cisco Systems",
    "00:1B:54": "Cisco Systems",
    "F8:72:EA": "Cisco Systems",
    # Ubiquiti
    "24:5A:4C": "Ubiquiti Inc",
    "78:8A:20": "Ubiquiti Inc",
    "F0:9F:C2": "Ubiquiti Inc",
    # MikroTik
    "4C:5E:0C": "MikroTikls SIA",
    "B8:69:F4": "MikroTikls SIA",
    "DC:2C:6E": "MikroTikls SIA",
    # Apple
    "00:1C:B3": "Apple Inc",
    "3C:22:FB": "Apple Inc",
    "F0:18:98": "Apple Inc",
    # Samsung
    "00:16:32": "Samsung Electronics",
    "50:01:BB": "Samsung Electronics",
    "CC:07:AB": "Samsung Electronics",
    # Realme / Guangdong Oppo Mobile
    "2C:59:8A": "Realme / OPPO Mobile",
    "94:D0:0D": "Realme / OPPO Mobile",
    "E8:9E:B4": "Realme / OPPO Mobile",
    # Raspberry Pi
    "B8:27:EB": "Raspberry Pi Foundation",
    "DC:A6:32": "Raspberry Pi Trading",
    "E4:5F:01": "Raspberry Pi Trading",
    # HP / Printers / Dell / Sophos
    "00:14:38": "Hewlett Packard",
    "3C:D9:2B": "Hewlett Packard",
    "F8:B1:56": "Dell Inc.",
    "00:1A:8C": "Sophos Ltd",
    # Hikvision / Dahua CCTV
    "44:19:B6": "Hikvision Digital",
    "C0:56:E3": "Hikvision Digital",
    "3C:EF:8C": "Dahua Technology",
    # Virtualization
    "00:05:69": "VMware Inc",
    "00:0C:29": "VMware Inc",
    "00:50:56": "VMware Inc",
    "08:00:27": "Oracle VirtualBox",
    "52:54:00": "QEMU / KVM Virtual NIC",
}

# Common LAN ports to probe during deep discovery
COMMON_LAN_PORTS: dict[int, str] = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    53: "DNS",
    80: "HTTP",
    139: "NetBIOS",
    443: "HTTPS",
    445: "SMB",
    554: "RTSP",
    2222: "SSH-Mgmt",
    2323: "Telnet-Alt",
    3389: "RDP",
    4444: "Sophos-Admin",
    5540: "RTSP-Stream",
    8080: "HTTP-Alt",
    8443: "HTTPS-Admin",
    9100: "JetDirect-Print",
}

EXHAUSTIVE_LAN_PORTS: dict[int, str] = {
    **COMMON_LAN_PORTS,
    110: "POP3",
    135: "MS-RPC",
    143: "IMAP",
    515: "LPD-Print",
    631: "IPP-Print",
    1883: "MQTT-IoT",
    3306: "MySQL",
    5173: "Vite-Web-UI",
    5432: "PostgreSQL",
    8000: "FastAPI-REST",
}

HIGH_RISK_PORTS: dict[int, str] = {
    21: "Plaintext FTP file transfer exposed",
    23: "Unencrypted Telnet remote shell exposed",
    2323: "Unencrypted alternate Telnet shell exposed",
    445: "SMB file sharing port exposed on LAN",
    3389: "Remote Desktop Protocol (RDP) exposed",
}


def get_default_gateway_ip() -> str | None:
    """
    Auto-detect the active IPv4 default gateway IP address across
    Linux, Windows, and macOS.
    """
    system = platform.system().lower()

    # 1. Linux via `ip -4 route show default`
    if system == "linux" and shutil.which("ip"):
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
                if "via" in parts:
                    idx = parts.index("via")
                    if idx + 1 < len(parts):
                        candidate = parts[idx + 1]
                        ipaddress.ip_address(candidate)
                        return candidate
        except Exception:
            pass

    # 2. macOS / BSD via `route -n get default`
    if system in ("darwin", "freebsd") and shutil.which("route"):
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
                if line.startswith("gateway:"):
                    candidate = line.split(":", 1)[1].strip()
                    ipaddress.ip_address(candidate)
                    return candidate
        except Exception:
            pass

    # 3. Windows via `ipconfig`
    if system == "windows" and shutil.which("ipconfig"):
        try:
            res = subprocess.run(
                ["ipconfig"],
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )
            for line in res.stdout.splitlines():
                if "Default Gateway" in line:
                    match = IPV4_REGEX.search(line)
                    if match:
                        return match.group(0)
        except Exception:
            pass

    return None


def is_locally_administered_mac(mac_address: str | None) -> bool:
    """
    Return True if the IEEE 802 Locally Administered Address (LAA) bit (bit 1 of octet 0)
    is set, which indicates a randomized privacy MAC (iOS/Android) or CPE virtual MAC.
    """
    if not mac_address or len(mac_address) < 2:
        return False
    try:
        first_octet = int(mac_address.split(":")[0], 16)
        # Bit 1 (0x02) = locally administered; Bit 0 (0x01) = multicast
        return bool(first_octet & 0x02) and not bool(first_octet & 0x01)
    except ValueError:
        return False


def lookup_mac_vendor(
    mac_address: str | None,
    hostname: str | None = None,
    ip_address: str | None = None,
    gateway_ip: str | None = None,
) -> str | None:
    """
    Identify hardware vendor from MAC OUI prefix, hostname hints, gateway status,
    or Locally Administered Address (LAA) bit.
    """
    if not mac_address:
        return None

    prefix = mac_address.upper()[:8]
    if prefix in OUI_VENDOR_MAP:
        return OUI_VENDOR_MAP[prefix]

    host_lower = (hostname or "").lower()
    if "realme" in host_lower:
        return "Realme Mobile (Randomized MAC)" if is_locally_administered_mac(mac_address) else "Realme Mobile"
    if "iphone" in host_lower or "ipad" in host_lower or "macbook" in host_lower:
        return "Apple Inc (Private MAC)" if is_locally_administered_mac(mac_address) else "Apple Inc"
    if "galaxy" in host_lower or "samsung" in host_lower:
        return "Samsung Electronics"
    if "homerouter" in host_lower or "cpe" in host_lower or (ip_address and gateway_ip and ip_address == gateway_ip):
        return "ISP CPE Gateway Router"

    if is_locally_administered_mac(mac_address):
        return "Private / Randomized MAC (LAA)"

    return None


def _grab_http_banner(ip_address: str, port: int = 80, timeout: float = 0.45) -> str | None:
    """Attempt a fast HTTP HEAD/GET request to extract page <title> or Server header."""
    try:
        with socket.create_connection((ip_address, port), timeout=timeout) as sock:
            sock.settimeout(timeout)
            req = (
                f"GET / HTTP/1.0\r\n"
                f"Host: {ip_address}\r\n"
                f"User-Agent: NETOPS-Discovery/1.0\r\n"
                f"Connection: close\r\n\r\n"
            )
            sock.sendall(req.encode("ascii", errors="ignore"))
            raw = sock.recv(2048).decode("utf-8", errors="ignore")
            title_match = TITLE_REGEX.search(raw)
            server_match = SERVER_HEADER_REGEX.search(raw)
            parts = []
            if title_match:
                clean_title = " ".join(title_match.group(1).split())[:48]
                if clean_title:
                    parts.append(f'"{clean_title}"')
            if server_match:
                clean_srv = server_match.group(1).strip()[:32]
                if clean_srv:
                    parts.append(clean_srv)
            return " / ".join(parts) if parts else None
    except Exception:
        return None


def _grab_raw_tcp_banner(ip_address: str, port: int, timeout: float = 0.35) -> str | None:
    """Read initial greeting banner from SSH, Telnet, RTSP, JetDirect, or Canary ports."""
    try:
        with socket.create_connection((ip_address, port), timeout=timeout) as sock:
            sock.settimeout(timeout)
            if port in (554, 5540):
                sock.sendall(b"OPTIONS * RTSP/1.0\r\nCSeq: 1\r\n\r\n")
            raw = sock.recv(512).decode("utf-8", errors="ignore").strip()
            if not raw:
                return None
            first_line = " ".join(raw.splitlines()[0].split())[:64]
            return first_line or None
    except Exception:
        return None


def probe_host_services(
    ip_address: str,
    ports: dict[int, str] | None = None,
    timeout: float = 0.22,
) -> dict:
    """
    Concurrently probe common TCP ports on a single LAN host, measure TCP handshake
    round-trip latency (ms), and extract HTTP/TCP banner metadata if available.
    """
    target_ports = ports or COMMON_LAN_PORTS
    open_ports: list[dict] = []
    latencies_ms: list[float] = []

    def _check_port(item: tuple[int, str]):
        port, service = item
        start = time.perf_counter()
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(timeout)
                rc = sock.connect_ex((ip_address, port))
                elapsed_ms = round((time.perf_counter() - start) * 1000.0, 1)
                if rc == 0:
                    latencies_ms.append(elapsed_ms)
                    banner = None
                    if port in (80, 4444, 5173, 8000, 8080):
                        banner = _grab_http_banner(ip_address, port, timeout=0.45)
                    elif port in (21, 22, 23, 554, 2222, 2323, 5540, 8899, 9100):
                        banner = _grab_raw_tcp_banner(ip_address, port, timeout=0.35)
                    return {
                        "port": port,
                        "service": service,
                        "banner": banner,
                        "risk": HIGH_RISK_PORTS.get(port),
                    }
                # Even ECONNREFUSED (RST packet from host) proves host reachability and gives RTT!
                elif rc in (111, 61, 10061):
                    latencies_ms.append(elapsed_ms)
        except Exception:
            pass
        return None

    with ThreadPoolExecutor(max_workers=len(target_ports)) as pool:
        for res in pool.map(_check_port, target_ports.items()):
            if res is not None:
                open_ports.append(res)

    open_ports.sort(key=lambda x: x["port"])
    latency_ms = min(latencies_ms) if latencies_ms else None

    return {
        "ip_address": ip_address,
        "latency_ms": latency_ms,
        "open_ports": open_ports,
        "services_summary": ", ".join(
            f"{p['port']}/{p['service']}" + (f" ({p['banner']})" if p.get("banner") else "")
            for p in open_ports
        )
        or "No open TCP ports",
    }


def analyze_mac_bits(mac_address: str | None, hostname: str | None = None, ip_address: str | None = None) -> dict:
    """
    Break down a 48-bit IEEE 802 MAC address into OUI prefix, NIC serial,
    first-octet binary flags (I/G Unicast vs Multicast, U/L Universal vs Local),
    and hardware manufacturer.
    """
    if not mac_address or len(mac_address) < 17:
        return {
            "mac_address": mac_address or "Unknown",
            "oui_prefix": "Unknown",
            "nic_serial": "Unknown",
            "first_octet_hex": "—",
            "first_octet_binary": "—",
            "ig_bit": "Unknown",
            "ul_bit": "Unknown",
            "is_randomized_laa": False,
            "vendor": "Unknown",
        }

    norm = mac_address.upper()
    parts = norm.split(":")
    oui_prefix = ":".join(parts[:3])
    nic_serial = ":".join(parts[3:])
    first_byte = int(parts[0], 16)
    binary_str = f"{first_byte:08b}"
    ig_multicast = bool(first_byte & 0x01)
    ul_local = bool(first_byte & 0x02)
    vendor = lookup_mac_vendor(norm, hostname=hostname, ip_address=ip_address, gateway_ip=get_default_gateway_ip()) or "Unlisted IEEE Vendor"

    return {
        "mac_address": norm,
        "oui_prefix": oui_prefix,
        "nic_serial": nic_serial,
        "first_octet_hex": f"0x{parts[0]}",
        "first_octet_binary": binary_str,
        "ig_bit": "1 (Multicast Group)" if ig_multicast else "0 (Unicast Individual)",
        "ul_bit": "1 (Locally Administered / Randomized LAA)" if ul_local else "0 (Universally Administered / IEEE Burned-In OUI)",
        "is_randomized_laa": ul_local and not ig_multicast,
        "vendor": vendor,
    }


def _probe_icmp_and_arp_state(ip_address: str) -> dict:
    """Run fast 2-packet ICMP ping (for TTL OS fingerprinting & RTT) + read kernel ARP state."""
    icmp_reachable = False
    icmp_rtt_ms = None
    ttl = None
    os_fingerprint = "Unknown / Filtered ICMP"
    arp_state = "UNKNOWN"
    arp_mac = None

    if ip_address.startswith("127."):
        arp_state = "LOCAL_LOOPBACK_VIRTUAL_NIC"
    elif shutil.which("ip"):
        try:
            res = subprocess.run(
                ["ip", "-4", "neigh", "show", ip_address],
                capture_output=True,
                text=True,
                check=False,
                timeout=2,
            )
            out = res.stdout.strip()
            if out:
                arp_state = out.split()[-1]
                mac_m = re.search(r"([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5})", out)
                if mac_m:
                    arp_mac = mac_m.group(1).upper()
            else:
                arp_state = "LOCAL_SENSOR_NIC"
        except Exception:
            pass

    if shutil.which("ping"):
        try:
            res = subprocess.run(
                ["ping", "-c", "2", "-W", "1", "-i", "0.2", ip_address],
                capture_output=True,
                text=True,
                check=False,
                timeout=3,
            )
            ttl_match = re.search(r"ttl=(\d+)", res.stdout, re.IGNORECASE)
            time_matches = [float(x) for x in re.findall(r"time=([\d.]+)\s*ms", res.stdout)]
            if ttl_match or time_matches:
                icmp_reachable = True
            if time_matches:
                icmp_rtt_ms = round(sum(time_matches) / len(time_matches), 2)
            if ttl_match:
                ttl = int(ttl_match.group(1))
                if ttl <= 64:
                    os_fingerprint = f"Linux / Android / RouterOS / macOS (Initial TTL=64, Observed={ttl})"
                elif ttl <= 128:
                    os_fingerprint = f"Windows NT / Server Stack (Initial TTL=128, Observed={ttl})"
                else:
                    os_fingerprint = f"Cisco IOS / Enterprise Network Gear (Initial TTL=255, Observed={ttl})"
        except Exception:
            pass

    reverse_dns = None
    try:
        reverse_dns = socket.gethostbyaddr(ip_address)[0]
    except Exception:
        pass

    return {
        "icmp_reachable": icmp_reachable,
        "icmp_rtt_ms": icmp_rtt_ms,
        "ttl": ttl,
        "os_fingerprint": os_fingerprint,
        "arp_state": arp_state,
        "arp_mac": arp_mac,
        "reverse_dns": reverse_dns,
    }


def inspect_host_exhaustive(
    ip_address: str,
    mac_address: str | None = None,
    hostname: str | None = None,
) -> dict:
    """
    Perform an exhaustive Layer-2, Layer-3, Layer-4, and Layer-7 deep inspection
    of a target IP on the LAN or Virtual Lab.
    """
    l3_info = _probe_icmp_and_arp_state(ip_address)
    resolved_mac = mac_address or l3_info.get("arp_mac")
    if not resolved_mac and ip_address.startswith("127.0.2."):
        from .virtual_lab import VIRTUAL_APPLIANCES

        for spec in VIRTUAL_APPLIANCES:
            if spec["ip_address"] == ip_address:
                resolved_mac = spec["mac_address"]
                hostname = hostname or spec["hostname"]
                break
    mac_analysis = analyze_mac_bits(resolved_mac, hostname=hostname or l3_info.get("reverse_dns"), ip_address=ip_address)
    ports_to_probe = dict(EXHAUSTIVE_LAN_PORTS)
    if ip_address.startswith("127.0.2."):
        # Exclude wildcard 0.0.0.0 host ports (Vite 5173, FastAPI 8000, SSH 22) so Virtual Lab VM shows only its own appliance ports
        ports_to_probe.pop(5173, None)
        ports_to_probe.pop(8000, None)
        ports_to_probe.pop(22, None)
    service_intel = probe_host_services(ip_address, ports=ports_to_probe, timeout=0.25)

    best_rtt = service_intel["latency_ms"] if service_intel["latency_ms"] is not None else l3_info["icmp_rtt_ms"]
    risks = [p for p in service_intel["open_ports"] if p.get("risk")]

    terminal_lines = [
        f"$ netops-inspect --deep --target {ip_address} --mac {mac_address or 'auto'}",
        f"[L2:MAC]   Address: {mac_analysis['mac_address']} | OUI: {mac_analysis['oui_prefix']} ({mac_analysis['vendor']}) | NIC Serial: {mac_analysis['nic_serial']}",
        f"[L2:IEEE]  Octet-0: {mac_analysis['first_octet_hex']} ({mac_analysis['first_octet_binary']}) | U/L Bit: {mac_analysis['ul_bit']}",
        f"[L2:ARP]   Kernel Neighbor State: {l3_info['arp_state']}",
        f"[L3:ICMP]  Echo Reachable: {'YES' if l3_info['icmp_reachable'] else 'NO/FILTERED'} | RTT: {best_rtt if best_rtt is not None else 'n/a'}ms | TTL: {l3_info['ttl'] or 'n/a'} -> {l3_info['os_fingerprint']}",
        f"[L4:SCAN]  Probed {len(EXHAUSTIVE_LAN_PORTS)} TCP service ports -> {len(service_intel['open_ports'])} open port(s) discovered:",
    ]
    if service_intel["open_ports"]:
        for p in service_intel["open_ports"]:
            banner_str = f" | Banner: {p['banner']}" if p.get("banner") else ""
            risk_str = f" | [RISK: {p['risk']}]" if p.get("risk") else ""
            terminal_lines.append(f"           • TCP :{p['port']:<5} {p['service']:<16}{banner_str}{risk_str}")
    else:
        terminal_lines.append("           • Zero open TCP ports detected (Host firewall active or ports closed).")

    return {
        "ip_address": ip_address,
        "hostname": hostname or l3_info["reverse_dns"] or "Unknown Host",
        "reverse_dns": l3_info["reverse_dns"],
        "mac_analysis": mac_analysis,
        "layer3": l3_info,
        "latency_ms": best_rtt,
        "open_ports": service_intel["open_ports"],
        "services_summary": service_intel["services_summary"],
        "risk_findings": risks,
        "terminal_lines": terminal_lines,
    }


def execute_sysadmin_command(raw_command: str) -> dict:
    """
    Execute a safe, read-only sysadmin network diagnostic command from the
    interactive NETOPS console (`arp`, `route`, `ports`, `ping`, `inspect`, `help`).
    """
    cmd = (raw_command or "").strip()
    parts = cmd.split()
    verb = parts[0].lower() if parts else "help"
    gw_ip = get_default_gateway_ip() or "192.168.8.1"

    if verb == "help":
        return {
            "command": cmd,
            "tone": "info",
            "lines": [
                "$ help — Available NETOPS Sysadmin Console Commands:",
                "  • arp              : Read OS Layer-2 Neighbor / ARP Cache (`ip -4 neigh show`) + OUI vendors",
                "  • route            : Inspect OS Layer-3 Routing Table (`ip -4 route`) & active NIC addresses",
                "  • ports            : List active listening TCP/UDP sockets on this sensor (`ss -tuln`)",
                f"  • ping [ip|gw]     : Measure live ICMP Round-Trip Time (RTT) & TTL OS fingerprint (default: {gw_ip})",
                f"  • inspect [ip]     : Run exhaustive 26-port + L2/L3/L7 banner probe on target IP (default: {gw_ip})",
                "  • scan             : Trigger full active LAN subnet discovery (`POST /discovery/scan`)",
                "  • audit            : Run 4-layer LAN Intrusion Detection audit (`POST /discovery/security-audit`)",
                "  • lab              : Toggle Virtual Enterprise Network Lab (ISP, Cisco Switch, Sophos FW, CCTV, Printer)",
            ],
        }

    if verb == "arp":
        lines = ["$ ip -4 neigh show  # Layer-2 ARP / Neighbor Cache"]
        if shutil.which("ip"):
            res = subprocess.run(["ip", "-4", "neigh", "show"], capture_output=True, text=True, check=False, timeout=3)
            for row in res.stdout.splitlines():
                mac_m = re.search(r"([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5})", row)
                mac_str = mac_m.group(1).upper() if mac_m else None
                vendor = lookup_mac_vendor(mac_str) if mac_str else None
                lines.append(f"  {row}" + (f"  [{vendor}]" if vendor else ""))
        if len(lines) == 1:
            lines.append("  (No dynamic neighbor entries currently cached)")
        return {"command": cmd, "tone": "success", "lines": lines}

    if verb == "route":
        lines = ["$ ip -br -4 addr show && ip -4 route show  # Layer-3 Interfaces & Routing Table"]
        if shutil.which("ip"):
            addr_res = subprocess.run(["ip", "-br", "-4", "addr", "show"], capture_output=True, text=True, check=False, timeout=3)
            for r in addr_res.stdout.splitlines():
                lines.append(f"  [IFACE] {r}")
            rt_res = subprocess.run(["ip", "-4", "route", "show"], capture_output=True, text=True, check=False, timeout=3)
            for r in rt_res.stdout.splitlines():
                lines.append(f"  [ROUTE] {r}")
        return {"command": cmd, "tone": "success", "lines": lines}

    if verb == "ports":
        lines = ["$ ss -tuln  # Local Sensor Listening TCP/UDP Sockets"]
        if shutil.which("ss"):
            res = subprocess.run(["ss", "-tuln"], capture_output=True, text=True, check=False, timeout=3)
            for r in res.stdout.splitlines()[:18]:
                lines.append(f"  {r}")
        return {"command": cmd, "tone": "info", "lines": lines}

    if verb == "ping":
        target = parts[1] if len(parts) > 1 else gw_ip
        if target.lower() in ("gw", "gateway", "router"):
            target = gw_ip
        try:
            ipaddress.ip_address(target)
        except ValueError:
            return {
                "command": cmd,
                "tone": "danger",
                "lines": [f"[ERROR] Invalid IPv4 address '{target}'. Usage: ping <ip|gw>"],
            }
        l3 = _probe_icmp_and_arp_state(target)
        svc = probe_host_services(target, timeout=0.2)
        rtt = l3["icmp_rtt_ms"] if l3["icmp_rtt_ms"] is not None else svc["latency_ms"]
        return {
            "command": cmd,
            "tone": "success" if (l3["icmp_reachable"] or rtt is not None) else "danger",
            "lines": [
                f"$ ping -c 2 -W 1 {target}",
                f"  Host Reachable : {'ONLINE' if (l3['icmp_reachable'] or rtt is not None) else 'UNREACHABLE'}",
                f"  Round-Trip Time: {rtt if rtt is not None else 'timeout'} ms",
                f"  Observed TTL   : {l3['ttl'] or 'n/a'} ({l3['os_fingerprint']})",
                f"  Kernel ARP     : {l3['arp_state']}",
            ],
        }

    if verb == "inspect":
        target = parts[1] if len(parts) > 1 else gw_ip
        if target.lower() in ("gw", "gateway", "router"):
            target = gw_ip
        try:
            ipaddress.ip_address(target)
        except ValueError:
            return {
                "command": cmd,
                "tone": "danger",
                "lines": [f"[ERROR] Invalid IPv4 address '{target}'. Usage: inspect <ip|gw>"],
            }
        report = inspect_host_exhaustive(target)
        return {
            "command": cmd,
            "tone": "success",
            "lines": report["terminal_lines"],
            "inspection": report,
        }

    return {
        "command": cmd,
        "tone": "danger",
        "lines": [
            f"[UNKNOWN COMMAND] '{cmd}'. Type or click 'help' to see available sysadmin commands."
        ],
    }
