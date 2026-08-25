import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { formatDate } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

/**
 * The company holiday calendar.
 *
 * Saving a holiday announces it to every role that marks attendance — see
 * announceHoliday in backend Hr/attendance.js. Two things follow from that and
 * are worth knowing before editing a row: a date in the past is recorded
 * silently (back-filling last year's calendar is not news), and changing the
 * name or the date re-announces it, while editing only the description or the
 * optional flag does not.
 */
const Holidays = () => {
  const fields: Field[] = [
    { name: "name", label: "Holiday", required: true },
    {
      name: "holiday_date",
      label: "Date",
      type: "date",
      required: true,
      render: (row: HrRow) => formatDate(row.holiday_date),
    },
    {
      name: "is_optional",
      label: "Optional",
      type: "checkbox",
      help: "Staff may work an optional holiday — they are told to mark attendance as usual",
    },
    { name: "description", label: "Description", type: "textarea", hideInTable: true, wide: true },
  ]

  return (
    <ResourceScreen
      title="Holiday Calendar"
      singular="Holiday"
      endpoint="/holidays"
      fields={fields}
      description="Add a holiday and everyone who marks attendance is notified. Past dates are recorded without an announcement."
    />
  )
}

export default Holidays
