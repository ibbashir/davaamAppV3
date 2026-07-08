import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SiteHeader } from "@/components/superAdmin/site-header";
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
import { getRequest } from "@/Apis/Api";
import {
  IconArrowLeft,
  IconBellRinging,
  IconClockPause,
  IconHistory,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import type { MachineDetailResponse } from "./Types";
import { formatDuration, formatEpoch } from "./Types";
import { useAlertBase } from "./useAlertBase";

const EMAIL_STATUS_BADGE: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};

export const MachineAlertDetail = () => {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { apiBase } = useAlertBase();
  const [detail, setDetail] = useState<MachineDetailResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!machineCode) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await getRequest<MachineDetailResponse>(
        `${apiBase}/machine/${machineCode}`,
      );
      setDetail(res.data);
    } catch (err) {
      console.error("Failed to load machine detail", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [machineCode, apiBase]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading && !detail) {
    return (
      <>
        <SiteHeader title="Machine Alert Detail" />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <IconLoader2 className="size-6 animate-spin" />
        </div>
      </>
    );
  }

  if (notFound || !detail) {
    return (
      <>
        <SiteHeader title="Machine Alert Detail" />
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <span>Machine not found.</span>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <IconArrowLeft className="size-4" /> Back
          </Button>
        </div>
      </>
    );
  }

  const { machine, current_status, last_updated, totals, sessions, alerts } =
    detail;

  return (
    <>
      <SiteHeader title="Machine Alert Detail" />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <IconArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {machine.machine_name || machine.machine_code}
              </h1>
              <Badge
                variant="outline"
                className={`border-0 ${
                  current_status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {current_status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {machine.machine_code}
              {machine.machine_location ? ` · ${machine.machine_location}` : ""}
              {machine.city ? ` · ${machine.city}` : ""}
              {last_updated ? ` · last seen ${formatEpoch(last_updated)}` : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDetail}
            disabled={loading}
          >
            <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <IconHistory className="size-5" />
              </div>
              <div>
                <div className="text-xl font-semibold">{totals.sessions}</div>
                <div className="text-xs text-muted-foreground">
                  Inactivity sessions
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <IconClockPause className="size-5" />
              </div>
              <div>
                <div className="text-xl font-semibold">
                  {formatDuration(totals.downtimeSeconds)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total downtime
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <IconBellRinging className="size-5" />
              </div>
              <div>
                <div className="text-xl font-semibold">{totals.alerts}</div>
                <div className="text-xs text-muted-foreground">
                  Alerts generated
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inactivity history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inactivity history</CardTitle>
            <CardDescription>Most recent 100 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inactive Since</TableHead>
                    <TableHead>Resolved At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No inactivity recorded for this machine
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">
                          {formatEpoch(s.inactive_since)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.resolved_at ? formatEpoch(s.resolved_at) : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatDuration(s.effective_duration_seconds)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-0 ${
                              s.status === "ongoing"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.alert_sent
                            ? `Sent ${formatEpoch(s.alert_sent_at)}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Alert history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert history</CardTitle>
            <CardDescription>
              Email alerts generated for this machine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Triggered At</TableHead>
                    <TableHead>Inactive For</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Email Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No alerts for this machine
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">
                          {formatEpoch(a.triggered_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuration(a.inactive_duration_seconds)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.emails_sent}/{a.emails_total}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-0 ${EMAIL_STATUS_BADGE[a.email_status] ?? ""}`}
                          >
                            {a.email_status}
                          </Badge>
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
    </>
  );
};
