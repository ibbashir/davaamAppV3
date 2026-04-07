/**
 * Formats elapsed time between two ISO timestamps (or start → now) as HH:MM:SS.
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
 * Formats an ISO date string to a locale-aware date+time string.
 */
export const formatDateTime = (iso: string): string =>
  iso ? new Date(iso).toLocaleString() : "N/A";

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