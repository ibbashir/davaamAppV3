/**
 * Turns one machine's stock, refill history and recent sales into plain
 * findings for the Health check tab. Pure functions, no fetching.
 *
 * Data quirks handled here (see the backend's machineVisit.js):
 * - A refill's quantity is the stock level after refilling, not what was added.
 * - Refill records can carry typos (e.g. 4875 for 75) and quick correction
 *   visits minutes apart, so typical values use medians and skip outliers.
 */
import moment from "moment-timezone";
import {
  expiresWithinDays,
  formatDate,
  formatMoney,
  formatNumber,
  formatQuantity,
  isExpired,
} from "./format";
import type {
  ProductStock,
  Refill,
  SeriesPoint,
  StockUnit,
  TransactionSummary,
  VisitTab,
} from "./types";

const DAY = 86400;

/** How far back the Health check looks at sales. */
export const HEALTH_WINDOW_DAYS = 60;
const TREND_DAYS = 30;
const MIN_DAYS_FOR_PACE = 0.5;
// With sales arriving at random, going 4 typical gaps without one happens ~2% of the time.
const NO_SALE_GAPS = 4;
const RUNS_OUT_SOON_DAYS = 3;
const TYPO_FACTOR = 10;
const PARTIAL_REFILL_SHARE = 0.7;
const SOLD_OUT_SHARE = 0.9;
// Shorter "visits" are corrections to the refill just before them.
const MIN_REFILL_GAP_DAYS = 0.5;
const RECENT_REFILLS = 10;
const BIG_CHANGE_PCT = 30;
const MIN_SALES_FOR_TREND = 10;
const MIN_SALES_FOR_PLAN = 10;
const PLAN_BUFFER = 1.25;
const DEFAULT_COVER_DAYS = 30;
// The pace since the last refill counts once the refill is this old; younger is too noisy.
const MIN_DAYS_FOR_RECENT_PACE = 3;

/** Stock left and how long it lasts at the pace since the last refill. The Stock tab uses this too. */
export function stockRunway(p: ProductStock, now = Date.now() / 1000) {
  const left = p.remaining === null ? null : Math.max(0, p.remaining);
  const daysSince = p.last_refill_at
    ? Math.max(MIN_DAYS_FOR_PACE, (now - p.last_refill_at) / DAY)
    : null;
  const perDay = daysSince && p.sold_since_refill > 0 ? p.sold_since_refill / daysSince : null;
  const daysLeft = perDay && left !== null ? Math.floor(left / perDay) : null;
  return { left, perDay, daysLeft };
}

export type LiveStatus = {
  state: "online" | "idle" | "offline" | "unknown";
  lastSeen: number | null;
};

export type Severity = "critical" | "warning" | "info" | "good";

export type Finding = {
  severity: Severity;
  title: string;
  detail?: string;
  action?: VisitTab;
};

export type PeriodTotals = { transactions: number; units: number; revenue: number };

export type ProductPlan = {
  brand_id: number;
  name: string;
  /** units sold in the health window */
  sold: number;
  share: number | null;
  /** planning pace: the faster of the window's pace and the pace since the last refill */
  perDay: number;
  left: number | null;
  daysLeft: number | null;
  empty: boolean;
  lastLoaded: number | null;
  /** the last refill's figure for this product looks like a typo */
  loadLooksWrong: boolean;
  /** most this product has been loaded to recently: a stand-in for row size */
  capacity: number | null;
  /** enough until the usual next refill, plus a buffer */
  needed: number | null;
  /** overflow: more is needed than this product has ever been loaded to */
  fit: "overflow" | "more" | "less" | "ok" | null;
};

export type RefillRow = {
  refilled_at: number;
  ends_at: number | null;
  loaded: number;
  sold: number;
  /** share of the stock sold before the next refill; null when the record looks wrong */
  shareSold: number | null;
};

export type Rhythm = {
  gapDays: number;
  avgShareSold: number | null;
  soldOut: number;
  counted: number;
  fullLoad: { name: string; days: number } | null;
  verdict: { tone: "late" | "early" | "fits"; text: string } | null;
  rows: RefillRow[];
};

export type HealthReport = {
  status: "good" | "watch" | "action";
  headline: string;
  findings: Finding[];
  recent: PeriodTotals | null;
  previous: PeriodTotals | null;
  revenueChange: number | null;
  salesChange: number | null;
  salesPerDay: number | null;
  lastSaleAt: number | null;
  weekly: { label: string; detail: string; value: number }[];
  runway: { daysLeft: number | null; product: string | null; empty: string[] };
  rhythm: Rhythm | null;
  plan: ProductPlan[];
  planReady: boolean;
  coverDays: number;
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

const median = (xs: number[]) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const totalsOf = (points: SeriesPoint[]): PeriodTotals => ({
  transactions: sum(points.map((p) => p.transactions)),
  units: sum(points.map((p) => p.units)),
  revenue: sum(points.map((p) => p.revenue)),
});

const pctChange = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null;

const listNames = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const round1 = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);

/** "17 days", "6 weeks", "4 months", "over a year" */
export const daysPhrase = (days: number) => {
  if (days < 1) return "less than a day";
  if (days < 31) {
    const d = Math.round(days);
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return "over a year";
};

/** "about 17 days", "more than a year" */
export const aboutDays = (days: number) =>
  days >= 365 ? "more than a year" : days < 1 ? "less than a day" : `about ${daysPhrase(days)}`;

/** "1.6 sales a day", "3 sales a week", "2 sales a month" */
export const ratePhrase = (perDay: number, one: string, many: string) => {
  const [n, per] =
    perDay >= 1 ? [perDay, "day"] : perDay * 7 >= 1 ? [perDay * 7, "week"] : [perDay * 30, "month"];
  const shown = round1(n);
  return `${formatNumber(shown)} ${shown === 1 ? one : many} a ${per}`;
};

const formatExpiry = (expiry: string) => moment(expiry, "YYYY-MM-DD").format("D MMM YYYY");

const gapDays = (r: Refill) => (r.ends_at === null ? null : (r.ends_at - r.refilled_at) / DAY);

/** Stock level per product after a refill. A later entry in the same visit replaces an earlier one. */
const refillLoads = (r: Refill) => {
  const loads = new Map<number, { name: string; qty: number }>();
  for (const it of r.items) loads.set(it.brand_id, { name: it.name, qty: Number(it.quantity) || 0 });
  return loads;
};

/** Products loaded to far more than the rest of the same refill: almost certainly a typo. */
const typoItems = (r: Refill) => {
  const loads = [...refillLoads(r).entries()];
  if (loads.length < 3) return [];
  const typical = median(loads.map(([, l]) => l.qty)) ?? 0;
  if (typical <= 0) return [];
  return loads
    .filter(([, l]) => l.qty > typical * TYPO_FACTOR)
    .map(([brand_id, l]) => ({ brand_id, name: l.name, qty: l.qty, typical }));
};

// ── Analysis ──────────────────────────────────────────────────────────────────

export function analyzeHealth(input: {
  products: ProductStock[];
  /** newest first, starting with the current refill; null when the backend can't provide them */
  refills: Refill[] | null;
  /** sales from windowFrom to now, grouped by day */
  summary: TransactionSummary | null;
  windowFrom: number;
  live: LiveStatus | null;
  unit: StockUnit;
  now?: number;
}): HealthReport {
  const { products, refills, summary, windowFrom, live, unit } = input;
  const now = input.now ?? Date.now() / 1000;
  const findings: Finding[] = [];
  const qty = (n: number) => formatQuantity(Math.round(n * 100) / 100, unit);

  // ── Sales: last 30 complete days against the 30 before ─────────────────────
  const series = summary?.series ?? [];
  const hasTrend = series.length >= TREND_DAYS * 2 + 1;
  const recent = hasTrend ? totalsOf(series.slice(-(TREND_DAYS + 1), -1)) : null;
  const previous = hasTrend
    ? totalsOf(series.slice(-(TREND_DAYS * 2 + 1), -(TREND_DAYS + 1)))
    : null;
  const revenueChange = recent && previous ? pctChange(recent.revenue, previous.revenue) : null;
  const salesChange =
    recent && previous ? pctChange(recent.transactions, previous.transactions) : null;
  const windowDays = Math.max(1, (now - windowFrom) / DAY);
  const salesInWindow = summary?.totals.transactions ?? 0;
  const salesPerDay = summary ? salesInWindow / windowDays : null;
  const lastSaleAt = summary?.totals.last_at ?? null;

  // Revenue per 7 days, newest week ending today
  const weekly: HealthReport["weekly"] = [];
  const weeks = Math.min(8, Math.floor(series.length / 7));
  for (let w = weeks - 1; w >= 0; w--) {
    const end = series.length - w * 7;
    const chunk = series.slice(end - 7, end);
    const first = moment(chunk[0].key, "YYYY-MM-DD");
    const last = moment(chunk[6].key, "YYYY-MM-DD");
    weekly.push({
      label: first.format("D MMM"),
      detail: `${first.format("D MMM")} – ${last.format("D MMM")}${w === 0 ? " (includes today)" : ""}`,
      value: sum(chunk.map((p) => p.revenue)),
    });
  }

  // ── Refill rhythm ──────────────────────────────────────────────────────────
  const realRefills = (refills ?? []).filter((r) => {
    const g = gapDays(r);
    return g === null || g >= MIN_REFILL_GAP_DAYS;
  });
  const completed = realRefills.filter((r) => r.ends_at !== null).slice(0, RECENT_REFILLS);
  const shareSold = (r: Refill) =>
    typoItems(r).length === 0 && r.total_loaded > 0
      ? Math.min(1, Math.max(0, r.sold.units / r.total_loaded))
      : null;
  const gap = median(completed.map((r) => gapDays(r)!));
  const coverDays = gap ?? DEFAULT_COVER_DAYS;

  // ── Per product: what sells against what's loaded ──────────────────────────
  const soldByBrand = new Map((summary?.products ?? []).map((p) => [p.brand_id, p.units]));
  const soldTotal = sum([...soldByBrand.values()]);
  const recentRefills = (refills ?? []).slice(0, RECENT_REFILLS + 1);
  const typosByRefill = new Map(recentRefills.map((r) => [r.refilled_at, typoItems(r)]));
  const capacityOf = (brandId: number) => {
    const loads = recentRefills.flatMap((r) => {
      const load = refillLoads(r).get(brandId);
      const isTypo = typosByRefill.get(r.refilled_at)?.some((t) => t.brand_id === brandId);
      return load && load.qty > 0 && !isTypo ? [load.qty] : [];
    });
    return loads.length ? Math.max(...loads) : null;
  };

  const latest = refills?.[0] ?? null;
  const latestTypos = latest ? typoItems(latest) : [];

  const planReady = summary !== null && soldTotal >= MIN_SALES_FOR_PLAN;
  const plan: ProductPlan[] = products.map((p) => {
    const { left, daysLeft } = stockRunway(p, now);
    const sold = soldByBrand.get(p.brand_id) ?? 0;
    const capacity = refills ? capacityOf(p.brand_id) : p.loaded;
    const loadLooksWrong = latestTypos.some((t) => t.brand_id === p.brand_id);
    // Plan for the faster pace: a 60-day average lags behind rising demand
    const sinceRefillDays = p.last_refill_at ? (now - p.last_refill_at) / DAY : 0;
    const recentPace =
      sinceRefillDays >= MIN_DAYS_FOR_RECENT_PACE && !loadLooksWrong
        ? p.sold_since_refill / sinceRefillDays
        : 0;
    const perDay = Math.max(sold / windowDays, recentPace);
    let needed: number | null = null;
    let fit: ProductPlan["fit"] = null;
    if (planReady && perDay > 0) {
      const raw = perDay * coverDays * PLAN_BUFFER;
      needed = unit === "L" ? Math.ceil(raw * 10) / 10 : Math.ceil(raw);
      // Judge against the real last load, not a typo
      const base = (loadLooksWrong ? capacity : p.loaded) ?? 0;
      fit =
        capacity && needed > capacity
          ? "overflow"
          : needed > base * 1.15
            ? "more"
            : needed < base * 0.5
              ? "less"
              : "ok";
    }
    return {
      brand_id: p.brand_id,
      name: p.name,
      sold,
      share: soldTotal > 0 ? sold / soldTotal : null,
      perDay,
      left,
      daysLeft,
      empty: left === 0 && p.loaded !== null,
      lastLoaded: p.loaded,
      loadLooksWrong,
      capacity,
      needed,
      fit,
    };
  });

  // How long a full load lasts: until the first product runs out at the recent pace
  const fullLoad =
    plan
      .filter((r) => r.capacity && r.perDay > 0)
      .map((r) => ({ name: r.name, days: r.capacity! / r.perDay }))
      .sort((a, b) => a.days - b.days)[0] ?? null;

  let rhythm: Rhythm | null = null;
  if (refills && completed.length >= 2 && gap !== null) {
    const shares = completed.map(shareSold).filter((s): s is number => s !== null);
    let verdict: Rhythm["verdict"] = null;
    if (fullLoad && salesInWindow > 0) {
      const g = daysPhrase(gap);
      const b = aboutDays(fullLoad.days);
      if (gap > fullLoad.days * 1.15) {
        verdict = {
          tone: "late",
          text: `At the current pace a full load of ${fullLoad.name} lasts only ${b}, but refills come every ~${g}, so it will run out before the next visit. Refill about every ${Math.max(1, Math.floor(fullLoad.days))} days, or give ${fullLoad.name} more space.`,
        };
      } else if (gap < fullLoad.days * 0.5) {
        verdict = {
          tone: "early",
          text: `Refilled every ~${g}, but at the current pace a full load lasts ${b} (${fullLoad.name} would run out first). Most stock is still in the machine at each visit, so refills could be less frequent.`,
        };
      } else {
        verdict = {
          tone: "fits",
          text: `Refill timing fits demand: refilled every ~${g}, and a full load lasts ${b} (${fullLoad.name} runs out first).`,
        };
      }
    }
    rhythm = {
      gapDays: gap,
      avgShareSold: shares.length ? sum(shares) / shares.length : null,
      soldOut: shares.filter((s) => s >= SOLD_OUT_SHARE).length,
      counted: shares.length,
      fullLoad,
      verdict,
      rows: realRefills.slice(0, 6).map((r) => ({
        refilled_at: r.refilled_at,
        ends_at: r.ends_at,
        loaded: r.total_loaded,
        sold: r.sold.units,
        shareSold: shareSold(r),
      })),
    };
  }

  // ── Findings ───────────────────────────────────────────────────────────────
  // A typo'd load says nothing about when that product runs out
  const trusted = plan.filter((r) => !r.loadLooksWrong);
  const empty = trusted.filter((r) => r.empty).map((r) => r.name);
  const anyStock = plan.some((r) => (r.left ?? 0) > 0);
  const checkMachine = "Check that the machine is powered on, online and dispensing.";
  const stockNote = !anyStock
    ? " Nothing is in stock, which would explain it."
    : empty.length
      ? ` ${listNames(empty)} ${empty.length === 1 ? "is" : "are"} empty, which may explain part of it, but other products are in stock. ${checkMachine}`
      : ` Stock is available, so ${checkMachine.charAt(0).toLowerCase()}${checkMachine.slice(1)}`;

  let offlineExplained = false;
  if (summary && salesInWindow === 0) {
    findings.push({
      severity: "critical",
      title: `No sales in the last ${HEALTH_WINDOW_DAYS} days`,
      detail: `Nothing has been sold since ${formatDate(windowFrom)}.${stockNote}`,
      action: "transactions",
    });
  } else if (lastSaleAt && salesPerDay) {
    const quietDays = (now - lastSaleAt) / DAY;
    if (quietDays >= Math.max(1, NO_SALE_GAPS / salesPerDay)) {
      // Offline since about the last sale explains the silence better than stock does
      const offlineSince = live?.state === "offline" ? live.lastSeen : null;
      const cause = offlineSince
        ? ` It has also been offline since ${formatDate(offlineSince)}${
            Math.abs(offlineSince - lastSaleAt) < DAY ? ", around the time of the last sale" : ""
          }, so it has most likely lost power or its connection.`
        : stockNote;
      findings.push({
        severity: "critical",
        title: `No sale for ${daysPhrase(quietDays)}`,
        detail: `The last sale was on ${formatDate(lastSaleAt)}. It normally makes about ${ratePhrase(salesPerDay, "sale", "sales")}, so a gap this long is unusual.${cause}`,
        action: "transactions",
      });
      if (offlineSince) offlineExplained = true;
    }
  }

  if (empty.length) {
    findings.push({
      severity: "critical",
      title: `${listNames(empty)} ${empty.length === 1 ? "is" : "are"} empty`,
      detail: `Customers can't buy ${empty.length === 1 ? "it" : "them"} until the next refill.`,
      action: "stock",
    });
  }

  const soon = trusted
    .filter((r) => !r.empty && r.daysLeft !== null && r.daysLeft <= RUNS_OUT_SOON_DAYS)
    .sort((a, b) => a.daysLeft! - b.daysLeft!);
  if (soon.length) {
    const days = soon[0].daysLeft!;
    findings.push({
      severity: "warning",
      title:
        soon.length === 1
          ? `${soon[0].name} runs out in ${aboutDays(days)}`
          : `${listNames(soon.map((r) => r.name))} run out within ${RUNS_OUT_SOON_DAYS} days`,
      detail: `At the pace since the last refill. Plan a refill by ${formatDate(now + days * DAY)}.`,
      action: "stock",
    });
  }

  if (live?.state === "offline" && !offlineExplained) {
    findings.push({
      severity: "warning",
      title: "Machine is offline",
      detail: live.lastSeen
        ? `It last checked in on ${formatDate(live.lastSeen)} (${moment.unix(live.lastSeen).fromNow()}).`
        : "It has never checked in.",
    });
  }

  for (const t of latestTypos) {
    findings.push({
      severity: "warning",
      title: `${t.name}'s stock figure looks wrong`,
      detail: `${qty(t.qty)} was recorded at the refill on ${formatDate(latest!.refilled_at)}, against about ${qty(t.typical)} for the other products. Probably a typing error, so its stock can't be trusted until it's corrected.`,
      action: "stock",
    });
  }

  if (latest && latestTypos.length === 0) {
    const usual = median(
      (refills ?? [])
        .slice(1, RECENT_REFILLS + 1)
        .filter((r) => typoItems(r).length === 0 && r.total_loaded > 0)
        .map((r) => r.total_loaded),
    );
    if (usual && (refills ?? []).length >= 3 && latest.total_loaded < usual * PARTIAL_REFILL_SHARE) {
      findings.push({
        severity: "warning",
        title: "Last refill was only partial",
        detail: `On ${formatDate(latest.refilled_at)} the machine was filled to ${qty(latest.total_loaded)}. Refills usually fill it to about ${qty(Math.round(usual))}.`,
        action: "stock",
      });
    }
  }

  const expired = products.filter((p) => isExpired(p.expiry_date));
  if (expired.length) {
    const dates = [...new Set(expired.map((p) => p.expiry_date!))].sort().map(formatExpiry);
    findings.push({
      severity: "warning",
      title:
        expired.length === products.length
          ? "Recorded expiry date has passed"
          : `Expiry date has passed for ${listNames(expired.map((p) => p.name))}`,
      detail: `The last refill recorded an expiry of ${listNames(dates)}. Check the stock, or correct the expiry date at the next refill.`,
      action: "stock",
    });
  }
  const expiring = products.filter((p) => expiresWithinDays(p.expiry_date, 30));
  if (expiring.length) {
    findings.push({
      severity: "info",
      title: `${listNames(expiring.map((p) => p.name))} ${expiring.length === 1 ? "expires" : "expire"} within 30 days`,
      detail: `Recorded expiry: ${listNames([...new Set(expiring.map((p) => formatExpiry(p.expiry_date!)))])}.`,
      action: "stock",
    });
  }

  if (recent && previous && salesChange !== null && previous.transactions >= MIN_SALES_FOR_TREND) {
    const detail = `${formatNumber(recent.transactions)} sales in the last 30 days, against ${formatNumber(previous.transactions)} in the 30 days before.`;
    if (salesChange <= -BIG_CHANGE_PCT) {
      findings.push({
        severity: "warning",
        title: `Sales down ${Math.abs(salesChange)}%`,
        detail: empty.length ? `${detail} Empty products may be part of the reason.` : detail,
        action: "sales",
      });
    } else if (salesChange >= BIG_CHANGE_PCT) {
      findings.push({ severity: "good", title: `Sales up ${salesChange}%`, detail, action: "sales" });
    }
  }

  if (rhythm?.verdict?.tone === "late") {
    findings.push({
      severity: "warning",
      title: `${rhythm.fullLoad!.name} will sell out before the next refill`,
      detail: rhythm.verdict.text,
    });
  } else if (rhythm?.verdict?.tone === "early") {
    findings.push({ severity: "info", title: "Refills could be less frequent", detail: rhythm.verdict.text });
  }

  const more = plan.filter((r) => r.fit === "more" || r.fit === "overflow").map((r) => r.name);
  const less = plan.filter((r) => r.fit === "less").map((r) => r.name);
  if (more.length && less.length) {
    findings.push({
      severity: "info",
      title: "Stock mix doesn't match what sells",
      detail: `${listNames(more)} ${more.length === 1 ? "needs" : "need"} more stock to last until the next refill, while ${listNames(less)} ${less.length === 1 ? "has" : "have"} far more than ${less.length === 1 ? "it sells" : "they sell"}. See the plan below.`,
    });
  }

  for (const p of products) {
    if (p.remaining !== null && p.remaining < 0 && !latestTypos.some((t) => t.brand_id === p.brand_id)) {
      findings.push({
        severity: "info",
        title: `More ${p.name} sold than was loaded`,
        detail: `${qty(p.sold_since_refill)} sold since the last refill, but only ${qty(p.loaded ?? 0)} was recorded. A refill may be missing from the records.`,
        action: "stock",
      });
    }
  }

  const ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  // ── Headline ───────────────────────────────────────────────────────────────
  const soonest =
    trusted
      .filter((r) => !r.empty && r.daysLeft !== null)
      .sort((a, b) => a.daysLeft! - b.daysLeft!)[0] ?? null;
  const parts: string[] = [];
  if (recent) {
    if (recent.transactions === 0) parts.push("No sales in the last 30 days.");
    else {
      const trend =
        salesChange === null || previous!.transactions < MIN_SALES_FOR_TREND
          ? ""
          : salesChange >= 5
            ? `, up ${salesChange}% on the 30 days before`
            : salesChange <= -5
              ? `, down ${Math.abs(salesChange)}% on the 30 days before`
              : ", about the same as the 30 days before";
      parts.push(
        `${formatNumber(recent.transactions)} sale${recent.transactions === 1 ? "" : "s"} (${formatMoney(recent.revenue)}) in the last 30 days${trend}.`,
      );
    }
  }
  if (empty.length) parts.push(`${listNames(empty)} ${empty.length === 1 ? "is" : "are"} empty.`);
  else if (soonest)
    parts.push(
      soonest.daysLeft! < 1
        ? `${soonest.name} runs out within a day.`
        : `Stock should last ${aboutDays(soonest.daysLeft!)} (${soonest.name} runs out first).`,
    );

  const status = findings.some((f) => f.severity === "critical")
    ? "action"
    : findings.some((f) => f.severity === "warning")
      ? "watch"
      : "good";

  return {
    status,
    headline: parts.join(" "),
    findings,
    recent,
    previous,
    revenueChange,
    salesChange,
    salesPerDay,
    lastSaleAt,
    weekly,
    runway: { daysLeft: soonest?.daysLeft ?? null, product: soonest?.name ?? null, empty },
    rhythm,
    plan,
    planReady,
    coverDays,
  };
}
