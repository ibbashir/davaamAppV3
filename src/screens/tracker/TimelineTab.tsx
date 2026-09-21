import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchTimeline, STATUS_LABEL, userName, isOverdue } from "@/components/tracker/tracker-api"
import { TypeBadge, Avatar, IssueKey, Empty } from "@/components/tracker/IssueBits"
import { IssueDialog } from "@/components/tracker/IssueDialog"
import { cn } from "@/lib/utils"
import type { TimelineData, Issue, IssueStatus, Sprint, TrackerUser } from "@/Types/tracker"

const BAR_COLOR: Record<IssueStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  done: "bg-emerald-500",
}

const DAY = 86_400_000
/** Width of the fixed label column. Every layer below is laid out against it. */
const LABEL_W = 260
/** Narrowest a tick label may sit from its neighbour before they read as noise. */
const MIN_TICK_PX = 44
/** Intl's en-GB gives "Sept" for September and three letters for everything
 *  else, so the ruler jumps width month to month. Fixed list instead. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const startOfDay = (v: string | Date) => { const d = new Date(v); d.setHours(0, 0, 0, 0); return d }
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY)

export default function TimelineTab({
  projectId, sprints, users, refreshKey, onChanged,
}: {
  projectId?: number; sprints: Sprint[]; users: TrackerUser[]; refreshKey: number; onChanged: () => void
}) {
  const [data, setData] = React.useState<TimelineData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Issue | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    fetchTimeline({ project_id: projectId })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load the timeline")))
      .finally(() => setLoading(false))
  }, [projectId])

  React.useEffect(() => { load() }, [load, refreshKey])

  /**
   * The drawing window: the issue range padded either side so a bar never sits
   * flush against an edge. Padding scales with the span — two days of padding
   * is invisible on a year-long plan and swamps a one-week one.
   */
  const scale = React.useMemo(() => {
    if (!data?.range) return null
    const rawFrom = startOfDay(data.range.from)
    const rawTo = startOfDay(data.range.to)
    const pad = Math.max(1, Math.round(daysBetween(rawFrom, rawTo) * 0.04))
    const from = new Date(rawFrom); from.setDate(from.getDate() - pad)
    const to = new Date(rawTo); to.setDate(to.getDate() + pad)
    const span = Math.max(daysBetween(from, to), 1)
    return { from, to, span, pct: (d: Date) => (daysBetween(from, startOfDay(d)) / span) * 100 }
  }, [data?.range])

  /**
   * The ruler is measured, not guessed. Tick spacing has to be decided against
   * real pixels: the same 14 labels that are comfortable on a wide screen
   * collide into each other at 760px, which is what made the dates unreadable.
   */
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  const [trackW, setTrackW] = React.useState(520)
  React.useEffect(() => {
    const el = trackRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setTrackW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /**
   * Two tiers, the way a gantt header normally reads: a coarse band naming the
   * month (or year), and a fine band carrying bare numbers under it. Repeating
   * "13 Sept / 14 Sept / 15 Sept" on every tick was the noise — the month only
   * needs saying once per month.
   */
  const ruler = React.useMemo(() => {
    if (!scale) return null
    const maxTicks = Math.max(2, Math.floor(trackW / MIN_TICK_PX))

    // Day steps first, then weeks, then whole months — the first that fits wins.
    const DAY_STEPS = [1, 2, 3, 5, 7, 14]
    let unit: "day" | "month" = "day"
    let step = DAY_STEPS[DAY_STEPS.length - 1]
    const fits = DAY_STEPS.find((d) => scale.span / d <= maxTicks)
    if (fits) {
      step = fits
    } else {
      unit = "month"
      // Months are uneven, so step counts months and is applied by date maths.
      const months = scale.span / 30.44
      step = Math.max(1, Math.ceil(months / maxTicks))
    }

    const ticks: Array<{ label: string; left: number }> = []
    const push = (d: Date, label: string) => {
      const left = scale.pct(d)
      if (left >= -0.5 && left <= 100.5) ticks.push({ label, left })
    }

    if (unit === "day") {
      const cur = new Date(scale.from)
      // Anchor weekly-or-wider steps to a Monday so the numbers are predictable.
      if (step >= 7) cur.setDate(cur.getDate() + ((8 - cur.getDay()) % 7))
      while (cur <= scale.to) {
        push(cur, String(cur.getDate()))
        cur.setDate(cur.getDate() + step)
      }
    } else {
      const cur = new Date(scale.from.getFullYear(), scale.from.getMonth(), 1)
      while (cur <= scale.to) {
        if (cur >= scale.from) push(cur, MONTHS[cur.getMonth()])
        cur.setMonth(cur.getMonth() + step)
      }
    }

    // Coarse band: months when ticking days, years when ticking months.
    const segments: Array<{ label: string; left: number; width: number }> = []
    const cur = unit === "day"
      ? new Date(scale.from.getFullYear(), scale.from.getMonth(), 1)
      : new Date(scale.from.getFullYear(), 0, 1)
    while (cur <= scale.to) {
      const next = new Date(cur)
      if (unit === "day") next.setMonth(next.getMonth() + 1)
      else next.setFullYear(next.getFullYear() + 1)

      const left = Math.max(scale.pct(cur), 0)
      const right = Math.min(scale.pct(next), 100)
      const width = right - left
      // A sliver at either end has no room for a label and only adds clutter.
      if (width > 3) {
        segments.push({
          label: unit === "day"
            ? `${MONTHS[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`
            : String(cur.getFullYear()),
          left,
          width,
        })
      }
      cur.setTime(next.getTime())
    }

    return { ticks, segments, unit }
  }, [scale, trackW])

  if (loading && !data) {
    return <div className="flex h-56 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }

  if (!data?.rows.length || !scale) {
    return (
      <Empty message={
        data?.undated
          ? `No issue has a start or due date yet — ${data.undated} issue(s) are undated. Add dates to see them here.`
          : "Nothing to plot yet. Give an issue a start or due date."
      } />
    )
  }

  const todayLeft = scale.pct(new Date())
  const todayVisible = todayLeft >= 0 && todayLeft <= 100
  const datedSprints = data.sprints.filter((s) => s.start_date)

  /**
   * Every layer is the same two-column grid, so the ruler, the sprint bands and
   * the bars resolve their percentages against one identical track. Laying the
   * header out with a margin and the rows with flex was what threw the bars out
   * of alignment with the dates above them.
   */
  const GRID = { display: "grid", gridTemplateColumns: `${LABEL_W}px 1fr` } as const

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timeline</CardTitle>
          <p className="text-xs text-muted-foreground">
            {data.rows.length} dated issue(s)
            {data.undated ? ` · ${data.undated} undated and not shown` : ""}
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Ruler — coarse month/year band over a bare-number tick band */}
            <div style={GRID} className="mb-1">
              <div />
              <div>
                <div className="relative h-4">
                  {ruler?.segments.map((seg) => (
                    <div
                      key={seg.label + seg.left}
                      className="absolute top-0 h-4 overflow-hidden whitespace-nowrap border-l border-border pl-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                    >
                      {seg.label}
                    </div>
                  ))}
                </div>
                <div ref={trackRef} className="relative h-4 border-b">
                  {ruler?.ticks.map((t, i) => (
                    <div key={`${t.label}-${i}`} className="absolute top-0 bottom-0" style={{ left: `${t.left}%` }}>
                      <span className="absolute bottom-1 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground">
                        {t.label}
                      </span>
                      <span className="absolute bottom-0 h-1 w-px bg-border" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sprint bands */}
            {datedSprints.length > 0 && (
              <div style={GRID} className="mb-1.5">
                <div className="pr-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sprints
                </div>
                <div className="relative h-5">
                  {datedSprints.map((s) => {
                    const left = scale.pct(new Date(s.start_date as string))
                    const right = scale.pct(new Date(s.end_date ?? (s.start_date as string)))
                    return (
                      <div
                        key={s.id}
                        title={`${s.name}${s.start_date ? ` · ${s.start_date} → ${s.end_date ?? "?"}` : ""}`}
                        className="absolute top-0 h-5 overflow-hidden text-ellipsis whitespace-nowrap rounded border border-dashed border-teal-300 bg-teal-50/70 px-1.5 text-[10px] leading-[18px] text-teal-700"
                        style={{ left: `${left}%`, width: `${Math.max(right - left, 4)}%` }}
                      >
                        {s.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rows, with the today line as an overlay over the track only */}
            <div className="relative">
              {todayVisible && (
                <div
                  className="pointer-events-none absolute inset-y-0 z-10"
                  style={{ left: LABEL_W, right: 0 }}
                >
                  <div className="absolute inset-y-0 w-px bg-red-400" style={{ left: `${todayLeft}%` }}>
                    <span className="absolute -top-px -translate-x-1/2 rounded-sm bg-red-500 px-1 text-[9px] leading-4 text-white">
                      today
                    </span>
                  </div>
                </div>
              )}

              {data.rows.map((row) => {
                const left = scale.pct(new Date(row.span_start))
                const right = scale.pct(new Date(row.span_end))
                const late = isOverdue(row)
                return (
                  <div
                    key={row.id}
                    style={GRID}
                    className="items-center border-b py-1.5 last:border-0 hover:bg-muted/40"
                  >
                    <button
                      onClick={() => { setEditing(row); setOpen(true) }}
                      className="flex min-w-0 items-center gap-1.5 pr-3 text-left"
                    >
                      <Avatar user={row.assignee} />
                      <IssueKey issue={row} />
                      <span className="min-w-0 flex-1 truncate text-xs">{row.title}</span>
                      <TypeBadge type={row.type} />
                    </button>
                    <div className="relative h-5">
                      <div
                        title={`${STATUS_LABEL[row.status]} · ${row.span_start} → ${row.span_end} · ${userName(row.assignee)}`}
                        className={cn(
                          "absolute top-0.5 h-4 min-w-[6px] rounded-full",
                          BAR_COLOR[row.status],
                          late && "ring-2 ring-red-400",
                        )}
                        style={{ left: `${left}%`, width: `${Math.max(right - left, 0.4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(Object.keys(BAR_COLOR) as IssueStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", BAR_COLOR[s])} />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 ring-2 ring-red-400" /> Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-red-400" /> Today
        </span>
      </div>

      <IssueDialog
        open={open} onOpenChange={setOpen} issue={editing}
        projectId={projectId} sprints={sprints} users={users}
        onSaved={() => { load(); onChanged() }}
      />
    </div>
  )
}
