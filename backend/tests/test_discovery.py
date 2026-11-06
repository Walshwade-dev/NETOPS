from unittest.mock import patch

import pytest

from backend.app.services.discovery import discover_devices


@pytest.mark.parametrize(
    "network",
    [
        "not-a-network",
        "192.168.1.5",
        "192.168.1.0/33",
        "",
    ],
)
def test_discovery_rejects_invalid_network_without_scanning(network):
    with patch(
        "backend.app.services.discovery.subprocess.run"
    ) as mock_run:
        with pytest.raises(ValueError):
            discover_devices(network)

    mock_run.assert_not_called()

def test_discovery_rejects_empty_network_without_scanning():
    from unittest.mock import patch

    with patch(
        "backend.app.services.discovery.subprocess.run"
    ) as mock_run:
        with pytest.raises(ValueError):
            discover_devices("")

    mock_run.assert_not_called()

def test_discovery_nmap_timeout():
    from unittest.mock import patch
    import subprocess

    with (
        patch(
            "backend.app.services.discovery.get_local_ip",
            return_value="192.168.1.10",
        ),
        patch(
            "backend.app.services.discovery.get_local_mac",
            return_value="AA:BB:CC:DD:EE:FF",
        ),
        patch(
            "backend.app.services.discovery.subprocess.run",
            side_effect=subprocess.TimeoutExpired(
                cmd="nmap",
                timeout=60,
            ),
        ) as mock_run,
    ):
        with pytest.raises(subprocess.TimeoutExpired):
            discover_devices("192.168.1.0/24")

    mock_run.assert_called_once()


def test_normalize_mac_handles_windows_and_bsd_formats():
    from backend.app.services.discovery import normalize_mac

    assert normalize_mac("4c-d5-77-57-c3-13") == "4C:D5:77:57:C3:13"
    assert normalize_mac("0:1a:2b:3c:4d:5e") == "00:1A:2B:3C:4D:5E"
    assert normalize_mac("ff-ff-ff-ff-ff-ff") is None
    assert normalize_mac("01-00-5e-00-00-fb") is None


def test_discover_devices_falls_back_when_nmap_missing():
    from unittest.mock import patch

    with (
        patch("backend.app.services.discovery.get_local_ip", return_value="192.168.8.30"),
        patch("backend.app.services.discovery.get_local_mac", return_value="4C:D5:77:57:C3:13"),
        patch("backend.app.services.discovery.subprocess.run", side_effect=FileNotFoundError("nmap")),
        patch("backend.app.services.discovery._pure_python_subnet_probe", return_value={"192.168.8.1": {"hostname": "homerouter.cpe", "vendor": None}}),
        patch("backend.app.services.discovery.get_neighbor_devices", return_value=[
            {"ip_address": "192.168.8.1", "mac_address": "C2:3D:10:AF:D1:81", "hostname": None, "vendor": None, "device_type": "unknown"},
        ]),
    ):
        devices = discover_devices("192.168.8.0/24")
        macs = {d["mac_address"]: d for d in devices}
        assert "4C:D5:77:57:C3:13" in macs
        assert "C2:3D:10:AF:D1:81" in macs
        assert macs["C2:3D:10:AF:D1:81"]["hostname"] == "homerouter.cpe"


def test_lan_intelligence_oui_and_laa_detection():
    from backend.app.services.lan_intelligence import (
        is_locally_administered_mac,
        lookup_mac_vendor,
    )

    # Intel OUI (universally administered)
    assert is_locally_administered_mac("4C:D5:77:57:C3:13") is False
    assert lookup_mac_vendor("4C:D5:77:57:C3:13") == "Intel Corporate"

    # Realme randomized MAC (bit 1 of B6 is 1 -> locally administered)
    assert is_locally_administered_mac("B6:6E:E6:0A:EE:19") is True
    assert "Realme" in lookup_mac_vendor("B6:6E:E6:0A:EE:19", hostname="realme-C21-Y")

    # Gateway router detection
    assert (
        lookup_mac_vendor(
            "C2:3D:10:AF:D1:81",
            hostname="homerouter.cpe",
            ip_address="192.168.8.1",
            gateway_ip="192.168.8.1",
        )
        == "ISP CPE Gateway Router"
    )


def test_lan_ids_detects_arp_spoofing_duplicate_mac():
    from unittest.mock import MagicMock, patch
    from backend.app.services.lan_ids import run_lan_security_audit

    mock_db = MagicMock()
    mock_db.scalars.return_value.all.return_value = []
    mock_db.scalar.return_value = None

    poisoned_arp = [
        {"ip_address": "192.168.8.1", "mac_address": "DE:AD:BE:EF:13:37"},
        {"ip_address": "192.168.8.99", "mac_address": "DE:AD:BE:EF:13:37"},
    ]

    with (
        patch("backend.app.services.lan_ids.get_default_gateway_ip", return_value="192.168.8.1"),
        patch("backend.app.services.lan_ids.create_event") as mock_event,
    ):
        mock_event.return_value = MagicMock(id=999)
        audit = run_lan_security_audit(mock_db, arp_entries=poisoned_arp, probe_ports=False)
        assert audit["status"] == "threat_detected"
        assert audit["alerts_count"] >= 1
        assert audit["alerts"][0]["type"] == "arp_spoofing_detected"
        assert "192.168.8.1" in audit["alerts"][0]["ip_addresses"]


def test_analyze_mac_bits_and_sysadmin_console_commands():
    from backend.app.services.lan_intelligence import (
        analyze_mac_bits,
        execute_sysadmin_command,
    )

    info = analyze_mac_bits("4C:D5:77:57:C3:13")
    assert info["oui_prefix"] == "4C:D5:77"
    assert info["nic_serial"] == "57:C3:13"
    assert info["first_octet_binary"] == "01001100"
    assert info["is_randomized_laa"] is False

    help_res = execute_sysadmin_command("help")
    assert help_res["tone"] == "info"
    assert any("inspect" in line for line in help_res["lines"])



