import * as React from "react"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const MODES = ["road", "air", "rail", "company_vehicle", "other"]
const STATUSES = ["pending", "approved", "rejected", "cancelled"]

const Travel = () => {
  const { options } = useHrOptions(["employees"])
  const [refresh, setRefresh] = React.useState(0)

  const decide = async (row: HrRow, decision: "approved" | "rejected") => {
    try {
      await hrAction(`/travel-requests/${row.id}/decide`, { decision })
      toast.success(`Travel request ${decision}`)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"))
    }
  }

  const fields: Field[] = [
    { name: "request_code", label: "Request", hideInForm: true },
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
    { name: "destination", label: "Destination", required: true },
    { name: "origin", label: "Origin", hideInTable: true },
    { name: "purpose", label: "Purpose", required: true, wide: true },
    { name: "from_date", label: "From", type: "date", required: true },
    { name: "to_date", label: "To", type: "date", required: true },
    { name: "mode", label: "Mode", type: "select", options: enumOptions(MODES), defaultValue: "road" },
    {
      name: "estimated_cost",
      label: "Est. Cost",
      type: "money",
      render: (row: HrRow) => formatMoney(row.estimated_cost),
    },
    {
      name: "advance_required",
      label: "Advance",
      type: "money",
      hideInTable: true,
    },
    {
      name: "accommodation_required",
      label: "Accommodation needed",
      type: "checkbox",
      hideInTable: true,
    },
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
      title="Travel Management"
      singular="Travel Request"
      endpoint="/travel-requests"
      description="Approved trips can be linked from an expense claim so the spend ties back to the journey."
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      filters={[
        { name: "status", label: "Status", options: enumOptions(STATUSES) },
        { name: "mode", label: "Modes", options: enumOptions(MODES) },
      ]}
      searchPlaceholder="Search travel requests…"
    />
  )
}

export default Travel
