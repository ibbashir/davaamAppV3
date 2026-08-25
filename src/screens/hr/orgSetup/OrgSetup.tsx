import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { useHrOptions } from "@/components/hr/useHrOptions"
import type { HrRow } from "@/Types/hr"

function DepartmentsTab() {
  const { options } = useHrOptions(["reportsTo"])

  const fields: Field[] = [
    { name: "name", label: "Department", required: true },
    { name: "code", label: "Code" },
    { name: "cost_center", label: "Cost Center" },
    {
      name: "head_employee_id",
      label: "Department Head",
      type: "select",
      optionsKey: "reportsTo",
      hideInTable: true,
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Departments"
      singular="Department"
      endpoint="/departments"
      fields={fields}
      optionSources={options}
    />
  )
}

function DesignationsTab() {
  const { options } = useHrOptions(["departments"])

  const fields: Field[] = [
    { name: "title", label: "Designation", required: true },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      optionsKey: "departments",
      render: (row: HrRow) => (row.department as { name?: string })?.name ?? "—",
    },
    { name: "grade", label: "Grade" },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Designations"
      singular="Designation"
      endpoint="/designations"
      fields={fields}
      optionSources={options}
    />
  )
}

function ShiftsTab() {
  const fields: Field[] = [
    { name: "name", label: "Shift", required: true },
    { name: "start_time", label: "Start", type: "time", required: true, defaultValue: "09:00" },
    { name: "end_time", label: "End", type: "time", required: true, defaultValue: "18:00" },
    {
      name: "grace_minutes",
      label: "Grace (min)",
      type: "number",
      defaultValue: 15,
      help: "Minutes after start before a punch counts as late",
    },
    { name: "full_day_hours", label: "Full Day (hrs)", type: "number", defaultValue: 8 },
    { name: "half_day_hours", label: "Half Day (hrs)", type: "number", defaultValue: 4 },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Shifts"
      singular="Shift"
      endpoint="/shifts"
      fields={fields}
      description="An employee's shift drives their late, half-day and overtime calculations."
    />
  )
}

function HolidaysTab() {
  const fields: Field[] = [
    { name: "name", label: "Holiday", required: true },
    { name: "holiday_date", label: "Date", type: "date", required: true },
    { name: "is_optional", label: "Optional", type: "checkbox" },
    { name: "description", label: "Description", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Holiday Calendar"
      singular="Holiday"
      endpoint="/holidays"
      fields={fields}
    />
  )
}

const OrgSetup = () => (
  <HrTabbedPage
    title="Org Setup"
    description="Reference data shared by every HR module — set these up before adding employees."
    tabs={[
      { value: "departments", label: "Departments", content: <DepartmentsTab /> },
      { value: "designations", label: "Designations", content: <DesignationsTab /> },
      { value: "shifts", label: "Shifts", content: <ShiftsTab /> },
      { value: "holidays", label: "Holidays", content: <HolidaysTab /> },
    ]}
  />
)

export default OrgSetup
