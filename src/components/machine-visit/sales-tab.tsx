import { useEffect, useState } from "react";
import moment from "moment-timezone";
import { Banknote, Receipt, ShoppingBag, CalendarDays } from "lucide-react";
import { postRequest } from "@/Apis/Api";
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
import { formatMoney, formatNumber, formatQuantity, TIMEZONE } from "./format";
import {
  ColumnChartCard,
  EmptyState,
  InlineBar,
  StatTile,
  UnavailableNote,
} from "./parts";
import type { StockUnit, TransactionSummary } from "./types";

type Range = "7d" | "30d" | "12m";
type Metric = "revenue" | "transactions" | "units";

const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "12m", label: "Last 12 months" },
];

const rangeStart = (range: Range) => {
  const now = moment().tz(TIMEZONE);
  if (range === "12m") return now.clone().subtract(11, "months").startOf("month");
  return now.clone().subtract(range === "7d" ? 6 : 29, "days").startOf("day");
};

export function SalesTab({
  apiBase,
  machineCode,
  unit,
}: {
  apiBase: string;
  machineCode: string;
  unit: StockUnit;
}) {
  const [range, setRange] = useState<Range>("30d");
  const [metric, setMetric] = useState<Metric>("revenue");
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postRequest<TransactionSummary>(`${apiBase}/machineTransactionSummary`, {
      machine_code: machineCode,
      from: rangeStart(range).unix(),
      groupBy: range === "12m" ? "month" : "day",
    })
      .then((res) => {
        if (cancelled) return;
        setSummary(res);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) setUnavailable(true);
        else setError("Couldn't load sales for this machine.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode, range]);

  if (unavailable) return <UnavailableNote what="Sales analytics" />;

  const rangeLabel = RANGES.find((r) => r.id === range)!.label.toLowerCase();
  const days = Math.max(1, moment().tz(TIMEZONE).diff(rangeStart(range), "days") + 1);
  const series = summary?.series ?? [];
  const chartData = series.map((p) => {
    const m = moment(p.key, range === "12m" ? "YYYY-MM" : "YYYY-MM-DD");
    return {
      label: range === "12m" ? m.format("MMM") : m.format("D MMM"),
      detail: range === "12m" ? m.format("MMMM YYYY") : m.format("ddd D MMM YYYY"),
      value: p[metric],
    };
  });
  const formatMetric = (n: number) =>
    metric === "revenue"
      ? formatMoney(n)
      : metric === "units"
        ? formatQuantity(n, unit)
        : formatNumber(n);
  const metricLabel =
    metric === "revenue" ? "Revenue" : metric === "units" ? "Sold" : "Sales";

  const maxProductRevenue = Math.max(0, ...(summary?.products.map((p) => p.revenue) ?? []));
  const maxPaymentRevenue = Math.max(0, ...(summary?.payments.map((p) => p.revenue) ?? []));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={range === r.id ? "default" : "ghost"}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Includes app, cash and card sales. Times are Pakistan time.
        </p>
      </div>

      {error && <EmptyState>{error}</EmptyState>}

      {summary && (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile
              icon={<Banknote className="h-4 w-4" />}
              label="Revenue"
              value={formatMoney(summary.totals.revenue)}
              hint={rangeLabel}
            />
            <StatTile
              icon={<Receipt className="h-4 w-4" />}
              label="Sales"
              value={formatNumber(summary.totals.transactions)}
              hint={`${formatNumber(summary.totals.active_days)} days with sales`}
            />
            <StatTile
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Sold"
              value={formatQuantity(summary.totals.units, unit)}
            />
            <StatTile
              icon={<CalendarDays className="h-4 w-4" />}
              label="Average per day"
              value={formatMoney(Math.round(summary.totals.revenue / days))}
              hint={`${formatNumber(Math.round((summary.totals.transactions / days) * 10) / 10)} sales/day`}
            />
          </div>

          <ColumnChartCard
            title={`${metricLabel} by ${range === "12m" ? "month" : "day"}`}
            description={RANGES.find((r) => r.id === range)!.label}
            data={chartData}
            valueLabel={metricLabel}
            formatValue={formatMetric}
            height={300}
            tickEvery={range === "30d" ? 5 : 1}
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {(["revenue", "transactions", "units"] as Metric[]).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={metric === m ? "default" : "ghost"}
                    onClick={() => setMetric(m)}
                  >
                    {m === "revenue" ? "Revenue" : m === "units" ? "Sold" : "Sales"}
                  </Button>
                ))}
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">By product</CardTitle>
                <CardDescription>What sold most, {rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.products.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No sales.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.products.map((p) => (
                        <TableRow key={p.brand_id}>
                          <TableCell className="whitespace-normal">{p.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatQuantity(p.units, unit)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(p.revenue)}
                          </TableCell>
                          <TableCell>
                            <InlineBar value={p.revenue} max={maxProductRevenue} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">
                  By payment method
                </CardTitle>
                <CardDescription>How customers paid, {rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.payments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No sales.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paid via</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.payments.map((p) => (
                        <TableRow key={p.method}>
                          <TableCell>{p.method}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(p.transactions)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(p.revenue)}
                          </TableCell>
                          <TableCell>
                            <InlineBar value={p.revenue} max={maxPaymentRevenue} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!summary && loading && (
        <div className="py-12 text-center text-sm text-slate-500">Loading sales…</div>
      )}
    </div>
  );
}
