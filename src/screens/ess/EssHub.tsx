import * as React from "react"
import { useNavigate } from "react-router-dom"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconLoader2,
  IconLogin2,
  IconLogout2,
  IconAlertCircle,
  IconCalendarEvent,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  errorMessage,
  statusClass,
  humanise,
  formatTime,
  formatMinutes,
  formatDate,
} from "@/components/hr/hr-api"
import { usePunch } from "@/components/hr/use-punch"
import { RemoteCheckoutButton } from "@/components/hr/RemoteCheckout"
import { GeofenceNotice } from "@/components/hr/GeofenceNotice"
import type { EssDashboard, Holiday } from "@/Types/hr"
import { ESS_ATTENDANCE, ESS_LEAVE, ESS_REQUESTS, MSS_TEAM } from "@/constants/Constant"

/**
 * Shown when a dashboard user has no linked employee record. This is the normal
 * state until HR links their account, so it explains the fix rather than
 * reading as an error.
 */
export function NotLinked({ message }: { message?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <IconAlertCircle className="h-8 w-8 text-amber-500" />
        <div>
          <p className="font-medium">Self service isn't set up for your account yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {message ??
              "Ask HR to link your dashboard login to your employee profile in Employee Management. Once linked, you can mark attendance, apply for leave and file expenses here."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const EssHub = () => {
  const navigate = useNavigate()
  const [data, setData] = React.useState<EssDashboard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [linkError, setLinkError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await essGet<{ data: EssDashboard }>("/dashboard")
      setData(res.data)
      setLinkError(null)
    } catch (err) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string } } }
      if (anyErr?.response?.status === 404) {
        setLinkError(anyErr.response.data?.message ?? null)
      } else {
        toast.error(errorMessage(err, "Could not load your self-service hub"))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const { punch, punching } = usePunch(load)

  if (loading) {
    return (
      <HrPage title="My Hub">
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </HrPage>
    )
  }

  if (linkError || !data) {
    return (
      <HrPage title="My Hub">
        <NotLinked message={linkError ?? undefined} />
      </HrPage>
    )
  }

  const { employee, today, this_month: month } = data

  return (
    <HrPage title="My Hub">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">{employee.name}</p>
            <p className="text-sm text-muted-foreground">
              {[employee.designation, employee.department].filter(Boolean).join(" · ") || employee.employee_code}
            </p>
            {employee.manager && (
              <p className="mt-0.5 text-xs text-muted-foreground">Reports to {employee.manager}</p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2 text-sm">
              {today.status && (
                <Badge variant="outline" className={cn("font-medium", statusClass(today.status))}>
                  {humanise(today.status)}
                </Badge>
              )}
              <span className="text-muted-foreground">
                In {formatTime(today.check_in)} · Out {formatTime(today.check_out)}
              </span>
            </div>

            {/* Offered only mid-shift: nothing to ask for before check-in, and
                nothing left to ask for after check-out. */}
            {today.checked_in && !today.checked_out && (
              <RemoteCheckoutButton pending={today.checkout_request} onDone={load} />
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => punch("in")}
                disabled={punching || today.checked_in}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <IconLogin2 className="h-4 w-4" />
                Check in
              </Button>
              <Button
                onClick={() => punch("out")}
                disabled={punching || !today.checked_in || today.checked_out}
                variant="outline"
              >
                <IconLogout2 className="h-4 w-4" />
                Check out
              </Button>
            </div>

            {employee.shift && (
              <p className="text-xs text-muted-foreground">
                Shift {employee.shift.name} · {employee.shift.start_time}–{employee.shift.end_time}
              </p>
            )}

            <div className="max-w-sm sm:text-right">
              <GeofenceNotice geofence={data.geofence} />
            </div>
          </div>
        </CardContent>
      </Card>

      <HolidayBanner holidays={data.holidays ?? []} />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Present This Month" value={month.present_days} tone="emerald" />
        <StatTile label="Leave Taken" value={month.leave_days} tone="teal" />
        <StatTile label="Absent" value={month.absent_days} tone={month.absent_days ? "red" : "default"} />
        <StatTile label="Late" value={formatMinutes(month.late_minutes)} tone={month.late_minutes ? "amber" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Leave Balances</CardTitle>
            <CardDescription>Available days for this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.leave_balances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leave types configured yet.
              </p>
            ) : (
              data.leave_balances.map((b) => (
                <div
                  key={b.leave_type_id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span>{b.leave_type}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold text-teal-600">{b.available}</span>
                    <span className="text-muted-foreground"> / {b.entitled}</span>
                  </span>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate(ESS_LEAVE)}>
              Apply for leave
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My Items</CardTitle>
            <CardDescription>Requests you have open</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Pending leave requests" value={data.pending.leave} onClick={() => navigate(ESS_LEAVE)} />
            <Row label="Pending expense claims" value={data.pending.expense} onClick={() => navigate(ESS_REQUESTS)} />
            <Row label="Open help desk tickets" value={data.pending.tickets} onClick={() => navigate(ESS_REQUESTS)} />
            <Row label="Onboarding tasks" value={data.pending.onboarding_tasks} onClick={() => navigate(ESS_REQUESTS)} />
            <Row label="Assets in my custody" value={data.assets_held} onClick={() => navigate(ESS_REQUESTS)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Holidays</CardTitle>
            <CardDescription>Company holiday calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.holidays ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No holidays scheduled. HR will announce the next one here.
              </p>
            ) : (
              (data.holidays ?? []).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.holiday_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {h.is_optional && (
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                    )}
                    <span className="text-xs font-medium text-teal-600">{holidayWhen(h)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate(ESS_ATTENDANCE)}>
          My attendance
        </Button>
        {data.is_manager && (
          <Button variant="outline" onClick={() => navigate(MSS_TEAM)}>
            My team ({data.direct_reports})
          </Button>
        )}
      </div>
    </HrPage>
  )
}

/**
 * Whole days between today and a holiday, on calendar dates rather than
 * elapsed hours — "tomorrow" has to stay tomorrow at 23:00 tonight, which a
 * millisecond difference divided by 86,400,000 would round away.
 */
function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number)
  const now = new Date()
  const target = Date.UTC(y, (m ?? 1) - 1, d ?? 1)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86_400_000)
}

/** "Today" / "Tomorrow" / "in 12 days" */
function holidayWhen(holiday: Holiday): string {
  const days = holiday.is_today ? 0 : daysUntil(holiday.holiday_date)
  if (days <= 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `in ${days} days`
}

/**
 * Announces a holiday that is today or tomorrow, at the top of the hub.
 *
 * The notification bell already carries the announcement from the moment HR
 * saves it, but a holiday added months ahead has long scrolled out of the bell
 * by the time it matters — this is the reminder on the day it lands.
 */
function HolidayBanner({ holidays }: { holidays: Holiday[] }) {
  const imminent = holidays.find((h) => h.is_today || daysUntil(h.holiday_date) === 1)
  if (!imminent) return null

  const when = holidayWhen(imminent)

  return (
    <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950">
      <IconCalendarEvent className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
          {when === "Today" ? `Today is ${imminent.name}` : `${imminent.name} is tomorrow`}
          <span className="font-normal text-teal-700 dark:text-teal-300">
            {" "}· {formatDate(imminent.holiday_date)}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-teal-700 dark:text-teal-300">
          {imminent.is_optional
            ? "This holiday is optional — mark your attendance as usual if you are working."
            : "Offices are closed and no attendance is required."}
          {imminent.description ? ` ${imminent.description}` : ""}
        </p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <span>{label}</span>
      <Badge
        variant="outline"
        className={value > 0 ? "bg-teal-100 text-teal-700 border-teal-200" : "bg-slate-100 text-slate-500 border-slate-200"}
      >
        {value}
      </Badge>
    </button>
  )
}

export default EssHub
