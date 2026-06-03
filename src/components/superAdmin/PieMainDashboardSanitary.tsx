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

type PieMainDashboardSanitaryResponse = {
  butterflyBrandsId: string[]
  butterflyAmount: number[]
  butterflyTransactionCounts: number[]
  totalRevenue: number
  totalTransactions: number
  butterflyAmountPercentage: number[]
  butterflyTransactionCountsPercentage: number[]
}

type NivoPieData = {
  id: string
  label: string
  value: number
  transactions: number
}

const TEAL_PALETTE = [
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#0891b2",
  "#0284c7",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
]

export default function SuperAdminDashboardSanitary() {
  const [data, setData] = React.useState<NivoPieData[]>([])
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [totalTransactions, setTotalTransactions] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res: PieMainDashboardSanitaryResponse = await postRequest(
          "/superadmin/PieMainDashboardSanitary",
          {},
        )
        const transformed: NivoPieData[] = res.butterflyBrandsId.map(
          (brand, i) => ({
            id: brand,
            label: brand,
            value: res.butterflyAmountPercentage[i],
            transactions: res.butterflyTransactionCountsPercentage[i],
          }),
        )
        setData(transformed)
        setTotalRevenue(res.totalRevenue)
        setTotalTransactions(res.totalTransactions)
      } catch (err) {
        console.error("Error fetching pie data:", err)
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
          Sanitary Brands Revenue
        </CardTitle>
        <CardDescription>Revenue distribution by brand</CardDescription>
        {!loading && !error && (
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <IconCash className="size-4 text-teal-600" />
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  Total Revenue
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  ₨ {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <IconReceipt2 className="size-4 text-teal-600" />
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
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
            colors={TEAL_PALETTE}
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
                    {datum.value.toFixed(1)}%
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Transactions:{" "}
                  <span className="font-medium text-foreground">
                    {(datum.data as NivoPieData).transactions.toFixed(1)}%
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
