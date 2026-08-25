import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconPlayerPlay, IconLoader2, IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  hrAction,
  hrGet,
  errorMessage,
  formatDateTime,
  humanise,
  todayISO,
  monthStartISO,
  HR,
  qs,
} from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const REPORT_TYPES = [
  "headcount",
  "attendance_summary",
  "leave_summary",
  "expense_summary",
  "recruitment_funnel",
  "training_summary",
  "attrition",
  "piece_work",
]

/** On-screen preview of any report, with a CSV download of the same rows. */
function PreviewTab() {
  const [type, setType] = React.useState("headcount")
  const [from, setFrom] = React.useState(monthStartISO())
  const [to, setTo] = React.useState(todayISO())
  const [result, setResult] = React.useState<{ columns: string[]; rows: unknown[][] } | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: { columns: string[]; rows: unknown[][] } }>("/reports/preview", {
        report_type: type,
        from,
        to,
      })
      setResult(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not build the report"))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [type, from, to])

  React.useEffect(() => {
    run()
  }, [run])

  // The CSV endpoint streams a file, so hand it to the browser directly rather
  // than pulling it through axios.
  const downloadUrl = `${HR}/reports/download${qs({ report_type: type, from, to })}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {humanise(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[165px]" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[165px]" />
        <Button variant="outline" onClick={run}>
          Run
        </Button>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <IconDownload className="h-4 w-4" />
            CSV
          </a>
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  {(result?.columns ?? []).map((c) => (
                    <TableHead key={c} className="whitespace-nowrap">
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={result?.columns?.length || 1} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : !result?.rows?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={result?.columns?.length || 1}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No data for this report
                    </TableCell>
                  </TableRow>
                ) : (
                  result.rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="whitespace-nowrap">
                          {cell === null || cell === undefined || cell === "" ? "—" : String(cell)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {result?.rows?.length ? (
        <p className="text-sm text-muted-foreground">{result.rows.length} row(s)</p>
      ) : null}
    </div>
  )
}

function SchedulesTab() {
  const [refresh, setRefresh] = React.useState(0)

  const runNow = async (row: HrRow) => {
    try {
      const res = await hrAction<{ message: string }>(`/scheduled-reports/${row.id}/run`, {})
      toast.success(res.message)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not run the report"))
    }
  }

  const fields: Field[] = [
    { name: "name", label: "Report", required: true, wide: true },
    { name: "report_type", label: "Type", type: "select", options: enumOptions(REPORT_TYPES), required: true },
    { name: "format", label: "Format", type: "select", options: enumOptions(["csv", "xlsx", "pdf"]), defaultValue: "csv" },
    {
      name: "frequency",
      label: "Frequency",
      type: "select",
      options: enumOptions(["daily", "weekly", "monthly"]),
      defaultValue: "monthly",
    },
    {
      name: "day_of_week",
      label: "Day of Week",
      type: "number",
      hideInTable: true,
      help: "Weekly only — 0 = Sunday through 6 = Saturday",
    },
    {
      name: "day_of_month",
      label: "Day of Month",
      type: "number",
      hideInTable: true,
      help: "Monthly only — 1 to 31",
    },
    { name: "time_of_day", label: "Time", defaultValue: "08:00", hideInTable: true },
    {
      name: "recipients",
      label: "Recipients",
      wide: true,
      hideInTable: true,
      help: 'JSON array of email addresses, e.g. ["hr@davaam.pk","ceo@davaam.pk"]',
    },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    {
      name: "last_run_at",
      label: "Last Run",
      hideInForm: true,
      render: (row: HrRow) => formatDateTime(row.last_run_at),
    },
  ]

  const actions: RowAction[] = [{ label: "Run now", icon: IconPlayerPlay, onClick: runNow }]

  return (
    <ResourceScreen
      embedded
      title="Scheduled Reports"
      singular="Scheduled Report"
      endpoint="/scheduled-reports"
      fields={fields}
      rowActions={actions}
      refreshToken={refresh}
      description="Due reports are built and emailed by the daily scheduler. A report with no recipients is generated but not sent."
      filters={[
        { name: "report_type", label: "Types", options: enumOptions(REPORT_TYPES) },
        { name: "frequency", label: "Frequency", options: enumOptions(["daily", "weekly", "monthly"]) },
      ]}
    />
  )
}

function LogsTab() {
  const fields: Field[] = [
    {
      name: "report_id",
      label: "Report",
      hideInForm: true,
      render: (row: HrRow) => (row.report as { name?: string })?.name ?? "—",
    },
    { name: "row_count", label: "Rows", hideInForm: true },
    { name: "status", label: "Status", hideInForm: true },
    {
      name: "created_at",
      label: "Run At",
      hideInForm: true,
      render: (row: HrRow) => formatDateTime(row.created_at),
    },
    { name: "error", label: "Error", hideInForm: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Report Log"
      singular="Log Entry"
      endpoint="/report-logs"
      fields={fields}
      canCreate={false}
      canEdit={false}
      emptyMessage="No reports have run yet"
    />
  )
}

const Reports = () => (
  <HrTabbedPage
    title="Scheduled Reports"
    tabs={[
      { value: "preview", label: "Preview & Export", content: <PreviewTab /> },
      { value: "schedules", label: "Schedules", content: <SchedulesTab /> },
      { value: "logs", label: "Log", content: <LogsTab /> },
    ]}
  />
)

export default Reports
