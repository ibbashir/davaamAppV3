import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  hrGet,
  hrAction,
  errorMessage,
  formatMoney,
  humanise,
  todayISO,
  monthStartISO,
} from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const ENTRY_STATUSES = ["pending", "approved", "rejected", "paid"]

const employeeCell = (row: HrRow) => {
  const e = row.employee as { first_name?: string; last_name?: string } | undefined
  return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
}

function EntriesTab() {
  const { options } = useHrOptions(["employees", "pieceWorkRates"])
  const [refresh, setRefresh] = React.useState(0)

  const decide = async (row: HrRow, decision: "approved" | "rejected") => {
    try {
      const res = await hrAction<{ message: string }>("/piece-work-entries/decide", {
        ids: [row.id],
        decision,
      })
      toast.success(res.message)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"))
    }
  }

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: employeeCell,
    },
    {
      name: "rate_id",
      label: "Task",
      type: "select",
      optionsKey: "pieceWorkRates",
      required: true,
      render: (row: HrRow) => (row.rate as { task_name?: string })?.task_name ?? "—",
    },
    { name: "work_date", label: "Date", type: "date", required: true },
    { name: "units", label: "Units", type: "number", required: true, defaultValue: 0 },
    {
      name: "rate_per_unit",
      label: "Rate",
      type: "money",
      help: "Defaults to the task's current rate card value",
      render: (row: HrRow) => formatMoney(row.rate_per_unit),
    },
    {
      name: "amount",
      label: "Amount",
      hideInForm: true,
      render: (row: HrRow) => <span className="font-semibold">{formatMoney(row.amount)}</span>,
    },
    { name: "machine_code", label: "Machine", hideInTable: true },
    { name: "status", label: "Status", hideInForm: true },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
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
      title="Piece Work Entries"
      singular="Entry"
      endpoint="/piece-work-entries"
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      description="Approved entries are picked up by the next payroll run and then locked as paid."
      filters={[
        { name: "status", label: "Status", options: enumOptions(ENTRY_STATUSES) },
        { name: "employee_id", label: "Employees", options: options.employees ?? [] },
      ]}
    />
  )
}

function RatesTab() {
  const { options } = useHrOptions(["departments"])

  const fields: Field[] = [
    { name: "task_name", label: "Task", required: true, wide: true },
    { name: "task_code", label: "Code" },
    { name: "unit", label: "Unit", defaultValue: "unit", required: true },
    {
      name: "rate_per_unit",
      label: "Rate / Unit",
      type: "money",
      required: true,
      render: (row: HrRow) => formatMoney(row.rate_per_unit),
    },
    { name: "effective_from", label: "Effective From", type: "date" },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      optionsKey: "departments",
      hideInTable: true,
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Rate Card"
      singular="Rate"
      endpoint="/piece-work-rates"
      fields={fields}
      optionSources={options}
      description="Entries store the rate applied at the time, so changing a rate here never rewrites past earnings."
    />
  )
}

function SummaryTab() {
  const [from, setFrom] = React.useState(monthStartISO())
  const [to, setTo] = React.useState(todayISO())
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([])
  const [grandTotal, setGrandTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: Record<string, unknown>[]; grand_total: number }>(
        "/piece-work/summary",
        { from, to },
      )
      setRows(res.data ?? [])
      setGrandTotal(res.grand_total ?? 0)
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the summary"))
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[165px]" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[165px]" />
        <Button variant="outline" onClick={load}>
          Apply
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total Earnings" value={formatMoney(grandTotal)} tone="teal" />
        <StatTile label="Rows" value={rows.length} />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Amount</TableHead>
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
                      No piece work logged in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => {
                    const e = row.employee as { first_name?: string; last_name?: string; employee_code?: string } | undefined
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium">
                            {`${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">{e?.employee_code}</div>
                        </TableCell>
                        <TableCell>{humanise(row.status)}</TableCell>
                        <TableCell>{String(row.entry_count ?? 0)}</TableCell>
                        <TableCell>{String(row.total_units ?? 0)}</TableCell>
                        <TableCell className="font-semibold">{formatMoney(row.total_amount)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const PieceWork = () => (
  <HrTabbedPage
    title="Piece Work Management"
    tabs={[
      { value: "entries", label: "Entries", content: <EntriesTab /> },
      { value: "summary", label: "Summary", content: <SummaryTab /> },
      { value: "rates", label: "Rate Card", content: <RatesTab /> },
    ]}
  />
)

export default PieceWork
