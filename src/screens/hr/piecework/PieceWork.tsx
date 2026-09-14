import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { useHrOptions } from "@/components/hr/useHrOptions"
import { formatMoney } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

/** The piece-work rate card: what one unit of a given task pays. */
const PieceWork = () => {
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
      title="Piece Work Rate Card"
      singular="Rate"
      endpoint="/piece-work-rates"
      fields={fields}
      optionSources={options}
      description="The rate that applies to a task from its effective date."
    />
  )
}

export default PieceWork
