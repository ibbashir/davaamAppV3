import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  createBoard, updateBoard, deleteBoard, TYPES, PRIORITIES, TYPE_STYLE, PRIORITY_STYLE, userName,
} from "./tracker-api"
import type { Board, Sprint, TrackerUser } from "@/Types/tracker"

const blank = {
  name: "", description: "",
  filter_sprint: "all", filter_assignee: "all", filter_type: "all", filter_priority: "all",
  is_default: false,
}

const toForm = (board?: Board | null) => (board ? {
  name: board.name,
  description: board.description ?? "",
  filter_sprint: board.filter_sprint,
  filter_assignee: board.filter_assignee,
  filter_type: board.filter_type,
  filter_priority: board.filter_priority,
  is_default: board.is_default,
} : blank)

export function BoardDialog({
  open, onOpenChange, board, projectId, sprints, users, onSaved, onDeleted,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Present = edit, absent = create. */
  board?: Board | null
  projectId?: number
  sprints: Sprint[]
  users: TrackerUser[]
  onSaved: (b: Board) => void
  onDeleted: () => void
}) {
  const [form, setForm] = React.useState(toForm(board))
  const [saving, setSaving] = React.useState(false)
  const editing = Boolean(board?.id)

  React.useEffect(() => { if (open) setForm(toForm(board)) }, [open, board])

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return toast.error("Give the board a name")
    setSaving(true)
    try {
      const body = { ...form, project_id: projectId }
      const res = editing && board ? await updateBoard(board.id, body) : await createBoard(body)
      toast.success(editing ? "Board updated" : "Board created")
      onOpenChange(false)
      onSaved(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the board"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!board) return
    if (!window.confirm(`Delete the board "${board.name}"?\n\nThis removes the view only — no issues are deleted.`)) return
    try {
      const res = await deleteBoard(board.id)
      toast.success(res.message)
      onOpenChange(false)
      onDeleted()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the board"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit board" : "New board"}</DialogTitle>
          <DialogDescription>
            A board is a saved filter. Deleting one removes the view only — the issues stay.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sprint Board"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Sprint</Label>
              <Select value={form.filter_sprint} onValueChange={(v) => set("filter_sprint", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All issues</SelectItem>
                  {/* Follows whichever sprint is running when the board is opened. */}
                  <SelectItem value="active">Active sprint</SelectItem>
                  <SelectItem value="backlog">Backlog only</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Assignee</Label>
              <Select value={form.filter_assignee} onValueChange={(v) => set("filter_assignee", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {/* Resolves per viewer, so one board works for the whole team. */}
                  <SelectItem value="me">Assigned to me</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{userName(u)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.filter_type} onValueChange={(v) => set("filter_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_STYLE[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={form.filter_priority} onValueChange={(v) => set("filter_priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {PRIORITIES.map((pr) => (
                    <SelectItem key={pr} value={pr}>{PRIORITY_STYLE[pr].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-sm">
            <Checkbox
              checked={form.is_default}
              onCheckedChange={(v) => set("is_default", Boolean(v))}
            />
            Open this board by default
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button variant="outline" onClick={remove} className="text-red-600 hover:text-red-700">
              <IconTrash className="mr-1.5 h-4 w-4" /> Delete board
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save board" : "Create board"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
