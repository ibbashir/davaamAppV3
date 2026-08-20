import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconLogin2, IconLogout2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
  formatTime,
  formatMinutes,
  todayISO,
  monthStartISO,
} from "@/components/hr/hr-api"
import { usePunch, type Geofence } from "@/components/hr/use-punch"
import { GeofenceNotice } from "@/components/hr/GeofenceNotice"

interface AttendanceRow {
  id: number
  attendance_date: string
  check_in: string | null
  check_out: string | null
  worked_minutes: number | null
  late_minutes: number
  overtime_minutes: number
  status: string
  remarks: string | null
}

const MyAttendance = () => {
  const [from, setFrom] = React.useState(monthStartISO())
  const [to, setTo] = React.useState(todayISO())
  const [rows, setRows] = React.useState<AttendanceRow[]>([])
  const [summary, setSummary] = React.useState<Record<string, number> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)
  const [geofence, setGeofence] = React.useState<Geofence | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{
        data: AttendanceRow[]
        summary: Record<string, number>
        geofence?: Geofence
      }>("/attendance", { from, to })
      setRows(res.data ?? [])
      setSummary(res.summary ?? {})
      setGeofence(res.geofence ?? null)
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) setNotLinked(true)
      else toast.error(errorMessage(err, "Could not load your attendance"))
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    load()
  }, [load])

  const { punch, punching } = usePunch(load)

  if (notLinked) {
    return (
      <HrPage title="My Attendance">
        <NotLinked />
      </HrPage>
    )
  }

  const s: Record<string, number> = summary ?? {}
  const todayRow = rows.find((r) => r.attendance_date?.slice(0, 10) === todayISO())

  return (
    <HrPage title="My Attendance">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[165px]" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[165px]" />
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex gap-2">
            <Button
              onClick={() => punch("in")}
              disabled={punching || !!todayRow?.check_in}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <IconLogin2 className="h-4 w-4" />
              Check in
            </Button>
            <Button
              onClick={() => punch("out")}
              disabled={punching || !todayRow?.check_in || !!todayRow?.check_out}
              variant="outline"
            >
              <IconLogout2 className="h-4 w-4" />
              Check out
            </Button>
          </div>
          <div className="max-w-md sm:text-right">
            <GeofenceNotice geofence={geofence} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatTile label="Present" value={(s.present ?? 0) + (s.late ?? 0)} tone="emerald" />
        <StatTile label="On Leave" value={s.on_leave ?? 0} tone="teal" />
        <StatTile label="Absent" value={s.absent ?? 0} tone={s.absent ? "red" : "default"} />
        {/* The policy counts late marks, not minutes — every 3 is half a day. */}
        <StatTile
          label="Times Late"
          value={s.late_days ?? 0}
          hint={s.late_penalty_days ? `${s.late_penalty_days} day penalty` : "Late after 9:30"}
          tone={s.late_days ? "amber" : "default"}
        />
        <StatTile label="Overtime" value={formatMinutes(s.overtime_minutes)} />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Remarks</TableHead>
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
                      No attendance recorded in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.attendance_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", statusClass(row.status))}>
                          {humanise(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(row.check_in)}</TableCell>
                      <TableCell>{formatTime(row.check_out)}</TableCell>
                      <TableCell>{formatMinutes(row.worked_minutes)}</TableCell>
                      <TableCell>
                        {row.late_minutes > 0 ? (
                          <span className="text-amber-600">{formatMinutes(row.late_minutes)}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{row.remarks ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </HrPage>
  )
}

export default MyAttendance
