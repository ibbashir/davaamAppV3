import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  IconLoader2,
  IconInbox,
  IconMapPin,
  IconCheck,
  IconX,
  IconLogout2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  hrGet,
  hrAction,
  errorMessage,
  statusClass,
  humanise,
  formatTime,
  formatDate,
} from "@/components/hr/hr-api"
import type { CheckoutRequest } from "@/Types/hr"

const STATUSES = ["pending", "approved", "rejected", "cancelled"]

/** A `datetime-local` value in Pakistan time — what the approve dialog edits. */
function toLocalInput(value: string | null): string {
  if (!value) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00"
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

/**
 * How far out they were, in the words HR needs: the number alone doesn't say
 * whether 800m is "round the corner" or "not plausibly at work".
 */
function Distance({ row }: { row: CheckoutRequest }) {
  if (row.distance_m == null) return <span className="text-muted-foreground">—</span>

  const km = row.distance_m >= 1000
  const label = km ? `${(row.distance_m / 1000).toFixed(1)} km` : `${row.distance_m} m`
  return (
    <div>
      <span className={cn("font-medium tabular-nums", km ? "text-amber-600" : "text-foreground")}>
        {label}
      </span>
      {row.nearest_site && (
        <p className="text-xs text-muted-foreground">from {row.nearest_site}</p>
      )}
    </div>
  )
}

/**
 * The queue of "I'm out on company work and can't punch out" requests.
 *
 * Approving punches the employee out — through the same code the office button
 * uses, so the day's worked minutes, overtime and status come out identically.
 * The time is HR's to set: the employee's own is filled in, because they are
 * the one who knows when they stopped, and it can be corrected here when they
 * clearly asked late.
 */
const CheckoutRequests = () => {
  const [rows, setRows] = React.useState<CheckoutRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState("pending")
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [approving, setApproving] = React.useState<CheckoutRequest | null>(null)
  const [checkOutAt, setCheckOutAt] = React.useState("")
  const [note, setNote] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await hrGet<{ data: CheckoutRequest[] }>("/attendance/checkout-requests", {
        status,
      })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load check-out requests"))
    } finally {
      setLoading(false)
    }
  }, [status])

  React.useEffect(() => {
    load()
  }, [load])

  const openApprove = (row: CheckoutRequest) => {
    setApproving(row)
    setCheckOutAt(toLocalInput(row.requested_at))
    setNote("")
  }

  const approve = async () => {
    if (!approving) return
    setBusyId(approving.id)
    try {
      const res = await hrAction<{ message: string }>(
        `/attendance/checkout-requests/${approving.id}/decide`,
        { decision: "approved", check_out_at: checkOutAt || undefined, note: note || undefined },
      )
      toast.success(res.message)
      setApproving(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not approve the request"))
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (row: CheckoutRequest) => {
    setBusyId(row.id)
    try {
      await hrAction(`/attendance/checkout-requests/${row.id}/decide`, { decision: "rejected" })
      toast.success("Request rejected — the day is left open")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not reject the request"))
    } finally {
      setBusyId(null)
    }
  }

  const pending = rows.filter((r) => r.status === "pending").length

  return (
    <HrPage
      title="Check-out Requests"
      description="Staff who finished the day away from an approved site and cannot punch out there. Approving records the check-out at the time you confirm below."
    >
      <div className="grid max-w-md gap-3 grid-cols-2">
        <StatTile label="Waiting on you" value={pending} tone={pending ? "amber" : "default"} />
        <StatTile label="Showing" value={rows.length} hint={humanise(status)} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All requests</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {humanise(s)}
                </SelectItem>
              ))}
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
                  <TableHead>Date</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Asked at</TableHead>
                  <TableHead>Where</TableHead>
                  <TableHead className="min-w-[220px]">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      <IconInbox className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      {status === "pending"
                        ? "Nothing waiting — every check-out request has been dealt with"
                        : `No ${humanise(status).toLowerCase()} requests`}
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
                      <TableCell>{formatDate(row.attendance_date)}</TableCell>
                      <TableCell>{formatTime(row.check_in)}</TableCell>
                      <TableCell className="tabular-nums">{formatTime(row.requested_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          <Distance row={row} />
                          {row.lat != null && row.lng != null && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`${Number(row.lat).toFixed(5)}, ${Number(row.lng).toFixed(5)} — open in Google Maps`}
                              className="mt-0.5 text-muted-foreground transition-colors hover:text-teal-600"
                            >
                              <IconMapPin className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm">
                        {row.reason}
                        {row.decision_note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Your note: {row.decision_note}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-medium", statusClass(row.status))}
                        >
                          {humanise(row.status)}
                        </Badge>
                        {row.status === "approved" && row.approved_check_out && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Out {formatTime(row.approved_check_out)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              className="h-8 bg-teal-600 hover:bg-teal-700"
                              disabled={busyId === row.id}
                              onClick={() => openApprove(row)}
                            >
                              <IconCheck className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={busyId === row.id}
                              onClick={() => reject(row)}
                            >
                              <IconX className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {row.decided_at ? formatDate(row.decided_at) : "—"}
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

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check {approving?.employee ?? "employee"} out</DialogTitle>
            <DialogDescription>
              This records the check-out on {formatDate(approving?.attendance_date ?? "")} and works
              out the day's hours from it, exactly as the office button would.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium" htmlFor="check-out-at">
                Check-out time
              </label>
              <Input
                id="check-out-at"
                type="datetime-local"
                value={checkOutAt}
                onChange={(e) => setCheckOutAt(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Pakistan time. Pre-filled with when they asked
                {approving ? ` (${formatTime(approving.requested_at)})` : ""} — change it if they
                told you a different finishing time.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="decision-note">
                Note (optional)
              </label>
              <Textarea
                id="decision-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1.5"
                placeholder="Kept with the request — e.g. confirmed with their manager."
              />
            </div>

            {approving?.reason && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">They said</p>
                <p className="mt-0.5 whitespace-pre-wrap">{approving.reason}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              Cancel
            </Button>
            <Button
              onClick={approve}
              disabled={!!busyId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {busyId ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconLogout2 className="h-4 w-4" />
              )}
              Approve &amp; check out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrPage>
  )
}

export default CheckoutRequests
