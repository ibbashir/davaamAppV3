import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"

type PeriodData = {
  Revenue: Record<string, number>[]
  Transaction: Record<string, number>[]
  CashRevenue?: Record<string, number>[]
  CashTransaction?: Record<string, number>[]
  OnlineRevenue?: Record<string, number>[]
  OnlineTransaction?: Record<string, number>[]
}

type ApiResponse = {
  isTcf?: boolean
  data: {
    weekly: PeriodData
    monthly: PeriodData
  }
}

type NivoBarData = {
  id: string
  label: string
  revenue: number
  transactions: number
  cashRevenue: number
  cashTransactions: number
  onlineRevenue: number
  onlineTransactions: number
}

interface BarChartCorporateClientSanitary {
  machineCodes: number[]
}

export default function BarCorporateDashboardSanitary({ machineCodes }: BarChartCorporateClientSanitary) {
  const [data, setData] = React.useState<NivoBarData[]>([])
  const [isTcf, setIsTcf] = React.useState(false)
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<"monthly" | "weekly">("monthly")
  const [metric, setMetric] = React.useState<"revenue" | "transactions">("transactions")

  const fetchData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>("corporates/BarChartCorporateClientSanitary", { machine_code: machineCodes })

      const period = type === "weekly" ? res.data.weekly : res.data.monthly
      const tcf = !!res.isTcf

      const revenueArr      = period.Revenue
      const transactionArr  = period.Transaction
      const cashRevArr      = period.CashRevenue      ?? []
      const cashTxnArr      = period.CashTransaction  ?? []
      const onlineRevArr    = period.OnlineRevenue    ?? []
      const onlineTxnArr    = period.OnlineTransaction ?? []

      const transformed: NivoBarData[] = revenueArr.map((revObj, i) => {
        const rawLabel = Object.keys(revObj)[0]
        const label = type === "weekly"
          ? new Date(rawLabel + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : rawLabel
        return {
          id: rawLabel,
          label,
          revenue:            Object.values(revObj)[0],
          transactions:       Object.values(transactionArr[i])[0],
          cashRevenue:        cashRevArr[i]    ? Object.values(cashRevArr[i])[0]    : 0,
          cashTransactions:   cashTxnArr[i]    ? Object.values(cashTxnArr[i])[0]    : 0,
          onlineRevenue:      onlineRevArr[i]  ? Object.values(onlineRevArr[i])[0]  : 0,
          onlineTransactions: onlineTxnArr[i]  ? Object.values(onlineTxnArr[i])[0]  : 0,
        }
      })

      setIsTcf(tcf)
      setData(transformed)
      setTotalRevenue(transformed.reduce((sum, d) => sum + d.revenue, 0))
      setTotalTransactions(transformed.reduce((sum, d) => sum + d.transactions, 0))
      setError(null)
    } catch (err) {
      console.error("Error fetching bar chart data:", err)
      setError("Failed to load bar chart.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData(view)
  }, [view])

  const barKeys = isTcf
    ? metric === "transactions" ? ["cashTransactions", "onlineTransactions"] : ["cashRevenue", "onlineRevenue"]
    : [metric]

  const barColors = isTcf ? ["#10b98180", "#3b82f680"] : [metric === "revenue" ? "#3b82f680" : "#10b98180"]

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Dispensing Revenue & Transactions Breakdown</CardTitle>
            <CardDescription>
              {view === "monthly" ? "Monthly" : "Weekly"}{" "}
              {metric === "transactions" ? "Transactions" : "Revenue"}
              {isTcf && " — Cash & Online"}
            </CardDescription>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <div>
                📦 <strong>Total Revenue:</strong> Rs{" "}
                {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div>
                🧾 <strong>Total Transactions:</strong>{" "}
                {totalTransactions.toLocaleString()}
              </div>
            </div>

            {isTcf && (
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#10b98180" }} />
                  Cash
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#3b82f680" }} />
                  Online
                </span>
              </div>
            )}

            <div className="flex p-2 space-x-2">
              <Button variant={metric === "transactions" ? "default" : "outline"} onClick={() => setMetric("transactions")}>
                Transactions
              </Button>
              <Button variant={metric === "revenue" ? "default" : "outline"} onClick={() => setMetric("revenue")}>
                Revenue
              </Button>
            </div>
          </div>

          <div className="space-x-2 space-y-1">
            <Button variant={view === "weekly" ? "default" : "outline"} onClick={() => setView("weekly")}>
              Weekly
            </Button>
            <Button variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center h-full text-destructive">{error}</div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={barKeys}
            indexBy="label"
            groupMode={isTcf ? "grouped" : "stacked"}
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            indexScale={{ type: "band", round: true }}
            axisBottom={{
              legend: view === "weekly" ? "Date" : "Month",
              legendPosition: "middle",
              legendOffset: 32,
            }}
            axisLeft={{
              legend: metric === "revenue" ? "Revenue (Rs)" : "Transactions",
              legendPosition: "middle",
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            colors={barColors}
            borderRadius={15}
            role="application"
            enableGridY={false}
          />
        )}
      </CardContent>
    </Card>
  )
}
