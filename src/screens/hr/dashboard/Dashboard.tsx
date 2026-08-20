import * as React from "react"
import { useNavigate } from "react-router-dom"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconUsers, IconUserCheck, IconClockHour4, IconAlertTriangle, IconBriefcase, IconTicket } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrGet, errorMessage } from "@/components/hr/hr-api"
import type { HrOverview } from "@/Types/hr"
import {
  HR_LEAVE,
  HR_EXPENSES,
  HR_TRAVEL,
  HR_MANPOWER,
  HR_PIECE_WORK,
  HR_RECRUITMENT,
  HR_HELPDESK,
  HR_ONBOARDING,
  HR_ATTENDANCE,
  HR_EMPLOYEES,
} from "@/constants/Constant"

const HrDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = React.useState<HrOverview | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{ data: HrOverview }>("/overview")
        setData(res.data)
      } catch (err) {
        toast.error(errorMessage(err, "Could not load the HR overview"))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <HrPage title="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </HrPage>
    )
  }

  const approvals = data?.pending_approvals
  const attendance = data?.attendance_today

  const approvalLinks = [
    { label: "Leave", count: approvals?.leave ?? 0, url: HR_LEAVE },
    { label: "Expense", count: approvals?.expense ?? 0, url: HR_EXPENSES },
    { label: "Travel", count: approvals?.travel ?? 0, url: HR_TRAVEL },
    { label: "Manpower", count: approvals?.manpower ?? 0, url: HR_MANPOWER },
    { label: "Piece Work", count: approvals?.piece_work ?? 0, url: HR_PIECE_WORK },
  ]

  return (
    <HrPage title="Dashboard" description="Human Capital & Human Resource Management">
      {/* Headcount */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <StatTile label="Total Employees" value={data?.headcount.total ?? 0} icon={IconUsers} tone="teal" />
        <StatTile label="Active" value={data?.headcount.active ?? 0} icon={IconUserCheck} tone="emerald" />
        <StatTile label="On Probation" value={data?.headcount.probation ?? 0} tone="amber" />
        <StatTile label="Notice Period" value={data?.headcount.notice_period ?? 0} tone="amber" />
        <StatTile label="Joined This Month" value={data?.headcount.new_this_month ?? 0} tone="emerald" />
        <StatTile label="Exits This Month" value={data?.headcount.separated_this_month ?? 0} tone="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconClockHour4 className="h-4 w-4 text-teal-600" />
              Attendance Today
            </CardTitle>
            <CardDescription>
              {attendance?.attendance_rate ?? 0}% of active employees are present
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Present" value={attendance?.present ?? 0} tone="emerald" />
              <StatTile label="On Leave" value={attendance?.on_leave ?? 0} tone="teal" />
              <StatTile label="Absent" value={attendance?.absent ?? 0} tone="red" />
              <StatTile label="Not Marked" value={attendance?.not_marked ?? 0} tone="amber" />
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate(HR_ATTENDANCE)}
            >
              Open attendance roster
            </Button>
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconAlertTriangle className="h-4 w-4 text-amber-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              {approvals?.total ?? 0} item{approvals?.total === 1 ? "" : "s"} waiting on you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {approvalLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.url)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span>{item.label}</span>
                <Badge
                  variant="outline"
                  className={
                    item.count > 0
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }
                >
                  {item.count}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Other signals */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <button type="button" onClick={() => navigate(HR_RECRUITMENT)} className="text-left">
          <StatTile
            label="Open Positions"
            value={data?.open_positions ?? 0}
            hint="Recruitment / ATS"
            icon={IconBriefcase}
            tone="teal"
          />
        </button>
        <button type="button" onClick={() => navigate(HR_HELPDESK)} className="text-left">
          <StatTile
            label="Open Tickets"
            value={data?.open_tickets ?? 0}
            hint="HR help desk"
            icon={IconTicket}
            tone={data?.open_tickets ? "amber" : "default"}
          />
        </button>
        <button type="button" onClick={() => navigate(HR_ONBOARDING)} className="text-left">
          <StatTile
            label="Overdue Onboarding"
            value={data?.overdue_onboarding_tasks ?? 0}
            hint="Tasks past their due date"
            tone={data?.overdue_onboarding_tasks ? "red" : "default"}
          />
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(HR_EMPLOYEES)}>
            Add employee
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(HR_ATTENDANCE)}>
            Mark attendance
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(HR_LEAVE)}>
            Review leave
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(HR_RECRUITMENT)}>
            Recruitment pipeline
          </Button>
        </CardContent>
      </Card>
    </HrPage>
  )
}

export default HrDashboard
