from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.device import Device
from ..services.device_classifier import classify_device
from ..services.event_service import create_event
from ..services.virtual_lab import (
    VIRTUAL_APPLIANCES,
    VIRTUAL_LAB_TAG,
    is_virtual_lab_running,
    seed_virtual_lab_devices,
    start_virtual_lab_daemons,
    stop_virtual_lab_daemons,
)
from ..services.vlan_policy import get_vlan_for_device_type

router = APIRouter(prefix="/simulation", tags=["Simulation"])

SIMULATION_NOTE = (
    "NETOPS SIMULATION: fictional test device; "
    "not discovered on the physical LAN."
)

SAMPLE_DEVICES = [
    {
        "mac_address": "02:4E:45:54:4F:01",
        "ip_address": "192.0.2.101",
        "hostname": "SIM-PC-01",
        "vendor": "Dell",
    },
    {
        "mac_address": "02:4E:45:54:4F:02",
        "ip_address": "192.0.2.102",
        "hostname": "SIM-CCTV-01",
        "vendor": "Hikvision",
    },
    {
        "mac_address": "02:4E:45:54:4F:03",
        "ip_address": "192.0.2.103",
        "hostname": "SIM-PRINTER-01",
        "vendor": "Brother",
    },
    {
        "mac_address": "02:4E:45:54:4F:04",
        "ip_address": "192.0.2.104",
        "hostname": "SIM-UNKNOWN-01",
        "vendor": "Unidentified Test Vendor",
    },
]


@router.post("/seed")
def seed_simulation_devices(db: Session = Depends(get_db)):
    """Create fictional devices without accessing physical equipment."""

    existing_by_mac = {}

    # Validate all existing MAC addresses before making changes.
    for sample in SAMPLE_DEVICES:
        existing = db.scalar(
            select(Device).where(
                Device.mac_address == sample["mac_address"]
            )
        )

        if existing is not None:
            if not (
                existing.notes
                and "NETOPS SIMULATION:" in existing.notes
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "A sample MAC address belongs to a "
                        "non-simulation device. No devices were created."
                    ),
                )

            existing_by_mac[sample["mac_address"]] = existing

    created = []
    already_present = []

    try:
        for sample in SAMPLE_DEVICES:
            mac_address = sample["mac_address"]

            if mac_address in existing_by_mac:
                already_present.append(mac_address)
                continue

            detected_type = classify_device(
                hostname=sample["hostname"],
                vendor=sample["vendor"],
                mac_address=mac_address,
            )

            device = Device(
                **sample,
                device_type=(
                    None if detected_type == "unknown"
                    else detected_type
                ),
                vlan_id=get_vlan_for_device_type(detected_type),
                classification_status="normal",
                status="online",
                approval_status="pending",
                enforcement_status="quarantined",
                internet_access_authorized=False,
                notes=SIMULATION_NOTE,
            )

            db.add(device)
            db.flush()

            create_event(
                db,
                "simulation_device_created",
                (
                    f"SIMULATION ONLY: created fictional device "
                    f"{device.hostname}, type={detected_type}, "
                    f"target VLAN={device.vlan_id}. "
                    "Device remains pending and quarantined."
                ),
                device.id,
            )

            created.append(device)

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "mode": "simulation",
        "hardware_accessed": False,
        "created_count": len(created),
        "already_present_count": len(already_present),
        "created": [
            {
                "id": device.id,
                "hostname": device.hostname,
                "mac_address": device.mac_address,
                "device_type": device.device_type or "unknown",
                "vlan_id": device.vlan_id,
                "approval_status": device.approval_status,
                "enforcement_status": device.enforcement_status,
            }
            for device in created
        ],
        "already_present": already_present,
    }


@router.post("/lab-up")
async def start_virtual_network_lab(db: Session = Depends(get_db)):
    """
    Boot the NETOPS Virtual Enterprise Network Lab on 127.0.2.0/24:
    Starts live TCP listeners for ISP Router, Cisco Catalyst Switch, Sophos XGS
    Firewall, Dell Workstation, Hikvision CCTV, HP LaserJet Printer, and Rogue
    Raspberry Pi DropBox, and registers them in the topology.
    """
    daemon_logs = await start_virtual_lab_daemons()
    seeded = seed_virtual_lab_devices(db)
    terminal_lines = [
        "$ netops-lab --up --subnet 127.0.2.0/24 --topology enterprise-nac",
        "[LAB] Booting 7 virtual network appliances with live TCP socket listeners...",
        *daemon_logs,
        f"[LAB] Virtual Enterprise Network Lab is ONLINE ({len(VIRTUAL_APPLIANCES)} virtual hosts reachable via ICMP & TCP).",
    ]
    return {
        "mode": "virtual_lab",
        "virtual_lab_active": is_virtual_lab_running(),
        "created_count": len(seeded["created"]),
        "already_present_count": len(seeded["already_present"]),
        "terminal_lines": terminal_lines,
    }


@router.post("/clear")
async def clear_simulation_devices(db: Session = Depends(get_db)):
    """
    Stop virtual appliance listeners and remove virtual/simulation devices so
    the operator views strictly real physical LAN telemetry without noise.
    """
    stopped_listeners = await stop_virtual_lab_daemons()
    sim_macs = {sample["mac_address"] for sample in SAMPLE_DEVICES} | {
        spec["mac_address"] for spec in VIRTUAL_APPLIANCES
    }
    devices = db.scalars(select(Device)).all()
    removed_hostnames: list[str] = []

    for device in devices:
        is_sim = (
            device.mac_address in sim_macs
            or (device.notes and ("NETOPS SIMULATION:" in device.notes or VIRTUAL_LAB_TAG in device.notes))
            or (device.ip_address and (device.ip_address.startswith("192.0.2.") or device.ip_address.startswith("127.0.2.")))
        )
        if is_sim:
            removed_hostnames.append(f"{device.hostname or device.mac_address} ({device.ip_address})")
            db.delete(device)

    db.commit()

    return {
        "mode": "live_lan_only",
        "stopped_listeners": stopped_listeners,
        "removed_count": len(removed_hostnames),
        "removed_devices": removed_hostnames,
        "terminal_lines": [
            "$ netops-lab --down --isolate-live-lan",
            f"[LAB] Stopped {stopped_listeners} virtual appliance TCP socket listener(s) on 127.0.2.0/24.",
            f"[CLEAN] Removed {len(removed_hostnames)} virtual/simulation host(s): {', '.join(removed_hostnames) or 'none'}",
            "[OK] Switched to strictly LIVE PHYSICAL LAN telemetry mode.",
        ],
    }

