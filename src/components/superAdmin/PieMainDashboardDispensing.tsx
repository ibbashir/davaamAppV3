import * as React from "react"
import { ResponsivePie } from "@nivo/pie"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"

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
                const res = await postRequest<DispensingPieResponse>("/superadmin/PieMainDashboardDispensing", {})

                const transformed: NivoPieData[] = res.cookingOilBrandsId.map((brand, i) => ({
                    id: brand,
                    label: brand,
                    value: res.cookingOilAmount[i],
                    transactions: res.cookingOilTransactionCounts[i],
                }))

                setData(transformed)
                setTotalRevenue(res.totalRevenue)
                setTotalTransactions(res.totalTransactions)
            } catch (err) {
                console.error("Error fetching dispensing pie data:", err)
                setError("Failed to load dispensing pie chart.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <Card className="flex justify-center items-center h-[300px]"><p>Loading...</p></Card>
    }

    if (error) {
        return <Card className="flex justify-center items-center h-[300px] text-destructive"><p>{error}</p></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dispensing Revenue Breakdown</CardTitle>
                <CardDescription>Brand-wise breakdown of dispensing revenue</CardDescription>
                <div className="mt-3 text-sm space-y-1">
                    <div>📦 <strong>Total Revenue:</strong> Rs {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div>🧾 <strong>Total Transactions:</strong> {totalTransactions.toLocaleString()}</div>
                </div>
            </CardHeader>
            <CardContent className="h-[400px]">
                <ResponsivePie
                    data={data}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={1}
                    cornerRadius={4}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "pastel1" }}
                    borderWidth={1}
                    borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                    tooltip={({ datum }) => (
                        <div className="px-3 py-1 text-sm bg-white shadow-md rounded-md border border-gray-200 text-black">
                            <strong>{datum.label}</strong><br />
                            Revenue: Rs {datum.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br />
                            Transactions: {(datum.data as NivoPieData).transactions}
                        </div>
                    )}
                />
            </CardContent>
        </Card>
    )
}
