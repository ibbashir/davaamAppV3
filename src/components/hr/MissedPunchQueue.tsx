import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { IconLoader2, IconInbox, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hrGet, hrAction, errorMessage, formatTime, formatDate } from "@/components/hr/hr-api"
import type { MissedPunchRequest } from "@/Types/hr"

type Stage = "hr" | "superadmin"

/**
 * The two desks a missed-attendance request passes through. Same screen, same
 * table, different endpoint and a different consequence to "Approve" — so it
 * is one component with the difference named here rather than two copies that
 * would drift.
 */
const STAGES: Record<
  Stage,
  {
    title: string
    description: string
    list: string
    decide: (id: number) => string
    waiting: MissedPunchRequest["status"]
    approveLabel: string
    approveExplain: string
  }
> = {
  hr: {
    title: "Missed Attendance",
    description:
      "Staff who forgot to punch in or out. Your approval is the first of two — approving sends the request to the super admin for final approval, and nothing is marked until they approve too.",
    list: "/attendance/missed-punch-requests",
    decide: (id) => `/attendance/missed-punch-requests/${id}/decide`,
    waiting: "pending_hr",
    approveLabel: "Approve & send to super admin",
    approveExplain:
      "This is the first approval. The request goes to the super admin next; the attendance is marked only if they approve as well.",
  },
  superadmin: {
    title: "Attendance Approvals",
    description:
      "Missed-attendance requests HR has already approved. Yours is the final approval — approving marks the attendance on the employee's record.",
    list: "/attendance/missed-punch-requests/final",
    decide: (id) => `/attendance/missed-punch-requests/final/${id}/decide`,
    waiting: "pending_superadmin",
    approveLabel: "Approve & mark attendance",
    approveExplain:
      "HR has approved this. Approving now writes the times onto the employee's attendance, with late minutes and hours worked out exactly as if they had punched.",
  },
}

const STATUS_LABEL: Record<string, string> = {
  pending_hr: "With HR",
  pending_superadmin: "With super admin",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Withdrawn",
}

const STATUS_CLASS: Record<string, string> = {
  pending_hr: "bg-amber-100 text-amber-700 border-amber-200",
  pending_superadmin: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
}

function Times({ checkIn, checkOut, empty }: { checkIn: string | null; checkOut: string | null; empty: string }) {
  if (!checkIn && !checkOut) return <span className="text-muted-foreground">{empty}</span>
  return (
    <div className="tabular-nums">
      {checkIn && <div>In {formatTime(checkIn)}</div>}
      {checkOut && <div>Out {formatTime(checkOut)}</div>}
    </div>
  )
}

export default function MissedPunchQueue({ stage }: { stage: Stage }) {
  const cfg = STAGES[stage]
  const [rows, setRows] = React.useState<MissedPunchRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<string>(cfg.waiting)
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [deciding, setDeciding] = React.useState<{ row: MissedPunchRequest; decision: "approved" | "rejected" } | null>(null)
  const [note, setNote] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: MissedPunchRequest[] }>(cfg.list, { status })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load requests"))
    } finally {
      setLoading(false)
    }
  }, [cfg.list, status])

  React.useEffect(() => {
    load()
  }, [load])

  const confirm = async () => {
    if (!deciding) return
    const { row, decision } = deciding
    setBusyId(row.id)
    try {
      const res = await hrAction<{ message: string }>(cfg.decide(row.id), {
        decision,
        note: note.trim() || undefined,
      })
      toast.success(res.message)
      setDeciding(null)
      setNote("")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the decision"))
    } finally {
      setBusyId(null)
    }
  }

  const waiting = rows.filter((r) => r.status === cfg.waiting).length

  return (
    <HrPage title={cfg.title} description={cfg.description}>
      <div className="grid max-w-md gap-3 grid-cols-2">
        <StatTile label="Waiting on you" value={waiting} tone={waiting ? "amber" : "default"} />
        <StatTile label="Showing" value={rows.length} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Show</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={cfg.waiting}>Waiting on you</SelectItem>
              <SelectItem value="in_process">Everything in process</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Withdrawn</SelectItem>
              <SelectItem value="all">All requests</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Asking for</TableHead>
                  <TableHead>On record now</TableHead>
                  <TableHead className="min-w-[240px]">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      <IconInbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      {status === cfg.waiting ? "Nothing waiting on you" : "No requests to show"}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.employee ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {[row.employee_code, row.department].filter(Boolean).join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(row.attendance_date)}</TableCell>
                      <TableCell className="font-medium">
                        <Times checkIn={row.requested_check_in} checkOut={row.requested_check_out} empty="—" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Times checkIn={row.current_check_in} checkOut={row.current_check_out} empty="No punches" />
                      </TableCell>
                      <TableCell className="max-w-[340px] whitespace-pre-wrap text-sm">
                        {row.reason}
                        {row.hr_note && <p className="mt-1 text-xs text-muted-foreground">HR: {row.hr_note}</p>}
                        {row.sa_note && (
                          <p className="mt-1 text-xs text-muted-foreground">Super admin: {row.sa_note}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", STATUS_CLASS[row.status])}>
                          {row.status === "rejected" && row.rejected_stage
                            ? `Rejected by ${row.rejected_stage === "hr" ? "HR" : "super admin"}`
                            : STATUS_LABEL[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === cfg.waiting ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              className="h-8 bg-teal-600 hover:bg-teal-700"
                              disabled={busyId === row.id}
                              onClick={() => {
                                setNote("")
                                setDeciding({ row, decision: "approved" })
                              }}
                            >
                              <IconCheck className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={busyId === row.id}
                              onClick={() => {
                                setNote("")
                                setDeciding({ row, decision: "rejected" })
                              }}
                            >
                              <IconX className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(row.sa_decided_at ?? row.hr_decided_at ?? row.cancelled_at ?? null)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deciding} onOpenChange={(open) => !open && setDeciding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deciding?.decision === "approved" ? "Approve" : "Reject"} {deciding?.row.employee ?? "request"}
            </DialogTitle>
            <DialogDescription>
              {deciding?.decision === "approved"
                ? cfg.approveExplain
                : "The request ends here and nothing is marked. The employee sees who rejected it and your note."}
            </DialogDescription>
          </DialogHeader>

          {deciding && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{formatDate(deciding.row.attendance_date)}</p>
                <p className="tabular-nums">
                  {[
                    deciding.row.requested_check_in && `In ${formatTime(deciding.row.requested_check_in)}`,
                    deciding.row.requested_check_out && `Out ${formatTime(deciding.row.requested_check_out)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{deciding.row.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="missed-note">
                  Note (optional)
                </label>
                <Textarea
                  id="missed-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                  placeholder={
                    deciding.decision === "approved"
                      ? "e.g. Confirmed with their manager."
                      : "Tell them why — they will see this."
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={!!busyId}
              className={deciding?.decision === "approved" ? "bg-teal-600 hover:bg-teal-700" : undefined}
              variant={deciding?.decision === "approved" ? "default" : "destructive"}
            >
              {busyId && <IconLoader2 className="h-4 w-4 animate-spin" />}
              {deciding?.decision === "approved" ? cfg.approveLabel : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrPage>
  )
}
