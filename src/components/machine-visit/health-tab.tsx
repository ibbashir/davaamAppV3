import { useEffect, useMemo, useState, type ReactNode } from "react";
import moment from "moment-timezone";
import {
  ArrowRight,
  Banknote,
  CircleCheck,
  Clock,
  Info,
  Minus,
  OctagonAlert,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { getRequest, postRequest } from "@/Apis/Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  aboutDays,
  analyzeHealth,
  daysPhrase,
  HEALTH_WINDOW_DAYS,
  type Finding,
  type HealthReport,
  type LiveStatus,
  type ProductPlan,
  type Rhythm,
  type Severity,
} from "./analysis";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatNumber,
  formatQuantity,
  formatRelative,
  TIMEZONE,
} from "./format";
import { ColumnChartCard, EmptyState, InlineBar, StatTile, UnavailableNote } from "./parts";
import type { ProductStock, Refill, StockUnit, TransactionSummary, VisitTab } from "./types";

type MachineListResponse = {
  data?: {
    machines?: Record<string, { machine_code: string; statusCode?: string; lastUpdated?: number | null }[]>;
  };
};

const STATUS_STYLE: Record<
  HealthReport["status"],
  { label: string; icon: typeof CircleCheck; card: string; badge: string }
> = {
  good: {
    label: "Running well",
    icon: CircleCheck,
    card: "border-teal-200 bg-teal-50/60",
    badge: "bg-teal-600 text-white",
  },
  watch: {
    label: "Keep an eye on it",
    icon: TriangleAlert,
    card: "border-amber-200 bg-amber-50/60",
    badge: "bg-amber-500 text-white",
  },
  action: {
    label: "Needs action",
    icon: OctagonAlert,
    card: "border-red-200 bg-red-50/60",
    badge: "bg-red-600 text-white",
  },
};

const SEVERITY_STYLE: Record<Severity, { label: string; icon: typeof Info; tone: string }> = {
  critical: { label: "Act now", icon: OctagonAlert, tone: "text-red-600" },
  warning: { label: "Check soon", icon: TriangleAlert, tone: "text-amber-600" },
  info: { label: "Worth knowing", icon: Info, tone: "text-sky-600" },
  good: { label: "Going well", icon: TrendingUp, tone: "text-teal-600" },
};

const TAB_ACTION: Partial<Record<VisitTab, string>> = {
  stock: "View stock",
  sales: "View sales",
  transactions: "View transactions",
};

const LIVE_STYLE: Record<LiveStatus["state"], { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-green-500" },
  idle: { label: "Idle", dot: "bg-amber-500" },
  offline: { label: "Offline", dot: "bg-red-500" },
  unknown: { label: "Never checked in", dot: "bg-slate-400" },
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function LivePill({ live }: { live: LiveStatus }) {
  const s = LIVE_STYLE[live.state];
  return (
    <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm">
      <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
      <span className="font-medium text-slate-900">{s.label}</span>
      {live.lastSeen && (
        <span className="text-slate-500" title={formatDateTime(live.lastSeen)}>
          · checked in {formatRelative(live.lastSeen)}
        </span>
      )}
    </div>
  );
}

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return <span>Nothing to compare with in the 30 days before</span>;
  const Icon = pct >= 5 ? TrendingUp : pct <= -5 ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        pct >= 5 ? "text-teal-700" : pct <= -5 ? "text-red-600" : "text-slate-500",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {pct > 0 ? "+" : ""}
      {pct}% vs the 30 days before
    </span>
  );
}

function FindingRow({ finding, onOpenTab }: { finding: Finding; onOpenTab: (tab: VisitTab) => void }) {
  const s = SEVERITY_STYLE[finding.severity];
  const Icon = s.icon;
  const action = finding.action && TAB_ACTION[finding.action];
  return (
    <li className="flex flex-wrap gap-x-3 gap-y-2 py-3 sm:flex-nowrap">
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.tone)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-slate-900">{finding.title}</span>
          <span className={cn("text-xs font-medium", s.tone)}>{s.label}</span>
        </div>
        {finding.detail && <p className="mt-0.5 text-sm text-slate-600">{finding.detail}</p>}
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-8 shrink-0 text-teal-700 sm:ml-0"
          onClick={() => onOpenTab(finding.action!)}
        >
          {action} <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

const VERDICT_TONE = {
  late: "bg-amber-50 text-amber-900",
  early: "bg-sky-50 text-sky-900",
  fits: "bg-teal-50 text-teal-900",
};

function RhythmCard({ rhythm, unit }: { rhythm: Rhythm | null; unit: StockUnit }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">Refill rhythm</CardTitle>
        <CardDescription>How much of the stock sells between visits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!rhythm ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Needs at least two finished refill periods to judge.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniStat label="Refilled every" value={`~${daysPhrase(rhythm.gapDays)}`} hint="typical gap" />
              <MiniStat
                label="Sold before next refill"
                value={rhythm.avgShareSold === null ? "—" : `${Math.round(rhythm.avgShareSold * 100)}%`}
                hint="of the stock, on average"
              />
              <MiniStat
                label="Ran nearly empty"
                value={`${rhythm.soldOut} of ${rhythm.counted}`}
                hint="recent refills"
              />
            </div>
            {rhythm.verdict && (
              <p className={cn("rounded-lg p-3 text-sm", VERDICT_TONE[rhythm.verdict.tone])}>
                {rhythm.verdict.text}
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refilled</TableHead>
                  <TableHead>Lasted</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="w-36">Share of stock sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rhythm.rows.map((r) => (
                  <TableRow key={r.refilled_at}>
                    <TableCell className="whitespace-nowrap" title={formatDateTime(r.refilled_at)}>
                      {formatDate(r.refilled_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.ends_at ? (
                        formatDuration(r.refilled_at, r.ends_at)
                      ) : (
                        <Badge variant="outline" className="border-teal-300 text-teal-700">
                          Current · {formatDuration(r.refilled_at, Date.now() / 1000)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatQuantity(r.sold, unit)}
                      <span className="text-slate-400"> / {formatNumber(r.loaded)}</span>
                    </TableCell>
                    <TableCell>
                      {r.shareSold === null ? (
                        <span className="text-xs text-slate-500" title="A product's figure at this refill looks like a typo">
                          Record looks wrong
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <InlineBar value={r.shareSold} max={1} />
                          <span className="w-9 text-right text-xs tabular-nums text-slate-600">
                            {Math.round(r.shareSold * 100)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const FIT_STYLE: Record<NonNullable<ProductPlan["fit"]>, { label: string; className: string }> = {
  overflow: { label: "More than a full row", className: "border-red-300 bg-red-50 text-red-700" },
  more: { label: "Load more", className: "border-amber-300 bg-amber-50 text-amber-800" },
  less: { label: "More than needed", className: "border-slate-300 bg-slate-50 text-slate-700" },
  ok: { label: "About right", className: "border-teal-300 bg-teal-50 text-teal-800" },
};

function runsOut(p: ProductPlan) {
  if (p.loadLooksWrong) return <span className="text-slate-400">—</span>;
  if (p.empty) return <span className="font-medium text-red-600">Empty now</span>;
  if (p.daysLeft === null) return <span className="text-slate-400">No sales since refill</span>;
  return <span className={cn(p.daysLeft <= 3 && "font-medium text-amber-700")}>{capitalize(aboutDays(p.daysLeft))}</span>;
}

function PlanCard({ report, unit }: { report: HealthReport; unit: StockUnit }) {
  const { plan, planReady, coverDays } = report;
  const maxShare = Math.max(0, ...plan.map((p) => p.share ?? 0));
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">What sells, and what to load</CardTitle>
        <CardDescription>
          Each product's share of sales in the last {HEALTH_WINDOW_DAYS} days, against what's in the machine.{" "}
          {planReady
            ? `"Needed" is enough to last ${daysPhrase(coverDays)} (the usual time between refills) at the current pace, plus 25% spare.`
            : `Too few sales in the last ${HEALTH_WINDOW_DAYS} days to plan loads.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Product</TableHead>
              <TableHead className="min-w-44">Share of sales</TableHead>
              <TableHead className="text-right">Left now</TableHead>
              <TableHead>Runs out</TableHead>
              <TableHead className="text-right">Last loaded</TableHead>
              <TableHead className="text-right">Needed</TableHead>
              <TableHead className="pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.map((p) => (
              <TableRow key={p.brand_id}>
                <TableCell className="pl-6 font-medium whitespace-normal text-slate-900">{p.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <InlineBar value={p.share ?? 0} max={maxShare} />
                    <span className="w-24 shrink-0 text-xs tabular-nums text-slate-600">
                      {p.share === null ? "—" : `${Math.round(p.share * 100)}% · ${formatNumber(p.sold)} sold`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.loadLooksWrong ? "—" : formatQuantity(p.left, unit)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{runsOut(p)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.loadLooksWrong ? (
                    <span className="text-red-600" title="Far more than the other products: probably a typo">
                      {formatNumber(p.lastLoaded)} ?
                    </span>
                  ) : (
                    formatQuantity(p.lastLoaded, unit)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.needed === null ? (
                    <span className="text-slate-400" title={planReady ? "No sales in this period" : undefined}>
                      —
                    </span>
                  ) : (
                    formatQuantity(p.needed, unit)
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  {p.fit && (
                    <Badge variant="outline" className={FIT_STYLE[p.fit].className}>
                      {FIT_STYLE[p.fit].label}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * One-screen read of a machine: is it selling, is it stocked, is it refilled at
 * the right pace, and what needs doing. Built from the same stock, refill and
 * sales data as the other tabs.
 */
export function HealthTab({
  apiBase,
  machineCode,
  products,
  refills,
  unit,
  stockLoading,
  onOpenTab,
}: {
  apiBase: string;
  machineCode: string;
  products: ProductStock[];
  refills: Refill[] | null;
  unit: StockUnit;
  stockLoading: boolean;
  onOpenTab: (tab: VisitTab) => void;
}) {
  const windowFrom = useMemo(
    () => moment().tz(TIMEZONE).subtract(HEALTH_WINDOW_DAYS, "days").startOf("day").unix(),
    // A new machine gets a fresh window
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [machineCode],
  );
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [summaryState, setSummaryState] = useState<"loading" | "ready" | "unavailable" | "failed">(
    "loading",
  );
  const [live, setLive] = useState<LiveStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummaryState("loading");
    postRequest<TransactionSummary>(`${apiBase}/machineTransactionSummary`, {
      machine_code: machineCode,
      from: windowFrom,
      groupBy: "day",
    })
      .then((res) => {
        if (cancelled) return;
        setSummary(res);
        setSummaryState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setSummaryState(err?.response?.status === 404 ? "unavailable" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode, windowFrom]);

  // Live online status, from the same list the Machines page uses
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ search: machineCode, page: "1", limit: "10" });
    getRequest<MachineListResponse>(`${apiBase}/getAllMachineStockAndStatus?${params}`)
      .then((res) => {
        if (cancelled) return;
        const m = Object.values(res.data?.machines ?? {})
          .flat()
          .find((x) => String(x.machine_code) === machineCode);
        if (!m) return setLive(null);
        const state =
          m.statusCode === "g"
            ? "online"
            : m.statusCode === "a"
              ? "idle"
              : m.statusCode === "r"
                ? "offline"
                : "unknown";
        setLive({ state, lastSeen: m.lastUpdated ?? null });
      })
      .catch(() => !cancelled && setLive(null));
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode]);

  const ready = !stockLoading && summaryState !== "loading";
  const report = useMemo(
    () =>
      ready
        ? analyzeHealth({ products, refills, summary: summaryState === "ready" ? summary : null, windowFrom, live, unit })
        : null,
    [ready, products, refills, summary, summaryState, windowFrom, live, unit],
  );

  if (!report) {
    return <div className="py-12 text-center text-sm text-slate-500">Checking this machine…</div>;
  }

  const status = STATUS_STYLE[report.status];
  const StatusIcon = status.icon;
  const { recent, runway } = report;
  const salesKnown = summaryState === "ready";

  return (
    <div className="space-y-6">
      <Card className={cn("rounded-2xl shadow-sm", status.card)}>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div
              className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", status.badge)}
            >
              <StatusIcon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{status.label}</h2>
              <p className="mt-0.5 max-w-3xl text-sm text-slate-700">
                {report.headline || "Not enough data yet to judge this machine."}
              </p>
            </div>
          </div>
          {live && <LivePill live={live} />}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-slate-900">What needs attention</CardTitle>
          <CardDescription>
            Checked against this machine's own stock, refills and last {HEALTH_WINDOW_DAYS} days of sales.
            {!salesKnown && " Sales couldn't be loaded, so only stock and refills were checked."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.findings.length === 0 ? (
            <p className="flex items-center gap-2 py-3 text-sm text-teal-700">
              <CircleCheck className="h-5 w-5" aria-hidden /> Nothing needs attention right now.
            </p>
          ) : (
            <ul className="divide-y">
              {report.findings.map((f, i) => (
                <FindingRow key={`${f.severity}-${i}`} finding={f} onOpenTab={onOpenTab} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Banknote className="h-4 w-4" />}
          label="Revenue, last 30 days"
          value={recent ? formatMoney(recent.revenue) : "—"}
          hint={recent ? <Change pct={report.revenueChange} /> : undefined}
        />
        <StatTile
          icon={<Receipt className="h-4 w-4" />}
          label="Sales per day"
          value={recent ? formatNumber(Math.round((recent.transactions / 30) * 10) / 10) : "—"}
          hint={recent ? <Change pct={report.salesChange} /> : undefined}
        />
        <StatTile
          icon={<Package className="h-4 w-4" />}
          label="Stock lasts"
          tone={runway.empty.length ? "critical" : runway.daysLeft !== null && runway.daysLeft <= 3 ? "warning" : "default"}
          value={
            runway.empty.length
              ? "Empty now"
              : runway.daysLeft !== null
                ? capitalize(aboutDays(runway.daysLeft))
                : "—"
          }
          hint={
            runway.empty.length
              ? `${runway.empty.join(", ")} ${runway.empty.length === 1 ? "is" : "are"} empty`
              : runway.product
                ? `${runway.product} runs out first`
                : "No sales since the last refill"
          }
        />
        <StatTile
          icon={<Clock className="h-4 w-4" />}
          label="Last sale"
          value={
            !salesKnown
              ? "—"
              : report.lastSaleAt
                ? capitalize(formatRelative(report.lastSaleAt))
                : `None in ${HEALTH_WINDOW_DAYS} days`
          }
          hint={report.lastSaleAt ? formatDateTime(report.lastSaleAt) : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {summaryState === "unavailable" ? (
          <UnavailableNote what="The sales trend" />
        ) : !salesKnown ? (
          <EmptyState>Couldn't load sales for this machine.</EmptyState>
        ) : (
          <ColumnChartCard
            title="Revenue per week"
            description="Last 8 weeks, newest on the right"
            data={report.weekly}
            valueLabel="Revenue"
            formatValue={formatMoney}
            height={330}
          />
        )}
        <RhythmCard rhythm={report.rhythm} unit={unit} />
      </div>

      {report.plan.length > 0 && <PlanCard report={report} unit={unit} />}
    </div>
  );
}
