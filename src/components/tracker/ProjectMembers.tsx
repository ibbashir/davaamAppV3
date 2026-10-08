import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IconLoader2, IconUserPlus, IconX, IconUsers, IconWorld } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  addProjectMembers, removeProjectMember, userName, initials, ROLE_LABEL,
} from "@/components/tracker/tracker-api"
import { cn } from "@/lib/utils"
import type { TrackerProject, TrackerUser } from "@/Types/tracker"

/** Pick people who are not on the team yet. */
function AddMembersDialog({ open, onOpenChange, candidates, onAdd }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  candidates: TrackerUser[]
  onAdd: (ids: number[]) => Promise<void>
}) {
  const [picked, setPicked] = React.useState<number[]>([])
  const [query, setQuery] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) { setPicked([]); setQuery("") }
  }, [open])

  const q = query.trim().toLowerCase()
  const shown = q
    ? candidates.filter((u) => `${userName(u)} ${u.email}`.toLowerCase().includes(q))
    : candidates

  const toggle = (id: number) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const save = async () => {
    setSaving(true)
    try {
      await onAdd(picked)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add people</DialogTitle>
          <DialogDescription>They will see this project and can be given its tasks.</DialogDescription>
        </DialogHeader>

        <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="rounded-md border">
          <div className="border-b px-2 py-1.5 text-xs text-muted-foreground">
            {picked.length === 0 ? "Nobody picked yet" : `${picked.length} selected`}
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {shown.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {candidates.length === 0 ? "Everyone is already on this project." : "No one matches that search."}
              </p>
            )}
            {shown.map((u) => {
              const on = picked.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                    on && "bg-teal-50",
                  )}
                >
                  <input type="checkbox" readOnly checked={on} className="h-3.5 w-3.5 accent-teal-600" />
                  <span className="truncate">{userName(u)}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {ROLE_LABEL[u.role_code] ?? ""}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || picked.length === 0}>
            {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add {picked.length > 0 ? picked.length : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Who is on the project, shown on the Summary tab. Leads can add and remove
 * people on a team project; an "all" project is everybody's, so it only says so.
 */
export function ProjectMembersCard({ project, allUsers, canManage, currentUserId, onChanged }: {
  project: TrackerProject
  /** Everyone assignable — the pool new members are picked from. */
  allUsers: TrackerUser[]
  canManage: boolean
  currentUserId?: number
  onChanged: (project: TrackerProject) => void
}) {
  const [adding, setAdding] = React.useState(false)
  const [removing, setRemoving] = React.useState<number | null>(null)
  const [confirmSelf, setConfirmSelf] = React.useState(false)

  const members = React.useMemo(
    () => [...(project.members ?? [])].sort((a, b) => userName(a).localeCompare(userName(b))),
    [project.members],
  )
  const memberIds = new Set(members.map((m) => m.id))
  const candidates = allUsers.filter((u) => !memberIds.has(u.id))

  if (project.visibility !== "team") {
    return (
      <Card>
        <CardContent className="flex items-center gap-2.5 py-4 text-sm text-muted-foreground">
          <IconWorld className="h-4 w-4 shrink-0 text-teal-600" />
          Open to everyone with tracker access. There is no member list to manage.
        </CardContent>
      </Card>
    )
  }

  const add = async (ids: number[]) => {
    try {
      const r = await addProjectMembers(project.id, ids)
      toast.success(r.message || "Members added")
      onChanged(r.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not add those people"))
      throw err
    }
  }

  const remove = async (adminId: number) => {
    setRemoving(adminId)
    try {
      const r = await removeProjectMember(project.id, adminId)
      toast.success(r.message || "Member removed")
      onChanged(r.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not remove that person"))
    } finally {
      setRemoving(null)
    }
  }

  const lastOne = members.length <= 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconUsers className="h-4 w-4 text-teal-600" />
          Team members
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {members.length}
          </span>
        </CardTitle>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <IconUserPlus className="mr-1 h-4 w-4" /> Add people
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const self = m.id === currentUserId
            return (
              <div key={m.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-semibold text-teal-700">
                  {initials(m)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {userName(m)}
                    {self && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[m.role_code] ?? m.email}</p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                    disabled={lastOne || removing !== null}
                    title={lastOne ? "A team project needs at least one member" : `Remove ${userName(m)}`}
                    onClick={() => (self ? setConfirmSelf(true) : remove(m.id))}
                  >
                    {removing === m.id
                      ? <IconLoader2 className="h-4 w-4 animate-spin" />
                      : <IconX className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>

      <AddMembersDialog open={adding} onOpenChange={setAdding} candidates={candidates} onAdd={add} />

      {/* Leads are not exempt from the team list, so leaving loses the project. */}
      <AlertDialog open={confirmSelf} onOpenChange={setConfirmSelf}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove yourself?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer see {project.name}. Another member would have to add you back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => currentUserId && remove(currentUserId)}
            >
              Remove me
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
