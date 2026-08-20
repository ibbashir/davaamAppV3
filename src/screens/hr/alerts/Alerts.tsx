import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { enumOptions } from "@/components/hr/useHrOptions"
import { IconPlayerPlay } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatDateTime } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const EVENT_TYPES = [
  "birthday",
  "work_anniversary",
  "probation_end",
  "contract_expiry",
  "document_expiry",
  "leave_balance_low",
  "pending_approvals",
  "missing_attendance",
]

function AlertsTab() {
  const [refresh, setRefresh] = React.useState(0)

  const runNow = async (row: HrRow) => {
    try {
      const res = await hrAction<{ message: string }>(`/scheduled-alerts/${row.id}/run`, {})
      toast.success(res.message)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not run the alert"))
    }
  }

  const fields: Field[] = [
    { name: "name", label: "Alert", required: true, wide: true },
    {
      name: "event_type",
      label: "Event",
      type: "select",
      options: enumOptions(EVENT_TYPES),
      required: true,
    },
    {
      name: "days_before",
      label: "Days Before",
      type: "number",
      defaultValue: 0,
      help: "How many days ahead of the date to fire. 0 = on the day.",
    },
    {
      name: "channel",
      label: "Channel",
      type: "select",
      options: enumOptions(["in_app", "email", "both"]),
      defaultValue: "in_app",
    },
    {
      name: "recipients",
      label: "Email Recipients",
      hideInTable: true,
      wide: true,
      help: 'JSON array of addresses, e.g. ["hr@davaam.pk"]. Leave blank for in-app only.',
    },
    {
      name: "message_template",
      label: "Message Template",
      type: "textarea",
      hideInTable: true,
      help: "Optional. Use {{message}} to place the generated text.",
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    {
      name: "last_run_at",
      label: "Last Run",
      hideInForm: true,
      render: (row: HrRow) => formatDateTime(row.last_run_at),
    },
  ]

  const actions: RowAction[] = [
    { label: "Run now", icon: IconPlayerPlay, onClick: runNow },
  ]

  return (
    <ResourceScreen
      embedded
      title="Scheduled Alerts"
      singular="Alert"
      endpoint="/scheduled-alerts"
      fields={fields}
      rowActions={actions}
      refreshToken={refresh}
      description="The scheduler evaluates every active alert once a day. 'Run now' fires exactly the same logic immediately."
      filters={[
        { name: "event_type", label: "Events", options: enumOptions(EVENT_TYPES) },
        { name: "channel", label: "Channels", options: enumOptions(["in_app", "email", "both"]) },
      ]}
    />
  )
}

function LogsTab() {
  const fields: Field[] = [
    {
      name: "alert_id",
      label: "Alert",
      hideInForm: true,
      render: (row: HrRow) => (row.alert as { name?: string })?.name ?? "—",
    },
    { name: "message", label: "Message", hideInForm: true },
    { name: "channel", label: "Channel", hideInForm: true },
    { name: "status", label: "Status", hideInForm: true },
    {
      name: "created_at",
      label: "Sent",
      hideInForm: true,
      render: (row: HrRow) => formatDateTime(row.created_at),
    },
    { name: "error", label: "Error", hideInForm: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Alert Log"
      singular="Log Entry"
      endpoint="/alert-logs"
      fields={fields}
      canCreate={false}
      canEdit={false}
      filters={[{ name: "status", label: "Status", options: enumOptions(["sent", "failed"]) }]}
      emptyMessage="Nothing has fired yet"
    />
  )
}

const Alerts = () => (
  <HrTabbedPage
    title="Scheduled Alerts"
    tabs={[
      { value: "alerts", label: "Alerts", content: <AlertsTab /> },
      { value: "logs", label: "Log", content: <LogsTab /> },
    ]}
  />
)

export default Alerts
