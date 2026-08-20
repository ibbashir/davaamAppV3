import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { IconCheck, IconX, IconLoader2, IconRefresh } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatDate } from "@/components/hr/hr-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HrRow } from "@/Types/hr"

const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"]

const employeeCell = (row: HrRow) => {
  const e = row.employee as { first_name?: string; last_name?: string; employee_code?: string } | undefined
  return e ? `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || e.employee_code : "—"
}

function RequestsTab() {
  const { options } = useHrOptions(["employees", "leaveTypes"])
  const [refresh, setRefresh] = React.useState(0)

  const decide = async (row: HrRow, decision: "approved" | "rejected") => {
    try {
      await hrAction(`/leave-requests/${row.id}/decide`, { decision })
      toast.success(
        decision === "approved"
          ? "Leave approved — balance deducted and attendance marked"
          : "Leave rejected",
      )
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
      name: "leave_type_id",
      label: "Leave Type",
      type: "select",
      optionsKey: "leaveTypes",
      required: true,
      render: (row: HrRow) => (row.leave_type as { name?: string })?.name ?? "—",
    },
    { name: "from_date", label: "From", type: "date", required: true },
    { name: "to_date", label: "To", type: "date", required: true },
    { name: "days", label: "Days", hideInForm: true },
    {
      name: "is_half_day",
      label: "Half day",
      type: "checkbox",
      hideInTable: true,
      placeholder: "Counts as 0.5 days",
    },
    { name: "status", label: "Status", type: "select", options: enumOptions(LEAVE_STATUSES), hideInForm: true },
    { name: "reason", label: "Reason", type: "textarea", hideInTable: true },
    { name: "contact_during_leave", label: "Contact During Leave", hideInTable: true },
    {
      name: "decided_at",
      label: "Decided",
      hideInForm: true,
      render: (row: HrRow) => (row.decided_at ? formatDate(row.decided_at) : "—"),
    },
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
      title="Leave Requests"
      singular="Leave Request"
      endpoint="/leave-requests"
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      filters={[{ name: "status", label: "Status", options: enumOptions(LEAVE_STATUSES) }]}
      searchPlaceholder="Search leave requests…"
    />
  )
}

function TypesTab() {
  const [applying, setApplying] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [refresh, setRefresh] = React.useState(0)

  /**
   * Resets the three policy quotas, writes them onto every current employee's
   * balance for this year, and clears out any other leave type. Days already
   * taken are untouched, and a type with history is deactivated rather than
   * deleted so past requests stay readable.
   */
  const applyPolicy = async () => {
    setApplying(true)
    try {
      const res = await hrAction<{ message: string }>("/leave-types/apply-policy")
      toast.success(res.message, { duration: 10000 })
      setConfirmOpen(false)
      setRefresh((n) => n + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not apply the leave policy"))
    } finally {
      setApplying(false)
    }
  }

  const fields: Field[] = [
    { name: "name", label: "Name", required: true },
    { name: "code", label: "Code" },
    { name: "annual_quota", label: "Annual Quota", type: "number", required: true, defaultValue: 0 },
    { name: "is_paid", label: "Paid leave", type: "checkbox", defaultValue: true, placeholder: "Unpaid days are deducted in payroll" },
    { name: "carry_forward", label: "Carry forward", type: "checkbox" },
    { name: "max_carry_forward", label: "Max Carry Forward", type: "number", hideInTable: true },
    { name: "requires_attachment", label: "Requires attachment", type: "checkbox", hideInTable: true },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  const screen = (
    <ResourceScreen
      embedded
      title="Leave Types"
      singular="Leave Type"
      endpoint="/leave-types"
      fields={fields}
      refreshToken={refresh}
      toolbar={
        <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={applying}>
          <IconRefresh className="h-4 w-4" />
          Apply company policy
        </Button>
      }
      description="Quotas defined here are opened as balances for every new employee. The company policy is 14 annual, 5 casual and 5 medical days."
    />
  )

  return (
    <>
      {screen}

      <Dialog open={confirmOpen} onOpenChange={(open) => !applying && setConfirmOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply the company leave policy?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>This sets the standing entitlement for everyone on the register:</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  <li>Annual Leave — 14 days</li>
                  <li>Casual Leave — 5 days</li>
                  <li>Medical Leave — 5 days</li>
                </ul>
                <p>
                  Every other leave type is removed. One that already has balances or requests
                  against it is deactivated instead of deleted, so past leave stays readable.
                </p>
                <p className="text-amber-700">
                  Any individually adjusted entitlement is reset to these numbers. Days already
                  taken are not affected.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={applying}>
              Cancel
            </Button>
            <Button onClick={applyPolicy} disabled={applying} className="bg-teal-600 hover:bg-teal-700">
              {applying && <IconLoader2 className="h-4 w-4 animate-spin" />}
              Apply policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function BalancesTab() {
  const { options } = useHrOptions(["employees", "leaveTypes"])

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
      name: "leave_type_id",
      label: "Leave Type",
      type: "select",
      optionsKey: "leaveTypes",
      required: true,
      render: (row: HrRow) => (row.leave_type as { name?: string })?.name ?? "—",
    },
    { name: "year", label: "Year", type: "number", required: true, defaultValue: new Date().getFullYear() },
    { name: "entitled", label: "Entitled", type: "number", defaultValue: 0 },
    { name: "carried_forward", label: "Carried Forward", type: "number", defaultValue: 0 },
    { name: "used", label: "Used", type: "number", defaultValue: 0 },
    {
      name: "available",
      label: "Available",
      hideInForm: true,
      render: (row: HrRow) =>
        String(
          Number(row.entitled ?? 0) + Number(row.carried_forward ?? 0) - Number(row.used ?? 0),
        ),
    },
  ]

  return (
    <ResourceScreen
      embedded
      title="Leave Balances"
      singular="Balance"
      endpoint="/leave-balances"
      fields={fields}
      optionSources={options}
      searchPlaceholder="Search balances…"
    />
  )
}

const Leave = () => (
  <HrTabbedPage
    title="Leave Management"
    description="Approving a request deducts the balance and marks those days on the attendance sheet automatically."
    tabs={[
      { value: "requests", label: "Requests", content: <RequestsTab /> },
      { value: "balances", label: "Balances", content: <BalancesTab /> },
      { value: "types", label: "Leave Types", content: <TypesTab /> },
    ]}
  />
)

export default Leave
