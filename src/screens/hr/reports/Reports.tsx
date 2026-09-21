import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
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
import { IconLoader2, IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  hrGet,
  errorMessage,
  humanise,
  todayISO,
  monthStartISO,
  HR,
  qs,
} from "@/components/hr/hr-api"

const REPORT_TYPES = [
  "headcount",
  "attendance_summary",
  "leave_summary",
  "payroll_summary",
  "recruitment_funnel",
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

const Reports = () => (
  <HrTabbedPage
    title="Reports"
    tabs={[{ value: "preview", label: "Preview & Export", content: <PreviewTab /> }]}
  />
)

export default Reports
