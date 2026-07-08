import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRequest } from "@/Apis/Api";
import { IconLoader2 } from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsResponse } from "./Types";
import { formatDuration } from "./Types";
import { useAlertBase } from "./useAlertBase";

// Chart palette — validated against the white card surface (dataviz slots 1/2/6)
const C_DOWNTIME = "#2a78d6";
const C_EMAILS = "#1baf7a";
const C_ALERTS = "#e34948";
const C_GRID = "#e1e0d9";
const C_AXIS = "#898781";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const axisTick = { fontSize: 11, fill: C_AXIS };

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  format?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {format ? format(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AnalyticsTab = () => {
  const navigate = useNavigate();
  const { apiBase, routeBase } = useAlertBase();
  const [days, setDays] = useState("30");
  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - parseInt(days, 10) * 86400;
      const res = await getRequest<AnalyticsResponse>(
        `${apiBase}/analytics?from=${from}&to=${to}`,
      );
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }, [days, apiBase]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const daily = useMemo(
    () =>
      (analytics?.daily ?? []).map((d) => ({
        ...d,
        day: d.date.slice(5), // MM-DD
        downtime_hours: +(d.downtime_seconds / 3600).toFixed(2),
      })),
    [analytics],
  );

  const topMachines = useMemo(
    () =>
      (analytics?.topInactiveMachines ?? []).map((m) => ({
        ...m,
        label: m.machine_name || m.machine_code,
        downtime_hours: +(m.downtime_seconds / 3600).toFixed(2),
      })),
    [analytics],
  );

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <IconLoader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Range filter + totals */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {analytics && (
            <>
              <span>
                Sessions:{" "}
                <strong className="text-foreground">
                  {analytics.totals.sessions}
                </strong>
              </span>
              <span>
                Alerts:{" "}
                <strong className="text-foreground">
                  {analytics.totals.alerts}
                </strong>
              </span>
              <span>
                Emails sent:{" "}
                <strong className="text-foreground">
                  {analytics.totals.emailsSent}
                </strong>
              </span>
              <span>
                Emails failed:{" "}
                <strong className="text-foreground">
                  {analytics.totals.emailsFailed}
                </strong>
              </span>
              <span>
                Total downtime:{" "}
                <strong className="text-foreground">
                  {formatDuration(analytics.totals.downtimeSeconds)}
                </strong>
              </span>
            </>
          )}
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Daily downtime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Downtime per day</CardTitle>
            <CardDescription>Total machine downtime, in hours</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 8, left: -16 }}>
                <CartesianGrid stroke={C_GRID} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: C_GRID }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={
                    <ChartTooltip format={(v) => `${v} h`} />
                  }
                />
                <Bar
                  dataKey="downtime_hours"
                  name="Downtime"
                  fill={C_DOWNTIME}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts per day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts per day</CardTitle>
            <CardDescription>Inactivity alerts triggered</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 8, left: -16 }}>
                <CartesianGrid stroke={C_GRID} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: C_GRID }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={<ChartTooltip />}
                />
                <Bar
                  dataKey="alerts"
                  name="Alerts"
                  fill={C_ALERTS}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emails per day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emails per day</CardTitle>
            <CardDescription>Sent vs failed alert emails</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 8, left: -16 }}>
                <CartesianGrid stroke={C_GRID} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: C_GRID }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={<ChartTooltip />}
                />
                <Bar
                  dataKey="emails_sent"
                  name="Sent"
                  fill={C_EMAILS}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="emails_failed"
                  name="Failed"
                  fill={C_ALERTS}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend (two series) */}
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: C_EMAILS }}
                />
                Sent
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: C_ALERTS }}
                />
                Failed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top inactive machines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most inactive machines</CardTitle>
            <CardDescription>
              Top 10 by total downtime — click a row to open the machine
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topMachines.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No downtime recorded in this period
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topMachines.map((m) => {
                  const max = topMachines[0].downtime_seconds || 1;
                  const pct = Math.max(
                    2,
                    (m.downtime_seconds / max) * 100,
                  );
                  return (
                    <button
                      key={m.machine_code}
                      onClick={() =>
                        navigate(`${routeBase}/machine/${m.machine_code}`)
                      }
                      className="group flex items-center gap-3 rounded-md px-1 py-1 text-left hover:bg-muted/50"
                    >
                      <div className="w-40 shrink-0 truncate text-xs">
                        <span className="font-medium group-hover:underline">
                          {m.label}
                        </span>
                        <span className="block text-muted-foreground">
                          {m.machine_code} · {m.sessions} session
                          {m.sessions !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-4 flex-1 rounded-sm bg-muted/40">
                        <div
                          className="h-4 rounded-sm"
                          style={{
                            width: `${pct}%`,
                            background: C_DOWNTIME,
                          }}
                        />
                      </div>
                      <div className="w-16 shrink-0 text-right text-xs font-medium">
                        {formatDuration(m.downtime_seconds)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
