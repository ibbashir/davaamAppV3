// ── Machine Alert System API types ────────────────────────────────────────────

export type AlertOverview = {
  totalMachines: number;
  activeMachines: number;
  inactiveMachines: number;
  ongoingSessions: number;
  alertsToday: number;
  emailsSentToday: number;
  emailsFailedToday: number;
  downtimeTodaySeconds: number;
};

export type OverviewResponse = {
  success: boolean;
  data: AlertOverview;
};

export type MachineAlert = {
  id: number;
  session_id: number;
  machine_code: string;
  machine_name: string | null;
  machine_location: string | null;
  alert_type: string;
  message: string | null;
  inactive_duration_seconds: number | null;
  triggered_at: number;
  email_status: "pending" | "sent" | "partial" | "failed";
  emails_total: number;
  emails_sent: number;
  created_at: number;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AlertsResponse = {
  success: boolean;
  data: MachineAlert[];
  pagination: Pagination;
};

export type InactiveMachine = {
  machine_code: string;
  machine_name: string | null;
  machine_location: string | null;
  machine_type: string | null;
  city: string | null;
  last_updated: number;
  inactive_since: number;
  inactive_for_seconds: number;
  session_id: number | null;
  alert_sent: boolean;
  alert_sent_at: number | null;
};

export type InactiveMachinesResponse = {
  success: boolean;
  data: InactiveMachine[];
  total: number;
};

export type TopInactiveMachine = {
  machine_code: string;
  machine_name: string | null;
  machine_location: string | null;
  sessions: number;
  downtime_seconds: number;
  ongoing: boolean;
};

export type DailyPoint = {
  date: string;
  downtime_seconds: number;
  alerts: number;
  emails_sent: number;
  emails_failed: number;
};

export type AnalyticsResponse = {
  success: boolean;
  data: {
    range: { from: number; to: number };
    totals: {
      sessions: number;
      alerts: number;
      emailsSent: number;
      emailsFailed: number;
      downtimeSeconds: number;
    };
    topInactiveMachines: TopInactiveMachine[];
    daily: DailyPoint[];
  };
};

// ── 24-hour report (mirrors the daily report email) ───────────────────────────

export type ReportInactiveMachine = {
  machineCode: string;
  machineName: string | null;
  machineLocation: string | null;
  inactiveSince: number;
  durationSeconds: number;
};

export type ReportResolvedSession = {
  machineCode: string;
  machineName: string | null;
  machineLocation: string | null;
  inactiveSince: number;
  resolvedAt: number;
  durationSeconds: number;
};

export type ReportRecipient = {
  recipient: string;
  status: "sent" | "failed";
  error: string | null;
  sent_at: number;
};

export type DailyReport = {
  windowStart: number;
  windowEnd: number;
  totals: {
    monitored: number;
    currentlyInactive: number;
    resolvedOutages: number;
    downtimeSeconds: number;
  };
  inactiveMachines: ReportInactiveMachine[];
  resolvedSessions: ReportResolvedSession[];
  lastReport: {
    triggered_at: number;
    email_status: "pending" | "sent" | "partial" | "failed";
    emails_sent: number;
    emails_total: number;
    recipients: ReportRecipient[];
  } | null;
};

export type DailyReportResponse = {
  success: boolean;
  data: DailyReport;
};

export type EmailLog = {
  id: number;
  alert_id: number;
  machine_code: string;
  recipient: string;
  subject: string | null;
  status: "sent" | "failed";
  message_id: string | null;
  error: string | null;
  sent_at: number;
  created_at: number;
};

export type EmailLogsResponse = {
  success: boolean;
  data: EmailLog[];
  pagination: Pagination;
};

export type InactivitySession = {
  id: number;
  machine_code: string;
  last_seen_at: number | null;
  inactive_since: number;
  detected_at: number;
  resolved_at: number | null;
  duration_seconds: number | null;
  status: "ongoing" | "resolved";
  alert_sent: boolean;
  alert_sent_at: number | null;
  created_at: number;
  effective_duration_seconds: number;
};

export type MachineDetailResponse = {
  success: boolean;
  data: {
    machine: {
      machine_code: string;
      machine_name?: string | null;
      machine_location?: string | null;
      machine_type?: string | null;
      city?: string | null;
    };
    current_status: "active" | "inactive";
    last_updated: number | null;
    totals: {
      sessions: number;
      alerts: number;
      downtimeSeconds: number;
    };
    sessions: InactivitySession[];
    alerts: MachineAlert[];
  };
};

// ── Shared formatting helpers ─────────────────────────────────────────────────

export function formatEpoch(epoch: number | null | undefined): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0m";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Converts rows to CSV and triggers a browser download. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
