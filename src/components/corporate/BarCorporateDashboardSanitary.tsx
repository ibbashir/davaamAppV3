import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"

type PeriodData = {
  Transaction: Record<string, number>[]
  CashTransaction?: Record<string, number>[]
  CorporateTransaction?: Record<string, number>[]
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
  transactions: number
  cashTransactions: number
  corporateTransactions: number
}

const toLookup = (arr?: Record<string, number>[]) =>
  Object.fromEntries((arr ?? []).map((obj) => Object.entries(obj)[0]))

interface BarChartCorporateClientSanitary {
  machineCodes: number[]
}

export default function BarCorporateDashboardSanitary({ machineCodes }: BarChartCorporateClientSanitary) {
  const [data, setData] = React.useState<NivoBarData[]>([])
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<"monthly" | "weekly">("monthly")

  const fetchData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>("corporates/BarChartCorporateClientSanitary", { machine_code: machineCodes })

      const period = type === "weekly" ? res.data.weekly : res.data.monthly

      const cashLookup = toLookup(period.CashTransaction)
      const corporateLookup = toLookup(period.CorporateTransaction)

      const transformed: NivoBarData[] = period.Transaction.map((txnObj) => {
        const rawLabel = Object.keys(txnObj)[0]
        const label = type === "weekly"
          ? new Date(rawLabel + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : rawLabel
        return {
          id: rawLabel,
          label,
          transactions: Object.values(txnObj)[0],
          cashTransactions: cashLookup[rawLabel] ?? 0,
          corporateTransactions: corporateLookup[rawLabel] ?? 0,
        }
      })

      setData(transformed)
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sanitary Transactions Breakdown</CardTitle>
            <CardDescription>
              {view === "monthly" ? "Last 6 Months Transactions Record" : "Last 7 Weeks Transaction Record"}
            </CardDescription>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <div>
                🧾 <strong>Total Transactions:</strong>{" "}
                {totalTransactions.toLocaleString()}
              </div>
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

      <CardContent className="flex-1 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center h-full text-destructive">{error}</div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={["transactions"]}
            indexBy="label"
            groupMode="stacked"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            indexScale={{ type: "band", round: true }}
            axisBottom={{
              legend: view === "weekly" ? "Date" : "Month",
              legendPosition: "middle",
              legendOffset: 32,
            }}
            axisLeft={{
              legend: "Transactions",
              legendPosition: "middle",
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            colors={["#10b98180"]}
            borderRadius={15}
            role="application"
            enableGridY={false}
            tooltip={({ indexValue, data }) => {
              const d = data as unknown as Partial<NivoBarData>
              const rows = [
                { label: "Cash", value: d.cashTransactions ?? 0, color: "#f59e0b" },
                { label: "Corporate", value: d.corporateTransactions ?? 0, color: "#3b82f6" },
              ]
              return (
                <div className="min-w-[190px] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-black">
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-1.5 mb-1.5">
                    <span className="text-sm font-semibold">{indexValue}</span>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                      {(d.transactions ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.label}
                        </span>
                        <span className="font-medium tabular-nums">{row.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
