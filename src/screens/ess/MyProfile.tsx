import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  essPost,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
} from "@/components/hr/hr-api"

/** Shared loader: returns null while loading, and flags a missing profile. */
function useEss<T>(path: string) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: T }>(path)
      setData(res.data)
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) setNotLinked(true)
      else toast.error(errorMessage(err, "Could not load your details"))
    } finally {
      setLoading(false)
    }
  }, [path])

  React.useEffect(() => {
    load()
  }, [load])

  return { data, loading, notLinked, reload: load }
}

function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <IconLoader2 className="h-5 w-5 animate-spin text-teal-600" />
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

// ─── Profile ─────────────────────────────────────────────────────────────────

interface Profile {
  employee_code: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  employment_type: string
  status: string
  date_of_joining: string | null
  work_location: string | null
  direct_reports: number
  department?: { name?: string } | null
  designation?: { title?: string } | null
  manager?: { first_name?: string; last_name?: string } | null
  shift?: { name?: string; start_time?: string; end_time?: string } | null
}

function ProfileTab() {
  const { data, loading, notLinked } = useEss<Profile>("/me")

  if (loading) return <Spinner />
  if (notLinked) return <NotLinked />
  if (!data) return <Empty message="Profile unavailable" />

  const rows: Array<[string, React.ReactNode]> = [
    ["Employee code", data.employee_code],
    ["Name", `${data.first_name} ${data.last_name ?? ""}`.trim()],
    ["Email", data.email ?? "—"],
    ["Phone", data.phone ?? "—"],
    ["Department", data.department?.name ?? "—"],
    ["Designation", data.designation?.title ?? "—"],
    [
      "Reports to",
      data.manager ? `${data.manager.first_name} ${data.manager.last_name ?? ""}`.trim() : "—",
    ],
    [
      "Shift",
      data.shift
        ? `${data.shift.name} (${data.shift.start_time}–${data.shift.end_time})`
        : "—",
    ],
    ["Employment type", humanise(data.employment_type)],
    ["Joined", formatDate(data.date_of_joining)],
    ["Work location", data.work_location ?? "—"],
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My details</CardTitle>
          <CardDescription>
            Ask HR to correct anything that looks wrong — these fields are managed in Employee
            Management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline" className={cn("font-medium", statusClass(data.status))}>
                  {humanise(data.status)}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

interface Task {
  id: number
  title: string
  category: string
  due_date: string | null
  status: string
}

function OnboardingTab() {
  const { data, loading, notLinked, reload } = useEss<Task[]>("/onboarding")

  const complete = async (task: Task) => {
    try {
      await essPost(`/onboarding/${task.id}/complete`, {})
      toast.success("Task marked complete")
      reload()
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the task"))
    }
  }

  if (loading) return <Spinner />
  if (notLinked) return <NotLinked />
  if (!data?.length) return <Empty message="You have no onboarding tasks." />

  const done = data.filter((t) => t.status === "completed").length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatTile label="Tasks" value={data.length} />
        <StatTile label="Completed" value={done} tone="emerald" />
        <StatTile
          label="Progress"
          value={`${Math.round((done / data.length) * 100)}%`}
          tone="teal"
        />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{humanise(task.category)}</TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", statusClass(task.status))}>
                      {humanise(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status !== "completed" && (
                      <Button size="sm" variant="outline" className="h-8" onClick={() => complete(task)}>
                        <IconCheck className="h-3.5 w-3.5" />
                        Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Performance ─────────────────────────────────────────────────────────────

interface Review {
  id: number
  self_rating: string | null
  manager_rating: string | null
  final_rating: string | null
  status: string
  strengths: string | null
  improvements: string | null
}
interface Goal {
  id: number
  title: string
  target_value: string | null
  achieved_value: string | null
  progress: number
  due_date: string | null
  status: string
}

function PerformanceTab() {
  const { data, loading, notLinked, reload } =
    useEss<{ reviews: Review[]; goals: Goal[] }>("/performance")
  const [active, setActive] = React.useState<Review | null>(null)
  const [form, setForm] = React.useState({ self_rating: "", strengths: "", improvements: "" })
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!active) return
    setSaving(true)
    try {
      await essPost(`/performance/${active.id}/self-review`, {
        self_rating: form.self_rating ? Number(form.self_rating) : null,
        strengths: form.strengths,
        improvements: form.improvements,
      })
      toast.success("Self review submitted to your manager")
      setActive(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, "Could not submit your review"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (notLinked) return <NotLinked />

  const reviews = data?.reviews ?? []
  const goals = data?.goals ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My reviews</CardTitle>
          <CardDescription>
            Complete your self review and it moves to your manager.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No reviews assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Status</TableHead>
                  <TableHead>Self</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusClass(r.status))}>
                        {humanise(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.self_rating ?? "—"}</TableCell>
                    <TableCell>{r.manager_rating ?? "—"}</TableCell>
                    <TableCell>{r.final_rating ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {["not_started", "self_review"].includes(r.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            setActive(r)
                            setForm({
                              self_rating: r.self_rating ?? "",
                              strengths: r.strengths ?? "",
                              improvements: r.improvements ?? "",
                            })
                          }}
                        >
                          Self review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My goals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {goals.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No goals set yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Goal</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.title}</TableCell>
                    <TableCell>{g.target_value ?? "—"}</TableCell>
                    <TableCell>{g.achieved_value ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${Math.min(100, g.progress ?? 0)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">{g.progress ?? 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(g.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusClass(g.status))}>
                        {humanise(g.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Self review</DialogTitle>
            <DialogDescription>
              Once submitted this moves to your manager and can't be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Self rating (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                step="0.1"
                value={form.self_rating}
                onChange={(e) => setForm((f) => ({ ...f, self_rating: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Strengths</Label>
              <Textarea
                rows={3}
                value={form.strengths}
                onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Areas to improve</Label>
              <Textarea
                rows={3}
                value={form.improvements}
                onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Training ────────────────────────────────────────────────────────────────

interface Enrollment {
  id: number
  status: string
  score: string | null
  certificate_url: string | null
  training?: { title?: string; start_date?: string; mode?: string; trainer?: string }
}

function TrainingTab() {
  const { data, loading, notLinked } = useEss<Enrollment[]>("/training")

  if (loading) return <Spinner />
  if (notLinked) return <NotLinked />
  if (!data?.length) return <Empty message="You aren't enrolled on any training yet." />

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Training</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.training?.title ?? "—"}</TableCell>
                <TableCell>{e.training?.trainer ?? "—"}</TableCell>
                <TableCell>{formatDate(e.training?.start_date)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", statusClass(e.status))}>
                    {humanise(e.status)}
                  </Badge>
                </TableCell>
                <TableCell>{e.score ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Assets ──────────────────────────────────────────────────────────────────

interface Assignment {
  id: number
  assigned_date: string
  returned_date: string | null
  status: string
  asset?: { asset_code?: string; name?: string; category?: string; serial_number?: string }
}

function AssetsTab() {
  const { data, loading, notLinked } = useEss<Assignment[]>("/assets")

  if (loading) return <Spinner />
  if (notLinked) return <NotLinked />
  if (!data?.length) return <Empty message="No company assets are assigned to you." />

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Asset</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.asset?.name ?? "—"}
                  <div className="text-xs text-muted-foreground">{a.asset?.asset_code}</div>
                </TableCell>
                <TableCell>{humanise(a.asset?.category)}</TableCell>
                <TableCell>{a.asset?.serial_number ?? "—"}</TableCell>
                <TableCell>{formatDate(a.assigned_date)}</TableCell>
                <TableCell>{a.returned_date ? formatDate(a.returned_date) : "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium", statusClass(a.status))}>
                    {humanise(a.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const MyProfile = () => (
  <HrTabbedPage
    title="My Profile"
    description="Your employee record, onboarding, performance, training and company assets."
    tabs={[
      { value: "profile", label: "Profile", content: <ProfileTab /> },
      { value: "onboarding", label: "Onboarding", content: <OnboardingTab /> },
      { value: "performance", label: "Performance", content: <PerformanceTab /> },
      { value: "training", label: "Training", content: <TrainingTab /> },
      { value: "assets", label: "Assets", content: <AssetsTab /> },
    ]}
  />
)

export default MyProfile
