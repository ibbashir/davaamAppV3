import { useState, type ReactNode } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { Table as TableIcon, BarChart3 } from "lucide-react";
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

const BAR_COLOR = "#0d9488"; // teal-600, the dashboard's primary

const chartTheme = {
  text: { fontSize: 11, fill: "#64748b" },
  axis: {
    ticks: { line: { stroke: "transparent" }, text: { fill: "#64748b" } },
    domain: { line: { stroke: "transparent" } },
  },
  grid: { line: { stroke: "#e2e8f0", strokeWidth: 1 } },
};

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "warning" | "critical";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4",
        tone === "warning" && "border-amber-300 bg-amber-50",
        tone === "critical" && "border-red-300 bg-red-50",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export type ColumnDatum = { label: string; value: number; detail?: string };

/** Single-series column chart with a hover tooltip and a table view. */
export function ColumnChartCard({
  title,
  description,
  data,
  valueLabel,
  formatValue,
  height = 260,
  tickEvery = 1,
  action,
}: {
  title: string;
  description?: ReactNode;
  data: ColumnDatum[];
  valueLabel: string;
  formatValue: (n: number) => string;
  height?: number;
  tickEvery?: number;
  action?: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  const tickValues = data
    .filter((_, i) => i % tickEvery === 0)
    .map((d) => d.label);
  // Small whole-number counts get whole-number ticks (no 0.2, 0.4, …)
  const max = Math.max(0, ...data.map((d) => d.value));
  const yTicks =
    max < 4 && data.every((d) => Number.isInteger(d.value))
      ? Array.from({ length: max + 1 }, (_, i) => i)
      : 4;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base text-slate-900">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
            >
              {asTable ? (
                <BarChart3 className="h-4 w-4" />
              ) : (
                <TableIcon className="h-4 w-4" />
              )}
              {asTable ? "Chart" : "Table"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {asTable ? (
          <div className="max-h-[320px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">{valueLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.label}>
                    <TableCell>{d.detail ?? d.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatValue(d.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div style={{ height }}>
            <ResponsiveBar
              data={data}
              keys={["value"]}
              indexBy="label"
              margin={{ top: 10, right: 10, bottom: 36, left: 56 }}
              padding={0.3}
              colors={BAR_COLOR}
              borderRadius={4}
              enableLabel={false}
              enableGridY
              gridYValues={yTicks}
              theme={chartTheme}
              axisBottom={{ tickSize: 0, tickPadding: 8, tickValues }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: yTicks,
                format: (v) => formatValue(Number(v)),
              }}
              tooltip={({ data: d }) => (
                <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-md">
                  <div className="font-medium text-slate-900">
                    {(d as ColumnDatum).detail ?? (d as ColumnDatum).label}
                  </div>
                  <div className="text-slate-600">
                    {valueLabel}: {formatValue(Number(d.value))}
                  </div>
                </div>
              )}
              role="img"
              ariaLabel={title}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Horizontal share bar for use inside table cells. */
export function InlineBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full min-w-16 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-teal-600"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white/60 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function UnavailableNote({ what }: { what: string }) {
  return (
    <EmptyState>
      {what} needs the latest backend (machineRefills / machineTransactionSummary
      endpoints). Deploy the backend to enable it.
    </EmptyState>
  );
}
