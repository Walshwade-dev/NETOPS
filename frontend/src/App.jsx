import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/events`;

function Icon({ name, size = 16 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { flexShrink: 0, display: "inline-block", verticalAlign: "middle" },
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "devices":
    case "computer":
      return (
        <svg {...props}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "cctv":
      return (
        <svg {...props}>
          <path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" />
          <path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z" />
          <path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" />
          <path d="M2 21v-4" />
        </svg>
      );
    case "printer":
      return (
        <svg {...props}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case "events":
      return (
        <svg {...props}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "updates":
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "vlan":
      return (
        <svg {...props}>
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
          <path d="M12 12V8" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...props}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "beaker":
      return (
        <svg {...props}>
          <path d="M4.5 3h15" />
          <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" />
          <path d="M6 14h12" />
        </svg>
      );
    case "alert":
    default:
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}

function DeviceTypeIcon({ type, size = 15 }) {
  switch (type) {
    case "computer":
      return <Icon name="computer" size={size} />;
    case "cctv":
      return <Icon name="cctv" size={size} />;
    case "printer":
      return <Icon name="printer" size={size} />;
    default:
      return <Icon name="alert" size={size} />;
  }
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [newDeviceAlert, setNewDeviceAlert] = useState(null);
  const [highlightedDeviceId, setHighlightedDeviceId] = useState(null);
  const [automationResult, setAutomationResult] = useState(null);
  const [accessSchedules, setAccessSchedules] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    schedule_id: null,
    device_id: null,
    start_time: "08:00",
    end_time: "17:00",
    days: "daily",
    enabled: true,
  });
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [vlanFilter, setVlanFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [eventLimit, setEventLimit] = useState(50);
  const [eventOffset, setEventOffset] = useState(0);
  const [lanScanLoading, setLanScanLoading] = useState(false);
  const [lanScanResult, setLanScanResult] = useState(null);
  const [simSeedLoading, setSimSeedLoading] = useState(false);
  const [simSeedBanner, setSimSeedBanner] = useState(null);

  const [patchJobs, setPatchJobs] = useState([]);
  const [deployModalDevice, setDeployModalDevice] = useState(null);
  const [deployingStatus, setDeployingStatus] = useState(null);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // Reports Page State (lifted so WebSocket updates don't reset report filters/results)
  const [reportType, setReportType] = useState("network_activity");
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportStartTime, setReportStartTime] = useState("00:00");
  const [reportEndTime, setReportEndTime] = useState("23:59");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Endpoint Updates State
  const [endpointUpdates, setEndpointUpdates] = useState([]);
  const [endpointUpdatesLoading, setEndpointUpdatesLoading] = useState(false);
  const [endpointUpdatesError, setEndpointUpdatesError] = useState("");

  // Settings / Sophos State
  const [sophosStatus, setSophosStatus] = useState(null);
  const [sophosLoading, setSophosLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [liveDiscoveryLoading, setLiveDiscoveryLoading] = useState(false);
  const [liveDiscoveryBanner, setLiveDiscoveryBanner] = useState(null);
  const [securityAuditLoading, setSecurityAuditLoading] = useState(false);
  const [securityAuditBanner, setSecurityAuditBanner] = useState(null);
  const [intrusionAlert, setIntrusionAlert] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalLines, setTerminalLines] = useState([
    {
      ts: new Date().toLocaleTimeString(),
      text: "NETOPS Sysadmin Telemetry Console initialized. Listening on WebSocket /ws/events & TCP Canary Trap :8899...",
      tone: "info",
    },
  ]);

  const appendTerminal = (lines, tone = "default") => {
    const arr = Array.isArray(lines) ? lines : [lines];
    const now = new Date().toLocaleTimeString();
    setTerminalLines((prev) => [
      ...prev.slice(-180),
      ...arr.filter(Boolean).map((text) => ({ ts: now, text, tone })),
    ]);
  };

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((device) => device.status === "online").length;
  const pendingDevices = devices.filter((device) => device.approval_status === "pending").length;
  const rejectedDevices = devices.filter((device) => device.approval_status === "rejected").length;
  const quarantinedDevices = devices.filter(
    (device) =>
      device.enforcement_status === "quarantined" || device.access_decision === "quarantine"
  ).length;
  const simulationDevicesCount = devices.filter(
    (device) => device.ip_address && device.ip_address.startsWith("192.0.2.")
  ).length;

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/devices/`);
      if (!response.ok) throw new Error("Failed to load devices");
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Device loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", String(eventLimit));
      params.set("offset", String(eventOffset));
      if (eventTypeFilter !== "all") {
        params.set("event_type", eventTypeFilter);
      }
      const response = await fetch(`${API_URL}/events/?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load events");
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Event loading error:", error);
    }
  };

  const loadEndpointUpdates = async () => {
    setEndpointUpdatesLoading(true);
    setEndpointUpdatesError("");
    try {
      const response = await fetch(`${API_URL}/endpoint-updates/`);
      if (!response.ok) {
        throw new Error(`Failed to load endpoint updates (${response.status})`);
      }
      const data = await response.json();
      setEndpointUpdates(Array.isArray(data) ? data : []);
    } catch (error) {
      setEndpointUpdatesError(error.message);
    } finally {
      setEndpointUpdatesLoading(false);
    }
  };

  const loadPatchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/endpoint-updates/jobs?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setPatchJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load patch jobs:", err);
    }
  };

  const loadAccessSchedules = async () => {
    try {
      const response = await fetch(`${API_URL}/access-schedules/`);
      if (!response.ok) throw new Error("Failed to load access schedules");
      const data = await response.json();
      const groupedSchedules = {};
      if (Array.isArray(data)) {
        data.forEach((schedule) => {
          if (!groupedSchedules[schedule.device_id]) {
            groupedSchedules[schedule.device_id] = [];
          }
          groupedSchedules[schedule.device_id].push(schedule);
        });
      }
      setAccessSchedules(groupedSchedules);
    } catch (error) {
      console.error("Access schedule loading error:", error);
    }
  };

  const checkSophos = () => {
    setSophosLoading(true);
    fetch(`${API_URL}/sophos/live-status`)
      .then((r) => r.json())
      .then((data) => setSophosStatus(data))
      .catch((err) => setSophosStatus({ connected: false, error: err.message }))
      .finally(() => setSophosLoading(false));
  };

  const loadNetworkInfo = () => {
    fetch(`${API_URL}/discovery/network`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNetworkInfo(data);
          appendTerminal(
            `[INTERFACE] Auto-detected OS=${data.os} dev=${data.interface || "auto"} ip=${data.local_ip} mac=${data.local_mac} gw=${data.gateway_ip || "n/a"} subnet=${data.network}`,
            "dim"
          );
        }
      })
      .catch(() => {});
  };

  const discoverLiveLan = async () => {
    setLiveDiscoveryLoading(true);
    setLiveDiscoveryBanner(null);
    setTerminalOpen(true);
    appendTerminal(
      `$ POST /discovery/scan {"network": "auto"} — probing active subnet ${networkInfo?.network || ""}...`,
      "cmd"
    );
    try {
      const response = await fetch(`${API_URL}/discovery/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: "auto" }),
      });
      if (!response.ok) throw new Error(`Discovery failed (${response.status})`);
      const data = await response.json();
      setLiveDiscoveryBanner(data);
      if (data.terminal_lines) {
        appendTerminal(data.terminal_lines, "success");
      }
      await loadDevices();
      await loadEvents();
      await loadNetworkInfo();
      setTimeout(() => setLiveDiscoveryBanner(null), 8000);
    } catch (err) {
      console.error("Live LAN discovery error:", err);
      appendTerminal(`[ERROR] Live LAN scan failed: ${err.message}`, "danger");
      alert("Failed to scan live network: " + err.message);
    } finally {
      setLiveDiscoveryLoading(false);
    }
  };

  const runSecurityAudit = async () => {
    setSecurityAuditLoading(true);
    setSecurityAuditBanner(null);
    setTerminalOpen(true);
    appendTerminal(
      `$ POST /discovery/security-audit — inspecting ARP cache, gateway MAC & open TCP services...`,
      "cmd"
    );
    try {
      const response = await fetch(`${API_URL}/discovery/security-audit`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`Audit failed (${response.status})`);
      const data = await response.json();
      setSecurityAuditBanner(data);
      if (data.terminal_lines) {
        appendTerminal(
          data.terminal_lines,
          data.alerts_count > 0 ? "danger" : "success"
        );
      }
      if (data.alerts && data.alerts.length > 0) {
        setIntrusionAlert(data.alerts[0]);
      }
      await loadEvents();
    } catch (err) {
      console.error("LAN security audit error:", err);
      appendTerminal(`[ERROR] Security audit failed: ${err.message}`, "danger");
      alert("Security audit failed: " + err.message);
    } finally {
      setSecurityAuditLoading(false);
    }
  };

  const triggerAttackDrill = async (attackType = "arp_spoof") => {
    setTerminalOpen(true);
    appendTerminal(
      `$ POST /discovery/simulate-attack {"attack_type": "${attackType}"}`,
      "cmd"
    );
    try {
      const response = await fetch(`${API_URL}/discovery/simulate-attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: attackType }),
      });
      if (!response.ok) throw new Error(`Drill failed (${response.status})`);
      const data = await response.json();
      if (data.alert) {
        setIntrusionAlert(data.alert);
        appendTerminal(`[IDS-ALERT] ${data.alert.message}`, "danger");
      }
      await loadEvents();
    } catch (err) {
      console.error("Attack drill error:", err);
    }
  };

  const toggleSimulationMode = async () => {
    setSimSeedLoading(true);
    setTerminalOpen(true);
    const isCurrentlyOn = simulationDevicesCount > 0;
    try {
      if (isCurrentlyOn) {
        appendTerminal(
          `$ POST /simulation/clear — removing RFC 5737 (192.0.2.0/24) fictional devices to isolate real LAN...`,
          "cmd"
        );
        const response = await fetch(`${API_URL}/simulation/clear`, {
          method: "POST",
        });
        if (!response.ok) throw new Error(`Clear failed (${response.status})`);
        const data = await response.json();
        appendTerminal(
          `[SIMULATION: OFF] Removed ${data.removed_count} fictional device(s): ${(data.removed_devices || []).join(", ")}. Showing ONLY real physical LAN devices.`,
          "success"
        );
        setSimSeedBanner(null);
      } else {
        appendTerminal(
          `$ POST /simulation/seed — seeding RFC 5737 TEST-NET-1 (192.0.2.0/24) simulation devices...`,
          "cmd"
        );
        const response = await fetch(`${API_URL}/simulation/seed`, {
          method: "POST",
        });
        if (!response.ok) throw new Error(`Seed failed (${response.status})`);
        const data = await response.json();
        setSimSeedBanner(data);
        appendTerminal(
          `[SIMULATION: ON] Seeded ${data.created_count} new fictional device(s) (${data.already_present_count} already present) on 192.0.2.0/24.`,
          "info"
        );
        setTimeout(() => setSimSeedBanner(null), 6000);
      }
      await loadDevices();
      await loadEvents();
    } catch (err) {
      console.error("Simulation toggle error:", err);
      appendTerminal(`[ERROR] Simulation toggle failed: ${err.message}`, "danger");
      alert("Failed to toggle simulation mode: " + err.message);
    } finally {
      setSimSeedLoading(false);
    }
  };

  const scanLanUpdates = async () => {
    setLanScanLoading(true);
    setLanScanResult(null);
    try {
      const response = await fetch(`${API_URL}/endpoint-updates/scan-lan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`LAN scan failed: ${response.status}`);
      }
      const data = await response.json();
      setLanScanResult(data);
      await loadDevices();
      await loadEndpointUpdates();
    } catch (err) {
      console.error("LAN scan error:", err);
      alert("Failed to complete LAN update scan: " + err.message);
    } finally {
      setLanScanLoading(false);
    }
  };

  const getActiveJobForDevice = (device) => {
    if (!device || !Array.isArray(patchJobs)) return null;
    return patchJobs.find(
      (job) =>
        (job.status === "PENDING" ||
          job.status === "IN_PROGRESS" ||
          job.status === "SCHEDULED") &&
        ((device.hostname &&
          job.hostname &&
          device.hostname.toLowerCase() === job.hostname.toLowerCase()) ||
          (device.mac_address &&
            job.mac_address &&
            device.mac_address.replace(/[:-]/g, "").toUpperCase() ===
              job.mac_address.replace(/[:-]/g, "").toUpperCase()) ||
          (device.id && job.device_id && device.id === job.device_id))
    );
  };

  const openDeployModal = (device) => {
    setScheduleMode("now");
    setScheduledDateTime("");
    setDeployModalDevice(device);
  };

  const deployUpdates = async (target, scheduledTime = null) => {
    const hostname = target.hostname || "local";
    const ip_address = target.ip_address || target.device_ip || null;
    const mac_address = target.mac_address || null;
    const machine_id = target.machine_id || null;
    const device_id =
      target.device_id || (target.vlan_id !== undefined ? target.id : null);
    const scheduled_at = scheduledTime
      ? new Date(scheduledTime).toISOString()
      : null;

    setDeployingStatus("dispatching");
    try {
      const response = await fetch(`${API_URL}/endpoint-updates/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname,
          ip_address,
          mac_address,
          machine_id,
          device_id,
          action: "INSTALL_ALL_UPDATES",
          initiated_by: "Admin Console",
          scheduled_at,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to queue update job (${response.status})`);
      }

      const job = await response.json();
      setDeployingStatus("success");
      setSelectedJobDetails(job);
      await loadPatchJobs();
      await loadDevices();
      await loadEndpointUpdates();
      return job;
    } catch (err) {
      console.error("Deploy updates error:", err);
      alert("Failed to deploy updates: " + err.message);
      setDeployingStatus("error");
      return null;
    }
  };

  const runJobNow = async (jobId) => {
    try {
      const response = await fetch(
        `${API_URL}/endpoint-updates/jobs/${jobId}/run-now`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Server error (${response.status})`);
      }
      const updatedJob = await response.json();
      setSelectedJobDetails(updatedJob);
      await loadPatchJobs();
      await loadDevices();
      await loadEndpointUpdates();
      return updatedJob;
    } catch (err) {
      console.error("Run job error:", err);
      alert("Failed to start update: " + err.message);
      return null;
    }
  };

  const createAccessSchedule = async () => {
    if (!scheduleForm.device_id) return;
    setScheduleLoading(scheduleForm.device_id);
    try {
      const isEditing = Boolean(scheduleForm.schedule_id);
      const response = await fetch(
        isEditing
          ? `${API_URL}/access-schedules/${scheduleForm.schedule_id}`
          : `${API_URL}/access-schedules/`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: scheduleForm.device_id,
            start_time: scheduleForm.start_time,
            end_time: scheduleForm.end_time,
            days: scheduleForm.days,
            enabled: scheduleForm.enabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          isEditing
            ? "Failed to update access schedule"
            : "Failed to create access schedule"
        );
      }

      await loadAccessSchedules();
      setScheduleForm({
        schedule_id: null,
        device_id: null,
        start_time: "08:00",
        end_time: "17:00",
        days: "daily",
        enabled: true,
      });
    } catch (error) {
      console.error("Access schedule save error:", error);
    } finally {
      setScheduleLoading(null);
    }
  };

  const resetAccessSchedule = async (deviceId) => {
    const schedules = accessSchedules[deviceId] || [];
    if (schedules.length === 0) return;

    const confirmed = window.confirm(
      `Reset the access schedule for device #${deviceId}?`
    );
    if (!confirmed) return;

    setScheduleLoading(deviceId);
    try {
      for (const schedule of schedules) {
        const response = await fetch(
          `${API_URL}/access-schedules/${schedule.id}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          throw new Error(`Failed to delete schedule ${schedule.id}`);
        }
      }
      await loadAccessSchedules();
      await deviceAction(deviceId, "enforce");
      setScheduleForm((current) =>
        current.device_id === deviceId
          ? {
              schedule_id: null,
              device_id: null,
              start_time: "08:00",
              end_time: "17:00",
              days: "daily",
              enabled: true,
            }
          : current
      );
    } catch (error) {
      console.error("Access schedule reset error:", error);
    } finally {
      setScheduleLoading(null);
    }
  };

  useEffect(() => {
    loadDevices();
    loadEvents();
    loadAccessSchedules();
    loadPatchJobs();
    loadEndpointUpdates();
    checkSophos();
    loadNetworkInfo();
  }, []);

  useEffect(() => {
    const hasActiveJob = patchJobs.some(
      (j) => j.status === "PENDING" || j.status === "IN_PROGRESS"
    );
    if (!hasActiveJob) return;

    const timer = setInterval(() => {
      loadPatchJobs();
      loadDevices();
      loadEndpointUpdates();
    }, 4000);

    return () => clearInterval(timer);
  }, [patchJobs]);

  useEffect(() => {
    loadEvents();
  }, [eventTypeFilter, eventLimit, eventOffset]);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      try {
        socket = new WebSocket(WS_URL);
        socket.onopen = () => setWsConnected(true);
        socket.onmessage = (message) => {
          try {
            const raw = JSON.parse(message.data);
            const event = raw?.type === "event" && raw.event ? raw.event : raw;
            setEvents((previous) => {
              const exists = previous.some(
                (item) => item.id && event.id && item.id === event.id
              );
              return exists ? previous : [event, ...previous];
            });

            if (event.event_type && event.event_type.startsWith("patch_job_")) {
              loadPatchJobs();
              loadDevices();
              loadEndpointUpdates();
            }

            if (
              event.event_type === "arp_spoofing_detected" ||
              event.event_type === "gateway_mac_hijack" ||
              event.event_type === "port_scan_detected" ||
              event.event_type === "risky_port_exposed"
            ) {
              setIntrusionAlert({
                id: event.id,
                type: event.event_type,
                title: event.event_type.replace(/_/g, " ").toUpperCase(),
                message: event.message,
              });
              setTerminalOpen(true);
              appendTerminal(
                `[WS:SECURITY:${event.event_type.toUpperCase()}] ${event.message}`,
                "danger"
              );
            } else if (event.message) {
              appendTerminal(
                `[WS:${(event.event_type || "EVENT").toUpperCase()}] ${event.message}`,
                "info"
              );
            }

            if (event.event_type === "new_device") {
              setNewDeviceAlert(event);
              setHighlightedDeviceId(event.device_id);
              loadDevices();
              setTimeout(() => {
                setNewDeviceAlert(null);
                setHighlightedDeviceId(null);
              }, 8000);
            }
          } catch (error) {
            console.error("WebSocket event error:", error);
          }
        };
        socket.onerror = () => setWsConnected(false);
        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  const deviceAction = async (deviceId, action, value = null) => {
    const actionKey = `${action}-${deviceId}`;
    try {
      setActionLoading(actionKey);
      let url = `${API_URL}/devices/${deviceId}`;
      let method = "PATCH";
      let body = null;

      if (action === "approve") {
        url += "/approve";
      } else if (action === "reject") {
        url += "/reject";
      } else if (action === "type") {
        url += "/type";
        body = JSON.stringify({ device_type: value });
      } else if (action === "vlan") {
        url += "/vlan";
        body = JSON.stringify({ vlan_id: parseInt(value, 10) });
      } else if (action === "allow") {
        url += "/allow";
        method = "POST";
      } else if (action === "disallow" || action === "quarantine") {
        url += "/disallow";
        method = "POST";
      } else if (action === "enforce") {
        url += "/enforce";
        method = "POST";
      } else if (action === "automate-vlan") {
        url += "/automate-vlan";
        method = "POST";
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body !== null) options.body = body;

      const response = await fetch(url, options);
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(responseText || `HTTP ${response.status}`);
      }

      let result = {};
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { message: responseText };
        }
      }

      if (action === "automate-vlan") {
        setAutomationResult(result);
      }

      await loadDevices();
      await loadEvents();
    } catch (error) {
      console.error(`Device action ${action} failed:`, error);
      alert(`Action failed: ${error.message || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filterDevicesList = (list) => {
    return list.filter((device) => {
      if (deviceFilter === "all") return true;
      if (deviceFilter === "online") return device.status === "online";
      if (deviceFilter === "needs_updates")
        return device.update_status === "updates_available";
      if (deviceFilter === "queued") return Boolean(getActiveJobForDevice(device));
      if (deviceFilter === "up_to_date")
        return device.update_status === "up_to_date";
      if (deviceFilter === "unmonitored")
        return !device.update_status || device.update_status === "unmonitored";
      if (deviceFilter === "pending") return device.approval_status === "pending";
      if (deviceFilter === "rejected") return device.approval_status === "rejected";
      if (deviceFilter === "quarantined")
        return (
          device.enforcement_status === "quarantined" ||
          device.access_decision === "quarantine"
        );
      if (deviceFilter === "computer") return device.device_type === "computer";
      if (deviceFilter === "cctv") return device.device_type === "cctv";
      if (deviceFilter === "printer") return device.device_type === "printer";
      if (deviceFilter === "unknown")
        return (
          !device.device_type ||
          !["computer", "cctv", "printer"].includes(device.device_type)
        );
      if (deviceFilter.startsWith("vlan")) {
        const targetVlan = Number(deviceFilter.replace("vlan", ""));
        return Number(device.vlan_id) === targetVlan;
      }
      return true;
    });
  };

  // ------------------------------------------------------------
  // PAGES
  // ------------------------------------------------------------

  const renderDevicesPage = () => {
    const filteredDevices = filterDevicesList(devices);

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Connected Devices</div>
            <div className="page-description">
              Devices detected on the LAN and their current classification, VLAN
              segmentation, and Internet enforcement posture.
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="primary-button"
              type="button"
              onClick={scanLanUpdates}
              disabled={lanScanLoading}
            >
              <Icon name="bolt" size={14} />
              {lanScanLoading
                ? "Scanning LAN Machines..."
                : "Scan LAN for Updates (Agentless)"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                loadPatchJobs();
                setShowJobsModal(true);
              }}
            >
              <Icon name="updates" size={14} />
              Update Jobs ({patchJobs.length})
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={loadDevices}
              disabled={lanScanLoading}
            >
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        </div>

        {lanScanResult && (
          <div
            className="panel"
            style={{
              background: "var(--status-success-bg)",
              borderColor: "var(--status-success-border)",
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--status-success-text)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Icon name="check" size={16} />
                  Agentless LAN Scan Complete ({lanScanResult.network})
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                  }}
                >
                  Assessed {lanScanResult.machines_assessed} machine(s) across the
                  LAN:{" "}
                  <strong>{lanScanResult.updates_available_count} need updates</strong>
                  , <strong>{lanScanResult.up_to_date_count} up to date</strong>.
                </div>
              </div>
              <button
                className="secondary-button small"
                onClick={() => setLanScanResult(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {pendingDevices > 0 && (
          <div
            className="panel"
            style={{ borderColor: "var(--status-warning-border)" }}
          >
            <div className="panel-header" style={{ borderBlockEnd: 0 }}>
              <div>
                <div
                  className="panel-title"
                  style={{ color: "var(--status-warning-text)" }}
                >
                  <Icon name="alert" size={16} />
                  New Devices Require Administrator Approval
                </div>
                <div className="panel-subtitle">
                  {pendingDevices} device(s) are currently isolated in Quarantine
                  awaiting review.
                </div>
              </div>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setDeviceFilter("pending")}
              >
                Filter Pending ({pendingDevices})
              </button>
            </div>
          </div>
        )}

        {rejectedDevices > 0 && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Icon name="shield" size={15} />
                  Rejected Devices
                </div>
                <div className="panel-subtitle">
                  Devices rejected by the administrator and blocked from network
                  access.
                </div>
              </div>
              <div className="settings-status">
                <span className="status-dot offline" />
                {rejectedDevices} Rejected
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>DEVICE</th>
                    <th>TYPE</th>
                    <th>VLAN</th>
                    <th>INTERNET</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {devices
                    .filter((device) => device.approval_status === "rejected")
                    .map((device) => (
                      <tr key={device.id}>
                        <td>
                          <div className="device-primary">
                            {device.hostname ||
                              device.ip_address ||
                              device.mac_address}
                          </div>
                        </td>
                        <td>
                          <TypeBadge type={device.device_type} />
                        </td>
                        <td>
                          <span className="vlan-badge quarantine">
                            VLAN {device.vlan_id || 90}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge rejected">Blocked</span>
                        </td>
                        <td>
                          <button
                            className="approve-button small"
                            type="button"
                            onClick={() => deviceAction(device.id, "approve")}
                            disabled={actionLoading === `approve-${device.id}`}
                          >
                            {actionLoading === `approve-${device.id}`
                              ? "Approving..."
                              : "Approve"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">LAN Device Inventory</div>
              <div className="panel-subtitle">
                Manage classification, VLAN segmentation, approval, and patch
                compliance for detected endpoints.
              </div>
            </div>

            <div className="settings-status">
              <span className="status-dot online" />
              Showing {filteredDevices.length} of {totalDevices} Devices
            </div>
          </div>

          <div className="filter-pill-bar">
            {[
              { id: "all", label: `All Devices (${devices.length})` },
              {
                id: "online",
                label: `Online (${devices.filter((d) => d.status === "online").length})`,
              },
              { id: "pending", label: `Pending (${pendingDevices})` },
              { id: "quarantined", label: `Quarantined (${quarantinedDevices})` },
              {
                id: "needs_updates",
                label: `Needs Updates (${devices.filter((d) => d.update_status === "updates_available").length})`,
              },
              {
                id: "queued",
                label: `Queued / Updating (${devices.filter((d) => Boolean(getActiveJobForDevice(d))).length})`,
              },
              {
                id: "up_to_date",
                label: `Up to Date (${devices.filter((d) => d.update_status === "up_to_date").length})`,
              },
              {
                id: "unmonitored",
                label: `No Agent (${devices.filter((d) => !d.update_status || d.update_status === "unmonitored").length})`,
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                className={`filter-pill ${deviceFilter === pill.id ? "active" : ""}`}
                onClick={() => setDeviceFilter(pill.id)}
              >
                {pill.label}
              </button>
            ))}

            {![
              "all",
              "online",
              "pending",
              "quarantined",
              "needs_updates",
              "queued",
              "up_to_date",
              "unmonitored",
            ].includes(deviceFilter) && (
              <button
                type="button"
                className="filter-pill active"
                onClick={() => setDeviceFilter("all")}
              >
                Filter: {deviceFilter.toUpperCase()} ✕
              </button>
            )}
          </div>

          {scheduleForm.device_id && (
            <div
              style={{
                margin: "16px 20px",
                padding: "16px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-focus)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div className="panel-title">
                    <Icon name="clock" size={15} />
                    Configure Internet Access Schedule (Device #{scheduleForm.device_id})
                  </div>
                  <div className="panel-subtitle">
                    Restrict or permit Internet access to specific operational hours.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                  Start Time
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        start_time: e.target.value,
                      })
                    }
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                  End Time
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        end_time: e.target.value,
                      })
                    }
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                  Days
                  <select
                    value={scheduleForm.days}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        days: e.target.value,
                      })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </label>

                <label
                  style={{
                    display: "inline-flex",
                    gap: "6px",
                    alignItems: "center",
                    paddingBottom: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={scheduleForm.enabled}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        enabled: e.target.checked,
                      })
                    }
                  />
                  Enabled
                </label>

                <button
                  type="button"
                  className="primary-button small"
                  onClick={createAccessSchedule}
                  disabled={scheduleLoading === scheduleForm.device_id}
                >
                  {scheduleLoading === scheduleForm.device_id
                    ? "Saving..."
                    : "Save Schedule"}
                </button>

                <button
                  type="button"
                  className="secondary-button small"
                  onClick={() =>
                    setScheduleForm({
                      schedule_id: null,
                      device_id: null,
                      start_time: "08:00",
                      end_time: "17:00",
                      days: "daily",
                      enabled: true,
                    })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>TYPE</th>
                  <th>VLAN</th>
                  <th>UPDATE STATUS</th>
                  <th>APPROVAL</th>
                  <th>INTERNET</th>
                  <th>ENFORCEMENT</th>
                  <th>SCHEDULE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="empty-state">
                        No devices match the selected filter.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr
                      key={device.id}
                      className={
                        highlightedDeviceId === device.id ? "highlighted" : ""
                      }
                    >
                      <td>
                        <div className="device-primary">
                          <span
                            className={`device-icon ${
                              device.device_type === "cctv"
                                ? "camera"
                                : device.device_type || "unknown"
                            }`}
                          >
                            <DeviceTypeIcon
                              type={device.device_type}
                              size={14}
                            />
                          </span>
                          <span>{device.hostname || "Unknown Device"}</span>
                        </div>
                        <div className="device-secondary">
                          {device.ip_address || "—"} •{" "}
                          {device.mac_address || "—"}
                          {device.vendor ? ` • ${device.vendor}` : ""}
                        </div>
                        {device.notes && (
                          <div
                            className="device-secondary"
                            style={{
                              marginTop: "3px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {device.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        <select
                          value={device.device_type || "unknown"}
                          disabled={actionLoading === `type-${device.id}`}
                          onChange={(event) =>
                            deviceAction(
                              device.id,
                              "type",
                              event.target.value
                            )
                          }
                        >
                          <option value="unknown">
                            Unknown (Quarantine VLAN 90)
                          </option>
                          <option value="computer">Computer (VLAN 20)</option>
                          <option value="cctv">CCTV (VLAN 30)</option>
                          <option value="printer">Printer (VLAN 40)</option>
                        </select>
                      </td>

                      <td>
                        <select
                          className={`vlan-select ${
                            device.vlan_id === 90 || !device.vlan_id
                              ? "quarantine"
                              : ""
                          }`}
                          value={device.vlan_id || 90}
                          disabled={actionLoading === `vlan-${device.id}`}
                          onChange={(event) =>
                            deviceAction(
                              device.id,
                              "vlan",
                              event.target.value
                            )
                          }
                          title="Change VLAN: VLAN 90 immediately disconnects internet"
                        >
                          <option value="20">VLAN 20 • Workstation</option>
                          <option value="30">VLAN 30 • CCTV</option>
                          <option value="40">VLAN 40 • Printers</option>
                          <option value="90">VLAN 90 • Quarantine</option>
                        </select>
                      </td>

                      <td>
                        {(() => {
                          const activeJob = getActiveJobForDevice(device);
                          if (activeJob) {
                            return (
                              <div>
                                <span
                                  className={`status-badge ${
                                    activeJob.status === "SCHEDULED"
                                      ? "scheduled"
                                      : "warning"
                                  }`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setSelectedJobDetails(activeJob);
                                    setShowJobsModal(true);
                                  }}
                                  title="Click to view update progress and logs"
                                >
                                  <Icon
                                    name={
                                      activeJob.status === "SCHEDULED"
                                        ? "clock"
                                        : "bolt"
                                    }
                                    size={11}
                                  />
                                  {activeJob.status === "IN_PROGRESS"
                                    ? `UPDATING ${activeJob.progress_percent}%`
                                    : activeJob.status === "SCHEDULED"
                                      ? "SCHEDULED"
                                      : "QUEUED"}
                                </span>
                                <div className="device-secondary">
                                  Job #{activeJob.id}{" "}
                                  {activeJob.status === "SCHEDULED" &&
                                  activeJob.scheduled_at
                                    ? `(${new Date(
                                        activeJob.scheduled_at.endsWith("Z")
                                          ? activeJob.scheduled_at
                                          : activeJob.scheduled_at + "Z"
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })})`
                                    : activeJob.is_local
                                      ? "(Local)"
                                      : "(Agent)"}
                                </div>
                                {(activeJob.status === "PENDING" ||
                                  activeJob.status === "SCHEDULED") && (
                                  <button
                                    type="button"
                                    className="approve-button small"
                                    style={{ marginTop: "5px" }}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await runJobNow(activeJob.id);
                                      setShowJobsModal(true);
                                    }}
                                  >
                                    Run Now
                                  </button>
                                )}
                              </div>
                            );
                          }

                          if (device.update_status === "up_to_date") {
                            return (
                              <div>
                                <span className="status-badge allowed">
                                  <Icon name="check" size={11} />
                                  Up to Date
                                </span>
                                {device.operating_system && (
                                  <div className="device-secondary">
                                    {device.operating_system}{" "}
                                    {device.os_version || ""}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (device.update_status === "updates_available") {
                            return (
                              <div>
                                <span className="status-badge warning">
                                  <Icon name="alert" size={11} />
                                  {device.pending_updates ?? "—"} Updates
                                </span>
                                {device.operating_system && (
                                  <div className="device-secondary">
                                    {device.operating_system}{" "}
                                    {device.os_version || ""}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="approve-button small"
                                  style={{ marginTop: "6px" }}
                                  onClick={() => openDeployModal(device)}
                                >
                                  <Icon name="bolt" size={11} />
                                  Deploy Updates
                                </button>
                              </div>
                            );
                          }

                          return (
                            <span
                              className="status-badge"
                              style={{
                                background: "rgba(148, 163, 184, 0.1)",
                                color: "var(--text-dim)",
                                borderColor: "var(--border-subtle)",
                              }}
                            >
                              No Agent
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        <StatusBadge value={device.approval_status} />
                      </td>

                      <td>
                        {device.internet_access_authorized ? (
                          <span className="status-badge allowed">
                            Authorized
                          </span>
                        ) : (
                          <span className="status-badge blocked">
                            Restricted
                          </span>
                        )}
                      </td>

                      <td>
                        <EnforcementBadge value={device.enforcement_status} />
                      </td>

                      <td>
                        {accessSchedules[device.id] &&
                        accessSchedules[device.id].length > 0 ? (
                          <div>
                            {accessSchedules[device.id].map((schedule) => (
                              <div
                                key={schedule.id}
                                style={{ marginBottom: "4px" }}
                              >
                                <span className="status-badge allowed">
                                  {schedule.start_time.slice(0, 5)} –{" "}
                                  {schedule.end_time.slice(0, 5)}
                                </span>
                                <div className="device-secondary">
                                  {schedule.days}
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="secondary-button small"
                              style={{ marginTop: "4px" }}
                              onClick={() => resetAccessSchedule(device.id)}
                              disabled={scheduleLoading === device.id}
                            >
                              {scheduleLoading === device.id
                                ? "Resetting..."
                                : "Reset"}
                            </button>
                          </div>
                        ) : (
                          <span
                            className="status-badge"
                            style={{
                              background: "rgba(148, 163, 184, 0.1)",
                              color: "var(--text-dim)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            Always On
                          </span>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="secondary-button small"
                            onClick={() => {
                              const existingSchedule =
                                accessSchedules[device.id]?.[0];
                              setScheduleForm({
                                schedule_id: existingSchedule?.id || null,
                                device_id: device.id,
                                start_time:
                                  existingSchedule?.start_time?.slice(0, 5) ||
                                  "08:00",
                                end_time:
                                  existingSchedule?.end_time?.slice(0, 5) ||
                                  "17:00",
                                days: existingSchedule?.days || "daily",
                                enabled: existingSchedule?.enabled ?? true,
                              });
                            }}
                          >
                            Schedule
                          </button>

                          {device.approval_status !== "approved" && (
                            <button
                              type="button"
                              className="approve-button small"
                              disabled={
                                actionLoading === `approve-${device.id}`
                              }
                              onClick={() =>
                                deviceAction(device.id, "approve")
                              }
                            >
                              {actionLoading === `approve-${device.id}`
                                ? "..."
                                : "Approve"}
                            </button>
                          )}

                          {device.approval_status !== "rejected" && (
                            <button
                              type="button"
                              className="reject-button small"
                              disabled={
                                actionLoading === `reject-${device.id}`
                              }
                              onClick={() => deviceAction(device.id, "reject")}
                            >
                              {actionLoading === `reject-${device.id}`
                                ? "..."
                                : "Reject"}
                            </button>
                          )}

                          {device.approval_status === "approved" &&
                            device.enforcement_status !== "allowed" && (
                              <button
                                type="button"
                                className="primary-button small"
                                disabled={
                                  actionLoading === `allow-${device.id}`
                                }
                                onClick={() =>
                                  deviceAction(device.id, "allow")
                                }
                              >
                                {actionLoading === `allow-${device.id}`
                                  ? "..."
                                  : "Allow Internet"}
                              </button>
                            )}

                          {device.approval_status === "approved" &&
                            device.enforcement_status === "allowed" && (
                              <button
                                type="button"
                                className="secondary-button small"
                                disabled={
                                  actionLoading === `disallow-${device.id}`
                                }
                                onClick={() =>
                                  deviceAction(device.id, "disallow")
                                }
                              >
                                {actionLoading === `disallow-${device.id}`
                                  ? "..."
                                  : "Quarantine"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAccessPage = () => {
    const allowed = devices.filter(
      (device) => device.enforcement_status === "allowed"
    );
    const quarantined = devices.filter(
      (device) => device.enforcement_status !== "allowed"
    );

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Access Control</div>
            <div className="page-description">
              Manage administrator approval, Internet authorization, and
              firewall/VLAN enforcement state.
            </div>
          </div>

          <button className="secondary-button" onClick={loadDevices}>
            <Icon name="refresh" size={14} />
            Refresh
          </button>
        </div>

        <div className="report-grid">
          <ReportCard
            title="Allowed"
            value={allowed.length}
            description="Devices permitted outbound Internet access."
          />
          <ReportCard
            title="Quarantined"
            value={quarantined.length}
            description="Devices isolated in VLAN 90 / firewall drop list."
          />
          <ReportCard
            title="Pending Approval"
            value={pendingDevices}
            description="New devices awaiting administrator verification."
          />
          <ReportCard
            title="Total Devices"
            value={totalDevices}
            description="Total endpoints tracked by NETOPS."
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Internet Access Enforcement Matrix</div>
              <div className="panel-subtitle">
                Device approval and outbound Internet authorization are
                evaluated independently.
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>TYPE</th>
                  <th>VLAN</th>
                  <th>APPROVAL</th>
                  <th>AUTHORIZATION</th>
                  <th>ACCESS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">No devices found.</div>
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="device-primary">
                          <span
                            className={`device-icon ${
                              device.device_type === "cctv"
                                ? "camera"
                                : device.device_type || "unknown"
                            }`}
                          >
                            <DeviceTypeIcon
                              type={device.device_type}
                              size={14}
                            />
                          </span>
                          <span>{device.hostname || "Unknown Device"}</span>
                        </div>
                        <div className="device-secondary">
                          {device.ip_address || "—"}
                        </div>
                      </td>

                      <td>
                        <TypeBadge type={device.device_type} />
                      </td>

                      <td>
                        <select
                          className={`vlan-select ${
                            device.vlan_id === 90 || !device.vlan_id
                              ? "quarantine"
                              : ""
                          }`}
                          value={device.vlan_id || 90}
                          disabled={actionLoading === `vlan-${device.id}`}
                          onChange={(event) =>
                            deviceAction(
                              device.id,
                              "vlan",
                              event.target.value
                            )
                          }
                        >
                          <option value="20">VLAN 20</option>
                          <option value="30">VLAN 30</option>
                          <option value="40">VLAN 40</option>
                          <option value="90">VLAN 90 (Quarantine)</option>
                        </select>
                      </td>

                      <td>
                        <StatusBadge value={device.approval_status} />
                      </td>

                      <td>
                        {device.internet_access_authorized ? (
                          <span className="status-badge allowed">
                            Authorized
                          </span>
                        ) : (
                          <span className="status-badge blocked">
                            Not Authorized
                          </span>
                        )}
                      </td>

                      <td>
                        {device.enforcement_status === "allowed" ? (
                          <span className="status-badge allowed">
                            Internet Allowed
                          </span>
                        ) : (
                          <span className="status-badge blocked">
                            Quarantined
                          </span>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {device.approval_status !== "approved" && (
                            <button
                              className="approve-button small"
                              onClick={() =>
                                deviceAction(device.id, "approve")
                              }
                            >
                              Approve
                            </button>
                          )}

                          {device.approval_status === "approved" &&
                            device.enforcement_status !== "allowed" && (
                              <button
                                className="primary-button small"
                                onClick={() =>
                                  deviceAction(device.id, "allow")
                                }
                              >
                                Allow Internet
                              </button>
                            )}

                          {device.approval_status === "approved" &&
                            device.enforcement_status === "allowed" && (
                              <button
                                className="secondary-button small"
                                onClick={() =>
                                  deviceAction(device.id, "disallow")
                                }
                              >
                                Disconnect
                              </button>
                            )}

                          {device.approval_status !== "rejected" && (
                            <button
                              className="reject-button small"
                              onClick={() => deviceAction(device.id, "reject")}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderVLANPage = () => {
    const vlanDevices =
      vlanFilter === "all"
        ? devices
        : devices.filter(
            (device) => String(device.vlan_id) === String(vlanFilter)
          );

    const vlan20 = devices.filter((device) => Number(device.vlan_id) === 20);
    const vlan30 = devices.filter((device) => Number(device.vlan_id) === 30);
    const vlan40 = devices.filter((device) => Number(device.vlan_id) === 40);
    const vlan90 = devices.filter(
      (device) => Number(device.vlan_id) === 90 || !device.vlan_id
    );

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">VLAN Automation</div>
            <div className="page-description">
              Cisco 802.1Q switchport segmentation and automated quarantine
              steering.
            </div>
          </div>
        </div>

        <div className="vlan-card-grid">
          <VLANCard
            vlan="20"
            name="Computers"
            description="Corporate workstations & laptops"
            devices={vlan20}
            selected={vlanFilter === "20"}
            onClick={() => setVlanFilter("20")}
          />
          <VLANCard
            vlan="30"
            name="CCTV"
            description="IP cameras & NVR surveillance"
            devices={vlan30}
            selected={vlanFilter === "30"}
            onClick={() => setVlanFilter("30")}
          />
          <VLANCard
            vlan="40"
            name="Printers"
            description="Network print & scan appliances"
            devices={vlan40}
            selected={vlanFilter === "40"}
            onClick={() => setVlanFilter("40")}
          />
          <VLANCard
            vlan="90"
            name="Quarantine"
            description="Unverified, rejected, or isolated hosts"
            devices={vlan90}
            selected={vlanFilter === "90"}
            quarantine
            onClick={() => setVlanFilter("90")}
          />
        </div>

        <FilterBar
          label={
            vlanFilter === "all"
              ? "All VLAN Segments"
              : `VLAN ${vlanFilter} Segment`
          }
          count={vlanDevices.length}
          active={vlanFilter !== "all"}
          clear={() => setVlanFilter("all")}
        />

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Switchport &amp; VLAN Assignment</div>
              <div className="panel-subtitle">
                Live device-to-switchport mapping and 1-click Netmiko VLAN
                provisioning
              </div>
            </div>

            <div className="settings-status">
              <span className="status-dot online" />
              Policy Active
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>TYPE</th>
                  <th>VLAN</th>
                  <th>SWITCH</th>
                  <th>PORT</th>
                  <th>AUTOMATION</th>
                </tr>
              </thead>

              <tbody>
                {vlanDevices.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">No devices found.</div>
                    </td>
                  </tr>
                ) : (
                  vlanDevices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="device-primary">
                          {device.hostname || "Unknown Device"}
                        </div>
                        <div className="device-secondary">
                          {device.ip_address || "—"}
                        </div>
                      </td>

                      <td>
                        <TypeBadge type={device.device_type} />
                      </td>

                      <td>
                        <select
                          className={`vlan-select ${
                            device.vlan_id === 90 || !device.vlan_id
                              ? "quarantine"
                              : ""
                          }`}
                          value={device.vlan_id || 90}
                          disabled={actionLoading === `vlan-${device.id}`}
                          onChange={(event) =>
                            deviceAction(
                              device.id,
                              "vlan",
                              event.target.value
                            )
                          }
                        >
                          <option value="20">VLAN 20 (Computers)</option>
                          <option value="30">VLAN 30 (CCTV)</option>
                          <option value="40">VLAN 40 (Printers)</option>
                          <option value="90">VLAN 90 (Quarantine)</option>
                        </select>
                      </td>

                      <td className="mono">
                        {device.switch_name || "Not identified"}
                      </td>

                      <td className="mono">
                        {device.switch_port || "Not identified"}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="primary-button small"
                            disabled={
                              actionLoading === `automate-vlan-${device.id}`
                            }
                            onClick={() =>
                              deviceAction(device.id, "automate-vlan")
                            }
                          >
                            <Icon name="bolt" size={12} />
                            {actionLoading === `automate-vlan-${device.id}`
                              ? "Running..."
                              : "Auto VLAN"}
                          </button>
                          {device.vlan_id !== 90 && (
                            <button
                              className="danger-button small"
                              disabled={actionLoading === `vlan-${device.id}`}
                              onClick={() =>
                                deviceAction(device.id, "vlan", 90)
                              }
                            >
                              Quarantine (VLAN 90)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">VLAN Segmentation Policy</div>
              <div className="panel-subtitle">
                Deterministic mapping from endpoint classification to 802.1Q
                VLAN ID
              </div>
            </div>
          </div>

          <PolicyRow
            vlan="20"
            name="Computers"
            description="Approved LAN computers and workstations"
            count={vlan20.length}
          />
          <PolicyRow
            vlan="30"
            name="CCTV"
            description="Cameras and surveillance equipment"
            count={vlan30.length}
          />
          <PolicyRow
            vlan="40"
            name="Printers"
            description="Network printing devices"
            count={vlan40.length}
          />
          <PolicyRow
            vlan="90"
            name="Quarantine"
            description="Unknown, rejected, or restricted devices"
            count={vlan90.length}
            quarantine
          />
        </div>
      </div>
    );
  };

  const renderEventsPage = () => (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Network Events</div>
          <div className="page-description">
            Immutable audit trail of discovery, VLAN steering, and firewall
            enforcement events.
          </div>
        </div>

        <button className="secondary-button" onClick={loadEvents}>
          <Icon name="refresh" size={14} />
          Refresh Events
        </button>
      </div>

      <div className="panel">
        <div className="form-grid">
          <label>
            Event Category
            <select
              value={eventTypeFilter}
              onChange={(event) => {
                setEventTypeFilter(event.target.value);
                setEventOffset(0);
              }}
            >
              <option value="all">All event types</option>
              <option value="endpoint_stale">Endpoint stale</option>
              <option value="endpoint_recovered">Endpoint recovered</option>
              <option value="device_detected">Device detected</option>
              <option value="unrecognized_endpoint">
                Unrecognized endpoint
              </option>
              <option value="access_enforcement">Access enforcement</option>
              <option value="vlan_automation">VLAN automation</option>
            </select>
          </label>

          <label>
            Events Per Page
            <select
              value={eventLimit}
              onChange={(event) => {
                setEventLimit(Number(event.target.value));
                setEventOffset(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>
        </div>

        <div className="button-row">
          <button
            className="secondary-button small"
            disabled={eventOffset === 0}
            onClick={() => setEventOffset(Math.max(0, eventOffset - eventLimit))}
          >
            Previous
          </button>

          <button
            className="secondary-button small"
            onClick={() => setEventOffset(eventOffset + eventLimit)}
            disabled={events.length < eventLimit}
          >
            Next
          </button>
        </div>
      </div>

      <div className="panel">
        {events.length === 0 ? (
          <div className="empty-state">No events found.</div>
        ) : (
          <div className="event-list large">
            {events.map((event, index) => (
              <EventRow
                key={event.id || `${event.event_type}-${index}`}
                event={event}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsPage = () => {
    const computerDevices = devices.filter(
      (device) => device.device_type === "computer"
    ).length;
    const cctvDevices = devices.filter(
      (device) => device.device_type === "cctv"
    ).length;
    const printerDevices = devices.filter(
      (device) => device.device_type === "printer"
    ).length;
    const unknownDevices = devices.filter(
      (device) => !["computer", "cctv", "printer"].includes(device.device_type)
    ).length;

    const vlan20Devices = devices.filter(
      (device) => Number(device.vlan_id) === 20
    ).length;
    const vlan30Devices = devices.filter(
      (device) => Number(device.vlan_id) === 30
    ).length;
    const vlan40Devices = devices.filter(
      (device) => Number(device.vlan_id) === 40
    ).length;
    const vlan90Devices = devices.filter(
      (device) => Number(device.vlan_id) === 90
    ).length;

    const enforcedAllowed = devices.filter(
      (device) =>
        device.enforcement_status === "allowed" ||
        device.access_decision === "allow"
    ).length;
    const enforcedQuarantined = devices.filter(
      (device) =>
        device.enforcement_status === "quarantined" ||
        device.access_decision === "quarantine"
    ).length;

    const generateReport = async () => {
      setReportLoading(true);
      setReportError("");
      setReportData(null);
      const today = new Date().toISOString().slice(0, 10);

      if (reportPeriod === "custom") {
        if (
          reportStartDate > today ||
          reportEndDate > today ||
          reportEndDate < reportStartDate
        ) {
          setReportError("Date input invalid, please select a valid date.");
          setReportLoading(false);
          return;
        }
      } else if (reportDate > today) {
        setReportError("Date input invalid, please select a valid date.");
        setReportLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          report_type: reportType,
          period: reportPeriod,
        });

        if (reportPeriod === "custom") {
          params.append(
            "start_datetime",
            `${reportStartDate}T${reportStartTime}`
          );
          params.append("end_datetime", `${reportEndDate}T${reportEndTime}`);
        } else {
          params.append("date", reportDate);
        }

        const response = await fetch(
          `${API_URL}/reports/generate?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to generate report.");
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        setReportError(error.message || "Failed to generate report.");
      } finally {
        setReportLoading(false);
      }
    };

    const exportReport = (format) => {
      const today = new Date().toISOString().slice(0, 10);
      if (reportPeriod === "custom") {
        if (
          reportStartDate > today ||
          reportEndDate > today ||
          reportEndDate < reportStartDate
        ) {
          setReportError("Date input invalid, please select a valid date.");
          return;
        }
      } else if (reportDate > today) {
        setReportError("Date input invalid, please select a valid date.");
        return;
      }

      const params = new URLSearchParams({
        report_type: reportType,
        period: reportPeriod,
      });

      if (reportPeriod === "custom") {
        params.append(
          "start_datetime",
          `${reportStartDate}T${reportStartTime}`
        );
        params.append("end_datetime", `${reportEndDate}T${reportEndTime}`);
      } else if (reportDate) {
        params.append("date", reportDate);
      }

      window.open(
        `${API_URL}/reports/export/${format}?${params.toString()}`,
        "_blank"
      );
    };

    const breakdownEntries = Object.entries(
      reportData?.summary?.event_types || reportData?.event_types || {}
    );

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Reports &amp; Compliance Export</div>
            <div className="page-description">
              Network operations telemetry, audit summaries, and Excel/PDF
              compliance exports.
            </div>
          </div>
        </div>

        <div className="report-grid">
          <ReportCard
            title="Device Inventory"
            value={totalDevices}
            description="Current LAN device inventory."
            onClick={() => {
              setDeviceFilter("all");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Online Devices"
            value={onlineDevices}
            description="Devices currently detected online."
            onClick={() => {
              setDeviceFilter("online");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Pending Approvals"
            value={pendingDevices}
            description="Devices awaiting administrator action."
            onClick={() => {
              setDeviceFilter("pending");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Rejected Devices"
            value={rejectedDevices}
            description="Devices rejected by the administrator."
            onClick={() => {
              setDeviceFilter("rejected");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Quarantine"
            value={quarantinedDevices}
            description="Devices blocked from network access."
            onClick={() => {
              setDeviceFilter("quarantined");
              setActivePage("devices");
            }}
          />

          <div className="report-section">
            <div className="panel-title">Device Classification</div>
            <div className="panel-subtitle">
              Click any card to filter the Device Inventory by endpoint class.
            </div>
          </div>

          <ReportCard
            title="Computers"
            value={computerDevices}
            description="Detected workstation endpoints."
            onClick={() => {
              setDeviceFilter("computer");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="CCTV"
            value={cctvDevices}
            description="Detected surveillance cameras."
            onClick={() => {
              setDeviceFilter("cctv");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Printers"
            value={printerDevices}
            description="Detected network printers."
            onClick={() => {
              setDeviceFilter("printer");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="Unknown"
            value={unknownDevices}
            description="Unclassified endpoints."
            onClick={() => {
              setDeviceFilter("unknown");
              setActivePage("devices");
            }}
          />

          <div className="report-section">
            <div className="panel-title">VLAN Distribution</div>
            <div className="panel-subtitle">
              Devices assigned to each 802.1Q network segment.
            </div>
          </div>

          <ReportCard
            title="VLAN 20"
            value={vlan20Devices}
            description="Workstation VLAN 20."
            onClick={() => {
              setDeviceFilter("vlan20");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="VLAN 30"
            value={vlan30Devices}
            description="CCTV Surveillance VLAN 30."
            onClick={() => {
              setDeviceFilter("vlan30");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="VLAN 40"
            value={vlan40Devices}
            description="Printers VLAN 40."
            onClick={() => {
              setDeviceFilter("vlan40");
              setActivePage("devices");
            }}
          />
          <ReportCard
            title="VLAN 90"
            value={vlan90Devices}
            description="Quarantine VLAN 90."
            onClick={() => {
              setDeviceFilter("vlan90");
              setActivePage("devices");
            }}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Enforcement Summary</div>
              <div className="panel-subtitle">
                Current firewall &amp; switchport enforcement posture
              </div>
            </div>
          </div>

          <div className="classification-list">
            <ClassificationRow
              label="Allowed"
              icon={<Icon name="check" size={14} />}
              type="computer"
              value={enforcedAllowed}
            />
            <ClassificationRow
              label="Quarantined"
              icon={<Icon name="shield" size={14} />}
              type="unknown"
              value={enforcedQuarantined}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Historical Report Builder</div>
              <div className="panel-subtitle">
                Generate audit reports and export to Excel (.xlsx) or PDF.
              </div>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-row">
              <label>Report Type</label>
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option value="network_activity">Network Activity</option>
                <option value="device_inventory">Device Inventory</option>
                <option value="device_discovery">Device Discovery</option>
                <option value="network_events">Network Events</option>
                <option value="access_enforcement">Access Enforcement</option>
                <option value="approvals">Approvals</option>
                <option value="quarantine">Quarantine</option>
                <option value="device_classification">
                  Device Classification
                </option>
                <option value="vlan_automation">VLAN Automation</option>
                <option value="system_activity">System Activity</option>
              </select>
            </div>

            <div className="settings-row">
              <label>Period</label>
              <select
                value={reportPeriod}
                onChange={(event) => setReportPeriod(event.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {reportPeriod === "custom" ? (
              <>
                <div className="settings-row">
                  <label>Starting</label>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(event) =>
                        setReportStartDate(event.target.value)
                      }
                    />
                    <input
                      type="time"
                      value={reportStartTime}
                      onChange={(event) =>
                        setReportStartTime(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="settings-row">
                  <label>Ending</label>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(event) => setReportEndDate(event.target.value)}
                    />
                    <input
                      type="time"
                      value={reportEndTime}
                      onChange={(event) => setReportEndTime(event.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="settings-row">
                <label>Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ padding: "16px 20px" }}>
            <button
              className="primary-button"
              onClick={generateReport}
              disabled={reportLoading}
            >
              <Icon name="reports" size={14} />
              {reportLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {reportError && <div className="error-message">{reportError}</div>}

          {reportData && (
            <div
              style={{
                margin: "0 20px 20px",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-input)",
                overflow: "hidden",
              }}
            >
              <div className="panel-header">
                <div>
                  <div className="panel-title">Report Results</div>
                  <div className="panel-subtitle">
                    {reportData.report_type} • {reportData.period}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="primary-button small"
                    onClick={() => exportReport("excel")}
                  >
                    Download Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() => exportReport("pdf")}
                  >
                    Download PDF
                  </button>
                </div>
              </div>

              <div className="classification-list">
                <div className="settings-row">
                  <span>Start Window</span>
                  <code>{reportData.start}</code>
                </div>
                <div className="settings-row">
                  <span>End Window</span>
                  <code>{reportData.end}</code>
                </div>
                <div className="settings-row">
                  <span>Total Recorded Events</span>
                  <strong>{reportData.summary?.total_events ?? 0}</strong>
                </div>
              </div>

              {breakdownEntries.length > 0 && (
                <div style={{ padding: "14px 20px" }}>
                  <div
                    className="panel-title"
                    style={{ marginBottom: "8px", fontSize: "13px" }}
                  >
                    Event Breakdown
                  </div>
                  {breakdownEntries.map(([eventType, count]) => (
                    <div className="settings-row" key={eventType}>
                      <span className="mono">{eventType}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsPage = () => (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">System Settings &amp; Integrations</div>
          <div className="page-description">
            NETOPS platform configuration, RFC 5737 Simulation Mode, and
            Sophos/Cisco hardware telemetry.
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Backend API &amp; Telemetry</div>
              <div className="panel-subtitle">
                FastAPI &amp; WebSocket event stream
              </div>
            </div>
          </div>

          <div className="settings-row">
            <span>REST API Endpoint</span>
            <code>{API_URL}</code>
          </div>
          <div className="settings-row">
            <span>WebSocket Stream</span>
            <code>{WS_URL}</code>
          </div>
          <div className="settings-row">
            <span>WebSocket Status</span>
            <span className="settings-status">
              <span
                className={`status-dot ${wsConnected ? "online" : "offline"}`}
              />
              {wsConnected ? "Connected (Real-time)" : "Reconnecting..."}
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                RFC 5737 Hardware-Free Simulation Mode
              </div>
              <div className="panel-subtitle">
                Safe evaluation on TEST-NET-1 (192.0.2.0/24)
              </div>
            </div>
            <button
              type="button"
              className="primary-button small"
              onClick={seedSimulationDevices}
              disabled={simSeedLoading}
            >
              <Icon name="beaker" size={13} />
              {simSeedLoading ? "Seeding..." : "Seed Simulation Devices"}
            </button>
          </div>

          <div className="settings-row">
            <span>Simulated Subnet</span>
            <code>192.0.2.0/24 (RFC 5737)</code>
          </div>
          <div className="settings-row">
            <span>Active Simulated Endpoints</span>
            <strong>{simulationDevicesCount} device(s)</strong>
          </div>
          <div className="settings-row">
            <span>Hardware Safety Guard</span>
            <span className="status-badge allowed">
              Zero Physical Switch/Firewall Writes
            </span>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Sophos Firewall Integration</div>
              <div className="panel-subtitle">
                Physical network isolation &amp; quarantine drop-rule
                enforcement
              </div>
            </div>
            <button
              type="button"
              className="secondary-button small"
              onClick={checkSophos}
              disabled={sophosLoading}
            >
              <Icon name="refresh" size={13} />
              {sophosLoading ? "Checking..." : "Refresh Status"}
            </button>
          </div>

          <div className="settings-row">
            <span>Firewall Appliance</span>
            <code>
              192.168.0.10:4444{" "}
              {sophosStatus?.api_version
                ? `(SFOS ${sophosStatus.api_version})`
                : ""}
            </code>
          </div>

          <div className="settings-row">
            <span>Enforcement Mode</span>
            <span className="settings-status">
              <span
                className={`status-dot ${
                  sophosStatus?.connected ? "online" : "offline"
                }`}
              />
              {sophosStatus?.connected
                ? "Active & Enforcing (Live Sophos Appliance)"
                : "Simulation Fallback (Hardware Offline / Unconfigured)"}
            </span>
          </div>

          <div className="settings-row">
            <span>Quarantine Firewall Rule</span>
            <span
              style={{
                color: sophosStatus?.quarantine_rule_active
                  ? "var(--status-success-text)"
                  : "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {sophosStatus?.quarantine_rule_active
                ? "NETOPS_Quarantine_Block (Top Drop Rule Live)"
                : "Simulated in Memory (No Physical Appliance Needed)"}
            </span>
          </div>

          <div className="settings-row">
            <span>Protected Infrastructure IPs</span>
            <code>192.168.0.1, 192.168.0.10, 192.168.0.13, 192.168.0.101</code>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEndpointUpdatesPage = () => {
    const endpointFreshness = (lastChecked) => {
      if (!lastChecked) return "stale";
      const lastCheckedTime = new Date(
        lastChecked.endsWith("Z") || lastChecked.includes("+")
          ? lastChecked
          : `${lastChecked}Z`
      );
      const ageMinutes = (Date.now() - lastCheckedTime.getTime()) / 60000;
      return ageMinutes <= 15 ? "online" : "stale";
    };

    const freshEndpointUpdates = endpointUpdates.filter(
      (endpoint) => endpointFreshness(endpoint.last_checked) === "online"
    );
    const endpointsWithUpdates = freshEndpointUpdates.filter(
      (endpoint) => endpoint.update_status === "updates_available"
    ).length;
    const endpointsUpToDate = freshEndpointUpdates.filter(
      (endpoint) => endpoint.update_status === "up_to_date"
    ).length;
    const totalPendingUpdates = freshEndpointUpdates.reduce(
      (total, endpoint) => total + (endpoint.pending_updates || 0),
      0
    );

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Endpoint Updates</div>
            <div className="page-description">
              Agentless LAN patch discovery and centralized remediation across
              Linux &amp; Windows endpoints.
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="primary-button"
              onClick={scanLanUpdates}
              disabled={lanScanLoading || endpointUpdatesLoading}
            >
              <Icon name="bolt" size={14} />
              {lanScanLoading
                ? "Scanning LAN..."
                : "Scan LAN for Updates (Agentless)"}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                loadPatchJobs();
                setShowJobsModal(true);
              }}
            >
              <Icon name="updates" size={14} />
              Remediation Jobs ({patchJobs.length})
            </button>
            <button
              className="secondary-button"
              onClick={loadEndpointUpdates}
              disabled={endpointUpdatesLoading || lanScanLoading}
            >
              <Icon name="refresh" size={14} />
              {endpointUpdatesLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {endpointUpdatesError && (
          <div className="error-message">{endpointUpdatesError}</div>
        )}

        <div className="stats-grid">
          <div className="card">
            <div className="card-subtitle">Known Endpoints</div>
            <div className="stat-value">{endpointUpdates.length}</div>
          </div>
          <div className="card">
            <div className="card-subtitle">Reporting Now</div>
            <div className="stat-value">{freshEndpointUpdates.length}</div>
          </div>
          <div className="card">
            <div
              className="card-subtitle"
              style={{ color: "var(--status-warning-text)" }}
            >
              Updates Needed
            </div>
            <div
              className="stat-value"
              style={{ color: "var(--status-warning-text)" }}
            >
              {endpointsWithUpdates}
            </div>
          </div>
          <div className="card">
            <div className="card-subtitle">Pending Packages</div>
            <div className="stat-value">
              {totalPendingUpdates.toLocaleString()}
            </div>
          </div>
          <div className="card">
            <div
              className="card-subtitle"
              style={{ color: "var(--status-success-text)" }}
            >
              Up to Date
            </div>
            <div
              className="stat-value"
              style={{ color: "var(--status-success-text)" }}
            >
              {endpointsUpToDate}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Endpoint Update Telemetry</div>
              <div className="panel-subtitle">
                {endpointUpdates.length} endpoint
                {endpointUpdates.length === 1 ? "" : "s"} reported
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>IP ADDRESS</th>
                  <th>MAC ADDRESS</th>
                  <th>OS</th>
                  <th>VERSION</th>
                  <th>ARCH</th>
                  <th>STATUS</th>
                  <th>PENDING</th>
                  <th>SECURITY</th>
                  <th>LAST CHECKED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {endpointUpdates.length === 0 ? (
                  <tr>
                    <td colSpan="11">
                      <div className="empty-state">
                        No endpoint update telemetry recorded yet. Click
                        &ldquo;Scan LAN for Updates&rdquo; to assess hosts.
                      </div>
                    </td>
                  </tr>
                ) : (
                  endpointUpdates.map((endpoint) => {
                    const isOnline =
                      endpointFreshness(endpoint.last_checked) === "online";
                    const activeJob = getActiveJobForDevice(endpoint);
                    return (
                      <tr key={endpoint.id}>
                        <td>
                          <div className="device-primary">
                            {endpoint.hostname}
                          </div>
                        </td>
                        <td className="mono">{endpoint.device_ip || "—"}</td>
                        <td className="mono">{endpoint.mac_address || "—"}</td>
                        <td>{endpoint.operating_system || "—"}</td>
                        <td>{endpoint.os_version || "—"}</td>
                        <td className="mono">{endpoint.architecture || "—"}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              !isOnline
                                ? "blocked"
                                : endpoint.update_status === "up_to_date"
                                  ? "allowed"
                                  : "warning"
                            }`}
                          >
                            {!isOnline
                              ? "Stale"
                              : endpoint.update_status === "updates_available"
                                ? "Updates Available"
                                : endpoint.update_status === "up_to_date"
                                  ? "Up to Date"
                                  : endpoint.update_status}
                          </span>
                        </td>
                        <td className="mono">
                          <strong>{endpoint.pending_updates ?? 0}</strong>
                        </td>
                        <td className="mono">
                          {endpoint.security_updates ?? "—"}
                        </td>
                        <td>
                          {endpoint.last_checked
                            ? new Date(
                                endpoint.last_checked.endsWith("Z")
                                  ? endpoint.last_checked
                                  : `${endpoint.last_checked}Z`
                              ).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {activeJob ? (
                            <button
                              type="button"
                              className="secondary-button small"
                              onClick={() => {
                                setSelectedJobDetails(activeJob);
                                setShowJobsModal(true);
                              }}
                            >
                              {activeJob.status === "SCHEDULED"
                                ? "Scheduled"
                                : `Job #${activeJob.id}`}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="approve-button small"
                              onClick={() => openDeployModal(endpoint)}
                            >
                              <Icon name="bolt" size={12} />
                              Deploy
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardPage = () => {
    const parseEndpointDate = (d) => {
      if (!d) return null;
      return new Date(d.endsWith("Z") || d.includes("+") ? d : d + "Z");
    };

    const dashboardUpdatesNeeded = endpointUpdates.filter(
      (endpoint) => endpoint.update_status === "updates_available"
    ).length;
    const dashboardUpToDate = endpointUpdates.filter(
      (endpoint) => endpoint.update_status === "up_to_date"
    ).length;
    const dashboardPendingUpdates = endpointUpdates.reduce(
      (total, endpoint) => total + (endpoint.pending_updates || 0),
      0
    );

    const computerDevices = devices.filter(
      (device) => device.device_type === "computer"
    ).length;
    const cctvDevices = devices.filter(
      (device) => device.device_type === "cctv"
    ).length;
    const printerDevices = devices.filter(
      (device) => device.device_type === "printer"
    ).length;
    const unknownDevices = devices.filter(
      (device) => !device.device_type || device.device_type === "unknown"
    ).length;

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Network Operations Dashboard</div>
            <div className="page-description">
              Real-time posture of connected LAN endpoints, 802.1Q VLAN
              segmentation, and automated patch remediation.
            </div>
          </div>
        </div>

        <div className="access-summary">
          <AccessSummary
            title="Total Devices"
            value={totalDevices}
            text="Devices detected on the LAN"
            onClick={() => {
              setDeviceFilter("all");
              setActivePage("devices");
            }}
          />
          <AccessSummary
            title="Online"
            value={onlineDevices}
            text="Currently connected"
            onClick={() => {
              setDeviceFilter("online");
              setActivePage("devices");
            }}
          />
          <AccessSummary
            title="Pending"
            value={pendingDevices}
            text="Awaiting administrator approval"
            onClick={() => {
              setDeviceFilter("pending");
              setActivePage("devices");
            }}
          />
          <AccessSummary
            title="Quarantined"
            value={quarantinedDevices}
            text="Isolated in VLAN 90 / Firewall"
            onClick={() => {
              setDeviceFilter("quarantined");
              setActivePage("devices");
            }}
          />
          <AccessSummary
            title="Rejected"
            value={rejectedDevices}
            text="Blocked by administrator"
            onClick={() => {
              setDeviceFilter("rejected");
              setActivePage("devices");
            }}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Endpoint Update Status</div>
              <div className="panel-subtitle">
                Patch compliance across monitored LAN machines
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="primary-button small"
                onClick={scanLanUpdates}
                disabled={lanScanLoading}
              >
                <Icon name="bolt" size={13} />
                {lanScanLoading ? "Scanning..." : "Scan LAN Updates"}
              </button>
              <button
                className="secondary-button small"
                onClick={() => setActivePage("endpoint-updates")}
              >
                View Details
              </button>
            </div>
          </div>

          {endpointUpdatesError && (
            <div className="error-message">{endpointUpdatesError}</div>
          )}

          <div className="access-summary">
            <div
              className="summary-card"
              onClick={() => {
                setDeviceFilter("all");
                setActivePage("devices");
              }}
            >
              <div className="summary-card-title">Monitored Machines</div>
              <div className="summary-card-value">
                {endpointUpdatesLoading ? "..." : endpointUpdates.length}
              </div>
            </div>

            <div
              className="summary-card"
              onClick={() => {
                setDeviceFilter("needs_updates");
                setActivePage("devices");
              }}
            >
              <div
                className="summary-card-title"
                style={{ color: "var(--status-warning-text)" }}
              >
                Needs Updates
              </div>
              <div
                className="summary-card-value"
                style={{ color: "var(--status-warning-text)" }}
              >
                {endpointUpdatesLoading ? "..." : dashboardUpdatesNeeded}
              </div>
            </div>

            <div
              className="summary-card"
              onClick={() => {
                setDeviceFilter("up_to_date");
                setActivePage("devices");
              }}
            >
              <div
                className="summary-card-title"
                style={{ color: "var(--status-success-text)" }}
              >
                Up to Date
              </div>
              <div
                className="summary-card-value"
                style={{ color: "var(--status-success-text)" }}
              >
                {endpointUpdatesLoading ? "..." : dashboardUpToDate}
              </div>
            </div>

            <div
              className="summary-card"
              onClick={() => setActivePage("endpoint-updates")}
            >
              <div className="summary-card-title">Pending Packages</div>
              <div className="summary-card-value">
                {endpointUpdatesLoading
                  ? "..."
                  : dashboardPendingUpdates.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Machine Update Details</div>
              <div className="panel-subtitle">
                Latest update report from each monitored endpoint
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => {
                  loadPatchJobs();
                  setShowJobsModal(true);
                }}
              >
                <Icon name="updates" size={13} />
                Remediation Jobs ({patchJobs.length})
              </button>
              <button
                type="button"
                className="primary-button small"
                onClick={scanLanUpdates}
                disabled={lanScanLoading}
              >
                <Icon name="bolt" size={13} />
                {lanScanLoading ? "Scanning..." : "Scan LAN Updates"}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MACHINE</th>
                  <th>IP ADDRESS</th>
                  <th>OPERATING SYSTEM</th>
                  <th>UPDATE STATUS</th>
                  <th>PENDING</th>
                  <th>LAST CHECKED</th>
                  <th>REPORT AGE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {endpointUpdatesLoading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="loading-state">
                        Loading endpoint reports...
                      </div>
                    </td>
                  </tr>
                ) : endpointUpdates.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        No endpoint update reports available.
                      </div>
                    </td>
                  </tr>
                ) : (
                  endpointUpdates.map((endpoint) => {
                    const checkedAt = parseEndpointDate(endpoint.last_checked);
                    const ageMinutes = checkedAt
                      ? (Date.now() - checkedAt.getTime()) / 60000
                      : Infinity;
                    const isFresh = ageMinutes >= 0 && ageMinutes <= 15;
                    const activeJob = getActiveJobForDevice(endpoint);

                    return (
                      <tr key={endpoint.id}>
                        <td>
                          <div className="device-primary">
                            {endpoint.hostname}
                          </div>
                        </td>
                        <td className="mono">
                          {endpoint.device_ip || endpoint.ip_address || "—"}
                        </td>
                        <td>
                          {endpoint.operating_system}
                          {endpoint.os_version ? ` ${endpoint.os_version}` : ""}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              !isFresh
                                ? "blocked"
                                : endpoint.update_status === "up_to_date"
                                  ? "allowed"
                                  : "warning"
                            }`}
                          >
                            {!isFresh
                              ? "Stale / Unknown"
                              : endpoint.update_status === "up_to_date"
                                ? "Up to Date"
                                : endpoint.update_status === "updates_available"
                                  ? "Needs Updates"
                                  : endpoint.update_status}
                          </span>
                        </td>
                        <td className="mono">
                          <strong>{endpoint.pending_updates ?? "—"}</strong>
                        </td>
                        <td>
                          {checkedAt ? checkedAt.toLocaleString() : "Never"}
                        </td>
                        <td>
                          {!checkedAt
                            ? "Unknown"
                            : ageMinutes < 0
                              ? "Just now"
                              : ageMinutes <= 15
                                ? "Recent"
                                : `${Math.floor(ageMinutes)}m ago`}
                        </td>
                        <td>
                          {activeJob ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className="secondary-button small"
                                onClick={() => {
                                  setSelectedJobDetails(activeJob);
                                  setShowJobsModal(true);
                                }}
                              >
                                {activeJob.status === "SCHEDULED"
                                  ? "Scheduled"
                                  : activeJob.status === "IN_PROGRESS"
                                    ? `Updating ${activeJob.progress_percent}%`
                                    : "Queued"}
                              </button>
                              {(activeJob.status === "PENDING" ||
                                activeJob.status === "SCHEDULED") && (
                                <button
                                  type="button"
                                  className="approve-button small"
                                  onClick={async () => {
                                    await runJobNow(activeJob.id);
                                    setShowJobsModal(true);
                                  }}
                                >
                                  Run Now
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="approve-button small"
                              onClick={() => openDeployModal(endpoint)}
                            >
                              <Icon name="bolt" size={12} />
                              Deploy Updates
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Device Classification &amp; VLANs</div>
              <div className="panel-subtitle">
                Current endpoint-to-VLAN segmentation summary
              </div>
            </div>
          </div>

          <div className="access-summary">
            <div
              className="summary-card"
              onClick={() => {
                setActivePage("vlans");
                setVlanFilter("20");
              }}
            >
              <div className="summary-card-title">
                <Icon name="computer" size={14} />
                Computers
              </div>
              <div className="summary-card-value">{computerDevices}</div>
              <div className="summary-card-text">VLAN 20 • Workstations</div>
            </div>

            <div
              className="summary-card"
              onClick={() => {
                setActivePage("vlans");
                setVlanFilter("30");
              }}
            >
              <div className="summary-card-title">
                <Icon name="cctv" size={14} />
                CCTV
              </div>
              <div className="summary-card-value">{cctvDevices}</div>
              <div className="summary-card-text">VLAN 30 • Surveillance</div>
            </div>

            <div
              className="summary-card"
              onClick={() => {
                setActivePage("vlans");
                setVlanFilter("40");
              }}
            >
              <div className="summary-card-title">
                <Icon name="printer" size={14} />
                Printers
              </div>
              <div className="summary-card-value">{printerDevices}</div>
              <div className="summary-card-text">VLAN 40 • Print Services</div>
            </div>

            <div
              className="summary-card"
              onClick={() => {
                setActivePage("vlans");
                setVlanFilter("90");
              }}
            >
              <div
                className="summary-card-title"
                style={{ color: "var(--status-warning-text)" }}
              >
                <Icon name="alert" size={14} />
                Quarantine
              </div>
              <div
                className="summary-card-value"
                style={{ color: "var(--status-warning-text)" }}
              >
                {unknownDevices}
              </div>
              <div className="summary-card-text">VLAN 90 • Restricted</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Access Control Status</div>
              <div className="panel-subtitle">
                Approval and Internet enforcement state across LAN endpoints
              </div>
            </div>

            <button
              className="secondary-button small"
              onClick={() => setActivePage("access")}
            >
              Manage Access
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>TYPE</th>
                  <th>APPROVAL</th>
                  <th>ACCESS</th>
                  <th>ENFORCEMENT</th>
                  <th>VLAN</th>
                </tr>
              </thead>

              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">No devices detected.</div>
                    </td>
                  </tr>
                ) : (
                  devices.slice(0, 10).map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="device-primary">
                          <span
                            className={`device-icon ${
                              device.device_type === "cctv"
                                ? "camera"
                                : device.device_type || "unknown"
                            }`}
                          >
                            <DeviceTypeIcon
                              type={device.device_type}
                              size={14}
                            />
                          </span>
                          <span>{device.hostname || "Unknown Device"}</span>
                        </div>
                        <div className="device-secondary">
                          {device.ip_address || "—"}
                        </div>
                      </td>

                      <td>
                        <TypeBadge type={device.device_type} />
                      </td>

                      <td>
                        <StatusBadge value={device.approval_status} />
                      </td>

                      <td>
                        <StatusBadge
                          value={device.access_decision || "unknown"}
                        />
                      </td>

                      <td>
                        <EnforcementBadge value={device.enforcement_status} />
                      </td>

                      <td>
                        <span
                          className={`vlan-badge ${
                            Number(device.vlan_id || 90) === 90
                              ? "quarantine"
                              : ""
                          }`}
                        >
                          VLAN {device.vlan_id || 90}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (activePage) {
      case "devices":
        return renderDevicesPage();
      case "events":
        return renderEventsPage();
      case "access":
        return renderAccessPage();
      case "endpoint-updates":
        return renderEndpointUpdatesPage();
      case "vlans":
        return renderVLANPage();
      case "reports":
        return renderReportsPage();
      case "settings":
        return renderSettingsPage();
      default:
        return renderDashboardPage();
    }
  };

  const renderPatchModals = () => (
    <>
      {deployModalDevice && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (deployingStatus !== "dispatching") {
              setDeployModalDevice(null);
              setDeployingStatus(null);
            }
          }}
        >
          <div
            className="automation-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxInlineSize: "580px" }}
          >
            <div className="automation-modal-header">
              <div>
                <div className="automation-label">
                  CENTRAL PATCH REMEDIATION
                </div>
                <div className="automation-title">Deploy Endpoint Updates</div>
              </div>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => {
                  setDeployModalDevice(null);
                  setDeployingStatus(null);
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div className="automation-device">
                <div>
                  <span>Target Machine</span>
                  <strong>{deployModalDevice.hostname || "Unknown Host"}</strong>
                </div>
                <div>
                  <span>IP Address</span>
                  <strong>
                    {deployModalDevice.ip_address ||
                      deployModalDevice.device_ip ||
                      "LAN Interface"}
                  </strong>
                </div>
                <div>
                  <span>Operating System</span>
                  <strong>
                    {deployModalDevice.operating_system || "Linux / Windows"}{" "}
                    {deployModalDevice.os_version || ""}
                  </strong>
                </div>
                <div>
                  <span>Pending Patches</span>
                  <strong style={{ color: "var(--status-warning-text)" }}>
                    {deployModalDevice.pending_updates ?? "Available"} Updates
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Deployment Timing
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    onClick={() => setScheduleMode("now")}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      background:
                        scheduleMode === "now"
                          ? "var(--status-success-bg)"
                          : "var(--bg-input)",
                      border:
                        scheduleMode === "now"
                          ? "1px solid var(--status-success-border)"
                          : "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === "now"}
                      onChange={() => setScheduleMode("now")}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color:
                            scheduleMode === "now"
                              ? "var(--status-success-text)"
                              : "var(--text-primary)",
                        }}
                      >
                        Deploy Immediately
                      </div>
                      <div
                        style={{ fontSize: "11.5px", color: "var(--text-muted)" }}
                      >
                        Execute package upgrade now
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setScheduleMode("scheduled");
                      if (!scheduledDateTime) {
                        const d = new Date(Date.now() + 3600 * 1000);
                        setScheduledDateTime(
                          new Date(
                            d.getTime() - d.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .slice(0, 16)
                        );
                      }
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      background:
                        scheduleMode === "scheduled"
                          ? "var(--status-indigo-bg)"
                          : "var(--bg-input)",
                      border:
                        scheduleMode === "scheduled"
                          ? "1px solid var(--status-indigo-border)"
                          : "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === "scheduled"}
                      onChange={() => setScheduleMode("scheduled")}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color:
                            scheduleMode === "scheduled"
                              ? "var(--status-indigo-text)"
                              : "var(--text-primary)",
                        }}
                      >
                        Schedule Maintenance
                      </div>
                      <div
                        style={{ fontSize: "11.5px", color: "var(--text-muted)" }}
                      >
                        Specify future window
                      </div>
                    </div>
                  </div>
                </div>

                {scheduleMode === "scheduled" && (
                  <div
                    style={{
                      marginTop: "12px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Select Execution Date &amp; Time
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      min={new Date(
                        Date.now() - new Date().getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      style={{ inlineSize: "100%" }}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setDeployModalDevice(null);
                    setDeployingStatus(null);
                  }}
                  disabled={deployingStatus === "dispatching"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    deployingStatus === "dispatching" ||
                    (scheduleMode === "scheduled" &&
                      (!scheduledDateTime ||
                        new Date(scheduledDateTime) <= new Date()))
                  }
                  onClick={async () => {
                    const target = deployModalDevice;
                    const targetTime =
                      scheduleMode === "scheduled" ? scheduledDateTime : null;
                    const job = await deployUpdates(target, targetTime);
                    if (job) {
                      setDeployModalDevice(null);
                      setDeployingStatus(null);
                      setSelectedJobDetails(job);
                      setShowJobsModal(true);
                    }
                  }}
                >
                  <Icon name="bolt" size={14} />
                  {deployingStatus === "dispatching"
                    ? "Dispatching..."
                    : scheduleMode === "scheduled"
                      ? "Confirm Schedule"
                      : "Confirm & Deploy Updates"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJobsModal && (
        <div className="modal-overlay" onClick={() => setShowJobsModal(false)}>
          <div
            className="automation-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ inlineSize: "min(840px, 95%)" }}
          >
            <div className="automation-modal-header">
              <div>
                <div className="automation-label">NETOPS REMEDIATION</div>
                <div className="automation-title">
                  Central Update Jobs &amp; Live Execution Logs
                </div>
              </div>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setShowJobsModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              {patchJobs.length === 0 ? (
                <div className="empty-state">
                  No update deployment jobs have been triggered yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxBlockSize: "260px",
                    overflowY: "auto",
                    marginBottom: "16px",
                  }}
                >
                  {patchJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobDetails(job)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        background:
                          selectedJobDetails?.id === job.id
                            ? "var(--bg-surface-elevated)"
                            : "var(--bg-input)",
                        border:
                          selectedJobDetails?.id === job.id
                            ? "1px solid var(--border-focus)"
                            : "1px solid var(--border-subtle)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: "13.5px",
                          }}
                        >
                          Job #{job.id} — {job.hostname} (
                          {job.ip_address || "LAN"})
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {job.is_local
                            ? "Local Host Execution"
                            : "Remote Agent Queue"}{" "}
                          •{" "}
                          {job.created_at
                            ? new Date(
                                job.created_at.endsWith("Z")
                                  ? job.created_at
                                  : job.created_at + "Z"
                              ).toLocaleTimeString()
                            : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          className={`status-badge ${
                            job.status === "COMPLETED"
                              ? "allowed"
                              : job.status === "IN_PROGRESS"
                                ? "warning"
                                : job.status === "SCHEDULED"
                                  ? "scheduled"
                                  : "blocked"
                          }`}
                        >
                          {job.status === "IN_PROGRESS"
                            ? `UPDATING ${job.progress_percent}%`
                            : job.status}
                        </span>

                        {(job.status === "PENDING" ||
                          job.status === "SCHEDULED") && (
                          <button
                            type="button"
                            className="approve-button small"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await runJobNow(job.id);
                            }}
                          >
                            Run Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedJobDetails && (
                <div
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                      }}
                    >
                      EXECUTION LOGS (JOB #{selectedJobDetails.id} —{" "}
                      {selectedJobDetails.hostname})
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      {selectedJobDetails.progress_percent}%
                    </span>
                  </div>

                  <pre
                    style={{
                      background: "#050811",
                      color: "var(--status-success-text)",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      maxBlockSize: "180px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                    }}
                  >
                    {selectedJobDetails.log_output || "Awaiting execution..."}
                    {selectedJobDetails.error_message
                      ? `\nError: ${selectedJobDetails.error_message}`
                      : ""}
                  </pre>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="primary-button small"
                  onClick={() => setShowJobsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderAutomationResult = () => {
    if (!automationResult) return null;

    const success =
      automationResult.configuration_status === "simulated" &&
      automationResult.verification_status === "verified_simulation";

    return (
      <div
        className="modal-overlay"
        onClick={() => setAutomationResult(null)}
      >
        <div
          className="automation-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="automation-modal-header">
            <div>
              <div className="automation-label">NETOPS AUTOMATION</div>
              <div className="automation-title">
                Cisco 802.1Q VLAN Provisioning
              </div>
            </div>

            <div
              className={
                success
                  ? "automation-result success"
                  : "automation-result warning"
              }
            >
              {success ? "VERIFIED" : "COMPLETED"}
            </div>
          </div>

          <div className="automation-device">
            <div>
              <span>IP ADDRESS</span>
              <strong>{automationResult.ip_address || "—"}</strong>
            </div>
            <div>
              <span>MAC ADDRESS</span>
              <strong>{automationResult.mac_address || "—"}</strong>
            </div>
          </div>

          <div className="automation-grid">
            <AutomationField
              label="Device Type"
              value={automationResult.device_type}
            />
            <AutomationField
              label="Target VLAN"
              value={`VLAN ${automationResult.vlan_id ?? "—"}`}
            />
            <AutomationField
              label="Switch"
              value={automationResult.switch_name || "Not identified"}
            />
            <AutomationField
              label="Port"
              value={automationResult.switch_port || "Not identified"}
            />
            <AutomationField
              label="Switch Status"
              value={automationResult.switch_status || "—"}
            />
            <AutomationField
              label="Port Status"
              value={automationResult.port_status || "—"}
            />
          </div>

          <div className="automation-pipeline">
            <div className="pipeline-title">AUTOMATION PIPELINE</div>
            <PipelineStep
              number="01"
              title="Classify Device"
              status="Complete"
            />
            <PipelineStep
              number="02"
              title="Apply VLAN Policy"
              status={`VLAN ${automationResult.vlan_id ?? "—"}`}
            />
            <PipelineStep
              number="03"
              title="Identify Switch Port"
              status={automationResult.switch_port ? "Complete" : "Waiting"}
            />
            <PipelineStep
              number="04"
              title="Configure Switch"
              status={automationResult.configuration_status || "—"}
            />
            <PipelineStep
              number="05"
              title="Verify Configuration"
              status={automationResult.verification_status || "—"}
            />
          </div>

          <div className="automation-mode">
            <span>EXECUTION MODE</span>
            <strong>{automationResult.mode || "simulation"}</strong>
          </div>

          <button
            className="primary-button full"
            onClick={() => setAutomationResult(null)}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="shield" size={18} />
          </div>

          <div className="brand-text">
            <div className="brand-name">NETOPS</div>
            <div className="brand-subtitle">Enterprise NAC &amp; VLAN</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section-title">OPERATIONS</div>

          <NavItem
            icon={<Icon name="dashboard" size={16} />}
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />

          <NavItem
            icon={<Icon name="devices" size={16} />}
            label="Devices"
            badge={totalDevices}
            active={activePage === "devices"}
            onClick={() => {
              setDeviceFilter("all");
              setActivePage("devices");
            }}
          />

          <NavItem
            icon={<Icon name="events" size={16} />}
            label="Events"
            active={activePage === "events"}
            onClick={() => setActivePage("events")}
          />

          <NavItem
            icon={<Icon name="shield" size={16} />}
            label="Access Control"
            badge={pendingDevices > 0 ? pendingDevices : null}
            badgeTone="warning"
            active={activePage === "access"}
            onClick={() => {
              setDeviceFilter("all");
              setActivePage("access");
            }}
          />

          <NavItem
            icon={<Icon name="updates" size={16} />}
            label="Endpoint Updates"
            active={activePage === "endpoint-updates"}
            onClick={() => setActivePage("endpoint-updates")}
          />

          <div className="nav-section-title">AUTOMATION</div>

          <NavItem
            icon={<Icon name="vlan" size={16} />}
            label="VLAN Automation"
            active={activePage === "vlans"}
            onClick={() => {
              setVlanFilter("all");
              setActivePage("vlans");
            }}
          />

          <NavItem
            icon={<Icon name="reports" size={16} />}
            label="Reports"
            active={activePage === "reports"}
            onClick={() => setActivePage("reports")}
          />

          <div className="nav-section-title">SYSTEM</div>

          <NavItem
            icon={<Icon name="settings" size={16} />}
            label="Settings"
            active={activePage === "settings"}
            onClick={() => setActivePage("settings")}
          />
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span className={`status-dot ${wsConnected ? "online" : "offline"}`} />
              NETOPS Core
            </span>
            <span className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {wsConnected ? "LIVE" : "POLL"}
            </span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{getPageTitle(activePage)}</div>

          <div className="topbar-right">
            <button
              type="button"
              className="primary-button small"
              onClick={discoverLiveLan}
              disabled={liveDiscoveryLoading}
              title="Auto-detect active OS network interface, probe open ports/banners, and scan live Wi-Fi/LAN subnet"
            >
              <Icon name="refresh" size={13} />
              {liveDiscoveryLoading
                ? "Scanning Live LAN..."
                : `Scan Live LAN (${networkInfo?.network || "Auto"})`}
            </button>

            <button
              type="button"
              className="secondary-button small"
              onClick={runSecurityAudit}
              disabled={securityAuditLoading}
              title="Inspect ARP table for MITM/spoofing, verify Gateway MAC integrity, and probe hosts for risky open ports"
            >
              <Icon name="shield" size={13} />
              {securityAuditLoading ? "Auditing LAN..." : "IDS Security Audit"}
            </button>

            <button
              type="button"
              className="secondary-button small"
              onClick={() => triggerAttackDrill("arp_spoof")}
              title="Trigger a safe simulated ARP Spoofing / MITM intrusion alert to test IDS response"
            >
              <Icon name="alert" size={13} />
              Test Intrusion Alert
            </button>

            <button
              type="button"
              className={
                simulationDevicesCount > 0
                  ? "approve-button small"
                  : "secondary-button small"
              }
              onClick={toggleSimulationMode}
              disabled={simSeedLoading}
              title={
                simulationDevicesCount > 0
                  ? "Simulation is ON. Click to turn OFF and remove fictional 192.0.2.x devices so only real LAN devices remain."
                  : "Simulation is OFF (Live LAN Only). Click to seed fictional RFC 5737 test devices."
              }
            >
              <Icon name="beaker" size={13} />
              {simSeedLoading
                ? "Switching..."
                : simulationDevicesCount > 0
                  ? `Simulation: ON (${simulationDevicesCount})`
                  : "Simulation: OFF (Live LAN)"}
            </button>

            <button
              type="button"
              className="secondary-button small"
              onClick={() => setTerminalOpen((prev) => !prev)}
              title="Toggle Sysadmin Network Execution Terminal"
            >
              <span className="mono" style={{ fontWeight: 700 }}>
                &gt;_
              </span>
              {terminalOpen ? "Hide Console" : "Console"}
            </button>

            <div className="live-indicator">
              <span className="live-dot" />
              {networkInfo?.interface
                ? `${networkInfo.interface} • ${networkInfo.local_ip}${
                    networkInfo.gateway_ip ? ` • GW ${networkInfo.gateway_ip}` : ""
                  }${networkInfo.canary_port ? ` • Canary :${networkInfo.canary_port}` : ""}`
                : "Live Telemetry"}
            </div>
          </div>
        </header>

        {intrusionAlert && (
          <div
            style={{
              margin: "16px 28px 0",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--status-danger-bg)",
              border: "1px solid var(--status-danger-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              fontSize: "13px",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--status-danger-text)",
                  textTransform: "uppercase",
                }}
              >
                [IDS ALERT] {intrusionAlert.title || "NETWORK INTRUSION DETECTED"}
              </div>
              <div style={{ color: "var(--text-primary)", marginTop: "3px" }}>
                {intrusionAlert.message}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setActivePage("events")}
              >
                View Audit Log
              </button>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setIntrusionAlert(null)}
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {securityAuditBanner && (
          <div
            style={{
              margin: "16px 28px 0",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background:
                securityAuditBanner.alerts_count > 0
                  ? "var(--status-warning-bg)"
                  : "var(--bg-surface)",
              border: `1px solid ${
                securityAuditBanner.alerts_count > 0
                  ? "var(--status-warning-border)"
                  : "var(--border-default)"
              }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            <div className="mono" style={{ fontSize: "12px" }}>
              <strong>
                LAN IDS Audit ({securityAuditBanner.status.toUpperCase()}):
              </strong>{" "}
              Inspected {securityAuditBanner.arp_entries_inspected} ARP neighbor
              entries • Gateway {securityAuditBanner.gateway_ip || "n/a"} •
              Canary Trap :{securityAuditBanner.canary_port} (
              {securityAuditBanner.canary_active ? "ACTIVE" : "INACTIVE"}) •{" "}
              {securityAuditBanner.alerts_count} active alert(s).
            </div>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setSecurityAuditBanner(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {liveDiscoveryBanner && (
          <div
            style={{
              margin: "16px 28px 0",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--status-success-bg)",
              border: "1px solid var(--status-success-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            <div>
              <strong style={{ color: "var(--status-success-text)" }}>
                Live Network Discovery Complete ({liveDiscoveryBanner.network}):
              </strong>{" "}
              Discovered {liveDiscoveryBanner.devices_discovered} active
              device(s) on your router ({networkInfo?.interface || "auto"}).
            </div>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setLiveDiscoveryBanner(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {simSeedBanner && (
          <div
            style={{
              margin: "16px 28px 0",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-surface)",
              border: "1px solid var(--border-focus)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            <div>
              <strong style={{ color: "var(--accent-text)" }}>
                Simulation Mode Ready (RFC 5737 • 192.0.2.0/24):
              </strong>{" "}
              {simSeedBanner.created_count} new device(s) created,{" "}
              {simSeedBanner.already_present_count} already active. Zero
              physical hardware touched.
            </div>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setSimSeedBanner(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <PageErrorBoundary>{renderPage()}</PageErrorBoundary>

        {terminalOpen && (
          <section
            style={{
              margin: "0 28px 24px",
              background: "#000000",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 14px",
                background: "#080808",
                borderBottom: "1px solid var(--border-subtle)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  &gt;_ NETOPS SYSADMIN NETWORK CONSOLE
                </span>
                <span style={{ color: "var(--text-dim)" }}>
                  {networkInfo?.interface || "wlp1s0"} • {networkInfo?.network || "auto"} • Canary TCP :{networkInfo?.canary_port || 8899}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="secondary-button small"
                  style={{ minHeight: "24px", padding: "0 8px", fontSize: "10px" }}
                  onClick={() =>
                    setTerminalLines([
                      {
                        ts: new Date().toLocaleTimeString(),
                        text: "Console cleared. Ready for network commands...",
                        tone: "dim",
                      },
                    ])
                  }
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="secondary-button small"
                  style={{ minHeight: "24px", padding: "0 8px", fontSize: "10px" }}
                  onClick={() => setTerminalOpen(false)}
                >
                  Minimize
                </button>
              </div>
            </div>
            <div
              style={{
                maxHeight: "210px",
                overflowY: "auto",
                padding: "12px 14px",
                fontSize: "12px",
                lineHeight: 1.65,
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              {terminalLines.map((line, idx) => {
                let color = "#d4d4d8";
                if (line.tone === "cmd") color = "#ffffff";
                else if (line.tone === "success") color = "#4ade80";
                else if (line.tone === "danger") color = "#f87171";
                else if (line.tone === "dim") color = "#71717a";
                else if (line.tone === "info") color = "#a1a1aa";
                return (
                  <div key={idx} style={{ color, wordBreak: "break-word" }}>
                    <span style={{ color: "#52525b", marginRight: "8px" }}>
                      [{line.ts}]
                    </span>
                    {line.text}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {newDeviceAlert && (
        <div className="new-device-alert">
          <div className="alert-top" />
          <div className="alert-body">
            <div className="alert-label">NEW DEVICE DETECTED</div>
            <div className="alert-title">Network device requires review</div>
            <div className="alert-message">
              {newDeviceAlert.message ||
                "A new device was discovered on the LAN."}
            </div>
            <button
              className="primary-button small"
              style={{ marginTop: "11px" }}
              onClick={() => {
                setDeviceFilter("pending");
                setActivePage("devices");
                setNewDeviceAlert(null);
              }}
            >
              Review Device
            </button>
          </div>
        </div>
      )}

      {renderAutomationResult()}
      {renderPatchModals()}
    </div>
  );
}

// ============================================================
// PRESENTATIONAL COMPONENTS
// ============================================================

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("NETOPS PAGE RENDER ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="panel" style={{ padding: "20px" }}>
            <div className="panel-title">NETOPS Page Error</div>
            <div className="panel-subtitle">
              The selected module encountered a rendering error.
            </div>
            <pre
              style={{
                marginTop: "16px",
                whiteSpace: "pre-wrap",
                color: "var(--status-danger-text)",
                background: "var(--bg-input)",
                padding: "16px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {this.state.error?.message || "Unknown React rendering error"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function NavItem({ icon, label, badge, badgeTone, active, onClick }) {
  return (
    <button
      className={active ? "nav-item active" : "nav-item"}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {badge !== undefined && badge !== null && (
        <span className={`nav-badge ${badgeTone || ""}`}>{badge}</span>
      )}
    </button>
  );
}

function getPageTitle(page) {
  const titles = {
    dashboard: "Network Operations Dashboard",
    devices: "Device Management & NAC",
    events: "Security & Network Audit Log",
    access: "Access Control & Quarantine",
    "endpoint-updates": "Endpoint Patch Management",
    vlans: "Cisco 802.1Q VLAN Automation",
    reports: "Compliance Reports & Export",
    settings: "Platform Settings & Integrations",
  };

  return titles[page] || "NETOPS";
}

function TypeBadge({ type }) {
  const normalized = type || "unknown";
  return (
    <span className={`type-badge ${normalized}`}>
      <DeviceTypeIcon type={normalized} size={12} />
      {normalized}
    </span>
  );
}

function StatusBadge({ value }) {
  const normalized = value || "unknown";
  return <span className={`status-badge ${normalized}`}>{normalized}</span>;
}

function EnforcementBadge({ value }) {
  const normalized = value || "unknown";
  return (
    <span className={`enforcement-badge ${normalized}`}>{normalized}</span>
  );
}

function ClassificationRow({ label, icon, type, value }) {
  return (
    <div className="classification-row">
      <div className="classification-name">
        <span className={`device-icon ${type}`}>{icon}</span>
        {label}
      </div>
      <div className="classification-value">{value}</div>
    </div>
  );
}

function FilterBar({ label, count, active, clear }) {
  return (
    <div className="device-filter-bar">
      <span>
        Showing: <strong>{label}</strong> <span>({count})</span>
      </span>
      {active && (
        <button className="clear-filter-button" onClick={clear}>
          Show All
        </button>
      )}
    </div>
  );
}

function AccessSummary({ title, value, text, onClick }) {
  return (
    <div
      className="access-summary-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{text} →</small>
    </div>
  );
}

function VLANCard({
  vlan,
  name,
  description,
  devices,
  selected,
  quarantine,
  onClick,
}) {
  return (
    <div
      className={[
        "vlan-card",
        selected ? "vlan-card-selected" : "",
        quarantine ? "quarantine" : "",
      ].join(" ")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="vlan-card-top">
        <div className="vlan-number">VLAN {vlan}</div>
        <div>VIEW →</div>
      </div>

      <div className="vlan-name">{name}</div>
      <div className="vlan-description">{description}</div>

      <div className="vlan-count">
        {devices.length} device{devices.length === 1 ? "" : "s"}
      </div>

      {devices.slice(0, 4).map((device) => (
        <div className="vlan-device" key={device.id}>
          <span>{device.hostname || "Unknown"}</span>
          <span className="mono">{device.ip_address || "—"}</span>
        </div>
      ))}

      <div className="vlan-card-action">Filter VLAN {vlan} devices →</div>
    </div>
  );
}

function PolicyRow({ vlan, name, description, count, quarantine }) {
  return (
    <div className="vlan-policy-row">
      <div className="vlan-policy-left">
        <div
          className="vlan-policy-number"
          style={
            quarantine
              ? {
                  background: "var(--status-danger-bg)",
                  borderColor: "var(--status-danger-border)",
                  color: "var(--status-danger-text)",
                }
              : undefined
          }
        >
          {vlan}
        </div>
        <div>
          <div className="vlan-policy-name">{name}</div>
          <div className="vlan-policy-description">{description}</div>
        </div>
      </div>
      <div className="vlan-policy-count">{count}</div>
    </div>
  );
}

function ReportCard({ title, value, description, onClick }) {
  return (
    <div
      className="report-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="report-card-title">{title}</div>
      <div className="report-card-value">{value}</div>
      <div className="report-card-description">{description}</div>
    </div>
  );
}

function EventRow({ event }) {
  const type = event.event_type || "event";
  let dotClass = "event-dot";

  if (
    type.includes("reject") ||
    type.includes("quarantine") ||
    type.includes("unrecognized")
  ) {
    dotClass += " warning";
  } else if (type.includes("approve") || type.includes("allow")) {
    dotClass += " success";
  }

  return (
    <div className="event-row">
      <span className={dotClass} />
      <div className="event-content">
        <div className="event-message">{event.message || type}</div>
        <div className="event-meta">
          <span>{type}</span>
          {event.device_id && <span>Device #{event.device_id}</span>}
          {event.created_at && <span>{event.created_at}</span>}
        </div>
      </div>
    </div>
  );
}

function AutomationField({ label, value }) {
  return (
    <div className="automation-field">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function PipelineStep({ number, title, status }) {
  return (
    <div className="pipeline-step">
      <div className="pipeline-number">{number}</div>
      <div className="pipeline-title-text">{title}</div>
      <div className="pipeline-status">{status}</div>
    </div>
  );
}

export default App;
