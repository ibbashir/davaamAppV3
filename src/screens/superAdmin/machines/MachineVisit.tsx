"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useLocation } from "react-router-dom"
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

export default function AdminMachineVisit() {
  const { state } = useLocation()
  const machine = state?.machine

  const [stockView, setStockView] = useState("batch")
  const [activeTab, setActiveTab] = useState("stock-levels")
  const [userTransactions, setUserTransactions] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [brandFillings, setBrandFillings] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
    const res = await postRequest(`/superadmin/machineDetailsWithMachineCode`, { machine_code: machine.machine_code })
    setUserTransactions(res.transactions)
    setBrandFillings(res.fillings)
    setBrands(res.brands)
  }

  const fetchChartData = async (type: "monthly" | "weekly") => {
    setLoading(true)
    try {
      const res = await postRequest<ApiResponse>("/superadmin/BarChartMainDashboardSanitaryByMachineCode", { machine_code: machine.machine_code })
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
        return { id: label, label, revenue, transactions }
      })

      setChartData(transformed)
      setTotalRevenue(transformed.reduce((sum, d) => sum + d.revenue, 0))
      setTotalTransactions(transformed.reduce((sum, d) => sum + d.transactions, 0))
      setError(null)
    } catch (err) {
      console.error("Error fetching bar chart data:", err)
      setError("⚠️ Failed to load bar chart.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData(view)
  }, [view])

  const totalPages = Math.ceil(userTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = userTransactions.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div>
      <SiteHeader title="🌍 Super Admin Machine Dashboard" />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-green-100 rounded-xl p-1 shadow-sm">
              <TabsTrigger value="stock-levels">📦 Stock Levels</TabsTrigger>
              <TabsTrigger value="sales-usage">📊 Sales & Usage</TabsTrigger>
              <TabsTrigger value="update-price">💲 Update Price</TabsTrigger>
              <TabsTrigger value="user-transactions">👥 Transactions</TabsTrigger>
            </TabsList>

            {/* STOCK LEVELS */}
            <TabsContent value="stock-levels" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={stockView === "batch" ? "default" : "outline"}
                    onClick={() => setStockView("batch")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    📦 Batch Refill
                  </Button>
                  <Button
                    variant={stockView === "realtime" ? "default" : "outline"}
                    onClick={() => setStockView("realtime")}
                    className={stockView === "realtime" ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" : ""}
                  >
                    ⏱ Real-Time Stock
                  </Button>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />  Add Stock
                </Button>
              </div>

              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {brandFillings.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="border border-emerald-200 shadow-md rounded-2xl hover:shadow-lg transition-all">
                        <CardHeader>
                          <CardTitle className="text-emerald-700">{item.name}</CardTitle>
                          <CardDescription>
                            {stockView === "batch" ? "Batch Refill Details" : "Real-Time Stock Status"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {stockView === "batch" ? (
                            <div className="space-y-2">
                              <p><span className="font-medium">📦 Quantity:</span> {item.quantity}</p>
                              <p><span className="font-medium">📅 Created At:</span> {item.created_at}</p>
                              <p><span className="font-medium">🔖 Batch No:</span> {item.batch_number}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p><span className="font-medium">🕒 Last Batch Refill:</span> {item.lastBatchRefill}</p>
                              <p><span className="font-medium text-red-600">❌ Stocks Out:</span> {item.stockOut}</p>
                              <p><span className="font-medium text-green-600">✅ Current Stock:</span> {item.currentStock}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </TabsContent>

            {/* SALES USAGE */}
            <TabsContent value="sales-usage" className="space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-emerald-700">📊 Sales & Usage Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>📈 Revenue & Transactions</CardTitle>
                            <CardDescription>
                              {view === "monthly" ? "📅 Monthly" : "📆 Weekly"} — {metric === "transactions" ? "Transactions" : "Revenue"}
                            </CardDescription>
                            <div className="mt-3 text-sm text-muted-foreground space-y-1">
                              <div><strong>💰 Total Revenue:</strong> Rs {totalRevenue.toLocaleString()}</div>
                              <div><strong>🛒 Total Transactions:</strong> {totalTransactions.toLocaleString()}</div>
                            </div>
                            <div className="flex p-2 space-x-2">
                              <Button variant={metric === "transactions" ? "default" : "outline"} onClick={() => setMetric("transactions")}>
                                🛒 Transactions
                              </Button>
                              <Button variant={metric === "revenue" ? "default" : "outline"} onClick={() => setMetric("revenue")}>
                                💰 Revenue
                              </Button>
                            </div>
                          </div>
                          <div className="space-x-2 space-y-1">
                            <Button variant={view === "weekly" ? "default" : "outline"} onClick={() => setView("weekly")}>📆 Weekly</Button>
                            <Button variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>📅 Monthly</Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-[400px]">
                        {loading ? (
                          <div className="flex justify-center items-center h-full animate-pulse text-emerald-600">⏳ Loading...</div>
                        ) : error ? (
                          <div className="flex justify-center items-center h-full text-red-600">{error}</div>
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
                            colors={metric === "revenue" ? "#34d399" : "#60a5fa"}
                            borderRadius={12}
                            enableGridY={false}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* UPDATE PRICE */}
            <TabsContent value="update-price" className="space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-emerald-700">💲 Update Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>🏷 Brand Name</TableHead>
                          <TableHead>💰 Price</TableHead>
                          <TableHead>🆔 Brand ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {brands.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-emerald-700 font-bold">{item.price}</TableCell>
                            <TableCell>{item.id}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* USER TRANSACTIONS */}
            <TabsContent value="user-transactions" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between px-2 py-3 mb-4">
                  <h1 className="text-2xl font-bold text-emerald-700">
                    👥 User Transactions
                  </h1>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg ml-4">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                </div>

                <Card className="rounded-2xl shadow-lg">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#️⃣ SNO</TableHead>
                          <TableHead>📱 Phone</TableHead>
                          <TableHead>🏷 Product</TableHead>
                          <TableHead>💵 Amount</TableHead>
                          <TableHead>📦 Quantity</TableHead>
                          <TableHead>🏭 Machine Code</TableHead>
                          <TableHead>⏰ Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map((transaction, index) => (
                          <TableRow key={transaction.id || index}>
                            <TableCell className="font-medium">
                              {startIndex + index + 1}
                            </TableCell>
                            <TableCell className="text-blue-600">{transaction.msisdn}</TableCell>
                            <TableCell className="text-emerald-700 font-bold">{transaction.brand_id}</TableCell>
                            <TableCell className="text-teal-600">{transaction.amount}</TableCell>
                            <TableCell>{transaction.quantity}</TableCell>
                            <TableCell>{transaction.machine_code}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {transaction.created_at}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Fixed Pagination */}
                {userTransactions.length > 0 && (
                  <div className="flex items-center justify-between px-4 mt-4">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                      Showing {paginatedTransactions.length} of {userTransactions.length} transactions
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                      <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                          Rows per page
                        </Label>
                        <Select
                          value={`${itemsPerPage}`}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value))
                            setCurrentPage(1)
                          }}
                        >
                          <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                            <SelectValue placeholder={itemsPerPage} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[5, 10, 20, 50, 100].map((pageSize) => (
                              <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8 bg-transparent"
                          size="icon"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8 bg-transparent"
                          size="icon"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden size-8 lg:flex bg-transparent"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}