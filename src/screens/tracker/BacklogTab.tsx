import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  fetchBacklog, createSprint, updateSprint, deleteSprint, moveIssue, isTrackerManager,
} from "@/components/tracker/tracker-api"
import { useAuth } from "@/contexts/AuthContext"
import { TypeBadge, PriorityBadge, StatusBadge, IssueKey, DueDate, Points, Empty, AssigneeStack } from "@/components/tracker/IssueBits"
import { IssueDialog } from "@/components/tracker/IssueDialog"
import { cn } from "@/lib/utils"
import type { BacklogData, Issue, Sprint, TrackerUser, SprintStatus } from "@/Types/tracker"

const SPRINT_TONE: Record<SprintStatus, string> = {
  planned: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-400 border-slate-200",
}

function Row({ issue, sprints, onOpen, onMove }: {
  issue: Issue
  sprints: Sprint[]
  onOpen: () => void
  onMove: (sprintId: number | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 last:border-0 hover:bg-muted/50">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <IssueKey issue={issue} />
        <TypeBadge type={issue.type} />
        <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <Points points={issue.story_points} />
        <DueDate issue={issue} />
        <PriorityBadge priority={issue.priority} />
        <StatusBadge status={issue.status} />
        <AssigneeStack issue={issue} />
        {/* Moving between sprints is the whole job of this screen, so it is a
            one-click control here rather than buried in the issue dialog. */}
        <Select
          value={issue.sprint_id ? String(issue.sprint_id) : "backlog"}
          onValueChange={(v) => onMove(v === "backlog" ? null : Number(v))}
        >
          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="backlog">Backlog</SelectItem>
            {sprints.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function SprintDialog({ open, onOpenChange, projectId, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; projectId?: number; onSaved: () => void
}) {
  const [form, setForm] = React.useState({ name: "", goal: "", start_date: "", end_date: "", status: "planned" })
  React.useEffect(() => {
    if (open) setForm({ name: "", goal: "", start_date: "", end_date: "", status: "planned" })
  }, [open])

  const save = async () => {
    if (!form.name.trim()) return toast.error("Give the sprint a name")
    try {
      await createSprint({ ...form, project_id: projectId })
      toast.success("Sprint created")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not create the sprint"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New sprint</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sprint 1" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Goal</Label>
            <Input value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} placeholder="What this sprint is for" />
          </div>
          <div className="grid gap-1.5">
            <Label>Start</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>End</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Create sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BacklogTab({
  projectId, sprints, users, refreshKey, onChanged,
}: {
  projectId?: number; sprints: Sprint[]; users: TrackerUser[]; refreshKey: number; onChanged: () => void
}) {
  const [data, setData] = React.useState<BacklogData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [issueOpen, setIssueOpen] = React.useState(false)
  const [sprintOpen, setSprintOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Issue | null>(null)
  const [createSprintId, setCreateSprintId] = React.useState<string>("backlog")

  // Creating tasks is limited to the project leads; the API enforces it too.
  const { state } = useAuth()
  const canCreate = isTrackerManager(state?.user?.email)

  const load = React.useCallback(() => {
    setLoading(true)
    fetchBacklog({ project_id: projectId })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load the backlog")))
      .finally(() => setLoading(false))
  }, [projectId])

  React.useEffect(() => { load() }, [load, refreshKey])

  const move = async (issue: Issue, sprintId: number | null) => {
    try {
      await moveIssue(issue.id, { sprint_id: sprintId })
      load(); onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not move the issue"))
    }
  }

  const removeSprint = async (sprint: Sprint) => {
    if (!window.confirm(`Delete "${sprint.name}"? Its issues return to the backlog.`)) return
    try {
      const res = await deleteSprint(sprint.id)
      toast.success(res.message)
      load(); onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the sprint"))
    }
  }

  const setSprintStatus = async (sprint: Sprint, status: SprintStatus) => {
    try {
      await updateSprint(sprint.id, { status })
      load(); onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the sprint"))
    }
  }

  const openCreate = (sprintId: string) => {
    setEditing(null); setCreateSprintId(sprintId); setIssueOpen(true)
  }

  if (loading && !data) {
    return <div className="flex h-56 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Work with no sprint sits in the backlog. Move it into a sprint to commit to it.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSprintOpen(true)}>
          <IconPlus className="mr-1 h-4 w-4" /> New sprint
        </Button>
      </div>

      {(data?.sprints ?? []).map((sprint) => (
        <Card key={sprint.id}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <div className="min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {sprint.name}
                <Badge variant="outline" className={cn("font-medium", SPRINT_TONE[sprint.status])}>
                  {sprint.status}
                </Badge>
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sprint.issues.length} issue(s) · {sprint.points} point(s) · {sprint.done} done
                {sprint.start_date && ` · ${sprint.start_date} → ${sprint.end_date ?? "?"}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Select value={sprint.status} onValueChange={(v) => setSprintStatus(sprint, v as SprintStatus)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["planned", "active", "completed"] as SprintStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => removeSprint(sprint)} className="text-red-600">
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {sprint.issues.length === 0 ? (
              <p className="px-6 pb-2 text-sm text-muted-foreground">Nothing committed yet.</p>
            ) : (
              sprint.issues.map((i) => (
                <Row key={i.id} issue={i} sprints={sprints}
                  onOpen={() => { setEditing(i); setIssueOpen(true) }}
                  onMove={(s) => move(i, s)} />
              ))
            )}
            {canCreate && (
              <Button variant="ghost" size="sm" className="ml-3 mt-1 text-muted-foreground"
                onClick={() => openCreate(String(sprint.id))}>
                <IconPlus className="mr-1 h-4 w-4" /> Add issue
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Backlog</CardTitle>
          <p className="text-xs text-muted-foreground">{data?.backlog.length ?? 0} unplanned issue(s)</p>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {!data?.backlog.length ? (
            <div className="px-6"><Empty message="Backlog is empty." /></div>
          ) : (
            data.backlog.map((i) => (
              <Row key={i.id} issue={i} sprints={sprints}
                onOpen={() => { setEditing(i); setIssueOpen(true) }}
                onMove={(s) => move(i, s)} />
            ))
          )}
          {canCreate && (
            <Button variant="ghost" size="sm" className="ml-3 mt-1 text-muted-foreground"
              onClick={() => openCreate("backlog")}>
              <IconPlus className="mr-1 h-4 w-4" /> Add issue
            </Button>
          )}
        </CardContent>
      </Card>

      <IssueDialog
        open={issueOpen} onOpenChange={setIssueOpen} issue={editing}
        projectId={projectId} sprints={sprints} users={users}
        defaults={{ sprint_id: createSprintId }}
        onSaved={() => { load(); onChanged() }}
      />
      <SprintDialog open={sprintOpen} onOpenChange={setSprintOpen} projectId={projectId}
        onSaved={() => { load(); onChanged() }} />
    </div>
  )
}
