import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconCheck, IconX, IconAlertCircle } from "@tabler/icons-react"
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
  formatMoney,
  formatMinutes,
  todayISO,
  monthStartISO,
} from "@/components/hr/hr-api"
import type { TeamMember } from "@/Types/hr"

interface PendingItem {
  id: number
  employee?: { first_name?: string; last_name?: string; employee_code?: string }
  [key: string]: unknown
}

interface Approvals {
  leave: PendingItem[]
  expense: PendingItem[]
  travel: PendingItem[]
}

function NotAManager() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <IconAlertCircle className="h-8 w-8 text-amber-500" />
        <div>
          <p className="font-medium">You don't have any direct reports</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Manager Self Service appears once HR sets you as the reporting manager for at least one
            employee.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const employeeName = (item: PendingItem) =>
  `${item.employee?.first_name ?? ""} ${item.employee?.last_name ?? ""}`.trim() ||
  item.employee?.employee_code ||
  "—"

function RosterTab({ onForbidden }: { onForbidden: () => void }) {
  const [rows, setRows] = React.useState<TeamMember[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await essGet<{ data: TeamMember[] }>("/team")
        setRows(res.data ?? [])
      } catch (err) {
        const anyErr = err as { response?: { status?: number } }
        if (anyErr?.response?.status === 403 || anyErr?.response?.status === 404) onForbidden()
        else toast.error(errorMessage(err, "Could not load your team"))
      } finally {
        setLoading(false)
      }
    })()
  }, [onForbidden])

  const present = rows.filter((r) => ["present", "late"].includes(r.today_status)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Team Size" value={rows.length} tone="teal" />
        <StatTile label="Present Today" value={present} tone="emerald" />
        <StatTile
          label="On Leave"
          value={rows.filter((r) => r.today_status === "on_leave").length}
        />
        <StatTile
          label="Absent"
          value={rows.filter((r) => r.today_status === "absent").length}
          tone="red"
        />
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Today</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.employee_id}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.employee_code}</div>
                      </TableCell>
                      <TableCell>{r.designation ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", statusClass(r.today_status))}>
                          {humanise(r.today_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(r.check_in)}</TableCell>
                      <TableCell>{formatTime(r.check_out)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ApprovalsTab() {
  const [data, setData] = React.useState<Approvals>({ leave: [], expense: [], travel: [] })
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: Approvals }>("/team/approvals")
      setData(res.data ?? { leave: [], expense: [], travel: [] })
    } catch (err) {
      toast.error(errorMessage(err, "Could not load pending approvals"))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const decide = async (kind: string, id: number, decision: "approved" | "rejected") => {
    try {
      await essPost(`/team/approvals/${kind}/${id}`, { decision })
      toast.success(`Request ${decision}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not record the decision"))
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <IconLoader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    )
  }

  const total = data.leave.length + data.expense.length + data.travel.length
  if (!total) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          Nothing is waiting on your approval.
        </CardContent>
      </Card>
    )
  }

  const Section = ({
    title,
    kind,
    items,
    describe,
  }: {
    title: string
    kind: string
    items: PendingItem[]
    describe: (item: PendingItem) => string
  }) =>
    items.length ? (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          {title} ({items.length})
        </h3>
        {items.map((item) => (
          <Card key={item.id} className="py-0">
            <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{employeeName(item)}</p>
                <p className="text-xs text-muted-foreground">{describe(item)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 bg-teal-600 hover:bg-teal-700"
                  onClick={() => decide(kind, item.id, "approved")}
                >
                  <IconCheck className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => decide(kind, item.id, "rejected")}
                >
                  <IconX className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : null

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Leave"
        kind="leave"
        items={data.leave}
        describe={(i) =>
          `${(i.leave_type as { name?: string })?.name ?? "Leave"} · ${formatDate(i.from_date)} → ${formatDate(i.to_date)} · ${i.days} day(s)`
        }
      />
      <Section
        title="Expenses"
        kind="expense"
        items={data.expense}
        describe={(i) => `${humanise(i.category)} · ${formatMoney(i.amount)} · ${formatDate(i.expense_date)}`}
      />
      <Section
        title="Travel"
        kind="travel"
        items={data.travel}
        describe={(i) => `${i.destination} · ${formatDate(i.from_date)} → ${formatDate(i.to_date)}`}
      />
    </div>
  )
}

function TeamAttendanceTab() {
  const [from, setFrom] = React.useState(monthStartISO())
  const [to, setTo] = React.useState(todayISO())
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: Record<string, unknown>[] }>("/team/attendance", { from, to })
      setRows(res.data ?? [])
    } catch (err) {
      toast.error(errorMessage(err, "Could not load team attendance"))
    } finally {
      setLoading(false)
    }
  }, [from, to])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[165px]" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[165px]" />
        <Button variant="outline" onClick={load}>
          Apply
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Overtime</TableHead>
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
                      No attendance for your team in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-medium">{String(row.name)}</div>
                        <div className="text-xs text-muted-foreground">{String(row.employee_code)}</div>
                      </TableCell>
                      <TableCell>{String(row.present_days ?? 0)}</TableCell>
                      <TableCell>{String(row.absent_days ?? 0)}</TableCell>
                      <TableCell>{String(row.leave_days ?? 0)}</TableCell>
                      <TableCell>{formatMinutes(row.late_minutes)}</TableCell>
                      <TableCell>{formatMinutes(row.overtime_minutes)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const MyTeam = () => {
  const [forbidden, setForbidden] = React.useState(false)
  const onForbidden = React.useCallback(() => setForbidden(true), [])

  if (forbidden) {
    return (
      <HrTabbedPage title="My Team" tabs={[{ value: "none", label: "Team", content: <NotAManager /> }]} />
    )
  }

  return (
    <HrTabbedPage
      title="My Team"
      description="Manager Self Service — your direct reports, their attendance, and anything waiting on your approval."
      tabs={[
        { value: "roster", label: "Team", content: <RosterTab onForbidden={onForbidden} /> },
        { value: "approvals", label: "Approvals", content: <ApprovalsTab /> },
        { value: "attendance", label: "Attendance", content: <TeamAttendanceTab /> },
      ]}
    />
  )
}

export default MyTeam
