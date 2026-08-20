import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconInbox } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, errorMessage, statusClass, humanise, formatDate } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const CATEGORIES = ["documentation", "it_setup", "hr", "training", "workspace", "other"]
const TASK_STATUSES = ["pending", "in_progress", "completed", "skipped"]

interface ProgressRow {
  employee_id: number
  employee: string
  employee_code: string | null
  total: number
  completed: number
  overdue: number
  progress: number
  tasks: Array<HrRow & { title?: string; status?: string; due_date?: string }>
}

/** Per-joiner checklist progress. */
function ProgressTab() {
  const [rows, setRows] = React.useState<ProgressRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{ data: ProgressRow[] }>("/onboarding/progress")
        setRows(res.data ?? [])
      } catch (err) {
        toast.error(errorMessage(err, "Could not load onboarding progress"))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <IconLoader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <IconInbox className="h-6 w-6 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No onboarding in progress. Checklists are created automatically when you add an
            employee — define the items under the Templates tab first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.employee_id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{row.employee}</p>
                <p className="text-xs text-muted-foreground">{row.employee_code}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-teal-600">{row.progress}%</p>
                <p className="text-xs text-muted-foreground">
                  {row.completed}/{row.total} done
                </p>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${row.progress}%` }}
              />
            </div>

            {row.overdue > 0 && (
              <p className="mt-2 text-xs font-medium text-red-600">{row.overdue} task(s) overdue</p>
            )}

            <div className="mt-3 space-y-1">
              {row.tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{task.title}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-muted-foreground">{formatDate(task.due_date)}</span>
                    <Badge variant="outline" className={cn("text-[10px]", statusClass(task.status))}>
                      {humanise(task.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {row.tasks.length > 5 && (
                <p className="pt-1 text-xs text-muted-foreground">
                  +{row.tasks.length - 5} more task(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TasksTab() {
  const { options } = useHrOptions(["employees"])

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "title", label: "Task", required: true, wide: true },
    { name: "category", label: "Category", type: "select", options: enumOptions(CATEGORIES), defaultValue: "other" },
    { name: "due_date", label: "Due", type: "date" },
    { name: "status", label: "Status", type: "select", options: enumOptions(TASK_STATUSES), defaultValue: "pending" },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Onboarding Tasks"
      singular="Task"
      endpoint="/onboarding-tasks"
      fields={fields}
      optionSources={options}
      filters={[
        { name: "status", label: "Status", options: enumOptions(TASK_STATUSES) },
        { name: "category", label: "Categories", options: enumOptions(CATEGORIES) },
      ]}
    />
  )
}

function TemplatesTab() {
  const fields: Field[] = [
    { name: "title", label: "Task", required: true, wide: true },
    { name: "category", label: "Category", type: "select", options: enumOptions(CATEGORIES), defaultValue: "other" },
    { name: "owner_role", label: "Owner", placeholder: "e.g. IT, HR, Manager" },
    {
      name: "due_days_after_joining",
      label: "Due (days after joining)",
      type: "number",
      defaultValue: 7,
    },
    { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Onboarding Templates"
      singular="Template"
      endpoint="/onboarding-templates"
      fields={fields}
      description="Every active item here is copied onto a new joiner's checklist when their employee record is created."
    />
  )
}

const Onboarding = () => (
  <HrTabbedPage
    title="Onboarding"
    tabs={[
      { value: "progress", label: "Progress", content: <ProgressTab /> },
      { value: "tasks", label: "All Tasks", content: <TasksTab /> },
      { value: "templates", label: "Templates", content: <TemplatesTab /> },
    ]}
  />
)

export default Onboarding
