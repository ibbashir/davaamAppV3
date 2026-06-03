import * as React from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"
import { cn } from "@/lib/utils"

type ApiResponse = {
  data: {
    weekly: {
      Revenue: Record<string, number>[]
      Transaction: Record<string, number>[]
    }
    monthly: {
      Revenue: Record<string, number>[]
      Transaction: Record<string, number>[]
    }
  }
}

type NivoBarData = {
  id: string
  label: string
  revenue: number
  transactions: number
}

const MONTH_SHORT: Record<string, string> = {
  JANUARY: "Jan", FEBRUARY: "Feb", MARCH: "Mar", APRIL: "Apr",
  MAY: "May", JUNE: "Jun", JULY: "Jul", AUGUST: "Aug",
  SEPTEMBER: "Sep", OCTOBER: "Oct", NOVEMBER: "Nov", DECEMBER: "Dec",
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-md border bg-muted p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-all",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function SuperAdminDispensingBarChart() {
  const [data, setData] = React.useState<NivoBarData[]>([])
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<"monthly" | "weekly">("monthly")
  const [metric, setMetric] = React.useState<"revenue" | "transactions">(
    "transactions",
  )

  const fetchData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>(
        "/superadmin/BarchartMainDashboardDispensing",
        {},
      )
      const { Revenue: revenueArr, Transaction: transactionArr } =
        type === "weekly" ? res.data.weekly : res.data.monthly

      const transformed: NivoBarData[] = revenueArr.map((revObj, i) => {
        const label = Object.keys(revObj)[0]
        return {
          id: label,
          label,
          revenue: Object.values(revObj)[0],
          transactions: Object.values(transactionArr[i])[0],
        }
      })

      setData(transformed)
      setTotalRevenue(transformed.reduce((s, d) => s + d.revenue, 0))
      setTotalTransactions(transformed.reduce((s, d) => s + d.transactions, 0))
      setError(null)
    } catch (err) {
      console.error("Error fetching bar chart data:", err)
      setError("Failed to load chart.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData(view)
  }, [view])

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Dispensing Breakdown
            </CardTitle>
            <CardDescription>
              {view === "monthly" ? "Monthly" : "Weekly"}{" "}
              {metric === "transactions" ? "transactions" : "revenue"}
            </CardDescription>
            <div className="mt-3 flex gap-3 text-sm">
              <span className="text-muted-foreground">
                Revenue:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  ₨{" "}
                  {totalRevenue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
              <span className="text-muted-foreground">
                Txns:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {totalTransactions.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SegmentedControl
              options={[
                { label: "Monthly", value: "monthly" },
                { label: "Weekly", value: "weekly" },
              ]}
              value={view}
              onChange={setView}
            />
            <SegmentedControl
              options={[
                { label: "Transactions", value: "transactions" },
                { label: "Revenue", value: "revenue" },
              ]}
              value={metric}
              onChange={setMetric}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[360px]">
        {loading ? (
          <div className="flex h-full flex-col justify-end gap-1 px-4 pb-4">
            {[55, 80, 40, 65, 75, 45, 90, 60, 70, 50, 85, 35].map((h, i) => (
              <div key={i} className="flex flex-1 items-end" style={{ maxHeight: `${h}%` }}>
                <Skeleton className="w-full" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={[metric]}
            indexBy="label"
            margin={{ top: 20, right: 20, bottom: 60, left: 55 }}
            padding={0.35}
            indexScale={{ type: "band", round: true }}
            axisBottom={{
              tickRotation: -45,
              format: (v) => MONTH_SHORT[String(v)] ?? String(v),
            }}
            axisLeft={{
              legend: metric === "revenue" ? "Revenue (₨)" : "Transactions",
              legendPosition: "middle",
              legendOffset: -45,
            }}
            labelTextColor="#ffffff"
            labelSkipWidth={14}
            labelSkipHeight={14}
            colors={metric === "revenue" ? "#d97706" : "#f59e0b"}
            borderRadius={6}
            enableGridY
            gridYValues={5}
            role="application"
            tooltip={({ data: d, value }) => (
              <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
                <p className="font-semibold">{d.label}</p>
                <p className="text-muted-foreground">
                  {metric === "revenue" ? "Revenue" : "Transactions"}:{" "}
                  <span className="font-medium text-foreground">
                    {metric === "revenue"
                      ? `₨ ${value.toLocaleString()}`
                      : value.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  )
}
