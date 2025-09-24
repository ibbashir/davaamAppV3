"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { SiteHeader } from "@/components/ops/site-header"
import { useLocation } from "react-router-dom"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"   // 👈 you missed this import

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

export default function AdminMachineVisit() {
  const { state } = useLocation()
  const machine = state?.machine

  const [stockView, setStockView] = useState("batch")
  const [activeTab, setActiveTab] = useState("stock-levels")
  const [userTransactions, setUserTransactions] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [brandFillings, setBrandFillings] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)

  // chart states
  const [chartData, setChartData] = useState<NivoBarData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"monthly" | "weekly">("monthly")
  const [metric, setMetric] = useState<"revenue" | "transactions">("transactions")

  useEffect(() => {
    fetchMachineDetails()
  }, [])

  const fetchMachineDetails = async () => {
    const res = await postRequest(`/ops/machineDetailsWithMachineCode`, { machine_code: machine.machine_code })
    setUserTransactions(res.transactions)
    setBrandFillings(res.fillings)
    setBrands(res.brands)
  }

  // 👇 chart data fetch
  const fetchChartData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>("/ops/BarChartMainDashboardSanitaryByMachineCode", {machine_code:machine.machine_code})

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
          label,
          revenue,
          transactions,
        }
      })

      const totalRev = transformed.reduce((sum, d) => sum + d.revenue, 0)
      const totalTrans = transformed.reduce((sum, d) => sum + d.transactions, 0)

      setChartData(transformed)
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

  useEffect(() => {
    fetchChartData(view)
  }, [view])

    return (
        <div>
            <SiteHeader title="Machine Details"/>
                <div className="min-h-screen bg-gray-50 p-4">
                <div className="mx-auto max-w-7xl">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="stock-levels">Stock Levels</TabsTrigger>
                            <TabsTrigger value="sales-usage">Sales & usage</TabsTrigger>
                            <TabsTrigger value="update-price">Update price</TabsTrigger>
                            <TabsTrigger value="user-transactions">User transactions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="stock-levels" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Button
                                        variant={stockView === "batch" ? "default" : "outline"}
                                        onClick={() => setStockView("batch")}
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        Stocks Refill By Batch Number
                                    </Button>
                                    <Button
                                        variant={stockView === "realtime" ? "default" : "outline"}
                                        onClick={() => setStockView("realtime")}
                                        className={stockView === "realtime" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                                    >
                                        Stocks Real Time
                                    </Button>
                                </div>
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Stock
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {brandFillings.map((item) => (
                                    <div key={item.id} className="space-y-4">
                                        <h2 className="text-xl font-semibold text-center text-slate-700">{item.name}</h2>

                                        {stockView === "batch" ? (
                                            <Card>
                                                <CardContent className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Quantity</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.quantity}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Created at</Label>
                                                            <div className="mt-1 text-sm text-slate-500">{item.created_at}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Batch Number</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.batch_number}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <CardContent className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Last Batch Refill</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.lastBatchRefill}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Stocks Out</Label>
                                                            <div className="mt-1 text-lg font-medium text-red-600">{item.stockOut}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Current stock</Label>
                                                            <div className="mt-1 text-lg font-medium text-green-600">{item.currentStock}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* ---- SALES USAGE WITH CHART ---- */}
                        <TabsContent value="sales-usage" className="space-y-6">
                        <Card>
                            <CardHeader>
                            <CardTitle>Sales & Usage Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <Card>
                                <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                    <CardTitle>Sanitary Revenue & Transactions Breakdown</CardTitle>
                                    <CardDescription>
                                        {view === "monthly" ? "Monthly" : "Weekly"}{" "}
                                        {metric === "transactions" ? "Transactions" : "Revenue"}
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
                                    data={chartData}
                                    keys={[metric]}
                                    indexBy="label"
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
                                    colors={metric === "revenue" ? "#3b82f680" : "#10b98180"}
                                    borderRadius={15}
                                    role="application"
                                    enableGridY={false}
                                    />
                                )}
                                </CardContent>
                            </Card>
                            </CardContent>
                        </Card>
                        </TabsContent>

                        <TabsContent value="update-price" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-slate-800">Update price</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Brand name</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Brand id</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {brands.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.price}</TableCell>
                                                    <TableCell>{item.id}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="user-transactions" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-bold text-slate-800">User transactions</h1>
                                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export as csv
                                    </Button>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>SNO</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Machine Code</TableHead>
                                            <TableHead>Created at</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {userTransactions
                                            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                                            .map((transaction, index) => (
                                            <TableRow key={transaction.id || index}>
                                                <TableCell className="font-medium">
                                                {(currentPage - 1) * rowsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell className="text-blue-600">{transaction.msisdn}</TableCell>
                                                <TableCell className="text-blue-600">{transaction.brand_id}</TableCell>
                                                <TableCell className="text-blue-600">{transaction.amount}</TableCell>
                                                <TableCell>{transaction.quantity}</TableCell>
                                                <TableCell>{transaction.machine_code}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{transaction.created_at}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </CardContent>
                                </Card>

                                {/* Pagination controls */}
                                <div className="flex items-center justify-between mt-4">
                                    <Button
                                    variant="outline"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                    >
                                    Previous
                                    </Button>
                                    <span className="text-slate-600">
                                    Page {currentPage} of {Math.ceil(userTransactions.length / rowsPerPage)}
                                    </span>
                                    <Button
                                    variant="outline"
                                    disabled={currentPage === Math.ceil(userTransactions.length / rowsPerPage)}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    >
                                    Next
                                    </Button>
                                </div>
                        </TabsContent>
                    </Tabs>
                </div>
        </div>
        </div >
    )
}
