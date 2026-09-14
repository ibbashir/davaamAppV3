import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { enumOptions } from "@/components/hr/useHrOptions"

const LETTER_TYPES = [
  "offer",
  "appointment",
  "confirmation",
  "promotion",
  "increment",
  "warning",
  "experience",
  "relieving",
  "noc",
  "salary_certificate",
  "other",
]

const TOKENS = [
  "employee_name",
  "employee_code",
  "designation",
  "department",
  "date_of_joining",
  "date_of_confirmation",
  "base_salary",
  "employment_type",
  "work_location",
  "email",
  "phone",
  "cnic",
  "today",
  "company_name",
]

/** The letter template library — the wording HR reuses for every letter type. */
const Letters = () => {
  const fields: Field[] = [
    { name: "name", label: "Template", required: true },
    { name: "letter_type", label: "Type", type: "select", options: enumOptions(LETTER_TYPES), defaultValue: "other" },
    { name: "subject", label: "Subject", wide: true },
    {
      name: "body",
      label: "Body",
      type: "textarea",
      required: true,
      hideInTable: true,
      help: `Available tokens: ${TOKENS.map((t) => `{{${t}}}`).join(", ")}`,
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  ]

  return (
    <ResourceScreen
      title="Letter Templates"
      singular="Template"
      endpoint="/letter-templates"
      fields={fields}
      description="Write the body once with {{tokens}}; a preview substitutes the employee's own details."
    />
  )
}

export default Letters
