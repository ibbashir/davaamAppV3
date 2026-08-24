import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconLogin2, IconLogout2, IconInbox, IconMapPin } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  hrGet,
  hrAction,
  errorMessage,
  statusClass,
  humanise,
  formatTime,
  formatMinutes,
  todayISO,
} from "@/components/hr/hr-api"
import type { RosterRow, HrRow } from "@/Types/hr"

const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "half_day",
  "on_leave",
  "holiday",
  "week_off",
]

/**
 * Where a punch was made, when it carried coordinates. Self-service punches
 * record them; anything HR marks by hand has none, so the pin is absent rather
 * than dead — an icon that goes nowhere is worse than no icon.
 *
 * Rendered as a real anchor so the coordinates survive middle-click and
 * "copy link address", and so the target is keyboard-reachable.
 */
function PunchLocation({
  lat,
  lng,
  label,
}: {
  lat: number | null
  lng: number | null
  label: string
}) {
  if (lat == null || lng == null) return null

  const coords = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label} at ${coords} — open in Google Maps`}
      aria-label={`${label} location ${coords}. Opens Google Maps in a new tab.`}
      className="text-muted-foreground transition-colors hover:text-teal-600"
    >
      <IconMapPin className="h-3.5 w-3.5" />
    </a>
  )
}

/** Today's roster — who is in, who is late, who hasn't been marked. */
function RosterTab() {
  const { options } = useHrOptions(["departments"])
  const [date, setDate] = React.useState(todayISO())
  const [departmentId, setDepartmentId] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [rows, setRows] = React.useState<RosterRow[]>([])
  const [summary, setSummary] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [bulkStatus, setBulkStatus] = React.useState("absent")
  const [selected, setSelected] = React.useState<number[]>([])

  // Department is filtered server-side — the endpoint takes it, and letting the
  // server narrow the set keeps the tiles counting the department on screen.
  // Status stays client-side on purpose: the tiles are the day's breakdown, so
  // filtering to "Late" must not collapse every other tile to zero.
  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: RosterRow[]; summary: Record<string, number> }>(
        "/attendance/roster",
        { date, department_id: departmentId },
      )
      setRows(res.data ?? [])
      setSummary(res.summary ?? {})
      setSelected([])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the roster"))
    } finally {
      setLoading(false)
    }
  }, [date, departmentId])

  React.useEffect(() => {
    load()
  }, [load])

  const punch = async (employeeId: number, type: "in" | "out") => {
    setBusyId(employeeId)
    try {
      await hrAction("/attendance/punch", { employee_id: employeeId, type, date })
      toast.success(type === "in" ? "Checked in" : "Checked out")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the punch"))
    } finally {
      setBusyId(null)
    }
  }

  const applyBulk = async () => {
    if (!selected.length) {
      toast.error("Select at least one employee")
      return
    }
    try {
      await hrAction("/attendance/bulk-mark", {
        employee_ids: selected,
        date,
        status: bulkStatus,
      })
      toast.success(`Marked ${selected.length} employee(s) as ${humanise(bulkStatus)}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not mark attendance"))
    }
  }

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const visibleRows = React.useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  )

  // Narrowing the filter drops anything it hides out of the selection. Bulk-mark
  // would otherwise write a status onto employees the user can no longer see.
  React.useEffect(() => {
    const visibleIds = new Set(visibleRows.map((r) => r.employee_id))
    setSelected((prev) => {
      const next = prev.filter((id) => visibleIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [visibleRows])

  const allSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selected.includes(r.employee_id))

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? visibleRows.map((r) => r.employee_id) : [])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatTile label="Present" value={summary.present ?? 0} tone="emerald" />
        <StatTile label="Late" value={summary.late ?? 0} tone="amber" />
        <StatTile label="On Leave" value={summary.on_leave ?? 0} tone="teal" />
        <StatTile label="Absent" value={summary.absent ?? 0} tone="red" />
        <StatTile label="Half Day" value={summary.half_day ?? 0} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[170px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Department</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {(options.departments ?? []).map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {humanise(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Bulk action — writes to selected employees
          </label>
          <div className="flex items-center gap-2">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    Mark as {humanise(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={applyBulk}
              disabled={!selected.length}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Apply to {selected.length || ""} selected
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                      <IconInbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      {rows.length === 0
                        ? "No active employees yet — add them in Employee Management"
                        : `No employees are marked ${humanise(statusFilter)} on this date`}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row) => (
                    <TableRow key={row.employee_id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.includes(row.employee_id)}
                          onChange={() => toggle(row.employee_id)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          aria-label={`Select ${row.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.employee_code}</div>
                      </TableCell>
                      <TableCell>{row.department ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", statusClass(row.status))}>
                          {humanise(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {formatTime(row.check_in)}
                          <PunchLocation
                            lat={row.check_in_lat}
                            lng={row.check_in_lng}
                            label="Checked in"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {formatTime(row.check_out)}
                          <PunchLocation
                            lat={row.check_out_lat}
                            lng={row.check_out_lng}
                            label="Checked out"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{formatMinutes(row.worked_minutes)}</TableCell>
                      <TableCell>
                        {row.late_minutes > 0 ? (
                          <span className="text-amber-600">{formatMinutes(row.late_minutes)}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={!!row.check_in || busyId === row.employee_id}
                            onClick={() => punch(row.employee_id, "in")}
                          >
                            <IconLogin2 className="h-3.5 w-3.5" />
                            In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={!row.check_in || !!row.check_out || busyId === row.employee_id}
                            onClick={() => punch(row.employee_id, "out")}
                          >
                            <IconLogout2 className="h-3.5 w-3.5" />
                            Out
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

/** Per-employee totals over a date range. */
function SummaryTab() {
  const [from, setFrom] = React.useState(`${todayISO().slice(0, 7)}-01`)
  const [to, setTo] = React.useState(todayISO())
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: Record<string, unknown>[] }>("/attendance/summary", { from, to })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the summary"))
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[170px]" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[170px]" />
        <Button variant="outline" onClick={load}>
          Apply
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Half Days</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Times Late</TableHead>
                  <TableHead>Late Penalty</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                      No attendance recorded in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => {
                    const employee = row.employee as { first_name?: string; last_name?: string; employee_code?: string } | undefined
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium">
                            {`${employee?.first_name ?? ""} ${employee?.last_name ?? ""}`.trim() || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">{employee?.employee_code}</div>
                        </TableCell>
                        <TableCell>{String(row.present_days ?? 0)}</TableCell>
                        <TableCell>{String(row.absent_days ?? 0)}</TableCell>
                        <TableCell>{String(row.half_days ?? 0)}</TableCell>
                        <TableCell>{String(row.leave_days ?? 0)}</TableCell>
                        <TableCell>
                          <div>{String(row.late_days ?? 0)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatMinutes(row.late_minutes)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {Number(row.late_penalty_days ?? 0) > 0 ? (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                              {String(row.late_penalty_days)} day
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{formatMinutes(row.overtime_minutes)}</TableCell>
                        <TableCell>{formatMinutes(row.worked_minutes)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const Attendance = () => {
  const { state } = useAuth()
  // Superadmin reaches this screen to watch the daily roster, not to administer
  // attendance — Records (create/edit/delete) and Summary stay with HR.
  const rosterOnly = state.role === "superadmin"
  // The employee list only feeds the Records form, so it is not worth fetching
  // for a role that never sees that tab.
  const { options } = useHrOptions(rosterOnly ? [] : ["employees"])

  const recordFields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "attendance_date", label: "Date", type: "date", required: true },
    { name: "check_in", label: "Check In", type: "datetime-local" },
    { name: "check_out", label: "Check Out", type: "datetime-local" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(ATTENDANCE_STATUSES),
      defaultValue: "present",
    },
    {
      name: "worked_minutes",
      label: "Worked",
      hideInForm: true,
      render: (row: HrRow) => formatMinutes(row.worked_minutes),
    },
    {
      name: "late_minutes",
      label: "Late",
      hideInForm: true,
      render: (row: HrRow) => formatMinutes(row.late_minutes),
    },
    { name: "remarks", label: "Remarks", type: "textarea", hideInTable: true },
  ]

  return (
    <HrTabbedPage
      title="Attendance Management"
      description={
        rosterOnly
          ? "Today's roster — who is in, who is late, and who has not been marked."
          : "Daily roster, manual corrections and period summaries. Employees punch their own attendance from Self Service."
      }
      tabs={[
        { value: "roster", label: "Daily Roster", content: <RosterTab /> },
        ...(rosterOnly
          ? []
          : [
              {
                value: "records",
                label: "Records",
                content: (
                  <ResourceScreen
                    embedded
                    title="Attendance Records"
                    singular="Record"
                    endpoint="/attendance"
                    fields={recordFields}
                    optionSources={options}
                    filters={[
                      { name: "status", label: "Status", options: enumOptions(ATTENDANCE_STATUSES) },
                    ]}
                    searchPlaceholder="Search records…"
                  />
                ),
              },
              { value: "summary", label: "Summary", content: <SummaryTab /> },
            ]),
      ]}
    />
  )
}

export default Attendance
