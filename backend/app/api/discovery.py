import platform
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.discovery import (
    discover_devices,
    get_active_interface,
    get_active_network_cidr,
    get_local_ip,
    get_local_mac,
    save_discovered_devices,
)
from ..services.lan_ids import (
    CANARY_PORT,
    run_lan_security_audit,
    simulate_lan_attack,
)
from ..services.lan_intelligence import get_default_gateway_ip


router = APIRouter(
    prefix="/discovery",
    tags=["Discovery"],
)


class DiscoveryRequest(BaseModel):
    network: str = "auto"

    @field_validator("network")
    @classmethod
    def validate_network(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Network range cannot be empty.")
        return value


class AttackDrillRequest(BaseModel):
    attack_type: str = "arp_spoof"


@router.get("/network")
def get_detected_network():
    """
    Return the auto-detected active network interface, local IP, MAC, gateway,
    OS, Canary trap port, and IPv4 CIDR range for platform-independent LAN discovery.
    """
    return {
        "os": platform.system(),
        "interface": get_active_interface(),
        "local_ip": get_local_ip(),
        "local_mac": get_local_mac(),
        "gateway_ip": get_default_gateway_ip(),
        "canary_port": CANARY_PORT,
        "network": get_active_network_cidr(),
    }


@router.post("/security-audit")
def run_security_audit_endpoint(
    db: Session = Depends(get_db),
):
    """
    Run deep LAN intrusion detection (ARP spoofing / MITM, Gateway hijack,
    risky exposed ports, and Canary port scan trap status).
    """
    iface = get_active_interface() or "auto"
    result = run_lan_security_audit(db, probe_ports=True)
    lines = [
        f"$ netops-ids --interface {iface} --gateway {result.get('gateway_ip') or 'auto'} --canary-port {result.get('canary_port')}",
        f"[IDS] Inspecting OS Layer-2 ARP cache (`ip -4 neigh show dev {iface}` / `arp -a`)... {result.get('arp_entries_inspected', 0)} neighbor entries read.",
        f"[IDS] Checking ARP cache for duplicate MAC-to-IP mappings (MITM / ARP Poisoning)...",
        f"[IDS] Verifying Default Gateway ({result.get('gateway_ip')}) MAC baseline integrity...",
        f"[IDS] TCP Canary Trap on port :{result.get('canary_port')} status: {'LISTENING (ACTIVE)' if result.get('canary_active') else 'INACTIVE'}",
    ]
    for host in result.get("host_telemetry", []):
        lines.append(
            f"[PROBE] {host['ip_address']} -> RTT: {host.get('latency_ms') or 'n/a'}ms | Open TCP: {host.get('services_summary')}"
        )
    if result.get("alerts"):
        for alert in result["alerts"]:
            lines.append(f"[ALERT:{alert.get('severity', 'HIGH').upper()}] {alert.get('message')}")
    else:
        lines.append("[OK] Zero ARP spoofing, gateway hijack, or rogue service anomalies detected.")
    result["terminal_lines"] = lines
    return result


@router.post("/simulate-attack")
def run_simulate_attack_endpoint(
    request: AttackDrillRequest,
    db: Session = Depends(get_db),
):
    """
    Trigger a safe simulated LAN attack alert (arp_spoof, port_scan, rogue_service)
    to verify real-time IDS alerting.
    """
    return simulate_lan_attack(db, attack_type=request.attack_type)


@router.post("/scan")
def run_discovery_scan(
    request: DiscoveryRequest,
    db: Session = Depends(get_db),
):
    """
    Discover LAN devices and save them to the NETOPS database.
    Pass `{"network": "auto"}` to auto-detect the current router's subnet.
    """
    target_network = (
        get_active_network_cidr()
        if request.network.strip().lower() == "auto"
        else request.network
    )

    try:
        discovered_devices = discover_devices(target_network)

        saved_devices = save_discovered_devices(
            discovered_devices,
            db,
        )

        iface = get_active_interface() or "auto"
        local_ip = get_local_ip()
        gw_ip = get_default_gateway_ip()
        terminal_lines = [
            f"$ netops-discover --interface {iface} --subnet {target_network}",
            f"[NET] Local Sensor IP: {local_ip} ({get_local_mac() or 'unknown'}) | Default Gateway: {gw_ip or 'n/a'}",
            f"[ARP] Sweeping {target_network} (UDP :5353 + TCP :80) & reading OS neighbor cache (`ip -4 neigh show dev {iface}`)...",
            f"[DISCOVERY] Found {len(discovered_devices)} active host(s) on {target_network}:",
        ]
        for dev in saved_devices:
            notes_info = getattr(dev, "notes", None) or ""
            terminal_lines.append(
                f"  -> {dev.ip_address:<15} {dev.mac_address}  host={dev.hostname or 'unknown'}  vendor=\"{dev.vendor or 'unknown'}\"  {notes_info}"
            )

        return {
            "status": "completed",
            "network": target_network,
            "devices_discovered": len(discovered_devices),
            "devices_processed": len(saved_devices),
            "terminal_lines": terminal_lines,
            "devices": [
                {
                    "id": device.id,
                    "ip_address": device.ip_address,
                    "mac_address": device.mac_address,
                    "hostname": device.hostname,
                    "vendor": device.vendor,
                    "device_type": device.device_type,
                    "classification_status": device.classification_status,
                    "vlan_id": device.vlan_id,
                    "approval_status": device.approval_status,
                    "status": device.status,
                    "notes": getattr(device, "notes", None),
                }
                for device in saved_devices
            ],
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid network range. Provide a valid IPv4 CIDR range, such as 192.168.1.0/24.",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Discovery scan failed due to an internal error.",
        ) from exc
