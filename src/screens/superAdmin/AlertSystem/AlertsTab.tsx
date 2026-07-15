import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react";
import type { AlertsResponse, MachineAlert, Pagination } from "./Types";
import { downloadCsv, formatDuration, formatEpoch } from "./Types";
import { useAlertBase } from "./useAlertBase";

const EMAIL_STATUS_BADGE: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

function buildQuery(
  page: number,
  limit: number,
  search: string,
  emailStatus: string,
  range: string,
) {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (emailStatus !== "all") params.append("emailStatus", emailStatus);
  if (range !== "all") {
    const to = Math.floor(Date.now() / 1000);
    const from =
      range === "1"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000
        : to - parseInt(range, 10) * 86400;
    params.append("from", String(Math.floor(from)));
    params.append("to", String(to));
  }
  return params.toString();
}

export const AlertsTab = () => {
  const navigate = useNavigate();
  const { apiBase, routeBase } = useAlertBase();
  const [alerts, setAlerts] = useState<MachineAlert[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [emailStatus, setEmailStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequest<AlertsResponse>(
        `${apiBase}/alerts?${buildQuery(page, 10, search, emailStatus, range)}`,
      );
      setAlerts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, emailStatus, range, apiBase]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getRequest<AlertsResponse>(
        `${apiBase}/alerts?${buildQuery(1, 500, search, emailStatus, range)}`,
      );
      downloadCsv(
        `machine-alerts-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "ID",
          "Machine Code",
          "Machine Name",
          "Location",
          "Triggered At",
          "Inactive For",
          "Email Status",
          "Emails Sent",
        ],
        res.data.map((a) => [
          a.id,
          a.machine_code,
          a.machine_name,
          a.machine_location,
          formatEpoch(a.triggered_at),
          formatDuration(a.inactive_duration_seconds),
          a.email_status,
          `${a.emails_sent}/${a.emails_total}`,
        ]),
      );
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search machine code, name, location…"
              className="w-72 pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={emailStatus}
            onValueChange={(v) => {
              setEmailStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Email status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={range}
            onValueChange={(v) => {
              setRange(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDownload className="size-4" />
            )}
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                {/* <TableHead>Location</TableHead> */}
                <TableHead>Triggered At</TableHead>
                <TableHead>Inactive For</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Email Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((a) => (
                  <TableRow
                    key={a.id}
                    className={
                      a.alert_type === "daily_report" ? "" : "cursor-pointer"
                    }
                    onClick={() => {
                      // The daily digest row has no machine behind it
                      if (a.alert_type === "daily_report") return;
                      navigate(`${routeBase}/machine/${a.machine_code}`);
                    }}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {a.machine_name || a.machine_code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.machine_code}
                      </div>
                    </TableCell>
                    {/* <TableCell className="max-w-52 truncate text-sm">
                      {a.machine_location || "—"}
                    </TableCell> */}
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

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {pagination.total} alert{pagination.total !== 1 ? "s" : ""} ·
              page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
