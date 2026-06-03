/** Pakistan Standard Time — used for all displayed dates throughout the dashboard. */
const PKT = "Asia/Karachi";

const pktDateFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: PKT,
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const pktDateTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: PKT,
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const pktTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: PKT,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Formats an ISO string or epoch ms to "DD Mon YYYY, HH:MM:SS" in PKT.
 * Falls back to "N/A" for falsy input.
 */
export const formatDateTime = (value: string | number | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return pktDateTimeFormatter.format(date);
};

/**
 * Formats an ISO string or epoch ms to "DD Mon YYYY" in PKT.
 */
export const formatDate = (value: string | number | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return pktDateFormatter.format(date);
};

/**
 * Formats an ISO string or epoch ms to "HH:MM:SS" in PKT.
 */
export const formatTime = (value: string | number | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return pktTimeFormatter.format(date);
};

/**
 * Converts a Unix epoch timestamp (seconds) to "DD Mon YYYY HH:MM:SS" in PKT.
 * Drop-in replacement for the legacy `timeConverter` in Constant.ts.
 */
export const formatUnixTimestamp = (unix: number): string => {
  if (!unix) return "N/A";
  return formatDateTime(unix * 1000);
};

/**
 * Formats elapsed time between two ISO timestamps (or start → now) as HH:MM:SS.
 * Platform-agnostic — no timezone needed since this is a duration, not a wall clock.
 */
export const formatDuration = (startTime: string, endTime?: string): string => {
  if (!startTime) return "N/A";
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const elapsed = Math.floor((end - start) / 1000);
  if (elapsed < 0) return "N/A";
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

/**
 * Returns true only when both lat/lng parse to non-zero finite numbers.
 */
export const isValidCoord = (lat: string, lng: string): boolean => {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  return !isNaN(la) && !isNaN(ln) && !(la === 0 && ln === 0);
};

/**
 * Formats a distance string; returns "—" for zero/falsy values.
 */
export const formatDistance = (km: string): string => {
  const value = parseFloat(km);
  return value > 0 ? `${value.toFixed(2)} km` : "—";
};

/**
 * Formats a number as Pakistani Rupees: "₨ 1,234.56"
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount);
  if (isNaN(num)) return "₨ 0";
  return `₨ ${num.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Returns a relative time string in PKT context: "2 hours ago", "just now", etc.
 */
export const formatRelativeTime = (value: string | number | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(value);
};
