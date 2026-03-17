"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, UserCheck, Repeat, BarChart3, Clock, CalendarDays, TrendingUp, Activity } from "lucide-react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useLocation } from "react-router-dom"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"
import moment from "moment-timezone"

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
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [brandFillings, setBrandFillings] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedMonth, setSelectedMonth] = useState<string>("")

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
    setFilteredTransactions(res.transactions) // Initialize filtered transactions with all data
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

  // Filter transactions by month
  const filterTransactionsByMonth = (month: string) => {
    setSelectedMonth(month)
    
    if (!month) {
      setFilteredTransactions(userTransactions)
      setCurrentPage(1)
      return
    }

    const filtered = userTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at)
      const transactionMonth = transactionDate.toISOString().slice(0, 7) // YYYY-MM format
      return transactionMonth === month
    })

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const months = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${month}`
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      
      months.unshift({ value, label })
    }
    
    return months
  }

  const monthOptions = getMonthOptions()

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  // Add this function inside your component
const exportToCSV = () => {
  if (filteredTransactions.length === 0) {
    alert("No data to export!")
    return
  }

  // Define CSV headers
  const headers = ["SNO", "Phone", "Product", "Amount", "Quantity", "Machine Code", "Created At"]
  
  // Convert data to CSV format
  const csvData = filteredTransactions.map((transaction, index) => [
    index + 1,
    transaction.msisdn,
    transaction.brand_id,
    transaction.amount,
    transaction.quantity,
    transaction.machine_code,
    transaction.created_at
  ])

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...csvData.map(row => row.map(field => `"${field}"`).join(","))
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  
  const fileName = `transactions_${machine?.machine_code || "machine"}_${selectedMonth || "all-time"}_${new Date().toISOString().split('T')[0]}.csv`
  
  link.setAttribute("href", url)
  link.setAttribute("download", fileName)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up URL object
  URL.revokeObjectURL(url)
}
  // ── Stats computation ──
  const stats = useMemo(() => {
    if (!userTransactions || userTransactions.length === 0) return null

    // User frequency map: phone -> transaction count
    const userFreq: Record<string, number> = {}
    const hourCounts = new Array(24).fill(0)
    const dayCounts = new Array(7).fill(0) // 0=Sun, 6=Sat
    const dailyTxMap: Record<string, Set<string>> = {} // date -> unique users

    for (const tx of userTransactions) {
      const phone = tx.msisdn || "unknown"
      userFreq[phone] = (userFreq[phone] || 0) + 1

      const d = moment(tx.created_at).tz("Asia/Karachi")
      hourCounts[d.hour()]++
      dayCounts[d.day()]++

      const dateKey = d.format("YYYY-MM-DD")
      if (!dailyTxMap[dateKey]) dailyTxMap[dateKey] = new Set()
      dailyTxMap[dateKey].add(phone)
    }

    const totalUsers = Object.keys(userFreq).length
    const returningUsers = Object.values(userFreq).filter((c) => c > 1).length
    const newUsers = totalUsers - returningUsers
    const repeatRate = totalUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0

    // Frequency distribution
    const freq = { once: 0, low: 0, mid: 0, high: 0 }
    for (const count of Object.values(userFreq)) {
      if (count === 1) freq.once++
      else if (count <= 3) freq.low++
      else if (count <= 10) freq.mid++
      else freq.high++
    }

    // Top 5 users
    const topUsers = Object.entries(userFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Avg transactions per day
    const totalDays = Object.keys(dailyTxMap).length || 1
    const avgTxPerDay = (userTransactions.length / totalDays).toFixed(1)

    // Peak hour
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))

    // Peak day
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const peakDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))]

    // Hourly chart data
    const hourlyData = hourCounts.map((count, h) => ({
      id: `${h.toString().padStart(2, "0")}:00`,
      label: `${h.toString().padStart(2, "0")}:00`,
      transactions: count,
    }))

    // Daily chart data
    const dailyData = dayNames.map((name, i) => ({
      id: name.slice(0, 3),
      label: name.slice(0, 3),
      transactions: dayCounts[i],
    }))

    // Frequency distribution chart data
    const freqData = [
      { id: "1x", label: "1 time", users: freq.once },
      { id: "2-3x", label: "2-3 times", users: freq.low },
      { id: "4-10x", label: "4-10 times", users: freq.mid },
      { id: "10x+", label: "10+ times", users: freq.high },
    ]

    return {
      totalUsers, newUsers, returningUsers, repeatRate,
      topUsers, avgTxPerDay, peakHour, peakDay,
      hourlyData, dailyData, freqData, totalDays,
    }
  }, [userTransactions])

  return (
    <div>
      <SiteHeader title="🌍 Super Admin Machine Dashboard" />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-green-100 rounded-xl p-1 shadow-sm">
              <TabsTrigger value="stock-levels">📦 Stock Levels</TabsTrigger>
              <TabsTrigger value="sales-usage">📊 Sales & Usage</TabsTrigger>
              <TabsTrigger value="update-price">💲 Update Price</TabsTrigger>
              <TabsTrigger value="user-transactions">👥 Transactions</TabsTrigger>
              <TabsTrigger value="stats">📈 Stats</TabsTrigger>
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
                  <Button 
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg ml-4"
                    onClick={exportToCSV}
                    disabled={filteredTransactions.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" /> 
                    Export CSV
                  </Button>
                </div>
                
                {/* Month Filter */}
                <div className="grid gap-2 mb-4">
                  <Label htmlFor="month-filter" className="text-sm font-medium">
                    📅 Filter by Month
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Select value={selectedMonth} onValueChange={filterTransactionsByMonth}>
                      <SelectTrigger className="w-48" id="month-filter">
                        <SelectValue placeholder="Select month..." />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedMonth && (
                      <Button 
                        variant="outline" 
                        onClick={() => filterTransactionsByMonth("")}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
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
                        {paginatedTransactions.length > 0 ? (
                          paginatedTransactions.map((transaction, index) => (
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
                                {moment(transaction.created_at).tz("Asia/Karachi").format("MMMM Do YYYY, h:mm:ss a")}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              {selectedMonth ? "No transactions found for the selected month" : "No transactions available"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Fixed Pagination */}
                {filteredTransactions.length > 0 && (
                  <div className="flex items-center justify-between px-4 mt-4">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                      Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
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
            {/* STATS */}
            <TabsContent value="stats" className="space-y-6">
              {!stats ? (
                <Card className="rounded-2xl shadow-lg">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No transaction data available to generate stats.
                  </CardContent>
                </Card>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6">
                  {/* User Retention & Engagement */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-emerald-700">👥 User Retention & Engagement</CardTitle>
                      <CardDescription>How users interact with this machine over time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border border-emerald-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Users className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-emerald-700">{stats.totalUsers}</p>
                            <p className="text-xs text-muted-foreground">Total Unique Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-blue-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-700">{stats.newUsers}</p>
                            <p className="text-xs text-muted-foreground">One-Time Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-violet-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Repeat className="h-6 w-6 text-violet-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-violet-700">{stats.returningUsers}</p>
                            <p className="text-xs text-muted-foreground">Returning Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-amber-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <TrendingUp className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-amber-700">{stats.repeatRate}%</p>
                            <p className="text-xs text-muted-foreground">Repeat Rate</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Frequency Distribution Chart */}
                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-emerald-700">📊 User Frequency Distribution</CardTitle>
                          <CardDescription>How often users return to this machine</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                          <ResponsiveBar
                            data={stats.freqData}
                            keys={["users"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                            padding={0.4}
                            colors="#8b5cf6"
                            borderRadius={8}
                            enableGridY={false}
                            axisBottom={{ legend: "Frequency", legendPosition: "middle", legendOffset: 32 }}
                            axisLeft={{ legend: "Users", legendPosition: "middle", legendOffset: -40 }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                          />
                        </CardContent>
                      </Card>

                      {/* Top Users Table */}
                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-emerald-700">🏆 Top 5 Users</CardTitle>
                          <CardDescription>Most frequent users of this machine</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>📱 Phone</TableHead>
                                <TableHead>🔄 Transactions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.topUsers.map(([phone, count], i) => (
                                <TableRow key={phone}>
                                  <TableCell className="font-medium">{i + 1}</TableCell>
                                  <TableCell className="text-blue-600">{phone}</TableCell>
                                  <TableCell className="font-bold text-emerald-700">{count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  {/* Machine Usage Patterns */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-emerald-700">⚡ Machine Usage Patterns</CardTitle>
                      <CardDescription>When and how often this machine is used</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Usage KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border border-teal-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Activity className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-teal-700">{stats.avgTxPerDay}</p>
                            <p className="text-xs text-muted-foreground">Avg Transactions/Day</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-emerald-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <BarChart3 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-emerald-700">{userTransactions.length}</p>
                            <p className="text-xs text-muted-foreground">Total Transactions</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-blue-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-700">{stats.peakHour.toString().padStart(2, "0")}:00</p>
                            <p className="text-xs text-muted-foreground">Peak Hour</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-orange-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <CalendarDays className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-700">{stats.peakDay}</p>
                            <p className="text-xs text-muted-foreground">Peak Day</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Hourly Distribution Chart */}
                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-emerald-700">🕐 Hourly Usage Distribution</CardTitle>
                          <CardDescription>Transaction volume by hour of day</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveBar
                            data={stats.hourlyData}
                            keys={["transactions"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                            padding={0.3}
                            colors="#14b8a6"
                            borderRadius={4}
                            enableGridY={false}
                            axisBottom={{
                              legend: "Hour of Day",
                              legendPosition: "middle",
                              legendOffset: 40,
                              tickRotation: -45,
                            }}
                            axisLeft={{ legend: "Transactions", legendPosition: "middle", legendOffset: -40 }}
                            labelSkipWidth={16}
                            labelSkipHeight={12}
                          />
                        </CardContent>
                      </Card>

                      {/* Day of Week Distribution Chart */}
                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-emerald-700">📅 Day of Week Distribution</CardTitle>
                          <CardDescription>Transaction volume by day of the week</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                          <ResponsiveBar
                            data={stats.dailyData}
                            keys={["transactions"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                            padding={0.4}
                            colors="#60a5fa"
                            borderRadius={8}
                            enableGridY={false}
                            axisBottom={{ legend: "Day", legendPosition: "middle", legendOffset: 32 }}
                            axisLeft={{ legend: "Transactions", legendPosition: "middle", legendOffset: -40 }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                          />
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}