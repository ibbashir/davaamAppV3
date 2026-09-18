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
import { fetchProjects, createProject, fetchSprints, fetchUsers } from "@/components/tracker/tracker-api"
import { GuidedTour } from "@/components/tracker/GuidedTour"
import { TRACKER_TOUR } from "@/components/tracker/tracker-tour"
import type { Sprint, TrackerProject, TrackerUser } from "@/Types/tracker"

import SummaryTab from "./SummaryTab"
import BacklogTab from "./BacklogTab"
import BoardTab from "./BoardTab"
import DevelopmentTab from "./DevelopmentTab"
import TimelineTab from "./TimelineTab"

function NewProjectDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (p: TrackerProject) => void
}) {
  const [form, setForm] = React.useState({ key: "", name: "", description: "" })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => { if (open) setForm({ key: "", name: "", description: "" }) }, [open])

  const save = async () => {
    setSaving(true)
    try {
      const res = await createProject(form)
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
  const [projects, setProjects] = React.useState<TrackerProject[]>([])
  const [projectId, setProjectId] = React.useState<number | undefined>()
  const [sprints, setSprints] = React.useState<Sprint[]>([])
  const [users, setUsers] = React.useState<TrackerUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newProject, setNewProject] = React.useState(false)
  // Bumped whenever a tab changes data, so the sibling tabs reload when opened.
  const [refreshKey, setRefreshKey] = React.useState(0)
  const bump = React.useCallback(() => setRefreshKey((k) => k + 1), [])
  // Controlled so the tour can move between tabs as it walks through them.
  const [tab, setTab] = React.useState("summary")
  const [tourOpen, setTourOpen] = React.useState(false)

  React.useEffect(() => {
    Promise.all([fetchProjects(), fetchUsers()])
      .then(([p, u]) => {
        setProjects(p.data ?? [])
        setUsers(u.data ?? [])
        setProjectId((cur) => cur ?? p.data?.[0]?.id)
      })
      .catch((err) => toast.error(errorMessage(err, "Could not load the tracker")))
      .finally(() => setLoading(false))
  }, [])

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
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={() => setNewProject(true)}>
              <IconPlus className="mr-1 h-4 w-4" /> New project
            </Button>
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
                Create one to start tracking work. The project key prefixes every issue — "DAV" gives you DAV-1, DAV-2 and so on.
              </p>
              <Button className="mt-4" onClick={() => setNewProject(true)}>
                <IconPlus className="mr-1 h-4 w-4" /> Create the first project
              </Button>
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
        open={newProject}
        onOpenChange={setNewProject}
        onCreated={(p) => { setProjects((cur) => [...cur, p]); setProjectId(p.id); bump() }}
      />
    </>
  )
}

export default Tracker
