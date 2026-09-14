import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const MyProfile = () => (
  <HrTabbedPage
    title="My Profile"
    description="Your employee record and onboarding checklist."
    tabs={[
      { value: "profile", label: "Profile", content: <ProfileTab /> },
      { value: "onboarding", label: "Onboarding", content: <OnboardingTab /> },
    ]}
  />
)

export default MyProfile
