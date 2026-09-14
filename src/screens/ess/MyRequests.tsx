import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconMapPin } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  essPost,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
  formatTime,
} from "@/components/hr/hr-api"
import type { CheckoutRequest, MissedPunchRequest } from "@/Types/hr"
import { MissedPunchButton, missedPunchProgress } from "@/components/hr/MissedPunch"

interface Row {
  id: number
  status: string
  [key: string]: unknown
}

const statusCell = (row: Row) => (
  <Badge variant="outline" className={cn("font-medium", statusClass(row.status))}>
    {humanise(row.status)}
  </Badge>
)

/**
 * Remote check-out requests — raised from My Hub or My Attendance when the
 * office geofence refuses a punch. Read-only here, apart from withdrawing one
 * HR hasn't reached: this tab is the record of what was asked and what came of
 * it, and the asking belongs next to the punch buttons.
 */
function CheckoutTab({ notLinkedRef }: { notLinkedRef: React.MutableRefObject<boolean> }) {
  const [rows, setRows] = React.useState<CheckoutRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: CheckoutRequest[] }>("/attendance/checkout-requests")
      setRows(res.data ?? [])
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) {
        setNotLinked(true)
        notLinkedRef.current = true
      } else {
        toast.error(errorMessage(err, "Could not load your check-out requests"))
      }
    } finally {
      setLoading(false)
    }
  }, [notLinkedRef])

  React.useEffect(() => {
    load()
  }, [load])

  const withdraw = async (row: CheckoutRequest) => {
    setBusyId(row.id)
    try {
      await essPost(`/attendance/checkout-requests/${row.id}/cancel`)
      toast.success("Request withdrawn")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not withdraw the request"))
    } finally {
      setBusyId(null)
    }
  }

  if (notLinked) return <NotLinked />

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Asked at</TableHead>
                <TableHead>Where</TableHead>
                <TableHead className="min-w-[220px]">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checked out</TableHead>
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
                    You haven't asked HR to check you out. The button appears on My Hub while you
                    are checked in.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.attendance_date)}</TableCell>
                    <TableCell className="tabular-nums">{formatTime(row.requested_at)}</TableCell>
                    <TableCell>
                      {row.lat != null && row.lng != null ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${row.lat},${row.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-teal-600"
                        >
                          <IconMapPin className="h-3.5 w-3.5" />
                          {row.distance_m == null
                            ? "Location"
                            : row.distance_m >= 1000
                              ? `${(row.distance_m / 1000).toFixed(1)} km out`
                              : `${row.distance_m} m out`}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm">
                      {row.reason}
                      {row.decision_note && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          HR: {row.decision_note}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{statusCell(row as unknown as Row)}</TableCell>
                    <TableCell>{formatTime(row.approved_check_out)}</TableCell>
                    <TableCell className="text-right">
                      {row.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={busyId === row.id}
                          onClick={() => withdraw(row)}
                        >
                          Withdraw
                        </Button>
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
  )
}

/**
 * "I forgot to mark my attendance" requests, and where each one stands.
 *
 * The two pending stages both read "In process" — with the desk it is sitting
 * at — because the employee's question is "is it done yet", and the answer is
 * no until the super admin has approved too.
 */
function MissedPunchTab({ notLinkedRef }: { notLinkedRef: React.MutableRefObject<boolean> }) {
  const [rows, setRows] = React.useState<MissedPunchRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: MissedPunchRequest[] }>("/attendance/missed-punch-requests")
      setRows(res.data ?? [])
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) {
        setNotLinked(true)
        notLinkedRef.current = true
      } else {
        toast.error(errorMessage(err, "Could not load your attendance requests"))
      }
    } finally {
      setLoading(false)
    }
  }, [notLinkedRef])

  React.useEffect(() => {
    load()
  }, [load])

  const withdraw = async (row: MissedPunchRequest) => {
    setBusyId(row.id)
    try {
      await essPost(`/attendance/missed-punch-requests/${row.id}/cancel`)
      toast.success("Request withdrawn")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not withdraw the request"))
    } finally {
      setBusyId(null)
    }
  }

  if (notLinked) return <NotLinked />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <MissedPunchButton onDone={load} />
      </div>
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Day</TableHead>
                  <TableHead>Asked for</TableHead>
                  <TableHead className="min-w-[220px]">Reason</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      No attendance requests. If you forget to check in or out, use "Forgot to mark
                      attendance?" above or on My Attendance.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const progress = missedPunchProgress(row)
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(row.attendance_date)}</TableCell>
                        <TableCell className="tabular-nums">
                          {row.requested_check_in && <div>In {formatTime(row.requested_check_in)}</div>}
                          {row.requested_check_out && <div>Out {formatTime(row.requested_check_out)}</div>}
                        </TableCell>
                        <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm">
                          {row.reason}
                          {row.hr_note && (
                            <p className="mt-1 text-xs text-muted-foreground">HR: {row.hr_note}</p>
                          )}
                          {row.sa_note && (
                            <p className="mt-1 text-xs text-muted-foreground">Super admin: {row.sa_note}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", progress.className)}>
                            {progress.label}
                          </Badge>
                          {/* HR → Super admin → Marked, so "in process" shows how far along. */}
                          {row.status !== "cancelled" && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Step done={row.status !== "pending_hr" && row.rejected_stage !== "hr"}>HR</Step>
                              <span>→</span>
                              <Step done={row.status === "approved"}>Super admin</Step>
                              <span>→</span>
                              <Step done={row.status === "approved"}>Marked</Step>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.in_process ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={busyId === row.id}
                              onClick={() => withdraw(row)}
                            >
                              Withdraw
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(row.sa_decided_at ?? row.hr_decided_at ?? row.cancelled_at ?? null)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <span className={cn(done ? "font-medium text-emerald-600" : undefined)}>
      {done ? "✓ " : ""}
      {children}
    </span>
  )
}

const MyRequests = () => {
  const notLinkedRef = React.useRef(false)

  return (
    <HrTabbedPage
      title="My Requests"
      description="Missed attendance and check-out requests you have raised."
      tabs={[
        {
          value: "missed",
          label: "Missed Attendance",
          content: <MissedPunchTab notLinkedRef={notLinkedRef} />,
        },
        {
          value: "checkout",
          label: "Check-out",
          content: <CheckoutTab notLinkedRef={notLinkedRef} />,
        },
      ]}
    />
  )
}

export default MyRequests
