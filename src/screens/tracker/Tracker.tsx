import * as React from "react"
import { SiteHeader } from "@/components/admin/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { IconLoader2, IconPlus, IconHelpCircle } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import {
  fetchProjects, createProject, fetchSprints, fetchUsers, isTrackerManager, userName,
} from "@/components/tracker/tracker-api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { GuidedTour } from "@/components/tracker/GuidedTour"
import { TRACKER_TOUR } from "@/components/tracker/tracker-tour"
import type { Sprint, TrackerProject, TrackerUser } from "@/Types/tracker"

import SummaryTab from "./SummaryTab"
import BacklogTab from "./BacklogTab"
import BoardTab from "./BoardTab"
import DevelopmentTab from "./DevelopmentTab"
import TimelineTab from "./TimelineTab"

const BLANK_PROJECT = {
  key: "",
  name: "",
  description: "",
  visibility: "all" as "all" | "team",
  member_ids: [] as number[],
}

function NewProjectDialog({ open, onOpenChange, onCreated, users }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (p: TrackerProject) => void
  users: TrackerUser[]
}) {
  const [form, setForm] = React.useState(BLANK_PROJECT)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => { if (open) setForm(BLANK_PROJECT) }, [open])

  const toggleMember = (id: number) =>
    setForm((f) => ({
      ...f,
      member_ids: f.member_ids.includes(id)
        ? f.member_ids.filter((x) => x !== id)
        : [...f.member_ids, id],
    }))

  const save = async () => {
    if (form.visibility === "team" && form.member_ids.length === 0) {
      return toast.error("Pick at least one person for an internal team project")
    }
    setSaving(true)
    try {
      // member_ids is meaningless on an "all" project, so it is not sent —
      // the server would ignore it, and sending it invites the two to drift.
      const res = await createProject(
        form.visibility === "team"
          ? form
          : { key: form.key, name: form.name, description: form.description, visibility: "all" },
      )
      toast.success("Project created")
      onOpenChange(false)
      onCreated(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not create the project"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            The key prefixes every issue in this project and cannot be changed later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Key</Label>
            <Input
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }))}
              placeholder="DAV"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              2–10 letters or digits, starting with a letter. Issues become DAV-1, DAV-2…
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Davaam Platform"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Who is this project for?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["all", "All users", "Everyone with tracker access can see it."],
                ["team", "Internal team", "Only the people you pick can see it."],
              ] as const).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visibility: value }))}
                  aria-pressed={form.visibility === value}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    form.visibility === value
                      ? "border-teal-500 bg-teal-50"
                      : "hover:border-teal-300",
                  )}
                >
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
          </div>

          {form.visibility === "team" && (
            <div className="grid gap-1.5">
              <Label>Team members</Label>
              <div className="rounded-md border">
                <div className="border-b px-2 py-1.5 text-xs text-muted-foreground">
                  {form.member_ids.length === 0
                    ? "Nobody picked yet"
                    : `${form.member_ids.length} selected`}
                  {" · you are added automatically"}
                </div>
                <div className="max-h-40 overflow-y-auto p-1">
                  {users.length === 0 && (
                    <p className="px-2 py-3 text-sm text-muted-foreground">No users to pick from.</p>
                  )}
                  {users.map((u) => {
                    const on = form.member_ids.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleMember(u.id)}
                        aria-pressed={on}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                          on && "bg-teal-50",
                        )}
                      >
                        <input type="checkbox" readOnly checked={on} className="h-3.5 w-3.5 accent-teal-600" />
                        <span className="truncate">{userName(u)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.key || !form.name}>
            {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const Tracker = () => {
  // Creating projects and tasks is limited to the project leads; everyone else
  // works the board. The API enforces it too — this just avoids offering a
  // button that would come back 403.
  const { state } = useAuth()
  const canManage = isTrackerManager(state?.user?.email)

  const [projects, setProjects] = React.useState<TrackerProject[]>([])
  const [projectId, setProjectId] = React.useState<number | undefined>()
  const [sprints, setSprints] = React.useState<Sprint[]>([])
  const [users, setUsers] = React.useState<TrackerUser[]>([])
  // Everyone assignable, regardless of project. The assignee list above is
  // narrowed to a team project's own people, which is right for handing out
  // work but wrong for picking the team of a project that does not exist yet.
  const [allUsers, setAllUsers] = React.useState<TrackerUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newProject, setNewProject] = React.useState(false)
  // Bumped whenever a tab changes data, so the sibling tabs reload when opened.
  const [refreshKey, setRefreshKey] = React.useState(0)
  const bump = React.useCallback(() => setRefreshKey((k) => k + 1), [])
  // Controlled so the tour can move between tabs as it walks through them.
  const [tab, setTab] = React.useState("summary")
  const [tourOpen, setTourOpen] = React.useState(false)

  React.useEffect(() => {
    // Settled, not all: these two are independent, and letting one failure
    // discard the other is what made a broken projects call look like an empty
    // member picker instead of an error.
    Promise.allSettled([fetchProjects(), fetchUsers()])
      .then(([p, u]) => {
        if (p.status === "fulfilled") {
          setProjects(p.value.data ?? [])
          setProjectId((cur) => cur ?? p.value.data?.[0]?.id)
        } else {
          toast.error(errorMessage(p.reason, "Could not load the projects"))
        }

        if (u.status === "fulfilled") {
          setUsers(u.value.data ?? [])
          setAllUsers(u.value.data ?? [])
        } else {
          toast.error(errorMessage(u.reason, "Could not load the people list"))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Re-fetched per project: a team project may only assign to its own members.
  React.useEffect(() => {
    if (!projectId) return
    fetchUsers({ project_id: projectId })
      .then((r) => setUsers(r.data ?? []))
      .catch(() => {})
  }, [projectId, refreshKey])

  // Sprints live at this level because four of the five tabs need the list.
  React.useEffect(() => {
    if (!projectId) return
    fetchSprints({ project_id: projectId })
      .then((r) => setSprints(r.data ?? []))
      .catch(() => setSprints([]))
  }, [projectId, refreshKey])

  /**
   * The tour is opened from the Tour button and nowhere else — it never runs
   * on its own. Nothing is stored, so there is no "have they seen it" state to
   * get wrong, and it is available as often as somebody wants it.
   */
  const openTour = React.useCallback(() => {
    setTab("summary")
    setTourOpen(true)
  }, [])

  const shared = { projectId, sprints, users, refreshKey, onChanged: bump }

  if (loading) {
    return (
      <>
        <SiteHeader title="Project Tracker" />
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="Project Tracker" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-4 md:py-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <Select value={projectId ? String(projectId) : ""} onValueChange={(v) => setProjectId(Number(v))}>
                <SelectTrigger className="w-60" data-tour="project-switcher">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="font-mono text-xs">{p.key}</span> · {p.name}
                      {/* Says out loud that this one is not on the whole team's
                          board, so nobody assumes a task here was seen widely. */}
                      {p.visibility === "team" && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          Team
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setNewProject(true)}>
                <IconPlus className="mr-1 h-4 w-4" /> New project
              </Button>
            )}
            <Button
              variant="ghost" size="sm"
              data-tour="replay-tour"
              onClick={openTour}
              title="Take the guided tour"
              className="text-muted-foreground"
            >
              <IconHelpCircle className="mr-1 h-4 w-4" /> Tour
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm font-medium">No projects yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {canManage
                  ? 'Create one to start tracking work. The project key prefixes every issue — "DAV" gives you DAV-1, DAV-2 and so on.'
                  : "A project lead needs to create one before there is anything to track here."}
              </p>
              {canManage && (
                <Button className="mt-4" onClick={() => setNewProject(true)}>
                  <IconPlus className="mr-1 h-4 w-4" /> Create the first project
                </Button>
              )}
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="summary" data-tour="tab-summary">Summary</TabsTrigger>
                <TabsTrigger value="backlog" data-tour="tab-backlog">Backlog</TabsTrigger>
                <TabsTrigger value="board" data-tour="tab-board">Board</TabsTrigger>
                <TabsTrigger value="development" data-tour="tab-development">Development</TabsTrigger>
                <TabsTrigger value="timeline" data-tour="tab-timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <SummaryTab projectId={projectId} refreshKey={refreshKey} />
              </TabsContent>
              <TabsContent value="backlog" className="mt-4"><BacklogTab {...shared} /></TabsContent>
              <TabsContent value="board" className="mt-4"><BoardTab {...shared} /></TabsContent>
              <TabsContent value="development" className="mt-4"><DevelopmentTab {...shared} /></TabsContent>
              <TabsContent value="timeline" className="mt-4"><TimelineTab {...shared} /></TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <GuidedTour
        steps={TRACKER_TOUR}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onFinish={() => setTourOpen(false)}
        onTabChange={setTab}
      />

      <NewProjectDialog
        users={allUsers}
        open={newProject}
        onOpenChange={setNewProject}
        onCreated={(p) => { setProjects((cur) => [...cur, p]); setProjectId(p.id); bump() }}
      />
    </>
  )
}

export default Tracker
