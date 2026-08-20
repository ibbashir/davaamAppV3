import * as React from "react"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { IconCheck, IconX, IconCash } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const CATEGORIES = [
  "travel",
  "fuel",
  "meals",
  "accommodation",
  "medical",
  "communication",
  "stationery",
  "other",
]
const STATUSES = ["pending", "approved", "rejected", "cancelled", "reimbursed"]

const Expenses = () => {
  const { options } = useHrOptions(["employees", "travelRequests"])
  const [refresh, setRefresh] = React.useState(0)

  const decide = async (row: HrRow, decision: "approved" | "rejected") => {
    try {
      await hrAction(`/expense-claims/${row.id}/decide`, { decision })
      toast.success(`Claim ${decision}`)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"))
    }
  }

  const reimburse = async (row: HrRow) => {
    try {
      await hrAction(`/expense-claims/${row.id}/reimburse`, {})
      toast.success("Claim marked reimbursed")
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not mark the claim reimbursed"))
    }
  }

  const fields: Field[] = [
    { name: "claim_code", label: "Claim", hideInForm: true },
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
    { name: "category", label: "Category", type: "select", options: enumOptions(CATEGORIES), defaultValue: "other" },
    { name: "expense_date", label: "Date", type: "date", required: true },
    {
      name: "amount",
      label: "Amount",
      type: "money",
      required: true,
      render: (row: HrRow) => formatMoney(row.amount),
    },
    { name: "status", label: "Status", hideInForm: true },
    {
      name: "travel_request_id",
      label: "Linked Travel",
      type: "select",
      optionsKey: "travelRequests",
      hideInTable: true,
      help: "Link this claim to an approved travel request",
    },
    { name: "receipt_url", label: "Receipt URL", hideInTable: true, wide: true },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
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
    {
      label: "Reimburse",
      icon: IconCash,
      show: (row) => row.status === "approved",
      onClick: reimburse,
    },
  ]

  return (
    <ResourceScreen
      title="Expense Management"
      singular="Expense Claim"
      endpoint="/expense-claims"
      description="Employees file claims from Self Service; approved claims are settled here."
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      filters={[
        { name: "status", label: "Status", options: enumOptions(STATUSES) },
        { name: "category", label: "Categories", options: enumOptions(CATEGORIES) },
      ]}
      searchPlaceholder="Search claims…"
    />
  )
}

export default Expenses
