import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { hrGet, errorMessage, formatMoney, humanise } from "@/components/hr/hr-api"
import type { HrAnalytics } from "@/Types/hr"

// One categorical ramp reused across every chart on the page
const PALETTE = ["#0d9488", "#0891b2", "#7c3aed", "#f59e0b", "#e11d48", "#65a30d", "#64748b"]

const Analytics = () => {
  const [data, setData] = React.useState<HrAnalytics | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{ data: HrAnalytics }>("/analytics", { months: 6 })
        setData(res.data)
      } catch (err) {
        toast.error(errorMessage(err, "Could not load HR analytics"))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <HrPage title="Dashboards & Analytics">
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </HrPage>
    )
  }

  const byDepartment = (data?.headcount_by_department ?? []).map((d) => ({
    name: d.department?.name ?? "Unassigned",
    count: Number(d.count),
  }))

  const byType = (data?.headcount_by_type ?? []).map((t) => ({
    name: humanise(t.employment_type),
    value: Number(t.count),
  }))

  const gender = (data?.gender_split ?? []).map((g) => ({
    name: g.gender ? humanise(g.gender) : "Not stated",
    value: Number(g.count),
  }))

  const totalHeadcount = byDepartment.reduce((s, d) => s + d.count, 0)

  return (
    <HrPage
      title="Dashboards & Analytics"
      description="Headcount, attendance, attrition and cost across the organisation."
    >
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active Headcount" value={totalHeadcount} tone="teal" />
        <StatTile label="Candidates in ATS" value={data?.candidate_count ?? 0} />
        <StatTile label="Trainings" value={data?.training_count ?? 0} />
        <StatTile label="Asset Value" value={formatMoney(data?.asset_value)} tone="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byDepartment.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDepartment} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Employees" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Joiners vs Exits</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!data?.trend?.length ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="joiners" name="Joiners" stroke={PALETTE[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="exits" name="Exits" stroke={PALETTE[4]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Rate</CardTitle>
            <CardDescription>Percentage of marked days present</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!data?.trend?.length ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="attendance_rate" name="Attendance" fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Employment Type</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byType.length === 0 ? <EmptyChart /> : <Donut data={byType} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gender Split</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {gender.length === 0 ? <EmptyChart /> : <Donut data={gender} />}
          </CardContent>
        </Card>
      </div>
    </HrPage>
  )
}

function Donut({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function EmptyChart({ message = "Not enough data yet" }: { message?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export default Analytics
