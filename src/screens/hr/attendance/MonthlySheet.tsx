import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconLoader2, IconDownload, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, errorMessage, formatDate, formatTime } from "@/components/hr/hr-api"
import { useHrOptions } from "@/components/hr/useHrOptions"
import type { MonthlySheet as Sheet, MonthlySheetRow, MonthlySheetDay } from "@/Types/hr"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/**
 * One letter per day in the grid. Deliberately terse — a month is up to 31
 * columns wide, so anything longer stops the whole month fitting on screen.
 * Colour carries the same meaning for anyone who cannot read the letter.
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

const csvCell = (value: unknown): string => {
  const s = String(value ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const MonthlySheet = () => {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getMonth() + 1)
  const [year, setYear] = React.useState(now.getFullYear())
  const [departmentId, setDepartmentId] = React.useState("all")
  const [sheet, setSheet] = React.useState<Sheet | null>(null)
  const [loading, setLoading] = React.useState(true)

  const { options } = useHrOptions(["departments"])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await hrGet<Sheet>("/attendance/monthly-sheet", {
          month,
          year,
          department_id: departmentId === "all" ? undefined : departmentId,
        })
        if (!cancelled) setSheet(res)
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Could not load the monthly sheet"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [month, year, departmentId])

  /** One row per employee, one column per day, plus every total. */
  const downloadCsv = () => {
    if (!sheet) return
    const days = sheet.period.days
    const header = [
      "Employee Code", "Name", "Department", "Designation",
      ...days.map((d) => `${d.day} ${d.label}`),
      "Working Days", "Present", "Late", "Half Days", "Leave", "Absent",
      "Worked Hours", "Expected Hours", "Overtime Hours",
      "Late Minutes", "Late Penalty (days)", "Payable Days", "Attendance %",
    ]
    const rows = sheet.data.map((r) => [
      r.employee_code, r.name, r.department ?? "", r.designation ?? "",
      ...days.map((d) => {
        const cell = r.days[d.date]
        if (!cell?.status) return ""
        return CELL[cell.status]?.label ?? cell.status
      }),
      r.totals.working_days, r.totals.present_days, r.totals.late_days,
      r.totals.half_days, r.totals.leave_days, r.totals.absent_days,
      r.totals.worked_hours, r.totals.expected_hours, r.totals.overtime_hours,
      r.totals.late_minutes, r.totals.late_penalty_days, r.totals.payable_days,
      r.totals.attendance_rate,
    ])

    const csv = [header, ...rows].map((line) => line.map(csvCell).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${sheet.period.year}-${String(sheet.period.month).padStart(2, "0")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Sheet downloaded")
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <HrPage
      title="Monthly Attendance Sheet"
      description="Every employee's month at a glance — daily attendance, hours worked, lates, overtime and payable days."
    >
      <div className="flex flex-wrap items-center gap-2">
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

        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {(options.departments ?? []).map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={downloadCsv}
          disabled={!sheet || !sheet.data.length}
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
      ) : !sheet || !sheet.data.length ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No employees to report on for this month.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatTile label="Employees" value={sheet.totals.employees} />
            <StatTile label="Attendance" value={`${sheet.totals.attendance_rate}%`} tone="teal" />
            <StatTile label="Hours Worked" value={sheet.totals.worked_hours} tone="emerald" />
            <StatTile
              label="Late Days"
              value={sheet.totals.late_days}
              tone={sheet.totals.late_days ? "amber" : "default"}
            />
            <StatTile
              label="Absences"
              value={sheet.totals.absent_days}
              tone={sheet.totals.absent_days ? "red" : "default"}
            />
          </div>

          <TrackingNotice period={sheet.period} />

          <Tabs defaultValue="totals">
            <TabsList>
              <TabsTrigger value="totals">Totals</TabsTrigger>
              <TabsTrigger value="grid">Daily Grid</TabsTrigger>
            </TabsList>

            <TabsContent value="totals" className="mt-4">
              <TotalsTable sheet={sheet} />
            </TabsContent>

            <TabsContent value="grid" className="mt-4">
              <DayGrid sheet={sheet} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </HrPage>
  )
}

/**
 * Says out loud where the numbers start, because the sheet infers absence from
 * a missing record: before the system was recording, a blank day means nobody
 * was writing rows, not that nobody came to work.
 */
function TrackingNotice({ period }: { period: Sheet["period"] }) {
  if (period.tracking_start <= period.from) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950">
      <IconInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
      <p className="text-sky-800 dark:text-sky-200">
        Attendance recording began on <strong>{formatDate(period.tracking_start)}</strong>. Days
        before that are left out of the totals — no records exist for them, which is not the same
        as nobody attending.
      </p>
    </div>
  )
}

function TotalsTable({ sheet }: { sheet: Sheet }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Per-employee totals</CardTitle>
        <CardDescription>
          {sheet.period.label} · {sheet.policy.working_week} · late after {sheet.policy.late_after} ·{" "}
          {sheet.policy.lates_per_half_day} lates count as half a day
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-medium">Employee</th>
                <th className="px-3 py-2.5 text-left font-medium">Department</th>
                <Num>Days</Num>
                <Num>Present</Num>
                <Num>Late</Num>
                <Num>Half</Num>
                <Num>Leave</Num>
                <Num>Absent</Num>
                <Num>Hours</Num>
                <Num>Overtime</Num>
                <Num>Penalty</Num>
                <Num>Payable</Num>
                <Num>Attendance</Num>
              </tr>
            </thead>
            <tbody>
              {sheet.data.map((r) => (
                <tr key={r.employee_id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee_code}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.department ?? "—"}</td>
                  <Cell>{r.totals.working_days}</Cell>
                  <Cell>{r.totals.present_days}</Cell>
                  <Cell tone={r.totals.late_days ? "amber" : undefined}>{r.totals.late_days}</Cell>
                  <Cell>{r.totals.half_days}</Cell>
                  <Cell>{r.totals.leave_days}</Cell>
                  <Cell tone={r.totals.absent_days ? "red" : undefined}>{r.totals.absent_days}</Cell>
                  <Cell>{r.totals.worked_hours}</Cell>
                  <Cell tone={r.totals.overtime_hours ? "emerald" : undefined}>
                    {r.totals.overtime_hours}
                  </Cell>
                  <Cell tone={r.totals.late_penalty_days ? "amber" : undefined}>
                    {r.totals.late_penalty_days}
                  </Cell>
                  <Cell>{r.totals.payable_days}</Cell>
                  <Cell tone={r.totals.attendance_rate < 80 ? "red" : "teal"}>
                    {r.totals.attendance_rate}%
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function DayGrid({ sheet }: { sheet: Sheet }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Daily attendance</CardTitle>
        <CardDescription>Hover any day for the exact times</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {/* Sticky so the name stays put while the month scrolls */}
                <th className="sticky left-0 z-10 min-w-44 bg-muted/50 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Employee
                </th>
                {sheet.period.days.map((d) => (
                  <th
                    key={d.date}
                    className={cn(
                      "w-9 px-0 py-2 text-center text-[11px] font-medium",
                      d.is_week_off || d.is_holiday ? "text-muted-foreground" : "text-foreground",
                    )}
                    title={d.holiday_name ?? undefined}
                  >
                    <div>{d.day}</div>
                    <div className="font-normal text-muted-foreground">{d.label.charAt(0)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.data.map((r) => (
                <tr key={r.employee_id} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 bg-background px-3 py-1.5">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee_code}</p>
                  </td>
                  {sheet.period.days.map((d) => (
                    <DayCellView key={d.date} day={d} cell={r.days[d.date]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 border-t px-3 py-3 text-xs text-muted-foreground">
          {Object.entries(CELL).map(([key, c]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded text-[11px] font-semibold",
                  c.className,
                )}
              >
                {c.letter}
              </span>
              {c.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DayCellView({
  day,
  cell,
}: {
  day: MonthlySheetDay
  cell: MonthlySheetRow["days"][string] | undefined
}) {
  const status = cell?.status
  const spec = status ? CELL[status] : null

  const title = spec
    ? [
        `${formatDate(day.date)} — ${spec.label}`,
        cell?.check_in ? `In ${formatTime(cell.check_in)}` : null,
        cell?.check_out ? `Out ${formatTime(cell.check_out)}` : null,
        cell?.late_minutes ? `${cell.late_minutes} min late` : null,
        cell?.overtime_minutes ? `${cell.overtime_minutes} min overtime` : null,
        day.holiday_name,
      ]
        .filter(Boolean)
        .join(" · ")
    : formatDate(day.date)

  return (
    <td className="px-0.5 py-1.5 text-center" title={title}>
      <span
        className={cn(
          "mx-auto grid h-6 w-6 place-items-center rounded text-[11px] font-semibold",
          spec ? spec.className : "text-muted-foreground/40",
        )}
      >
        {spec ? spec.letter : "·"}
      </span>
    </td>
  )
}

const Num = ({ children }: { children: React.ReactNode }) => (
  <th className="px-3 py-2.5 text-right font-medium">{children}</th>
)

const Cell = ({
  children,
  tone,
}: {
  children: React.ReactNode
  tone?: "amber" | "red" | "emerald" | "teal"
}) => {
  const tones = {
    amber: "text-amber-600",
    red: "text-red-600",
    emerald: "text-emerald-600",
    teal: "text-teal-600",
  }
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-right tabular-nums",
        tone ? `font-medium ${tones[tone]}` : undefined,
      )}
    >
      {children}
    </td>
  )
}

export default MonthlySheet
