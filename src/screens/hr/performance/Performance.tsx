import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import type { HrRow } from "@/Types/hr"

const REVIEW_STATUSES = ["not_started", "self_review", "manager_review", "completed"]
const GOAL_STATUSES = ["not_started", "in_progress", "achieved", "missed"]

const employeeCell = (row: HrRow) => {
  const e = row.employee as { first_name?: string; last_name?: string } | undefined
  return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
}

function CyclesTab() {
  const fields: Field[] = [
    { name: "name", label: "Cycle", required: true },
    { name: "period_start", label: "From", type: "date", required: true },
    { name: "period_end", label: "To", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["draft", "active", "closed"]),
      defaultValue: "draft",
    },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Review Cycles"
      singular="Review Cycle"
      endpoint="/review-cycles"
      fields={fields}
    />
  )
}

function ReviewsTab() {
  const { options } = useHrOptions(["employees", "reviewCycles"])

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
      name: "cycle_id",
      label: "Cycle",
      type: "select",
      optionsKey: "reviewCycles",
      render: (row: HrRow) => (row.cycle as { name?: string })?.name ?? "—",
    },
    {
      name: "reviewer_id",
      label: "Reviewer",
      type: "select",
      optionsKey: "employees",
      render: (row: HrRow) => {
        const r = row.reviewer as { first_name?: string; last_name?: string } | undefined
        return `${r?.first_name ?? ""} ${r?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "self_rating", label: "Self", type: "number" },
    { name: "manager_rating", label: "Manager", type: "number" },
    { name: "final_rating", label: "Final", type: "number" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(REVIEW_STATUSES),
      defaultValue: "not_started",
    },
    { name: "strengths", label: "Strengths", type: "textarea", hideInTable: true },
    { name: "improvements", label: "Areas to Improve", type: "textarea", hideInTable: true },
    { name: "reviewer_comments", label: "Reviewer Comments", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Performance Reviews"
      singular="Review"
      endpoint="/performance-reviews"
      fields={fields}
      optionSources={options}
      description="Employees complete their self-review from Self Service; managers and HR finish it here."
      filters={[{ name: "status", label: "Status", options: enumOptions(REVIEW_STATUSES) }]}
    />
  )
}

function GoalsTab() {
  const { options } = useHrOptions(["employees", "reviewCycles"])

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: employeeCell,
    },
    { name: "title", label: "Goal", required: true, wide: true },
    {
      name: "cycle_id",
      label: "Cycle",
      type: "select",
      optionsKey: "reviewCycles",
      hideInTable: true,
    },
    { name: "target_value", label: "Target" },
    { name: "achieved_value", label: "Achieved" },
    { name: "weightage", label: "Weight %", type: "number", defaultValue: 0 },
    { name: "progress", label: "Progress %", type: "number", defaultValue: 0 },
    { name: "due_date", label: "Due", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(GOAL_STATUSES),
      defaultValue: "not_started",
    },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Goals"
      singular="Goal"
      endpoint="/goals"
      fields={fields}
      optionSources={options}
      filters={[{ name: "status", label: "Status", options: enumOptions(GOAL_STATUSES) }]}
    />
  )
}

const Performance = () => (
  <HrTabbedPage
    title="Performance Management"
    tabs={[
      { value: "reviews", label: "Reviews", content: <ReviewsTab /> },
      { value: "goals", label: "Goals", content: <GoalsTab /> },
      { value: "cycles", label: "Cycles", content: <CyclesTab /> },
    ]}
  />
)

export default Performance
