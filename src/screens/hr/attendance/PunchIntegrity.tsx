import * as React from "react"
import { StatTile } from "@/components/hr/HrPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconLoader2,
  IconInbox,
  IconAlertTriangle,
  IconDeviceLaptop,
  IconCheck,
  IconShieldCheck,
  IconBan,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, hrUpdate, errorMessage, formatDateTime } from "@/components/hr/hr-api"

/**
 * Attendance integrity — which machine each punch came from, and where one
 * machine has clocked in more than one person.
 *
 * The screen is built around the judgement, not the data: the reasons a punch
 * was flagged are spelled out in words, and the employee it conflicts with is
 * named, because the next step is always a conversation rather than a lookup.
 */

interface EmployeeRef {
  id: number
  employee_code: string
  first_name: string
  last_name: string | null
}

interface PunchEvent {
  id: number
  employee_id: number
  punch_type: "in" | "out"
  device_id: string | null
  ip: string | null
  browser: string | null
  os: string | null
  device_type: string | null
  screen: string | null
  risk_score: number
  reasons: string[]
  severity: "high" | "low" | "none"
  reviewed_at: string | null
  created_at: string
  employee?: EmployeeRef
  conflict_employee?: EmployeeRef | null
}

interface PunchDevice {
  id: number
  employee_id: number
  device_id: string
  label: string | null
  browser: string | null
  os: string | null
  status: "new" | "known" | "trusted" | "blocked"
  punch_count: number
  last_seen_at: string | null
  last_ip: string | null
  is_shared: boolean
  shared_with: { employee_id: number; name: string | null; employee_code: string | null }[]
  employee?: EmployeeRef
}

interface Summary {
  window_days: number
  punches: number
  flagged: number
  unreviewed: number
  shared_devices: number
  registered_devices: number
}

const name = (e?: EmployeeRef | null) =>
  e ? `${e.first_name} ${e.last_name ?? ""}`.trim() : "—"

const STATUS_STYLES: Record<PunchDevice["status"], string> = {
  trusted: "border-emerald-300 bg-emerald-50 text-emerald-700",
  known: "border-teal-300 bg-teal-50 text-teal-700",
  new: "border-amber-300 bg-amber-50 text-amber-700",
  blocked: "border-red-300 bg-red-50 text-red-700",
}

/** Flagged punches, newest first. */
function EventsTab() {
  const [rows, setRows] = React.useState<PunchEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAll, setShowAll] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: PunchEvent[] }>("/attendance/integrity/events", {
        all: showAll ? "true" : undefined,
        limit: 100,
      })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the punch trail"))
    } finally {
      setLoading(false)
    }
  }, [showAll])

  React.useEffect(() => {
    load()
  }, [load])

  const markReviewed = async (id: number) => {
    setBusyId(id)
    try {
      await hrUpdate("/attendance/integrity/events", `${id}/review`, {})
      toast.success("Marked as reviewed")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not mark it reviewed"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant={showAll ? "outline" : "default"} onClick={() => setShowAll(false)}
          className={cn(!showAll && "bg-teal-600 hover:bg-teal-700")}>
          Flagged only
        </Button>
        <Button variant={showAll ? "default" : "outline"} onClick={() => setShowAll(true)}
          className={cn(showAll && "bg-teal-600 hover:bg-teal-700")}>
          All punches
        </Button>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>When</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Punch</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Why flagged</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      <IconInbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      {showAll
                        ? "No punches recorded yet"
                        : "Nothing flagged — every punch came from a device we recognise"}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className={cn(row.severity === "high" && "bg-red-50/40")}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{name(row.employee)}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.employee?.employee_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {row.punch_type === "in" ? "Check in" : "Check out"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{row.browser} on {row.os}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.device_type}
                          {row.screen ? ` · ${row.screen}` : ""}
                          {row.ip ? ` · ${row.ip}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {row.reasons.length ? (
                          <div className="flex flex-col gap-1">
                            {row.reasons.map((r) => (
                              <span key={r} className="text-xs">{r}</span>
                            ))}
                            {row.conflict_employee && (
                              <span className="text-xs font-medium text-red-700">
                                Conflicts with {name(row.conflict_employee)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            row.severity === "high"
                              ? "border-red-300 bg-red-50 text-red-700"
                              : row.severity === "low"
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : "border-emerald-300 bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {row.risk_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.reviewed_at ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <IconCheck className="h-3.5 w-3.5" /> Reviewed
                          </span>
                        ) : row.severity === "high" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={busyId === row.id}
                            onClick={() => markReviewed(row.id)}
                          >
                            Mark reviewed
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
    </div>
  )
}

/** The device registry, shared machines first. */
function DevicesTab() {
  const [rows, setRows] = React.useState<PunchDevice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: PunchDevice[] }>("/attendance/integrity/devices")
      // Shared machines are the whole point of the screen, so they sort to the
      // top regardless of when they were last used.
      setRows(
        (res.data ?? []).sort((a, b) => Number(b.is_shared) - Number(a.is_shared)),
      )
    } catch (err) {
      toast.error(errorMessage(err, "Could not load devices"))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: number, status: PunchDevice["status"]) => {
    setBusyId(id)
    try {
      await hrUpdate("/attendance/integrity/devices", id, { status })
      toast.success(`Device marked ${status}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the device"))
    } finally {
      setBusyId(null)
    }
  }

  const visible = rows.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      name(r.employee).toLowerCase().includes(q) ||
      (r.label ?? "").toLowerCase().includes(q) ||
      r.device_id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search employee or device…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[260px]"
        />
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Punches</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Also used by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      <IconDeviceLaptop className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      No devices registered yet — they appear as employees punch in
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((row) => (
                    <TableRow key={row.id} className={cn(row.is_shared && "bg-red-50/40")}>
                      <TableCell>
                        <div className="font-medium">{name(row.employee)}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.employee?.employee_code}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{row.label ?? `${row.browser} on ${row.os}`}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {row.device_id.slice(0, 12)}…
                        </div>
                      </TableCell>
                      <TableCell>{row.punch_count}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(row.last_seen_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[row.status])}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.is_shared ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-red-700">
                            <IconAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {row.shared_with.map((s) => s.name).join(", ")}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={busyId === row.id || row.status === "trusted"}
                            onClick={() => setStatus(row.id, "trusted")}
                          >
                            <IconShieldCheck className="h-3.5 w-3.5" />
                            Trust
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:text-red-700"
                            disabled={busyId === row.id || row.status === "blocked"}
                            onClick={() => setStatus(row.id, "blocked")}
                          >
                            <IconBan className="h-3.5 w-3.5" />
                            Block
                          </Button>
                        </div>
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
  )
}

export default function PunchIntegrity() {
  const [summary, setSummary] = React.useState<Summary | null>(null)

  React.useEffect(() => {
    hrGet<{ data: Summary }>("/attendance/integrity/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Flagged punches"
          value={summary?.flagged ?? 0}
          hint={`last ${summary?.window_days ?? 30} days`}
          tone={summary?.flagged ? "red" : "emerald"}
        />
        <StatTile
          label="Awaiting review"
          value={summary?.unreviewed ?? 0}
          tone={summary?.unreviewed ? "amber" : "emerald"}
        />
        <StatTile
          label="Shared devices"
          value={summary?.shared_devices ?? 0}
          hint="one machine, two people"
          tone={summary?.shared_devices ? "red" : "emerald"}
        />
        <StatTile
          label="Devices registered"
          value={summary?.registered_devices ?? 0}
          tone="teal"
        />
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="events">Punch trail</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4">
          <EventsTab />
        </TabsContent>
        <TabsContent value="devices" className="mt-4">
          <DevicesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
