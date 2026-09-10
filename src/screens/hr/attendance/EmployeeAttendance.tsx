import * as React from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconLoader2,
  IconDownload,
  IconInfoCircle,
  IconArrowLeft,
  IconMapPin,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, errorMessage, formatDate, formatTime } from "@/components/hr/hr-api"
import { HR_MONTHLY_SHEET } from "@/constants/Constant"
import type { EmployeeAttendance as Sheet, AttendanceRecordRow } from "@/Types/hr"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/**
 * The same letters and colours the monthly sheet uses. One employee's month
 * and the whole company's month have to read identically — HR moves between
 * the two screens constantly, and a different palette on each would make them
 * check the legend every time.
 */
const CELL: Record<string, { letter: string; className: string; label: string }> = {
  present: { letter: "P", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", label: "Present" },
  late: { letter: "L", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", label: "Late" },
  half_day: { letter: "H", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", label: "Half day" },
  on_leave: { letter: "V", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", label: "On leave" },
  absent: { letter: "A", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", label: "Absent" },
  holiday: { letter: "★", className: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", label: "Holiday" },
  week_off: { letter: "–", className: "bg-muted text-muted-foreground", label: "Week off" },
}

const SOURCE_LABEL: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  biometric: "Terminal",
  manual: "Marked by HR",
}

const csvCell = (value: unknown): string => {
  const s = String(value ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** First and last day of a month, as YYYY-MM-DD. Pure calendar arithmetic. */
const monthRange = (year: number, month: number) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}` }
}

/**
 * One employee's attendance, day by day.
 *
 * Every employee can already see this for themselves on the ESS hub; this is
 * the same record from HR's side, reached by clicking a name on the monthly
 * sheet or the daily roster. It answers the question those two screens cannot:
 * not "who was absent" but "what happened to this person this month".
 */
const EmployeeAttendance = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const now = new Date()
  const [month, setMonth] = React.useState(
    Number(searchParams.get("month")) || now.getMonth() + 1,
  )
  const [year, setYear] = React.useState(
    Number(searchParams.get("year")) || now.getFullYear(),
  )
  const [sheet, setSheet] = React.useState<Sheet | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)

  const years = React.useMemo(() => {
    const current = now.getFullYear()
    return [current, current - 1, current - 2]
  }, [now])

  React.useEffect(() => {
    // Kept in the URL so a link to "Asiya, September" can be pasted into a
    // message rather than described in words.
    setSearchParams({ month: String(month), year: String(year) }, { replace: true })
  }, [month, year, setSearchParams])

  React.useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    const { from, to } = monthRange(year, month)
    ;(async () => {
      try {
        const res = await hrGet<Sheet>(`/attendance/employee/${id}`, { from, to })
        if (!cancelled) setSheet(res)
      } catch (err) {
        if (cancelled) return
        const message = errorMessage(err, "Could not load this employee's attendance")
        if (/not found/i.test(message)) setNotFound(true)
        else toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, month, year])

  const downloadCsv = () => {
    if (!sheet) return
    const header = [
      "Date", "Day", "Status", "Check in", "Check out",
      "Worked minutes", "Late minutes", "Overtime minutes",
    ]
    const rows = sheet.period.days.map((day) => {
      const cell = sheet.days[day.date]
      return [
        day.date,
        day.label,
        cell?.status ?? "",
        cell?.check_in ? formatTime(cell.check_in) : "",
        cell?.check_out ? formatTime(cell.check_out) : "",
        cell?.worked_minutes ?? "",
        cell?.late_minutes ?? 0,
        cell?.overtime_minutes ?? 0,
      ]
    })
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${sheet.employee.employee_code}-${year}-${String(month).padStart(2, "0")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <HrPage
      title={sheet ? sheet.employee.name : "Employee attendance"}
      description={
        sheet
          ? `${sheet.employee.employee_code}${sheet.employee.department ? ` · ${sheet.employee.department}` : ""}${sheet.employee.designation ? ` · ${sheet.employee.designation}` : ""}`
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => navigate(HR_MONTHLY_SHEET)}>
          <IconArrowLeft className="h-4 w-4" />
          Monthly sheet
        </Button>

        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={downloadCsv}
          disabled={!sheet}
          className="ml-auto"
        >
          <IconDownload className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notFound ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No such employee, or they are not visible to HR.
          </CardContent>
        </Card>
      ) : !sheet ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Could not load this employee's attendance.
          </CardContent>
        </Card>
      ) : (
        <>
          <EmployeeCard sheet={sheet} />

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
            <StatTile label="Present" value={sheet.totals.present_days} tone="emerald" />
            <StatTile
              label="Late"
              value={sheet.totals.late_days}
              tone={sheet.totals.late_days ? "amber" : "default"}
              hint={sheet.totals.late_minutes ? `${sheet.totals.late_minutes} min total` : undefined}
            />
            <StatTile
              label="Absent"
              value={sheet.totals.absent_days}
              tone={sheet.totals.absent_days ? "red" : "default"}
            />
            <StatTile
              label="Hours"
              value={sheet.totals.worked_hours}
              hint={`of ${sheet.totals.expected_hours} expected`}
            />
            <StatTile
              label="Payable Days"
              value={sheet.totals.payable_days}
              hint={
                sheet.totals.late_penalty_days
                  ? `after ${sheet.totals.late_penalty_days} penalty`
                  : undefined
              }
            />
            <StatTile
              label="Attendance"
              value={`${sheet.totals.attendance_rate}%`}
              tone={sheet.totals.attendance_rate < 80 ? "red" : "teal"}
            />
          </div>

          <TrackingNotice period={sheet.period} />

          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="punches">Punch Log ({sheet.total})</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <CalendarView sheet={sheet} />
            </TabsContent>

            <TabsContent value="punches" className="mt-4">
              <PunchLog records={sheet.records} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </HrPage>
  )
}

function EmployeeCard({ sheet }: { sheet: Sheet }) {
  const e = sheet.employee
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4 text-sm">
        <Field label="Employee">
          {e.name} <span className="text-muted-foreground">({e.employee_code})</span>
        </Field>
        <Field label="Status">
          <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
        </Field>
        <Field label="Department">{e.department ?? "—"}</Field>
        <Field label="Designation">{e.designation ?? "—"}</Field>
        <Field label="Shift">
          {e.shift ? `${e.shift.name} · ${e.shift.start_time}–${e.shift.end_time}` : "—"}
        </Field>
        <Field label="Joined">{formatDate(e.date_of_joining)}</Field>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{children}</p>
    </div>
  )
}

/**
 * Says out loud where the numbers start. Absence is inferred from a missing
 * record, so before the system was recording a blank day means nobody was
 * writing rows — not that this person did not come to work.
 */
function TrackingNotice({ period }: { period: Sheet["period"] }) {
  if (period.tracking_start <= period.from) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950">
      <IconInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
      <p className="text-sky-800 dark:text-sky-200">
        Attendance recording began on <strong>{formatDate(period.tracking_start)}</strong>. Days
        before that are left out of the totals — no records exist for them, which is not the same
        as not attending.
      </p>
    </div>
  )
}

/** The month as a row of day tiles, each showing status and the punch pair. */
function CalendarView({ sheet }: { sheet: Sheet }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {MONTHS[Number(sheet.period.from.slice(5, 7)) - 1]} {sheet.period.from.slice(0, 4)}
        </CardTitle>
        <CardDescription>
          {sheet.policy.working_week} · late after {sheet.policy.late_after} ·{" "}
          {sheet.policy.lates_per_half_day} lates count as half a day
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {sheet.period.days.map((day) => {
            const cell = sheet.days[day.date]
            const style = cell?.status ? CELL[cell.status] : null
            return (
              <div
                key={day.date}
                className={cn(
                  "rounded-lg border p-2.5",
                  day.is_future && "opacity-40",
                  day.is_week_off && "bg-muted/40",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{day.day}</span>
                </div>

                <div
                  className={cn(
                    "mt-1.5 rounded px-1.5 py-1 text-center text-xs font-medium",
                    style ? style.className : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {day.is_holiday
                    ? day.holiday_name || "Holiday"
                    : (style?.label ?? (day.is_future ? "—" : "No record"))}
                </div>

                {cell?.check_in && (
                  <p className="mt-1.5 text-center text-xs tabular-nums text-muted-foreground">
                    {formatTime(cell.check_in)} – {cell.check_out ? formatTime(cell.check_out) : "…"}
                  </p>
                )}
                {Boolean(cell?.late_minutes) && (
                  <p className="text-center text-xs text-amber-600">{cell.late_minutes}m late</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-3">
          {Object.entries(CELL).map(([key, v]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("rounded px-1.5 py-0.5 font-medium", v.className)}>{v.letter}</span>
              {v.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * The stored rows as they are. The calendar above is the interpretation; this
 * is the evidence — exact stamps, where the punch was made from, and whether
 * it came from the web, a phone, a door terminal or HR's own hand. It is what
 * a disputed day gets settled with.
 */
function PunchLog({ records }: { records: AttendanceRecordRow[] }) {
  if (!records.length) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No punches recorded in this period.
        </CardContent>
      </Card>
    )
  }

  const maps = (lat: number | null, lng: number | null) =>
    lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Punch log</CardTitle>
        <CardDescription>The stored records behind the calendar</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">In</th>
                <th className="px-3 py-2.5 text-left font-medium">Out</th>
                <th className="px-3 py-2.5 text-right font-medium">Worked</th>
                <th className="px-3 py-2.5 text-right font-medium">Late</th>
                <th className="px-3 py-2.5 text-right font-medium">Overtime</th>
                <th className="px-3 py-2.5 text-left font-medium">Source</th>
                <th className="px-3 py-2.5 text-left font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const inMap = maps(r.check_in_lat, r.check_in_lng)
                const outMap = maps(r.check_out_lat, r.check_out_lng)
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(r.attendance_date)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          CELL[r.status]?.className ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {CELL[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {formatTime(r.check_in)}
                        {inMap && (
                          <a href={inMap} target="_blank" rel="noreferrer" title="Where this punch was made">
                            <IconMapPin className="h-3.5 w-3.5 text-muted-foreground hover:text-teal-600" />
                          </a>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {formatTime(r.check_out)}
                        {outMap && (
                          <a href={outMap} target="_blank" rel="noreferrer" title="Where this punch was made">
                            <IconMapPin className="h-3.5 w-3.5 text-muted-foreground hover:text-teal-600" />
                          </a>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.worked_minutes != null ? `${Math.floor(r.worked_minutes / 60)}h ${r.worked_minutes % 60}m` : "—"}
                    </td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums", r.late_minutes && "text-amber-600")}>
                      {r.late_minutes ? `${r.late_minutes}m` : "—"}
                    </td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums", r.overtime_minutes && "text-emerald-600")}>
                      {r.overtime_minutes ? `${r.overtime_minutes}m` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.remarks ?? "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmployeeAttendance
