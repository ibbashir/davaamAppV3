import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRequest } from "@/Apis/Api";
import {
  IconClockPause,
  IconDownload,
  IconLoader2,
  IconMail,
  IconRefresh,
  IconRotateClockwise,
  IconServer,
  IconServerOff,
} from "@tabler/icons-react";
import type { DailyReport, DailyReportResponse } from "./Types";
import { downloadCsv, formatDuration, formatEpoch } from "./Types";
import { useAlertBase } from "./useAlertBase";

const EMAIL_STATUS_BADGE: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};

export const DailyReportTab = () => {
  const navigate = useNavigate();
  const { apiBase, routeBase } = useAlertBase();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequest<DailyReportResponse>(
        `${apiBase}/daily-report`,
      );
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load daily report", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!report) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `inactivity-report-24h-${date}.csv`,
      ["Section", "Machine Code", "Machine Name", "Location", "Went Inactive", "Recovered", "Duration"],
      [
        ...report.inactiveMachines.map((m) => [
          "Currently Inactive",
          m.machineCode,
          m.machineName,
          m.machineLocation,
          formatEpoch(m.inactiveSince),
          "",
          formatDuration(m.durationSeconds),
        ]),
        ...report.resolvedSessions.map((s) => [
          "Recovered (24h)",
          s.machineCode,
          s.machineName,
          s.machineLocation,
          formatEpoch(s.inactiveSince),
          formatEpoch(s.resolvedAt),
          formatDuration(s.durationSeconds),
        ]),
      ],
    );
  };

  if (loading && !report) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
          Failed to load the report
        </CardContent>
      </Card>
    );
  }

  const summary = [
    {
      label: "Monitored Machines",
      value: String(report.totals.monitored),
      icon: <IconServer className="size-5" />,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Currently Inactive",
      value: String(report.totals.currentlyInactive),
      icon: <IconServerOff className="size-5" />,
      accent:
        report.totals.currentlyInactive > 0
          ? "bg-red-50 text-red-600"
          : "bg-green-50 text-green-600",
    },
    {
      label: "Recovered (24h)",
      value: String(report.totals.resolvedOutages),
      icon: <IconRotateClockwise className="size-5" />,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Downtime (24h)",
      value: formatDuration(report.totals.downtimeSeconds),
      icon: <IconClockPause className="size-5" />,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header row: window + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Report window: {formatEpoch(report.windowStart)} —{" "}
          {formatEpoch(report.windowEnd)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
          >
            <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <IconDownload className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((card) => (
          <Card key={card.label} className="py-4">
            <CardContent className="flex flex-col gap-2 px-4">
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${card.accent}`}
              >
                {card.icon}
              </div>
              <div className="text-2xl font-semibold">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last emailed report */}
      <Card className="py-4">
        <CardContent className="flex flex-wrap items-center gap-3 px-4 text-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <IconMail className="size-5" />
          </div>
          {report.lastReport ? (
            <>
              <div>
                <div className="font-medium">
                  Last report email — {formatEpoch(report.lastReport.triggered_at)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Delivered to {report.lastReport.emails_sent}/
                  {report.lastReport.emails_total} recipient
                  {report.lastReport.emails_total !== 1 ? "s" : ""}
                  {report.lastReport.recipients.length > 0 && (
                    <> · {report.lastReport.recipients.map((r) => r.recipient).join(", ")}</>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`ml-auto border-0 ${EMAIL_STATUS_BADGE[report.lastReport.email_status] ?? ""}`}
              >
                {report.lastReport.email_status}
              </Badge>
            </>
          ) : (
            <span className="text-muted-foreground">
              No report email has been sent yet — the first one goes out with the
              next daily run.
            </span>
          )}
        </CardContent>
      </Card>

      {/* Currently inactive machines */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h3 className="font-semibold">
            Currently Inactive Machines
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {report.inactiveMachines.length} machine
              {report.inactiveMachines.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Inactive For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.inactiveMachines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-green-600"
                    >
                      All machines are active ✅
                    </TableCell>
                  </TableRow>
                ) : (
                  report.inactiveMachines.map((m) => (
                    <TableRow
                      key={m.machineCode}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`${routeBase}/machine/${m.machineCode}`)
                      }
                    >
                      <TableCell>
                        <div className="font-medium">
                          {m.machineName || m.machineCode}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.machineCode}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-sm">
                        {m.machineLocation || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatEpoch(m.inactiveSince)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-red-600">
                        {formatDuration(m.durationSeconds)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Outages recovered in the last 24 hours */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h3 className="font-semibold">
            Recovered in the Last 24 Hours
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {report.resolvedSessions.length} outage
              {report.resolvedSessions.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Went Inactive</TableHead>
                  <TableHead>Recovered</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.resolvedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No outages (≥ 1 hour) were resolved in the last 24 hours
                    </TableCell>
                  </TableRow>
                ) : (
                  report.resolvedSessions.map((s, i) => (
                    <TableRow
                      key={`${s.machineCode}-${s.resolvedAt}-${i}`}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`${routeBase}/machine/${s.machineCode}`)
                      }
                    >
                      <TableCell>
                        <div className="font-medium">
                          {s.machineName || s.machineCode}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.machineCode}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-sm">
                        {s.machineLocation || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatEpoch(s.inactiveSince)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatEpoch(s.resolvedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(s.durationSeconds)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
