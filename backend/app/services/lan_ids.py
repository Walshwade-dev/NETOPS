"""
LAN Intrusion Detection System (IDS) & Active Canary Trap for NETOPS.

Detects:
1. ARP Spoofing / Man-in-the-Middle (MITM) attacks (duplicate MAC across IPs or Gateway MAC hijack).
2. IP Hijacking / MAC Spoofing anomalies against baseline devices.
3. High-risk exposed LAN services (Telnet :23, FTP :21, SMB :445, RDP :3389).
4. Active Port Scans touching the NETOPS TCP Canary Trap port (:8899).
"""

from __future__ import annotations

import asyncio
import platform
import shutil
import subprocess
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models.device import Device
from ..models.event import Event
from .discovery import IPV4_REGEX, get_active_interface, is_valid_ip_address, normalize_mac
from .event_service import create_event
from .lan_intelligence import HIGH_RISK_PORTS, get_default_gateway_ip, probe_host_services

CANARY_PORT = 8899
_canary_server: asyncio.AbstractServer | None = None
_recent_canary_hits: list[dict] = []


def get_raw_arp_entries() -> list[dict[str, str]]:
    """
    Return all raw (ip_address, mac_address) entries from the OS neighbor table
    WITHOUT deduplicating by MAC so that ARP poisoning (1 MAC claiming 2+ IPs)
    can be detected.
    """
    entries: list[dict[str, str]] = []
    seen_pairs: set[tuple[str, str]] = set()
    system = platform.system().lower()
    iface = get_active_interface()

    if system == "linux" and shutil.which("ip"):
        cmds = []
        if iface:
            cmds.append(["ip", "-4", "neigh", "show", "dev", iface])
        cmds.append(["ip", "-4", "neigh", "show"])

        for cmd in cmds:
            try:
                res = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    check=False,
                    timeout=4,
                )
                if res.returncode != 0:
                    continue
                for line in res.stdout.splitlines():
                    parts = line.split()
                    if not parts or "lladdr" not in parts:
                        continue
                    ip_addr = parts[0]
                    if not is_valid_ip_address(ip_addr):
                        continue
                    idx = parts.index("lladdr")
                    if idx + 1 >= len(parts):
                        continue
                    mac_addr = normalize_mac(parts[idx + 1])
                    if mac_addr and (ip_addr, mac_addr) not in seen_pairs:
                        seen_pairs.add((ip_addr, mac_addr))
                        entries.append({"ip_address": ip_addr, "mac_address": mac_addr})
                if entries:
                    break
            except Exception:
                pass

    if not entries and shutil.which("arp"):
        try:
            res = subprocess.run(
                ["arp", "-a"],
                capture_output=True,
                text=True,
                check=False,
                timeout=4,
            )
            for line in res.stdout.splitlines():
                ip_match = IPV4_REGEX.search(line)
                if not ip_match:
                    continue
                ip_addr = ip_match.group(0)
                if not is_valid_ip_address(ip_addr):
                    continue
                mac_addr = None
                for token in line.replace("(", " ").replace(")", " ").split():
                    cand = normalize_mac(token)
                    if cand:
                        mac_addr = cand
                        break
                if mac_addr and (ip_addr, mac_addr) not in seen_pairs:
                    seen_pairs.add((ip_addr, mac_addr))
                    entries.append({"ip_address": ip_addr, "mac_address": mac_addr})
        except Exception:
            pass

    return entries


def _record_security_alert(
    db: Session,
    event_type: str,
    message: str,
    device_id: int | None = None,
) -> Event:
    """Create a deduplicated security alert event in the database."""
    latest = db.scalar(
        select(Event)
        .where(Event.event_type == event_type, Event.message == message)
        .order_by(Event.id.desc())
        .limit(1)
    )
    if latest is not None:
        return latest
    return create_event(db, event_type, message, device_id)


def run_lan_security_audit(
    db: Session,
    arp_entries: list[dict[str, str]] | None = None,
    probe_ports: bool = True,
) -> dict:
    """
    Inspect the live LAN ARP table, gateway integrity, device identity baseline,
    and exposed ports for active attacks or security risks.
    """
    raw_arp = arp_entries if arp_entries is not None else get_raw_arp_entries()
    gateway_ip = get_default_gateway_ip()
    known_devices = db.scalars(select(Device)).all()
    devices_by_mac = {d.mac_address.upper(): d for d in known_devices if d.mac_address}
    devices_by_ip = {d.ip_address: d for d in known_devices if d.ip_address and d.status == "online"}

    alerts: list[dict] = []

    # 1. ARP Spoofing / MITM Check: Single MAC claiming multiple IPs
    ips_by_mac: dict[str, list[str]] = {}
    for entry in raw_arp:
        mac = entry["mac_address"].upper()
        ip = entry["ip_address"]
        ips_by_mac.setdefault(mac, []).append(ip)

    for mac, ips in ips_by_mac.items():
        if len(ips) > 1:
            involves_gw = gateway_ip in ips
            severity = "critical"
            msg = (
                f"ARP SPOOFING / MITM DETECTED: MAC {mac} claims multiple IPv4 addresses "
                f"({', '.join(sorted(ips))})"
                + (f" including Default Gateway {gateway_ip}!" if involves_gw else ".")
            )
            dev = devices_by_mac.get(mac)
            ev = _record_security_alert(db, "arp_spoofing_detected", msg, dev.id if dev else None)
            alerts.append(
                {
                    "id": ev.id,
                    "severity": severity,
                    "type": "arp_spoofing_detected",
                    "title": "ARP Cache Poisoning / MITM",
                    "message": msg,
                    "mac_address": mac,
                    "ip_addresses": ips,
                }
            )

    # 2. Gateway MAC Hijack / Impersonation Check
    if gateway_ip:
        gw_arp_macs = [e["mac_address"].upper() for e in raw_arp if e["ip_address"] == gateway_ip]
        gw_device = devices_by_ip.get(gateway_ip)
        if gw_device and gw_arp_macs:
            live_gw_mac = gw_arp_macs[0]
            if gw_device.mac_address.upper() != live_gw_mac:
                msg = (
                    f"GATEWAY MAC CHANGED: Router {gateway_ip} baseline MAC was "
                    f"{gw_device.mac_address} but ARP table reports {live_gw_mac}. "
                    f"Possible rogue gateway or Evil Twin AP."
                )
                ev = _record_security_alert(db, "gateway_mac_hijack", msg, gw_device.id)
                alerts.append(
                    {
                        "id": ev.id,
                        "severity": "critical",
                        "type": "gateway_mac_hijack",
                        "title": "Gateway MAC Hijack / Rogue Router",
                        "message": msg,
                        "mac_address": live_gw_mac,
                        "ip_addresses": [gateway_ip],
                    }
                )

    # 3. High-Risk Open Ports / Rogue Services Check on Online Devices
    host_telemetry: list[dict] = []
    if probe_ports:
        online_ips = sorted({e["ip_address"] for e in raw_arp})
        for ip in online_ips:
            intel = probe_host_services(ip)
            host_telemetry.append(intel)
            for port_info in intel["open_ports"]:
                risk_desc = port_info.get("risk")
                if risk_desc:
                    dev = devices_by_ip.get(ip)
                    msg = (
                        f"RISKY SERVICE EXPOSED: Host {ip} "
                        f"({dev.hostname if dev and dev.hostname else 'unknown'}) "
                        f"has port {port_info['port']}/{port_info['service']} open — {risk_desc}."
                    )
                    ev = _record_security_alert(
                        db, "risky_port_exposed", msg, dev.id if dev else None
                    )
                    alerts.append(
                        {
                            "id": ev.id,
                            "severity": "high",
                            "type": "risky_port_exposed",
                            "title": f"Exposed {port_info['service']} Port (:{port_info['port']})",
                            "message": msg,
                            "ip_addresses": [ip],
                        }
                    )

    # 4. Include recent Canary Port Trap triggers (active port scans against this host)
    for hit in _recent_canary_hits[-5:]:
        alerts.append(hit)

    db.commit()

    return {
        "status": "threat_detected" if alerts else "secure",
        "gateway_ip": gateway_ip,
        "arp_entries_inspected": len(raw_arp),
        "canary_port": CANARY_PORT,
        "canary_active": _canary_server is not None,
        "alerts_count": len(alerts),
        "alerts": alerts,
        "host_telemetry": host_telemetry,
    }


async def _handle_canary_connection(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
) -> None:
    """Triggered whenever any host connects to the local TCP Canary Port (:8899)."""
    peer = writer.get_extra_info("peername")
    scanner_ip = peer[0] if peer else "unknown"
    try:
        writer.write(b"SSH-2.0-OpenSSH_8.9p1 NETOPS-Canary\r\n")
        await writer.drain()
    except Exception:
        pass
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass

    # Look up scanner MAC in ARP table if available
    scanner_mac = None
    for entry in get_raw_arp_entries():
        if entry["ip_address"] == scanner_ip:
            scanner_mac = entry["mac_address"]
            break

    db = SessionLocal()
    try:
        dev = db.scalar(select(Device).where(Device.ip_address == scanner_ip))
        if not scanner_mac and dev and dev.mac_address:
            scanner_mac = dev.mac_address
        msg = (
            f"PORT SCAN / INTRUSION ATTEMPT DETECTED: Host {scanner_ip}"
            + (f" ({scanner_mac})" if scanner_mac else "")
            + f" probed NETOPS Canary Trap on TCP port {CANARY_PORT}."
        )
        ev = create_event(db, "port_scan_detected", msg, dev.id if dev else None)
        db.commit()
        hit = {
            "id": ev.id,
            "severity": "critical",
            "type": "port_scan_detected",
            "title": "Active Port Scan / Canary Triggered",
            "message": msg,
            "mac_address": scanner_mac,
            "ip_addresses": [scanner_ip],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        _recent_canary_hits.append(hit)
    finally:
        db.close()


async def start_canary_trap(port: int = CANARY_PORT) -> bool:
    """Start the background TCP Canary Trap listener for port-scan detection."""
    global _canary_server
    if _canary_server is not None:
        return True
    try:
        _canary_server = await asyncio.start_server(
            _handle_canary_connection,
            host="0.0.0.0",
            port=port,
        )
        return True
    except Exception as exc:
        print(f"[IDS-CANARY] Could not bind Canary port {port}: {exc}")
        return False


def simulate_lan_attack(db: Session, attack_type: str = "arp_spoof") -> dict:
    """
    Trigger a safe, realistic simulated LAN attack alert so the operator can
    verify real-time IDS alerting and WebSocket notifications.
    """
    gateway_ip = get_default_gateway_ip() or "192.168.8.1"

    if attack_type == "port_scan":
        msg = (
            f"[SIMULATED DRILL] PORT SCAN DETECTED: Host 192.168.8.66 "
            f"(B6:6E:E6:0A:EE:19) swept local ports and triggered NETOPS Canary Trap (TCP :{CANARY_PORT})."
        )
        ev_type = "port_scan_detected"
        title = "Active Port Scan / Canary Triggered"
    elif attack_type == "rogue_service":
        msg = (
            f"[SIMULATED DRILL] RISKY SERVICE EXPOSED: Host {gateway_ip} opened "
            f"unencrypted Telnet port 23/TCP on the local Wi-Fi."
        )
        ev_type = "risky_port_exposed"
        title = "Exposed Telnet Service (:23)"
    else:
        msg = (
            f"[SIMULATED DRILL] ARP SPOOFING / MITM DETECTED: Attacker MAC DE:AD:BE:EF:13:37 "
            f"is broadcasting gratuitous ARP replies impersonating Default Gateway {gateway_ip}!"
        )
        ev_type = "arp_spoofing_detected"
        title = "ARP Cache Poisoning / MITM"

    ev = create_event(db, ev_type, msg, None)
    db.commit()
    db.refresh(ev)

    return {
        "status": "simulated",
        "alert": {
            "id": ev.id,
            "severity": "critical",
            "type": ev_type,
            "title": title,
            "message": msg,
            "created_at": ev.created_at.isoformat(),
        },
    }
