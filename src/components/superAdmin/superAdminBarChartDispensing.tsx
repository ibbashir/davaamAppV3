"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"

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

export default function SuperAdminDispensingBarChart() {
  const [data, setData] = React.useState<NivoBarData[]>([])
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<"monthly" | "weekly">("monthly")
  const [metric, setMetric] = React.useState<"revenue" | "transactions">("transactions")

  const fetchData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>("/superadmin/BarchartMainDashboardDispensing", {})

      let revenueArr: Record<string, number>[] = []
      let transactionArr: Record<string, number>[] = []

      if (type === "weekly") {
        revenueArr = res.data.weekly.Revenue
        transactionArr = res.data.weekly.Transaction
      } else {
        revenueArr = res.data.monthly.Revenue
        transactionArr = res.data.monthly.Transaction
      }

      const transformed: NivoBarData[] = revenueArr.map((revObj, i) => {
        const label = Object.keys(revObj)[0]
        const revenue = Object.values(revObj)[0]
        const transactions = Object.values(transactionArr[i])[0]
        return {
          id: label,
          label: label,
          revenue,
          transactions,
        }
      })

      const totalRev = transformed.reduce((sum, d) => sum + d.revenue, 0)
      const totalTrans = transformed.reduce((sum, d) => sum + d.transactions, 0)

      setData(transformed)
      setTotalRevenue(totalRev)
      setTotalTransactions(totalTrans)
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Dispensing Revenue & Transactions Breakdown</CardTitle>
            <CardDescription>
              {view === "monthly" ? "Monthly" : "Weekly"} {metric === "transactions" ? "Transactions" : "Revenue"}
            </CardDescription>
            <div className="mt-3 text-sm space-y-1">
              <div>
                📦 <strong>Total Revenue:</strong> Rs{" "}
                {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div>
                🧾 <strong>Total Transactions:</strong>{" "}
                {totalTransactions.toLocaleString()}
              </div>
            </div>
            
          <div className="flex p-2 space-x-2">
            <Button
              variant={metric === "transactions" ? "default" : "outline"}
              onClick={() => setMetric("transactions")}
            >
              Transactions
            </Button>
            <Button
              variant={metric === "revenue" ? "default" : "outline"}
              onClick={() => setMetric("revenue")}
            >
              Revenue
            </Button>
          </div>
          </div>

          <div className="space-x-2 space-y-1">
            <Button
              variant={view === "weekly" ? "default" : "outline"}
              onClick={() => setView("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={view === "monthly" ? "default" : "outline"}
              onClick={() => setView("monthly")}
            >
              Monthly
            </Button>
            
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center h-full text-destructive">
            {error}
          </div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={[metric]} // 👈 dynamic key
            indexBy="label"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            indexScale={{ type: "band", round: true }}
           axisBottom={{
              tickRotation: -90, // rotate labels
              legend: view === "weekly" ? "Date" : "",
              legendPosition: "middle",
              legendOffset: 50,
              format: (value) => {
                // Shorten month names
                const monthMap: Record<string, string> = {
                  JANUARY: "Jan",
                  FEBRUARY: "Feb",
                  MARCH: "Mar",
                  APRIL: "Apr",
                  MAY: "May",
                  JUNE: "Jun",
                  JULY: "Jul",
                  AUGUST: "Aug",
                  SEPTEMBER: "Sep",
                  OCTOBER: "Oct",
                  NOVEMBER: "Nov",
                  DECEMBER: "Dec",
                };
                const key = String(value);
                return monthMap[key] || key; // if not a month, return as is
              },
            }}
            axisLeft={{
              legend: metric === "revenue" ? "Revenue (Rs)" : "Transactions",
              legendPosition: "middle",
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}  
            colors={metric === "revenue" ? "#3b82f680" : "#10b98180"}
            borderRadius={15}
            role="application"
            enableGridY={false}
          />
        )}
      </CardContent>
    </Card>
  )
}
