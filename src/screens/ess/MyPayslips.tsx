import * as React from "react"
import { HrPage } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconEye } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { essGet, errorMessage, statusClass, humanise, formatMoney } from "@/components/hr/hr-api"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface Payslip {
  id: number
  basic: string
  allowances: string
  overtime_amount: string
  piece_work_amount: string
  gross: string
  tax: string
  deductions: string
  unpaid_leave_deduction: string
  net_pay: string
  paid_days: string
  absent_days: string
  leave_days: string
  status: string
  payroll_run?: { period_month: number; period_year: number }
}

const MyPayslips = () => {
  const [rows, setRows] = React.useState<Payslip[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)
  const [viewing, setViewing] = React.useState<Payslip | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await essGet<{ data: Payslip[] }>("/payslips")
        setRows(res.data ?? [])
      } catch (err) {
        const anyErr = err as { response?: { status?: number } }
        if (anyErr?.response?.status === 404) setNotLinked(true)
        else toast.error(errorMessage(err, "Could not load your payslips"))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (notLinked) {
    return (
      <HrPage title="My Payslips">
        <NotLinked />
      </HrPage>
    )
  }

  const period = (p: Payslip) =>
    p.payroll_run ? `${MONTHS[p.payroll_run.period_month - 1]} ${p.payroll_run.period_year}` : "—"

  return (
    <HrPage
      title="My Payslips"
      description="Payslips appear here once the payroll run has been approved."
    >
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Period</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                      No approved payslips yet
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{period(row)}</TableCell>
                      <TableCell>{formatMoney(row.gross)}</TableCell>
                      <TableCell>
                        {formatMoney(
                          Number(row.tax) + Number(row.deductions) + Number(row.unpaid_leave_deduction),
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{formatMoney(row.net_pay)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", statusClass(row.status))}>
                          {humanise(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8" onClick={() => setViewing(row)}>
                          <IconEye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>{viewing ? period(viewing) : ""}</DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-1 text-sm">
              <LineItem label="Basic" value={viewing.basic} />
              <LineItem label="Allowances" value={viewing.allowances} />
              <LineItem label="Overtime" value={viewing.overtime_amount} />
              <LineItem label="Piece work" value={viewing.piece_work_amount} />
              <LineItem label="Gross" value={viewing.gross} bold />

              <div className="pt-2" />
              <LineItem label="Tax" value={viewing.tax} negative />
              <LineItem label="Other deductions" value={viewing.deductions} negative />
              <LineItem label="Unpaid leave / absence" value={viewing.unpaid_leave_deduction} negative />

              <div className="mt-2 border-t pt-2">
                <LineItem label="Net pay" value={viewing.net_pay} bold />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-muted p-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Paid days</p>
                  <p className="font-medium">{viewing.paid_days}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Absent</p>
                  <p className="font-medium">{viewing.absent_days}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leave</p>
                  <p className="font-medium">{viewing.leave_days}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700">
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrPage>
  )
}

function LineItem({
  label,
  value,
  bold,
  negative,
}: {
  label: string
  value: string
  bold?: boolean
  negative?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between", bold && "font-semibold")}>
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", negative && "text-red-600")}>
        {negative ? "−" : ""}
        {formatMoney(value)}
      </span>
    </div>
  )
}

export default MyPayslips
