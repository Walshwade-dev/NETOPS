"""
NETOPS Live Virtual Enterprise Network Lab Engine.

Spawns real asynchronous TCP socket servers on distinct Linux 127.0.2.0/24
virtual interface addresses so every virtual appliance (ISP Edge Router,
Cisco Catalyst Switch, Sophos XGS Firewall, Corporate Workstation, Hikvision
CCTV Camera, HP JetDirect Printer, and Rogue Raspberry Pi DropBox) responds
to real ICMP pings, TCP port scans, banner grabs, and VLAN/Firewall actions.
"""

from __future__ import annotations

import asyncio
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.device import Device
from .event_service import create_event

VIRTUAL_LAB_TAG = "[VIRTUAL-LAB]"

VIRTUAL_APPLIANCES = [
    {
        "ip_address": "127.0.2.1",
        "mac_address": "4C:5E:0C:01:00:01",
        "hostname": "ISP-EDGE-GW01",
        "vendor": "MikroTikls SIA",
        "device_type": "computer",
        "vlan_id": 20,
        "approval_status": "approved",
        "enforcement_status": "allowed",
        "internet_access_authorized": True,
        "switch_name": "WAN-UPLINK-01",
        "switch_port": "SFP+1/0/1",
        "role": "ISP Edge Router (WAN Gateway)",
        "os_name": "MikroTik RouterOS",
        "os_version": "7.14.2 (Stable)",
        "services": [
            {
                "port": 8080,
                "proto": "http",
                "server": "MikroTik-RouterOS/7.14",
                "title": "MikroTik RouterOS v7.14 — ISP Fiber Edge Gateway",
                "body": "WAN Uplink: CONNECTED (10Gbps SFP+) | BGP Session: ESTABLISHED",
            },
        ],
    },
    {
        "ip_address": "127.0.2.2",
        "mac_address": "00:1B:54:02:00:02",
        "hostname": "SW-CORE-2960X",
        "vendor": "Cisco Systems",
        "device_type": "computer",
        "vlan_id": 20,
        "approval_status": "approved",
        "enforcement_status": "allowed",
        "internet_access_authorized": True,
        "switch_name": "SW-CORE-2960X (Self)",
        "switch_port": "Vlan1 (Mgmt)",
        "role": "Cisco Catalyst 2960-X 802.1Q L2/L3 Switch",
        "os_name": "Cisco IOS Software",
        "os_version": "15.2(7)E10",
        "services": [
            {
                "port": 2222,
                "proto": "raw",
                "banner": "SSH-2.0-Cisco-1.25 Catalyst-2960X-IOS-15.2(7)E\r\n",
            },
            {
                "port": 8080,
                "proto": "http",
                "server": "Cisco-IOS-HTTP/15.2",
                "title": "Cisco Catalyst 2960-X — 802.1Q Switch Matrix (VLAN 20/30/40/90)",
                "body": "Ports Active: Gi1/0/1, Gi1/0/11 (VLAN 20), Gi1/0/15 (VLAN 30), Gi1/0/18 (VLAN 40), Gi1/0/24 (VLAN 90)",
            },
        ],
    },
    {
        "ip_address": "127.0.2.10",
        "mac_address": "00:1A:8C:10:00:10",
        "hostname": "SOPHOS-XGS-2100",
        "vendor": "Sophos Ltd",
        "device_type": "computer",
        "vlan_id": 20,
        "approval_status": "approved",
        "enforcement_status": "allowed",
        "internet_access_authorized": True,
        "switch_name": "SW-CORE-2960X",
        "switch_port": "Gi1/0/1 (Trunk)",
        "role": "Sophos XGS 2100 Next-Gen Firewall Appliance",
        "os_name": "Sophos SFOS",
        "os_version": "20.0.1 MR-1-Build342",
        "services": [
            {
                "port": 4444,
                "proto": "http",
                "server": "Sophos-XGS-Firewall/SFOS-20.0.1",
                "title": "Sophos XGS 2100 Admin API — Rule NETOPS_Quarantine_Block Active",
                "body": "<Response APIVersion=\"2000.1\"><Login><status>Authentication Successful</status></Login><FirewallRule name=\"NETOPS_Quarantine_Block\" status=\"Active\"/></Response>",
            },
        ],
    },
    {
        "ip_address": "127.0.2.21",
        "mac_address": "F8:B1:56:21:00:15",
        "hostname": "WS-FINANCE-01",
        "vendor": "Dell Inc.",
        "device_type": "computer",
        "vlan_id": 20,
        "approval_status": "approved",
        "enforcement_status": "allowed",
        "internet_access_authorized": True,
        "switch_name": "SW-CORE-2960X",
        "switch_port": "Gi1/0/11",
        "role": "Corporate Finance Workstation (VLAN 20)",
        "os_name": "Ubuntu Linux",
        "os_version": "24.04.1 LTS",
        "services": [
            {
                "port": 2222,
                "proto": "raw",
                "banner": "SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.5 (WS-FINANCE-01)\r\n",
            },
            {
                "port": 8080,
                "proto": "http",
                "server": "nginx/1.24.0 (Ubuntu)",
                "title": "WS-FINANCE-01 Endpoint Telemetry Agent",
                "body": "Host: WS-FINANCE-01 | VLAN: 20 | Status: Online",
            },
        ],
    },
    {
        "ip_address": "127.0.2.31",
        "mac_address": "44:19:B6:31:00:22",
        "hostname": "CCTV-LOBBY-01",
        "vendor": "Hikvision Digital",
        "device_type": "cctv",
        "vlan_id": 30,
        "approval_status": "approved",
        "enforcement_status": "quarantined",
        "internet_access_authorized": False,
        "switch_name": "SW-CORE-2960X",
        "switch_port": "Gi1/0/15",
        "role": "IP PoE Surveillance Camera (VLAN 30 Isolated)",
        "os_name": "Hikvision Embedded Linux",
        "os_version": "V5.7.15 build 240110",
        "services": [
            {
                "port": 5540,
                "proto": "raw",
                "banner": "RTSP/1.0 200 OK\r\nServer: Hikvision-RTSP-Stream/5.7.15 (DS-2CD2143G2-I)\r\n\r\n",
            },
            {
                "port": 8080,
                "proto": "http",
                "server": "App-webs/ Hikvision-DNVR",
                "title": "Hikvision DS-2CD2143G2-I — Main Lobby Dome Camera",
                "body": "Stream: H.265+ 2688x1520@30fps | PoE Draw: 6.2W",
            },
        ],
    },
    {
        "ip_address": "127.0.2.41",
        "mac_address": "3C:D9:2B:41:00:40",
        "hostname": "PRN-FLOOR2-HP",
        "vendor": "Hewlett Packard",
        "device_type": "printer",
        "vlan_id": 40,
        "approval_status": "approved",
        "enforcement_status": "quarantined",
        "internet_access_authorized": False,
        "switch_name": "SW-CORE-2960X",
        "switch_port": "Gi1/0/18",
        "role": "Enterprise Network Laser Printer (VLAN 40)",
        "os_name": "HP FutureSmart Firmware",
        "os_version": "FS 5.7.1.3",
        "services": [
            {
                "port": 9100,
                "proto": "raw",
                "banner": '@PJL INFO ID\r\n"HP LaserJet Enterprise M611dn" STATUS=READY TONER=84%\r\n',
            },
            {
                "port": 8080,
                "proto": "http",
                "server": "HP-ChaiSOE/1.0",
                "title": "HP LaserJet Enterprise M611dn — Embedded Web Server",
                "body": "Serial: CNB1R24091 | Page Count: 14,892 | Toner: 84%",
            },
        ],
    },
    {
        "ip_address": "127.0.2.99",
        "mac_address": "B8:27:EB:99:13:37",
        "hostname": "ROGUE-PI-DROPBOX",
        "vendor": "Raspberry Pi Foundation",
        "device_type": None,
        "vlan_id": 90,
        "approval_status": "pending",
        "enforcement_status": "quarantined",
        "internet_access_authorized": False,
        "switch_name": "SW-CORE-2960X",
        "switch_port": "Gi1/0/24",
        "role": "Unverified Rogue DropBox — Quarantined in VLAN 90",
        "os_name": "Debian GNU/Linux (Kali)",
        "os_version": "2026.1-arm64",
        "services": [
            {
                "port": 2323,
                "proto": "raw",
                "banner": "WARNING: Unencrypted Telnet Root Shell (ROGUE-PI-DROPBOX)\r\nkali-dropbox login: ",
            },
        ],
    },
]

_active_lab_servers: list[asyncio.AbstractServer] = []


def _make_service_handler(svc: dict):
    async def _handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        try:
            if svc.get("proto") == "http":
                try:
                    await asyncio.wait_for(reader.read(512), timeout=0.25)
                except Exception:
                    pass
                title = svc.get("title", "NETOPS Virtual Appliance")
                server_hdr = svc.get("server", "NETOPS-Virtual-Appliance/1.0")
                body_txt = svc.get("body", "")
                html = f"<html><head><title>{title}</title></head><body><h1>{title}</h1><p>{body_txt}</p></body></html>"
                payload = (
                    f"HTTP/1.1 200 OK\r\n"
                    f"Server: {server_hdr}\r\n"
                    f"Content-Type: text/html; charset=utf-8\r\n"
                    f"Content-Length: {len(html)}\r\n"
                    f"Connection: close\r\n\r\n"
                    f"{html}"
                )
                writer.write(payload.encode("utf-8"))
                await writer.drain()
            else:
                banner = svc.get("banner", "NETOPS-Virtual-Service READY\r\n")
                writer.write(banner.encode("utf-8"))
                await writer.drain()
        except Exception:
            pass
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    return _handler


async def start_virtual_lab_daemons() -> list[str]:
    """Bind real TCP listeners on 127.0.2.x for all 7 virtual network appliances."""
    global _active_lab_servers
    if _active_lab_servers:
        return [
            f"[LAB] {len(_active_lab_servers)} virtual appliance TCP socket listeners already active on 127.0.2.0/24."
        ]

    logs: list[str] = []
    for app in VIRTUAL_APPLIANCES:
        ip = app["ip_address"]
        bound_ports: list[str] = []
        for svc in app.get("services", []):
            port = svc["port"]
            try:
                srv = await asyncio.start_server(
                    _make_service_handler(svc),
                    host=ip,
                    port=port,
                )
                _active_lab_servers.append(srv)
                bound_ports.append(f":{port}")
            except Exception as exc:
                bound_ports.append(f":{port}(err:{exc})")
        logs.append(
            f"  [VM-UP] {app['hostname']:<17} {ip:<12} ({app['mac_address']}) "
            f"-> {app['switch_name']}:{app['switch_port']:<12} VLAN {app['vlan_id']:<2} "
            f"listening on {', '.join(bound_ports)}"
        )
    return logs


async def stop_virtual_lab_daemons() -> int:
    """Shut down all virtual appliance TCP listeners."""
    global _active_lab_servers
    count = len(_active_lab_servers)
    for srv in _active_lab_servers:
        try:
            srv.close()
            await srv.wait_closed()
        except Exception:
            pass
    _active_lab_servers = []
    return count


def is_virtual_lab_running() -> bool:
    return len(_active_lab_servers) > 0


def seed_virtual_lab_devices(db: Session) -> dict:
    """
    Create or update the 7 virtual network topology appliances in the database
    along with backward-compatible RFC 5737 / 127.0.2.x records.
    """
    created = []
    already_present = []

    for spec in VIRTUAL_APPLIANCES:
        existing = db.scalar(
            select(Device).where(Device.mac_address == spec["mac_address"])
        )
        ports_desc = ", ".join(f"{s['port']}/TCP" for s in spec.get("services", []))
        note = (
            f"{VIRTUAL_LAB_TAG} {spec['role']} | Switch: {spec['switch_name']} "
            f"({spec['switch_port']}) | Live Ports: {ports_desc}"
        )
        if existing is not None:
            existing.ip_address = spec["ip_address"]
            existing.hostname = spec["hostname"]
            existing.vendor = spec["vendor"]
            existing.switch_name = spec["switch_name"]
            existing.switch_port = spec["switch_port"]
            existing.notes = note
            already_present.append(spec["mac_address"])
            continue

        dev = Device(
            ip_address=spec["ip_address"],
            mac_address=spec["mac_address"],
            hostname=spec["hostname"],
            vendor=spec["vendor"],
            device_type=spec["device_type"],
            vlan_id=spec["vlan_id"],
            classification_status="normal" if spec["device_type"] else "unrecognized",
            status="online",
            approval_status=spec["approval_status"],
            enforcement_status=spec["enforcement_status"],
            internet_access_authorized=spec["internet_access_authorized"],
            switch_name=spec["switch_name"],
            switch_port=spec["switch_port"],
            notes=note,
        )
        db.add(dev)
        db.flush()
        created.append(dev)

    if created:
        create_event(
            db,
            "simulation_device_created",
            f"VIRTUAL LAB ONLINE: Booted {len(created)} virtual appliances on 127.0.2.0/24 "
            "(ISP Router, Cisco Catalyst Switch, Sophos XGS Firewall, Dell Workstation, "
            "Hikvision CCTV, HP LaserJet Printer, Rogue Raspberry Pi).",
            created[0].id,
        )
    db.commit()

    return {
        "created": created,
        "already_present": already_present,
    }
