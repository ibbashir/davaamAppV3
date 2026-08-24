import { BASE_URL } from "@/constants/Constant";
import { getRequest, postRequest, putRequest, deleteRequest } from "@/Apis/Api";
import type { HrListResponse, HrItemResponse, HrRow } from "@/Types/hr";

export const HR = `${BASE_URL}/hr`;
export const ESS = `${BASE_URL}/ess`;

/** Serialises a filter object into a query string, dropping empty values. */
export function qs(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    search.append(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
}

export const hrList = <T = HrRow>(path: string, params?: Record<string, unknown>) =>
  getRequest<HrListResponse<T>>(`${HR}${path}${qs(params)}`);

export const hrGet = <T>(path: string, params?: Record<string, unknown>) =>
  getRequest<T>(`${HR}${path}${qs(params)}`);

export const hrCreate = <T = HrRow>(path: string, body: object) =>
  postRequest<HrItemResponse<T>>(`${HR}${path}`, body);

export const hrUpdate = <T = HrRow>(path: string, id: number | string, body: object) =>
  putRequest<HrItemResponse<T>>(`${HR}${path}/${id}`, body);

/**
 * `force` asks the server to delete the record along with everything that
 * references it. Without it a record that still has history is archived rather
 * than deleted, and the response says so.
 */
export const hrDelete = (path: string, id: number | string, force = false) =>
  deleteRequest<{ statusCode: number; message: string; archived?: boolean }>(
    `${HR}${path}/${id}${force ? "?force=true" : ""}`,
  );

export const hrAction = <T = unknown>(path: string, body: object = {}) =>
  postRequest<T>(`${HR}${path}`, body);

export const essGet = <T>(path: string, params?: Record<string, unknown>) =>
  getRequest<T>(`${ESS}${path}${qs(params)}`);

export const essPost = <T>(path: string, body: object = {}) =>
  postRequest<T>(`${ESS}${path}`, body);

/**
 * Accounts that must never be rendered in an HR list.
 *
 * The server already filters these out — this is a second line of defence for
 * the screens that reach an endpoint the filter has not been applied to yet, so
 * one missed query does not put them back on screen. Keep in step with
 * backend/src/controllers/DavaamDashboard/Hr/hiddenEmployees.js.
 */
const HIDDEN_EMPLOYEE_EMAILS = [
  "ifraaslamhr@davaam.pk",
  "hassanharoon321@gmail.com",
  "salman@davaam.pk",
  "ifrahaslam@davaam.pk",
  "hassan.haroon@davaam.pk",
]

/**
 * Drops rows belonging to a hidden account, whether the address sits on the row
 * itself (an employee list) or on a nested `employee` (attendance, leave,
 * payslips…). Rows with no email are always kept — most records carry none, and
 * dropping them would empty half the screens this guards.
 */
export function stripHiddenEmployees<T>(rows: T[]): T[] {
  const hidden = (value: unknown): boolean =>
    typeof value === "string" && HIDDEN_EMPLOYEE_EMAILS.includes(value.trim().toLowerCase())

  return (rows ?? []).filter((row) => {
    if (!row || typeof row !== "object") return true
    const r = row as Record<string, unknown>
    const nested = r.employee as Record<string, unknown> | undefined
    return !hidden(r.email) && !hidden(nested?.email)
  })
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/** "notice_period" → "Notice Period" */
export const humanise = (value: unknown): string =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatDate = (value: unknown): string => {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (value: unknown): string => {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Punch times read in Pakistan time, not the viewer's. Lateness is judged
 * against a 09:30 PKT cut-off, so a browser somewhere else must not show an
 * on-time arrival as 04:45 or a late one as on time.
 */
export const formatTime = (value: unknown): string => {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });
};

export const formatMoney = (value: unknown): string => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
};

export const formatMinutes = (value: unknown): string => {
  const mins = Number(value ?? 0);
  if (!mins || Number.isNaN(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

/** Tailwind classes per status token — one palette across every HR module. */
const STATUS_CLASSES: Record<string, string> = {
  // positive / done
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  hired: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cleared: "bg-emerald-100 text-emerald-700 border-emerald-200",
  achieved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reimbursed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  settled: "bg-emerald-100 text-emerald-700 border-emerald-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  returned: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fulfilled: "bg-emerald-100 text-emerald-700 border-emerald-200",
  // waiting
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  probation: "bg-amber-100 text-amber-700 border-amber-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  screening: "bg-amber-100 text-amber-700 border-amber-200",
  scheduled: "bg-amber-100 text-amber-700 border-amber-200",
  half_day: "bg-amber-100 text-amber-700 border-amber-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  on_hold: "bg-amber-100 text-amber-700 border-amber-200",
  in_clearance: "bg-amber-100 text-amber-700 border-amber-200",
  notice_period: "bg-amber-100 text-amber-700 border-amber-200",
  not_started: "bg-amber-100 text-amber-700 border-amber-200",
  // negative
  rejected: "bg-red-100 text-red-700 border-red-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  separated: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  missed: "bg-red-100 text-red-700 border-red-200",
  lost: "bg-red-100 text-red-700 border-red-200",
  damaged: "bg-red-100 text-red-700 border-red-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
  // informational
  open: "bg-teal-100 text-teal-700 border-teal-200",
  applied: "bg-teal-100 text-teal-700 border-teal-200",
  assigned: "bg-teal-100 text-teal-700 border-teal-200",
  enrolled: "bg-teal-100 text-teal-700 border-teal-200",
  interview: "bg-blue-100 text-blue-700 border-blue-200",
  offer: "bg-violet-100 text-violet-700 border-violet-200",
  on_leave: "bg-blue-100 text-blue-700 border-blue-200",
  holiday: "bg-slate-100 text-slate-600 border-slate-200",
  week_off: "bg-slate-100 text-slate-600 border-slate-200",
  issued: "bg-teal-100 text-teal-700 border-teal-200",
  sent: "bg-teal-100 text-teal-700 border-teal-200",
};

export const statusClass = (status: unknown): string =>
  STATUS_CLASSES[String(status ?? "").toLowerCase()] ??
  "bg-slate-100 text-slate-600 border-slate-200";

/** Pulls a readable message out of an axios error. */
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
  return anyErr?.response?.data?.message || anyErr?.message || fallback;
}

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const monthStartISO = (): string => `${todayISO().slice(0, 7)}-01`;
