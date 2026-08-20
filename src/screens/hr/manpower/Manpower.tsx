import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconCheck, IconX, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, hrAction, errorMessage, formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "intern", "daily_wage"]
const REQUEST_STATUSES = ["pending", "approved", "rejected", "fulfilled", "cancelled"]
const REASONS = ["replacement", "expansion", "seasonal", "project"]

interface PlanVsActual {
  department_id: number
  department: string
  planned_headcount: number
  actual_headcount: number
  gap: number
  in_pipeline: number
}

function PlanVsActualTab() {
  const [year, setYear] = React.useState(String(new Date().getFullYear()))
  const [rows, setRows] = React.useState<PlanVsActual[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: PlanVsActual[] }>("/manpower/vs-actual", { year })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the headcount comparison"))
    } finally {
      setLoading(false)
    }
  }, [year])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-[120px]"
          aria-label="Year"
        />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Department</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>In Pipeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      No departments defined yet — add them under Org Setup
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.department_id}>
                      <TableCell className="font-medium">{row.department}</TableCell>
                      <TableCell>{row.planned_headcount}</TableCell>
                      <TableCell>{row.actual_headcount}</TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          row.gap > 0 ? "text-amber-600" : row.gap < 0 ? "text-red-600" : "",
                        )}
                      >
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </TableCell>
                      <TableCell>{row.in_pipeline}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RequestsTab() {
  const { options } = useHrOptions(["departments", "designations"])
  const [refresh, setRefresh] = React.useState(0)

  const decide = async (row: HrRow, decision: "approved" | "rejected") => {
    try {
      await hrAction(`/manpower-requests/${row.id}/decide`, { decision })
      toast.success(
        decision === "approved"
          ? "Request approved — a job posting has been opened"
          : "Request rejected",
      )
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"))
    }
  }

  const fields: Field[] = [
    { name: "request_code", label: "Request", hideInForm: true },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      optionsKey: "departments",
      required: true,
      render: (row: HrRow) => (row.department as { name?: string })?.name ?? "—",
    },
    {
      name: "designation_id",
      label: "Designation",
      type: "select",
      optionsKey: "designations",
      render: (row: HrRow) => (row.designation as { title?: string })?.title ?? "—",
    },
    { name: "headcount", label: "Headcount", type: "number", defaultValue: 1, required: true },
    {
      name: "employment_type",
      label: "Type",
      type: "select",
      options: enumOptions(EMPLOYMENT_TYPES),
      defaultValue: "full_time",
    },
    { name: "request_reason", label: "Reason", type: "select", options: enumOptions(REASONS), defaultValue: "expansion" },
    { name: "required_by", label: "Required By", type: "date" },
    {
      name: "budget_per_head",
      label: "Budget / Head",
      type: "money",
      render: (row: HrRow) => formatMoney(row.budget_per_head),
    },
    { name: "status", label: "Status", hideInForm: true },
    { name: "justification", label: "Justification", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Approve",
      icon: IconCheck,
      show: (row) => row.status === "pending",
      onClick: (row) => decide(row, "approved"),
    },
    {
      label: "Reject",
      icon: IconX,
      show: (row) => row.status === "pending",
      onClick: (row) => decide(row, "rejected"),
    },
  ]

  return (
    <ResourceScreen
      embedded
      title="Manpower Requests"
      singular="Manpower Request"
      endpoint="/manpower-requests"
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      description="Approving a request automatically opens a matching job posting in Recruitment."
      filters={[
        { name: "status", label: "Status", options: enumOptions(REQUEST_STATUSES) },
        { name: "department_id", label: "Departments", options: options.departments ?? [] },
      ]}
    />
  )
}

function PlansTab() {
  const { options } = useHrOptions(["departments", "designations"])

  const fields: Field[] = [
    {
      name: "department_id",
      label: "Department",
      type: "select",
      optionsKey: "departments",
      required: true,
      render: (row: HrRow) => (row.department as { name?: string })?.name ?? "—",
    },
    {
      name: "designation_id",
      label: "Designation",
      type: "select",
      optionsKey: "designations",
      render: (row: HrRow) => (row.designation as { title?: string })?.title ?? "—",
    },
    { name: "year", label: "Year", type: "number", required: true, defaultValue: new Date().getFullYear() },
    { name: "planned_headcount", label: "Planned", type: "number", defaultValue: 0 },
    {
      name: "budget_per_head",
      label: "Budget / Head",
      type: "money",
      render: (row: HrRow) => formatMoney(row.budget_per_head),
    },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Manpower Plans"
      singular="Plan"
      endpoint="/manpower-plans"
      fields={fields}
      optionSources={options}
    />
  )
}

const Manpower = () => (
  <HrTabbedPage
    title="Manpower Management"
    tabs={[
      { value: "vs-actual", label: "Plan vs Actual", content: <PlanVsActualTab /> },
      { value: "requests", label: "Requests", content: <RequestsTab /> },
      { value: "plans", label: "Plans", content: <PlansTab /> },
    ]}
  />
)

export default Manpower
