import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import type { InactiveMachine, InactiveMachinesResponse } from "./Types";
import { downloadCsv, formatDuration, formatEpoch } from "./Types";
import { useAlertBase } from "./useAlertBase";

export const InactiveMachinesTab = () => {
  const navigate = useNavigate();
  const { apiBase, routeBase } = useAlertBase();
  const [machines, setMachines] = useState<InactiveMachine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequest<InactiveMachinesResponse>(
        `${apiBase}/inactive-machines`,
      );
      setMachines(res.data);
    } catch (err) {
      console.error("Failed to load inactive machines", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const filtered = useMemo(() => {
    if (!search) return machines;
    const q = search.toLowerCase();
    return machines.filter(
      (m) =>
        m.machine_code.toLowerCase().includes(q) ||
        (m.machine_name ?? "").toLowerCase().includes(q) ||
        (m.machine_location ?? "").toLowerCase().includes(q) ||
        (m.city ?? "").toLowerCase().includes(q),
    );
  }, [machines, search]);

  const handleExport = () => {
    downloadCsv(
      `inactive-machines-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Machine Code", "Name", "Location", "City", "Last Seen", "Inactive For", "Alert Sent"],
      filtered.map((m) => [
        m.machine_code,
        m.machine_name,
        m.machine_location,
        m.city,
        formatEpoch(m.inactive_since),
        formatDuration(m.inactive_for_seconds),
        m.alert_sent ? "Yes" : "No",
      ]),
    );
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search machines…"
              className="w-72 pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} inactive machine{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMachines}
              disabled={loading}
            >
              <IconRefresh
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <IconDownload className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                {/* <TableHead>Location</TableHead> */}
                <TableHead>City</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Inactive For</TableHead>
                <TableHead>1h Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {machines.length === 0
                      ? "All machines are active 🎉"
                      : "No machines match your search"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow
                    key={m.machine_code}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`${routeBase}/machine/${m.machine_code}`)
                    }
                  >
                    <TableCell>
                      <div className="font-medium">
                        {m.machine_name || m.machine_code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.machine_code}
                      </div>
                    </TableCell>
                    {/* <TableCell className="max-w-52 truncate text-sm">
                      {m.machine_location || "—"}
                    </TableCell> */}
                    <TableCell className="text-sm">{m.city || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {formatEpoch(m.inactive_since)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          m.inactive_for_seconds > 3600
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {formatDuration(m.inactive_for_seconds)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {m.alert_sent ? (
                        <Badge
                          variant="outline"
                          className="border-0 bg-red-100 text-red-700"
                        >
                          Alerted
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-0 bg-gray-100 text-gray-600"
                        >
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
