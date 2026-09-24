import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { useAuth } from "@/contexts/AuthContext"
import {
  createIssue, updateIssue, deleteIssue, addComment, fetchIssue,
  TYPES, PRIORITIES, STATUS_LABEL, userName, fetchColumns, isTrackerManager,
} from "./tracker-api"
import { TypeBadge, PriorityBadge, Avatar, IssueKey } from "./IssueBits"
import type { BoardColumn, Issue, Sprint, TrackerUser } from "@/Types/tracker"

const humanise = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Picks the people a task is shared between.
 *
 * A plain list of toggles rather than a dropdown: the team is small enough to
 * show at once, and a multi-select dropdown hides the current selection behind
 * a click — which is the one thing you want visible while handing work out.
 */
function AssigneePicker({
  users,
  selected,
  onChange,
}: {
  users: TrackerUser[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-xs text-muted-foreground">
          {selected.length === 0
            ? "Unassigned"
            : `${selected.length} ${selected.length === 1 ? "person" : "people"}`}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-44 overflow-y-auto p-1">
        {users.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nobody available to assign.</p>
        )}
        {users.map((u) => {
          const on = selected.includes(u.id)
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              aria-pressed={on}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
                on ? "bg-teal-50" : ""
              }`}
            >
              <input type="checkbox" readOnly checked={on} className="h-3.5 w-3.5 accent-teal-600" />
              <Avatar user={u} />
              <span className="truncate">{userName(u)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A blank form, or an existing issue's values. */
const toForm = (issue?: Issue | null) => ({
  title: issue?.title ?? "",
  description: issue?.description ?? "",
  type: issue?.type ?? "task",
  status: issue?.status ?? "todo",
  priority: issue?.priority ?? "medium",
  // The full set, not just the primary. Falls back to `assignee` so an issue
  // created before tasks could be shared still opens with its person selected.
  assignee_ids: issue?.assignees?.length
    ? issue.assignees.map((u) => u.id)
    : issue?.assignee_id
      ? [issue.assignee_id]
      : ([] as number[]),
  sprint_id: issue?.sprint_id ? String(issue.sprint_id) : "backlog",
  story_points: issue?.story_points != null ? String(issue.story_points) : "",
  start_date: issue?.start_date ?? "",
  due_date: issue?.due_date ?? "",
  branch: issue?.branch ?? "",
  pull_request: issue?.pull_request ?? "",
})

export function IssueDialog({
  open, onOpenChange, issue, projectId, sprints, users, defaults, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Present = edit, absent = create. */
  issue?: Issue | null
  projectId?: number
  sprints: Sprint[]
  users: TrackerUser[]
  /** Pre-set fields when creating from a specific column or sprint. */
  defaults?: Partial<ReturnType<typeof toForm>>
  onSaved: () => void
}) {
  const [form, setForm] = React.useState(toForm(issue))
  const [saving, setSaving] = React.useState(false)
  const [full, setFull] = React.useState<Issue | null>(null)
  // Statuses are per-project columns, so the picker has to be fetched rather
  // than read from a constant.
  const [columns, setColumns] = React.useState<BoardColumn[]>([])
  const [comment, setComment] = React.useState("")
  const editing = Boolean(issue?.id)

  // Editing, assigning and deleting a task are all limited to the project
  // leads. Everyone else opens this dialog to read the task and comment on it,
  // so the fields are disabled and Save/Delete are not offered — the API
  // enforces the same rule, and a button that always 403s is worse than none.
  const { state } = useAuth()
  const canEdit = isTrackerManager(state?.user?.email)

  React.useEffect(() => {
    if (!open) return
    setForm({ ...toForm(issue), ...(issue ? {} : defaults) })
    setComment("")
    setFull(null)
    // Comments only exist on a saved issue, and only the detail route returns them.
    if (issue?.id) {
      fetchIssue(issue.id).then((r) => setFull(r.data)).catch(() => {})
    }
    fetchColumns({ project_id: projectId }).then((r) => setColumns(r.data ?? [])).catch(() => {})
    // defaults is a fresh object literal each render; spreading it here rather
    // than depending on it keeps the effect from re-running every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, issue])

  // Generic over the key so `assignee_ids` can carry a number[] while every
  // other field stays a string.
  type FormShape = ReturnType<typeof toForm>
  const set = <K extends keyof FormShape>(k: K, v: FormShape[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) return toast.error("Give the issue a title")
    setSaving(true)
    try {
      const body = {
        ...form,
        project_id: projectId,
        assignee_ids: form.assignee_ids,
        sprint_id: form.sprint_id === "backlog" ? null : Number(form.sprint_id),
        story_points: form.story_points === "" ? null : Number(form.story_points),
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      }
      if (editing && issue) await updateIssue(issue.id, body)
      else await createIssue(body)
      toast.success(editing ? "Issue updated" : "Issue created")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the issue"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!issue) return
    if (!window.confirm(`Delete ${issue.issue_key}? This cannot be undone.`)) return
    try {
      await deleteIssue(issue.id)
      toast.success("Issue deleted")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the issue"))
    }
  }

  const postComment = async () => {
    if (!issue || !comment.trim()) return
    try {
      await addComment(issue.id, comment.trim())
      setComment("")
      const r = await fetchIssue(issue.id)
      setFull(r.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not add the comment"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {issue && <IssueKey issue={issue} />}
            {!canEdit ? "Issue" : editing ? "Edit issue" : "New issue"}
            {issue && <TypeBadge type={issue.type} />}
            {issue && <PriorityBadge priority={issue.priority} />}
          </DialogTitle>
          <DialogDescription>
            {!canEdit
              ? `Reported by ${userName(issue?.reporter)} · only project leads can change this task`
              : editing
                ? `Reported by ${userName(issue?.reporter)}`
                : "It lands in the backlog unless you pick a sprint."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What needs doing?"
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Context, acceptance criteria, links…"
              disabled={!canEdit}
            />
          </div>

          {([
            ["type", "Type", TYPES],
            ["status", "Status", columns.length ? columns.map((c) => c.key) : [form.status]],
            ["priority", "Priority", PRIORITIES],
          ] as const).map(([key, label, options]) => (
            <div key={key} className="grid gap-1.5">
              <Label>{label}</Label>
              <Select value={form[key]} onValueChange={(v) => set(key, v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {key === "status"
                        ? (columns.find((c) => c.key === o)?.name ?? STATUS_LABEL[o])
                        : humanise(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Assignees</Label>
            {canEdit ? (
              <AssigneePicker
                users={users}
                selected={form.assignee_ids}
                onChange={(ids) => set("assignee_ids", ids)}
              />
            ) : (
              // Read-only for everyone else: showing a dead control would look
              // broken, and showing nothing would hide who holds the work.
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-2">
                {form.assignee_ids.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                ) : (
                  users
                    .filter((u) => form.assignee_ids.includes(u.id))
                    .map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs shadow-sm">
                        <Avatar user={u} />
                        {userName(u)}
                      </span>
                    ))
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Only project leads can change this
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Sprint</Label>
            <Select value={form.sprint_id} onValueChange={(v) => set("sprint_id", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Story points</Label>
            <Input
              type="number" min={0}
              value={form.story_points}
              onChange={(e) => set("story_points", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Start date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} disabled={!canEdit} />
          </div>
          <div className="grid gap-1.5">
            <Label>Due date</Label>
            <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} disabled={!canEdit} />
          </div>

          <div className="grid gap-1.5">
            <Label>Branch</Label>
            <Input
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              placeholder="feature/machine-alerts"
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Pull request</Label>
            <Input
              value={form.pull_request}
              onChange={(e) => set("pull_request", e.target.value)}
              placeholder="https://github.com/…/pull/42"
              disabled={!canEdit}
            />
          </div>
        </div>

        {editing && (
          <div className="mt-2 border-t pt-4">
            <h4 className="mb-3 text-sm font-semibold">
              Activity {full?.comments?.length ? `(${full.comments.length})` : ""}
            </h4>
            <div className="mb-3 space-y-3">
              {(full?.comments ?? []).map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar user={c.author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{userName(c.author)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("en-GB")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.body}</p>
                  </div>
                </div>
              ))}
              {!full?.comments?.length && (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && postComment()}
                placeholder="Leave a comment…"
              />
              <Button variant="outline" onClick={postComment} disabled={!comment.trim()}>
                Post
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {editing && canEdit ? (
            <Button variant="outline" onClick={remove} className="text-red-600 hover:text-red-700">
              <IconTrash className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button onClick={save} disabled={saving}>
                {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create issue"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
