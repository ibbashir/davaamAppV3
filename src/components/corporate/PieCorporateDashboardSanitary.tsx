"use client"

import * as React from "react"
import { ResponsivePie } from "@nivo/pie"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"

type PieMainDashboardSanitaryResponse = {
    butterflyBrandsId: string[]
    butterflyAmount: number[]
    butterflyTransactionCounts: number[]
    totalRevenue: number
    totalTransactions: number
}

type NivoPieData = {
    id: string
    label: string
    value: number
    transactions: number
}

interface PieCorporateDashboardSanitary{
    machineCodes:number[]
}

export default function PieCorporateDashboardSanitary({machineCodes}:PieCorporateDashboardSanitary) {
    const [data, setData] = React.useState<NivoPieData[]>([])
    const [totalRevenue, setTotalRevenue] = React.useState(0)
    const [totalTransactions, setTotalTransactions] = React.useState(0)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res: PieMainDashboardSanitaryResponse = await postRequest("corporates/PieChartCorporateClientSanitary", {"machine_code": machineCodes})

                console.log(res)
                const transformed: NivoPieData[] = res.butterflyBrandsId.map((brand, i) => ({
                    id: brand,
                    label: brand,
                    value: res.butterflyAmount[i],
                    transactions: res.butterflyTransactionCounts[i]
                }))

                setData(transformed)
                setTotalRevenue(res.totalRevenue)
                setTotalTransactions(res.totalTransactions)
            } catch (err) {
                console.error("Error fetching pie data:", err)
                setError("Failed to load pie chart data.")
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
                <CardTitle>Sanitary Brands Revenue</CardTitle>
                <CardDescription>Revenue distribution with total stats</CardDescription>
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                    <div className="text-black text-lg">📦 <span className="">Total Revenue:</span> Rs {totalRevenue.toLocaleString()}</div>
                    <div className="text-black text-lg">🧾 <span className="">Total Transactions:</span> {totalTransactions.toLocaleString()}</div>
                </div>
            </CardHeader>
            <CardContent className="h-[445px]">
                <ResponsivePie
                    data={data}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={1}
                    cornerRadius={4}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "paired" }}
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
                            Revenue: Rs {datum.value.toLocaleString()}<br />
                            Transactions: {(datum.data as any).transactions}
                        </div>
                    )}
                />
            </CardContent>
        </Card>
    )
}
