import * as React from "react"
import { ResponsivePie } from "@nivo/pie"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { postRequest } from "@/Apis/Api"
import { IconCash, IconReceipt2 } from "@tabler/icons-react"

type DispensingPieResponse = {
  cookingOilBrandsId: string[]
  cookingOilAmount: number[]
  cookingOilTransactionCounts: number[]
  totalRevenue: number
  totalTransactions: number
}

type NivoPieData = {
  id: string
  label: string
  value: number
  transactions: number
}

const AMBER_PALETTE = [
  "#d97706",
  "#f59e0b",
  "#fbbf24",
  "#fb923c",
  "#f97316",
  "#ef4444",
  "#dc2626",
  "#16a34a",
  "#059669",
]

export default function SuperAdminDashboardDispensing() {
  const [data, setData] = React.useState<NivoPieData[]>([])
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await postRequest<DispensingPieResponse>(
          "/superadmin/PieMainDashboardDispensing",
          {},
        )
        const transformed: NivoPieData[] = res.cookingOilBrandsId.map(
          (brand, i) => ({
            id: brand,
            label: brand,
            value: res.cookingOilAmount[i],
            transactions: res.cookingOilTransactionCounts[i],
          }),
        )
        setData(transformed)
        setTotalRevenue(res.totalRevenue)
        setTotalTransactions(res.totalTransactions)
      } catch (err) {
        console.error("Error fetching dispensing pie data:", err)
        setError("Failed to load chart data.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Dispensing Revenue Breakdown
        </CardTitle>
        <CardDescription>Brand-wise cooking oil distribution</CardDescription>
        {!loading && !error && (
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <IconCash className="size-4 text-amber-600" />
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  Total Revenue
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  ₨{" "}
                  {totalRevenue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <IconReceipt2 className="size-4 text-amber-600" />
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  Transactions
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {totalTransactions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="mt-3 flex gap-4">
            <Skeleton className="h-12 w-36 rounded-lg" />
            <Skeleton className="h-12 w-36 rounded-lg" />
          </div>
        )}
      </CardHeader>

      <CardContent className="h-[360px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <ResponsivePie
            data={data}
            margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.55}
            padAngle={1.5}
            cornerRadius={5}
            activeOuterRadiusOffset={6}
            colors={AMBER_PALETTE}
            borderWidth={0}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="var(--foreground)"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#ffffff"
            tooltip={({ datum }) => (
              <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
                <p className="font-semibold">{datum.label}</p>
                <p className="text-muted-foreground">
                  Revenue:{" "}
                  <span className="font-medium text-foreground">
                    ₨{" "}
                    {datum.value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Transactions:{" "}
                  <span className="font-medium text-foreground">
                    {(datum.data as NivoPieData).transactions}
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
