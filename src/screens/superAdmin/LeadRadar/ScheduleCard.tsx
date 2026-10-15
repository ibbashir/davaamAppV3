import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendarTime, IconExternalLink } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { RUN_KIND, type AgentSchedule, type SchedulePhase, type TodayRun } from "./api"

/** Pakistan is UTC+5 all year — no daylight saving — so hours convert by a fixed offset. */
const PKT_OFFSET_H = 5
const HOURS = Array.from({ length: 24 }, (_, h) => h)

const pktParts = (epoch: number) => {
  const d = new Date((epoch + PKT_OFFSET_H * 3600) * 1000)
  return { h: d.getUTCHours(), m: d.getUTCMinutes(), day: Math.floor((epoch + PKT_OFFSET_H * 3600) / 86400) }
}

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "am" : "pm"
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve}${suffix}`
}

const fmtDay = (epoch: number) =>
  new Date(epoch * 1000).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", weekday: "short", day: "2-digit", month: "short" })
const fmtClock = (epoch: number) =>
  new Date(epoch * 1000).toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })

const countdown = (seconds: number) => {
  if (seconds <= 0) return "starting now"
  const d = Math.floor(seconds / 86400)
  if (d >= 2) return `in ${d} days`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`
}

const phaseTimes = (p: SchedulePhase) =>
  [...p.hours_utc].map((h) => (h + PKT_OFFSET_H) % 24).sort((a, b) => a - b).map(hourLabel).join(", ")

const RUN_DOT: Record<string, string> = {
  agent: "bg-teal-600",
  test: "bg-violet-500",
  resend: "bg-amber-500",
}

/**
 * When the cloud agent runs: the next run with a live countdown, a 24-hour
 * timeline of today in Pakistan time (scheduled hour, runs that happened, now),
 * and the next week of runs. The schedule is set on the routine, not here.
 */
export function ScheduleCard({ schedule, todayRuns }: { schedule: AgentSchedule; todayRuns: TodayRun[] }) {
  // The page can stay open for hours, so the clock moves on its own.
  // Starts from the server's time so a wrong laptop clock does not skew it.
  const offset = React.useMemo(() => schedule.server_time - Math.floor(Date.now() / 1000), [schedule.server_time])
  const [now, setNow] = React.useState(() => Math.floor(Date.now() / 1000) + offset)
  React.useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000) + offset), 30_000)
    return () => clearInterval(t)
  }, [offset])

  const upcoming = schedule.next_runs.filter((t) => t > now - 60)
  const next = upcoming[0]
  const scheduledPkt = schedule.hours_utc.map((h) => (h + PKT_OFFSET_H) % 24)
  const nowPkt = pktParts(now)
  const nowPct = ((nowPkt.h * 60 + nowPkt.m) / (24 * 60)) * 100
  const spare = schedule.max_runs_per_day - schedule.hours_utc.length

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconCalendarTime className="h-4 w-4 text-teal-600" /> Agent schedule
          </CardTitle>
          <CardDescription>All times in Pakistan time. The agent starts within a few minutes of the scheduled time.</CardDescription>
        </div>
        <a
          href={schedule.routine_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
        >
          Change schedule on claude.ai <IconExternalLink className="h-3 w-3" />
        </a>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* The plan: which phase is on now, and when it changes */}
        <div className="grid gap-2 sm:grid-cols-2">
          {schedule.phases.map((p) => {
            const active = (p.from == null || now >= p.from) && (p.until == null || now < p.until)
            const ended = p.until != null && now >= p.until
            return (
              <div
                key={p.label}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  active ? "border-teal-300 bg-teal-50" : ended ? "opacity-60" : "bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    active ? "bg-teal-600 text-white" : ended ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-600",
                  )}>
                    {active ? "Now" : ended ? "Finished" : "Next"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.hours_utc.length} runs a day at {phaseTimes(p)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.from == null && p.until != null && `Until ${fmtDay(p.until)}`}
                  {p.from != null && p.until == null && `From ${fmtDay(p.from)} onwards`}
                  {p.from != null && p.until != null && `${fmtDay(p.from)} – ${fmtDay(p.until)}`}
                  {active && p.until != null && ` · changes ${countdown(p.until - now)}`}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          {/* Next run + today's timeline */}
          <div className="space-y-4">
            {next && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next run</span>
                <span className="text-xl font-semibold">
                  {pktParts(next).day === nowPkt.day ? "Today" : pktParts(next).day === nowPkt.day + 1 ? "Tomorrow" : fmtDay(next)}
                  {", "}{fmtClock(next)}
                </span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">{countdown(next - now)}</span>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Today, hour by hour</p>
              <div className="relative">
                {/* Runs that happened today, placed at the minute they ran */}
                <div className="relative mb-1 h-4">
                  {todayRuns.map((r) => {
                    const p = pktParts(r.created_at)
                    const left = ((p.h * 60 + p.m) / (24 * 60)) * 100
                    return (
                      <span
                        key={r.id}
                        title={`${RUN_KIND[r.kind] ?? r.kind} at ${fmtClock(r.created_at)} · ${r.emailed_count} emailed (${r.email_status})`}
                        className={cn("absolute top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-white", RUN_DOT[r.kind] ?? "bg-slate-400")}
                        style={{ left: `${left}%` }}
                      />
                    )
                  })}
                </div>

                {/* 24 hourly slots */}
                <div className="grid gap-px overflow-hidden rounded-md border bg-slate-200" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {HOURS.map((h) => {
                    const scheduled = scheduledPkt.includes(h)
                    const past = h < nowPkt.h
                    return (
                      <div
                        key={h}
                        title={scheduled ? `Scheduled run at ${hourLabel(h)}` : `${hourLabel(h)}: free slot, the agent can be scheduled here`}
                        className={cn(
                          "h-9",
                          scheduled ? "bg-teal-600" : past ? "bg-slate-100" : "bg-white",
                        )}
                      />
                    )
                  })}
                </div>

                {/* Current time */}
                <div className="pointer-events-none absolute bottom-0 top-5 w-0.5 bg-red-500" style={{ left: `${nowPct}%` }}>
                  <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
                </div>

                {/* Hour labels every 3 hours */}
                <div className="mt-1 grid text-[10px] text-muted-foreground" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {HOURS.map((h) => (
                    <span key={h} className={cn("truncate", h % 3 !== 0 && "invisible")}>{hourLabel(h)}</span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded-sm bg-teal-600" /> Scheduled run</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded-sm border bg-white" /> Free hour (can be scheduled)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded-sm bg-slate-100" /> Already passed today</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-red-500" /> Now</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Agent ran</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Test email</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Resend</span>
              </div>
            </div>
          </div>

          {/* Next 7 runs */}
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Upcoming runs</p>
            <ol className="space-y-1.5 text-sm">
              {upcoming.slice(0, 8).map((t, i) => (
                <li key={t} className={cn("flex items-center justify-between gap-2", i === 0 && "font-semibold text-teal-700")}>
                  <span>{fmtDay(t)}</span>
                  <span className="tabular-nums">{fmtClock(t)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <b className="text-foreground">When it can run:</b> any whole hour of the day. Your Claude Pro plan allows up to{" "}
          {schedule.max_runs_per_day} routine runs a day, at least {schedule.min_interval_hours} hour apart. The schedule uses{" "}
          {schedule.hours_utc.length} of them, so {spare > 0 ? `${spare} more could be added` : "there is no room for more"}.
          Every run, including one started by hand, comes out of the plan's normal usage, so extra runs leave less for everyday work.
        </div>
      </CardContent>
    </Card>
  )
}
