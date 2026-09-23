import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatTile } from "@/components/hr/HrPage"
import { IconLoader2, IconChecklist, IconAlertTriangle, IconUserOff } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchSummary, STATUS_LABEL, PRIORITY_STYLE, userName, COLOR_BADGE, statusColor } from "@/components/tracker/tracker-api"
import { TypeBadge, StatusBadge, IssueKey, Empty, AssigneeStack } from "@/components/tracker/IssueBits"
import { cn } from "@/lib/utils"
import type { SummaryData } from "@/Types/tracker"

/** Horizontal proportion bar — one segment per bucket, zero-count ones dropped. */
function Bar({ items, styles, labels = {} }: {
  items: Array<{ key: string; count: number }>
  styles: Record<string, string>
  /** Column names, when the caller has them — otherwise the key is humanised. */
  labels?: Record<string, string>
}) {
  const total = items.reduce((s, i) => s + i.count, 0)
  if (!total) return <p className="text-sm text-muted-foreground">Nothing yet.</p>
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {items.filter((i) => i.count > 0).map((i) => (
          <div
            key={i.key}
            title={`${i.key}: ${i.count}`}
            className={cn("h-full", styles[i.key]?.split(" ")[0] ?? "bg-slate-300")}
            style={{ width: `${(i.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map((i) => (
          <div key={i.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", styles[i.key]?.split(" ")[0] ?? "bg-slate-300")} />
              {labels[i.key] ?? STATUS_LABEL[i.key]}
            </span>
            <span className="font-medium tabular-nums">{i.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SummaryTab({ projectId, refreshKey }: { projectId?: number; refreshKey: number }) {
  const [data, setData] = React.useState<SummaryData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSummary({ project_id: projectId })
      .then((r) => { if (!cancelled) setData(r.data) })
      .catch((err) => toast.error(errorMessage(err, "Could not load the summary")))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, refreshKey])

  if (loading) {
    return <div className="flex h-56 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }
  if (!data?.totals?.total && !data?.recent?.length) {
    return <Empty message="No issues yet. Create one from the Backlog or Board tab." />
  }

  const t = data.totals

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Total Issues" value={t.total} icon={IconChecklist} tone="teal" />
        <StatTile label="Open" value={t.open} tone="amber" />
        <StatTile label="Done" value={t.done} hint={`${t.completion}% complete`} tone="emerald" />
        <StatTile label="Overdue" value={t.overdue} icon={IconAlertTriangle} tone={t.overdue ? "red" : "default"} />
        <StatTile label="Unassigned" value={t.unassigned} icon={IconUserOff} tone={t.unassigned ? "amber" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By status</CardTitle></CardHeader>
          <CardContent>
            <Bar
              items={data.by_status}
              styles={Object.fromEntries(
                data.by_status.map((s) => [s.key, COLOR_BADGE[statusColor(s.key, data.columns)]]),
              )}
              labels={Object.fromEntries((data.columns ?? []).map((c) => [c.key, c.name]))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By priority</CardTitle></CardHeader>
          <CardContent>
            <Bar
              items={data.by_priority}
              styles={Object.fromEntries(Object.entries(PRIORITY_STYLE).map(([k, v]) => [k, v.className]))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Workload</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {data.by_assignee.length === 0 && <p className="text-sm text-muted-foreground">Nobody assigned yet.</p>}
            {data.by_assignee.map((a) => (
              <div key={a.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.done}/{a.total} done</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${a.total ? (a.done / a.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing updated yet.</p>}
            {data.recent.map((i) => (
              <div key={i.id} className="flex items-start gap-2.5">
                <AssigneeStack issue={i} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <IssueKey issue={i} />
                    <TypeBadge type={i.type} />
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="truncate text-sm">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {userName(i.assignee)} · {new Date(i.updated_at).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
