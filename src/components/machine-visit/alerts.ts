/**
 * Reads the faults a machine reported about itself (machine_diag_alerts) into
 * a current state per product row. Customer ratings arrive through the same
 * machine call but are not faults and never count here. Machines never report a fault clearing, so
 * a fault counts as cleared once that row sells again (the backend finds that
 * sale); until then it stays open.
 */
import type { DiagAlert, DiagAlertsResponse } from "./types";

// Repeats of the same fault this close together are one episode (a jam is
// often reported several times while someone keeps pressing).
const EPISODE_GAP_SECONDS = 15 * 60;
const RECENT_SECONDS = 7 * 24 * 60 * 60;

const KIND_LABELS: Record<string, string> = {
  jam: "Jam",
  dispense_fail: "Failed to dispense",
  overdispense: "Dispensed too many",
  arduino_fail: "Controller not responding",
  w5500_fail: "Network chip not responding",
  error: "Error",
};

/** Faults that stop the whole machine, not one row. */
const MACHINE_DOWN_KINDS = new Set(["arduino_fail", "w5500_fail"]);
export const isMachineDown = (kind: string) => MACHINE_DOWN_KINDS.has(kind);

/**
 * The fault an alert is. The machine sends type "error" for every fault and
 * says which one in info, so the backend reads it out as `kind`; a backend
 * without it leaves only the type to go on.
 */
export const alertKind = (a: Pick<DiagAlert, "kind" | "alert_type">) => a.kind ?? a.alert_type;

/** "Jam", "Failed to dispense", "Coin stuck" for a kind this page doesn't know */
export const alertKindLabel = (kind: string) =>
  KIND_LABELS[kind] ??
  kind
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

/** What the label doesn't already say: an overdispense's count, or an unknown error's text. */
export const alertDetail = (a: Pick<DiagAlert, "kind" | "alert_type" | "info" | "row_num" | "count">) => {
  const kind = alertKind(a);
  if (kind === "overdispense") return a.count ? `${a.count} for one request` : null;
  if (kind in KIND_LABELS && kind !== "error") return null;
  return a.row_num === null && a.info ? a.info : null;
};

export type Episode = {
  key: string;
  kind: string;
  label: string;
  detail: string | null;
  row_num: number | null;
  product_name: string | null;
  first_at: number;
  last_at: number;
  count: number;
  cleared_by_sale_at: number | null;
  mac: string | null;
  ip: string | null;
};

export type ScopeState = {
  key: string;
  row_num: number | null;
  brand_id: number | null;
  name: string;
  state: "open" | "cleared" | "ok";
  last: Episode | null;
  recentAlerts: number;
};

export type AlertsSummary = {
  status: "fault" | "recovered" | "clear" | "none";
  open: ScopeState[];
  scopes: ScopeState[];
  episodes: Episode[];
  byKind: { kind: string; label: string; count: number }[];
  lastAt: number | null;
  recentAlerts: number;
};

const scopeOf = (a: { row_num: number | null }) =>
  a.row_num === null ? "machine" : `row:${a.row_num}`;

export const scopeName = (row_num: number | null, product: string | null) =>
  row_num === null ? "Whole machine" : `Row ${row_num}${product ? ` · ${product}` : ""}`;

/** Collapse repeats of the same fault on the same row into episodes, newest first. */
export function groupEpisodes(alerts: DiagAlert[]): Episode[] {
  const ascending = [...alerts].sort((a, b) => a.epoch_time - b.epoch_time || a.id - b.id);
  const open = new Map<string, Episode>();
  const episodes: Episode[] = [];
  for (const a of ascending) {
    const kind = alertKind(a);
    const key = `${scopeOf(a)}|${kind}|${alertDetail(a) ?? ""}`;
    const current = open.get(key);
    if (current && a.epoch_time - current.last_at <= EPISODE_GAP_SECONDS) {
      current.last_at = a.epoch_time;
      current.count += 1;
      current.cleared_by_sale_at = a.cleared_by_sale_at;
      current.mac = a.mac;
      current.ip = a.ip;
      continue;
    }
    const episode: Episode = {
      key: `${key}|${a.id}`,
      kind,
      label: alertKindLabel(kind),
      detail: alertDetail(a),
      row_num: a.row_num,
      product_name: a.product_name,
      first_at: a.epoch_time,
      last_at: a.epoch_time,
      count: 1,
      cleared_by_sale_at: a.cleared_by_sale_at,
      mac: a.mac,
      ip: a.ip,
    };
    open.set(key, episode);
    episodes.push(episode);
  }
  return episodes.sort((a, b) => b.last_at - a.last_at);
}

export function summarizeAlerts(data: DiagAlertsResponse, now = Date.now() / 1000): AlertsSummary {
  // Ratings are never faults; a backend that predates them sends them in the list
  const alerts = data.alerts.filter((a) => a.alert_type !== "feedback");
  const episodes = groupEpisodes(alerts);
  const recentCutoff = now - RECENT_SECONDS;

  // Every product row gets a card, faulty or not; rows or a whole-machine
  // scope that only appear in alerts are added after them.
  const scopes = new Map<string, ScopeState>();
  for (const r of data.rows) {
    scopes.set(`row:${r.row_num}`, {
      key: `row:${r.row_num}`,
      row_num: r.row_num,
      brand_id: r.brand_id,
      name: scopeName(r.row_num, r.name),
      state: "ok",
      last: null,
      recentAlerts: 0,
    });
  }
  for (const a of alerts) {
    const key = scopeOf(a);
    if (!scopes.has(key)) {
      scopes.set(key, {
        key,
        row_num: a.row_num,
        brand_id: a.brand_id,
        name: scopeName(a.row_num, a.product_name),
        state: "ok",
        last: null,
        recentAlerts: 0,
      });
    }
    if (a.epoch_time >= recentCutoff) scopes.get(key)!.recentAlerts += 1;
  }
  // Episodes are newest first, so the first one seen per scope is its latest
  for (const e of episodes) {
    const scope = scopes.get(scopeOf(e))!;
    if (scope.last) continue;
    scope.last = e;
    scope.state = e.cleared_by_sale_at === null ? "open" : "cleared";
  }

  const list = [...scopes.values()].sort(
    (a, b) => (a.row_num ?? Number.MAX_SAFE_INTEGER) - (b.row_num ?? Number.MAX_SAFE_INTEGER),
  );
  const open = list.filter((s) => s.state === "open");
  const recentAlerts = alerts.filter((a) => a.epoch_time >= recentCutoff).length;

  const counts = new Map<string, number>();
  for (const a of alerts) counts.set(alertKind(a), (counts.get(alertKind(a)) ?? 0) + 1);

  return {
    status: open.length
      ? "fault"
      : recentAlerts
        ? "recovered"
        : alerts.length
          ? "clear"
          : "none",
    open,
    scopes: list,
    episodes,
    byKind: [...counts.entries()]
      .map(([kind, count]) => ({ kind, label: alertKindLabel(kind), count }))
      .sort((a, b) => b.count - a.count),
    lastAt: alerts[0]?.epoch_time ?? null,
    recentAlerts,
  };
}
