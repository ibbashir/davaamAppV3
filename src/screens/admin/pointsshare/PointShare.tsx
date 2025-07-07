"use client"

import { useState } from "react"
import PointsShareTable from "@/components/admin/Points-Share-Table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowUpRight, IconArrowDownRight, IconClock, IconCheck } from "@tabler/icons-react"
import { SiteHeader } from "@/components/admin/site-header"

// Mock data - replace with your actual data source
const mockData = [
    {
        id: "MCH001",
        alternate_name: "John Doe",
        user_name: "Jane Smith",
        msisdn: "+1234567890",
        alternate_msisdn: "+0987654321",
        amount: 150.75,
        created_at: "2024-01-15T10:30:00Z",
        status: "completed",
    },
    {
        id: "MCH002",
        alternate_name: "Alice Johnson",
        user_name: "Bob Wilson",
        msisdn: "+1122334455",
        alternate_msisdn: "+5544332211",
        amount: 89.5,
        created_at: "2024-01-14T14:20:00Z",
        status: "pending",
    },
    {
        id: "MCH003",
        alternate_name: "Mike Davis",
        user_name: "Sarah Brown",
        msisdn: "+9988776655",
        alternate_msisdn: "+5566778899",
        amount: 275.25,
        created_at: "2024-01-13T09:15:00Z",
        status: "completed",
    },

]

export function AdminPointShare() {
    const [tableData, setTableData] = useState(mockData)

    // Calculate summary statistics
    const totalTransfers = tableData.length
    const totalAmount = tableData.reduce((sum, item) => sum + item.amount, 0)
    const completedTransfers = tableData.filter((item) => item.status === "completed").length
    const pendingTransfers = tableData.filter((item) => item.status === "pending").length

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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <IconCheck className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{completedTransfers}</div>
                            <p className="text-xs text-muted-foreground">Successful transfers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <IconClock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{pendingTransfers}</div>
                            <p className="text-xs text-muted-foreground">Awaiting completion</p>
                        </CardContent>
                    </Card>
                </div>

                <PointsShareTable tableData={tableData} />
            </div>
        </div>
    )
}
