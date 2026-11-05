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
    # HP / Printers
    "00:14:38": "Hewlett Packard",
    "3C:D9:2B": "Hewlett Packard",
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
    3389: "RDP",
    8080: "HTTP-Alt",
    8443: "HTTPS-Admin",
    9100: "JetDirect-Print",
}

HIGH_RISK_PORTS: dict[int, str] = {
    21: "Plaintext FTP file transfer exposed",
    23: "Unencrypted Telnet remote shell exposed",
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


def probe_host_services(
    ip_address: str,
    ports: dict[int, str] | None = None,
    timeout: float = 0.22,
) -> dict:
    """
    Concurrently probe common TCP ports on a single LAN host, measure TCP handshake
    round-trip latency (ms), and extract HTTP banner metadata if available.
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
                    if port in (80, 8080):
                        banner = _grab_http_banner(ip_address, port, timeout=0.45)
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
