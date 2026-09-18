import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  IconLoader2, IconTrash, IconArrowLeft, IconArrowRight, IconPlus, IconGripVertical,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  createColumn, updateColumn, deleteColumn, reorderColumns,
  COLUMN_COLORS, COLOR_FILL,
} from "./tracker-api"
import { cn } from "@/lib/utils"
import type { BoardColumn } from "@/Types/tracker"

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLUMN_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => onChange(c)}
          className={cn(
            "h-6 w-6 rounded-full ring-offset-2 transition",
            COLOR_FILL[c],
            value === c ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-muted-foreground/40",
          )}
        />
      ))}
    </div>
  )
}

/**
 * Manages a project's board columns: add, rename, recolour, reorder, delete.
 *
 * Deleting is the only operation that can lose work, so a column still holding
 * issues cannot be removed until a destination is chosen — the server refuses
 * it and this dialog asks where they should go.
 */
export function ColumnDialog({
  open, onOpenChange, columns, projectId, onChanged,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  columns: BoardColumn[]
  projectId?: number
  onChanged: () => void
}) {
  const [rows, setRows] = React.useState<BoardColumn[]>(columns)
  const [busy, setBusy] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [newCol, setNewCol] = React.useState({ name: "", color: "slate", is_done: false })
  // Set when a delete is refused because the column still holds issues.
  const [pendingDelete, setPendingDelete] = React.useState<
    { column: BoardColumn; count: number; options: Array<{ id: number; name: string }>; moveTo: string } | null
  >(null)

  React.useEffect(() => { if (open) { setRows(columns); setAdding(false); setPendingDelete(null) } }, [open, columns])

  const patch = async (col: BoardColumn, body: Partial<BoardColumn>) => {
    setRows((r) => r.map((x) => (x.id === col.id ? { ...x, ...body } : x)))
    try {
      await updateColumn(col.id, body)
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the column"))
      setRows(columns)
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...rows]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    try {
      await reorderColumns(next.map((c) => c.id), projectId)
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not reorder the columns"))
      setRows(columns)
    }
  }

  const add = async () => {
    if (!newCol.name.trim()) return toast.error("Give the column a name")
    setBusy(true)
    try {
      await createColumn({ ...newCol, project_id: projectId })
      toast.success("Column added")
      setNewCol({ name: "", color: "slate", is_done: false })
      setAdding(false)
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not add the column"))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (col: BoardColumn, moveTo?: number) => {
    try {
      const res = await deleteColumn(col.id, moveTo)
      toast.success(res.message)
      setPendingDelete(null)
      onChanged()
    } catch (err: unknown) {
      // 409 carries the issue count and the columns they could move to.
      const body = (err as { response?: { data?: { data?: { issue_count: number; options: Array<{ id: number; name: string }> }; message?: string } } })?.response?.data
      if (body?.data?.options?.length) {
        setPendingDelete({
          column: col,
          count: body.data.issue_count,
          options: body.data.options,
          moveTo: String(body.data.options[0].id),
        })
        return
      }
      toast.error(errorMessage(err, "Could not delete the column"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Board columns</DialogTitle>
          <DialogDescription>
            These are the project's workflow states. Renaming one is safe — issues track the
            column, not its label.
          </DialogDescription>
        </DialogHeader>

        {pendingDelete ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium">
              "{pendingDelete.column.name}" still holds {pendingDelete.count} issue(s)
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose where they should go. Nothing is deleted.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={pendingDelete.moveTo}
                onValueChange={(v) => setPendingDelete((p) => p && { ...p, moveTo: v })}
              >
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pendingDelete.options.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive" size="sm"
                onClick={() => remove(pendingDelete.column, Number(pendingDelete.moveTo))}
              >
                Move and delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>Cancel</Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {rows.map((col, i) => (
            <div key={col.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
              <IconGripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={col.name}
                onChange={(e) => setRows((r) => r.map((x) => (x.id === col.id ? { ...x, name: e.target.value } : x)))}
                onBlur={(e) => e.target.value.trim() && e.target.value !== columns.find((c) => c.id === col.id)?.name
                  && patch(col, { name: e.target.value.trim() })}
                className="h-8 w-40"
              />
              <ColorPicker value={col.color} onChange={(c) => patch(col, { color: c })} />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox
                  checked={col.is_done}
                  onCheckedChange={(v) => patch(col, { is_done: Boolean(v) })}
                />
                Counts as done
              </label>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  disabled={i === 0} onClick={() => move(i, -1)}>
                  <IconArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <IconArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                  disabled={rows.length <= 1} onClick={() => remove(col)}>
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {adding ? (
          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <div className="grid gap-1.5">
              <Label>Column name</Label>
              <Input
                autoFocus
                value={newCol.name}
                onChange={(e) => setNewCol((c) => ({ ...c, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="QA, Blocked, Ready to Deploy…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Colour</Label>
              <ColorPicker value={newCol.color} onChange={(c) => setNewCol((x) => ({ ...x, color: c }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={newCol.is_done}
                onCheckedChange={(v) => setNewCol((c) => ({ ...c, is_done: Boolean(v) }))}
              />
              Issues here count as done
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={add} disabled={busy}>
                {busy && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Add column
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
            <IconPlus className="mr-1 h-4 w-4" /> Add column
          </Button>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
