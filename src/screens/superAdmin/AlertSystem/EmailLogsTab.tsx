import { useCallback, useEffect, useState } from "react";
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
import type { EmailLog, EmailLogsResponse, Pagination } from "./Types";
import { downloadCsv, formatEpoch } from "./Types";
import { useAlertBase } from "./useAlertBase";

function buildQuery(page: number, limit: number, search: string, status: string) {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status !== "all") params.append("status", status);
  return params.toString();
}

export const EmailLogsTab = () => {
  const { apiBase } = useAlertBase();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequest<EmailLogsResponse>(
        `${apiBase}/email-logs?${buildQuery(page, 10, search, status)}`,
      );
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load email logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, apiBase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
      const res = await getRequest<EmailLogsResponse>(
        `${apiBase}/email-logs?${buildQuery(1, 500, search, status)}`,
      );
      downloadCsv(
        `alert-email-logs-${new Date().toISOString().slice(0, 10)}.csv`,
        ["ID", "Alert ID", "Machine Code", "Recipient", "Status", "Sent At", "Error"],
        res.data.map((l) => [
          l.id,
          l.alert_id,
          l.machine_code,
          l.recipient,
          l.status,
          formatEpoch(l.sent_at),
          l.error,
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipient, machine, subject…"
              className="w-72 pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No emails logged yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-medium">
                      {l.recipient}
                    </TableCell>
                    <TableCell className="text-sm">{l.machine_code}</TableCell>
                    <TableCell className="max-w-64 truncate text-sm">
                      {l.subject || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-0 ${
                          l.status === "sent"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatEpoch(l.sent_at)}
                    </TableCell>
                    <TableCell className="max-w-52 truncate text-xs text-red-600">
                      {l.error || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {pagination.total} email{pagination.total !== 1 ? "s" : ""} ·
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
