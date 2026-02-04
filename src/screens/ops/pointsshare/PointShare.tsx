import { useState, useEffect } from "react"
import PointsShareTable from "@/components/superAdmin/Points-Share-Table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowUpRight, IconArrowDownRight} from "@tabler/icons-react"
import { SiteHeader } from "@/components/ops/site-header"
import { getRequest } from "@/Apis/Api"

interface PointShare {
    id: number,
    amount: string,
    created_at: string,
    user_id: number,
    status: string,
    msisdn: string,
    transaction_number: string,
    alternate_msisdn: string,
    user_name: string,
    alternate_name: string
}

interface ApiResponse {
    pointsShare: PointShare[]
}

export function OpsPointShare() {
    const [tableData, setTableData] = useState<PointShare[]>([])

    const fetchPointShare = async () => {
        try {
            const res = await getRequest<ApiResponse>("/ops/pointShareDetail");
            setTableData(res.pointsShare)
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        fetchPointShare();
    }, [])


    // Calculate summary statistics
    const totalTransfers = tableData.length
    const totalAmount = tableData.reduce((sum, item) => sum + parseFloat(item.amount), 0)
    // const completedTransfers = tableData.filter((item) => item.status === "completed").length
    // const pendingTransfers = tableData.filter((item) => item.status === "pending").length

    return (
        <div>
            <SiteHeader title="Points Share" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Points Share</h1> */}
                        <p className="text-muted-foreground">Manage and track point transfers between users</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                            <IconArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTransfers}</div>
                            <p className="text-xs text-muted-foreground">All time transfers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <IconArrowDownRight className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Total transferred</p>
                        </CardContent>
                    </Card>
                </div>

                <PointsShareTable tableData={tableData} />
            </div>
        </div>
    )
}
