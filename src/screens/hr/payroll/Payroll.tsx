import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconLoader2, IconPlayerPlay, IconCheck, IconCash } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const employeeCell = (row: HrRow) => {
  const e = row.employee as { first_name?: string; last_name?: string; employee_code?: string } | undefined
  return e ? `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || e.employee_code : "—"
}

function RunsTab() {
  const now = new Date()
  const [refresh, setRefresh] = React.useState(0)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [month, setMonth] = React.useState(String(now.getMonth() + 1))
  const [year, setYear] = React.useState(String(now.getFullYear()))
  const [processing, setProcessing] = React.useState(false)
  const [totals, setTotals] = React.useState({ gross: 0, net: 0, employees: 0 })

  const process = async () => {
    setProcessing(true)
    try {
      const res = await hrAction<{ message: string }>("/payroll-runs/process", {
        period_month: Number(month),
        period_year: Number(year),
      })
      toast.success(res.message)
      setDialogOpen(false)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Payroll processing failed"))
    } finally {
      setProcessing(false)
    }
  }

  const setStatus = async (row: HrRow, status: string) => {
    try {
      await hrAction(`/payroll-runs/${row.id}/status`, { status })
      toast.success(`Payroll run marked ${status}`)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the run"))
    }
  }

  const fields: Field[] = [
    {
      name: "period_month",
      label: "Period",
      hideInForm: true,
      render: (row: HrRow) => `${MONTHS[Number(row.period_month) - 1] ?? row.period_month} ${row.period_year}`,
    },
    { name: "employee_count", label: "Employees", hideInForm: true },
    {
      name: "total_gross",
      label: "Gross",
      hideInForm: true,
      render: (row: HrRow) => formatMoney(row.total_gross),
    },
    {
      name: "total_deductions",
      label: "Deductions",
      hideInForm: true,
      render: (row: HrRow) => formatMoney(row.total_deductions),
    },
    {
      name: "total_net",
      label: "Net Payable",
      hideInForm: true,
      render: (row: HrRow) => (
        <span className="font-semibold">{formatMoney(row.total_net)}</span>
      ),
    },
    { name: "status", label: "Status", hideInForm: true },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Approve",
      icon: IconCheck,
      show: (row) => row.status === "draft",
      onClick: (row) => setStatus(row, "approved"),
    },
    {
      label: "Mark Paid",
      icon: IconCash,
      show: (row) => row.status === "approved",
      onClick: (row) => setStatus(row, "paid"),
    },
  ]

  return (
    <>
      <ResourceScreen
        embedded
        title="Payroll Runs"
        singular="Payroll Run"
        endpoint="/payroll-runs"
        fields={fields}
        rowActions={actions}
        refreshToken={refresh}
        canCreate={false}
        canEdit={false}
        filters={[
          { name: "status", label: "Status", options: enumOptions(["draft", "processing", "approved", "paid", "cancelled"]) },
        ]}
        emptyMessage="No payroll has been processed yet"
        onLoaded={(rows) => {
          setTotals({
            gross: rows.reduce((s, r) => s + Number(r.total_gross ?? 0), 0),
            net: rows.reduce((s, r) => s + Number(r.total_net ?? 0), 0),
            employees: rows.length ? Number(rows[0].employee_count ?? 0) : 0,
          })
        }}
        toolbar={
          <Button onClick={() => setDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <IconPlayerPlay className="h-4 w-4" />
            Process Payroll
          </Button>
        }
        header={
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatTile label="Latest Run Employees" value={totals.employees} tone="teal" />
            <StatTile label="Gross (all runs)" value={formatMoney(totals.gross)} />
            <StatTile label="Net (all runs)" value={formatMoney(totals.net)} tone="emerald" />
          </div>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process payroll</DialogTitle>
            <DialogDescription>
              Generates a payslip for every active employee from their salary structure,
              attendance, unpaid leave and approved piece work. A draft run can be
              reprocessed; approved and paid runs are locked.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map((offset) => {
                    const y = new Date().getFullYear() - offset
                    return (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={process} disabled={processing} className="bg-teal-600 hover:bg-teal-700">
              {processing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PayslipsTab() {
  const { options } = useHrOptions(["employees", "payrollRuns"])

  const fields: Field[] = [
    { name: "employee_id", label: "Employee", hideInForm: true, render: employeeCell },
    {
      name: "payroll_run_id",
      label: "Run",
      type: "select",
      optionsKey: "payrollRuns",
      hideInForm: true,
      render: (row: HrRow) => {
        const run = row.payroll_run as { period_month?: number; period_year?: number } | undefined
        return run ? `${String(run.period_month).padStart(2, "0")}/${run.period_year}` : "—"
      },
    },
    { name: "basic", label: "Basic", hideInForm: true, render: (r: HrRow) => formatMoney(r.basic) },
    { name: "allowances", label: "Allowances", hideInForm: true, render: (r: HrRow) => formatMoney(r.allowances) },
    { name: "overtime_amount", label: "Overtime", hideInForm: true, render: (r: HrRow) => formatMoney(r.overtime_amount) },
    { name: "piece_work_amount", label: "Piece Work", hideInForm: true, render: (r: HrRow) => formatMoney(r.piece_work_amount) },
    { name: "gross", label: "Gross", hideInForm: true, render: (r: HrRow) => formatMoney(r.gross) },
    {
      name: "unpaid_leave_deduction",
      label: "Unpaid Deduction",
      hideInForm: true,
      render: (r: HrRow) => formatMoney(r.unpaid_leave_deduction),
    },
    {
      name: "net_pay",
      label: "Net Pay",
      hideInForm: true,
      render: (r: HrRow) => <span className="font-semibold">{formatMoney(r.net_pay)}</span>,
    },
    { name: "status", label: "Status", hideInForm: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Payslips"
      singular="Payslip"
      endpoint="/payslips"
      fields={fields}
      optionSources={options}
      canCreate={false}
      canEdit={false}
      canDelete={false}
      filters={[
        { name: "payroll_run_id", label: "Runs", options: options.payrollRuns ?? [] },
        { name: "status", label: "Status", options: enumOptions(["generated", "approved", "paid"]) },
      ]}
      emptyMessage="No payslips — process a payroll run first"
    />
  )
}

function StructuresTab() {
  const { options } = useHrOptions(["employees"])

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: employeeCell,
    },
    { name: "effective_from", label: "Effective From", type: "date", required: true },
    { name: "basic", label: "Basic", type: "money", defaultValue: 0 },
    { name: "house_rent", label: "House Rent", type: "money", defaultValue: 0 },
    { name: "medical", label: "Medical", type: "money", defaultValue: 0 },
    { name: "conveyance", label: "Conveyance", type: "money", defaultValue: 0, hideInTable: true },
    { name: "other_allowance", label: "Other Allowance", type: "money", defaultValue: 0, hideInTable: true },
    { name: "tax_deduction", label: "Tax", type: "money", defaultValue: 0 },
    { name: "pf_deduction", label: "Provident Fund", type: "money", defaultValue: 0, hideInTable: true },
    { name: "other_deduction", label: "Other Deduction", type: "money", defaultValue: 0, hideInTable: true },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Salary Structures"
      singular="Salary Structure"
      endpoint="/salary-structures"
      fields={fields}
      optionSources={options}
      description="The active structure with the latest effective date is what payroll uses."
    />
  )
}

const Payroll = () => (
  <HrTabbedPage
    title="Payroll"
    description="Gross = salary structure + overtime + approved piece work. Absent and unpaid-leave days are deducted at the per-day rate."
    tabs={[
      { value: "runs", label: "Payroll Runs", content: <RunsTab /> },
      { value: "payslips", label: "Payslips", content: <PayslipsTab /> },
      { value: "structures", label: "Salary Structures", content: <StructuresTab /> },
    ]}
  />
)

export default Payroll
