import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Users, UserCheck, Repeat, BarChart3, Clock, CalendarDays, TrendingUp, Activity,
  Phone, Tag, Package, Cpu, DollarSign,
} from "lucide-react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useLocation, useNavigate } from "react-router-dom"
import { postRequest } from "@/Apis/Api"
import { ResponsiveBar } from "@nivo/bar"
import moment from "moment-timezone"

// ── Types ──────────────────────────────────────────────────────────────────────
type ApiResponse = {
  data: {
    weekly: {
      Revenue: Record<string, number>[];
      Transaction: Record<string, number>[];
    };
    monthly: {
      Revenue: Record<string, number>[];
      Transaction: Record<string, number>[];
    };
  };
};

type NivoBarData = {
  id: string;
  label: string;
  revenue: number;
  transactions: number;
};

type TransactionResponse = {
  success: boolean;
  machine_code: string;
  transactions: any[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type MachineDetailsResponse = {
  transactions: Record<string, unknown>[]
  brands: Record<string, unknown>[]
  fillings: Record<string, unknown>[]
}

// ── Mobile transaction card ────────────────────────────────────────────────────
function MobileTransactionCard({
  transaction,
  index,
  startIndex,
}: {
  transaction: Record<string, unknown>
  index: number
  startIndex: number
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-400">#{startIndex + index + 1}</span>
        <span className="text-xs text-slate-500">
          {moment(transaction.created_at as string).tz("Asia/Karachi").format("MMM D, YYYY h:mm a")}
        </span>
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <Phone className="size-3.5 text-blue-500 shrink-0" />
          <span className="text-blue-600 font-medium">{String(transaction.msisdn ?? "—")}</span>
        </p>
        <p className="flex items-center gap-2">
          <Tag className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 font-semibold">{String(transaction.brand_id ?? "—")}</span>
        </p>
        <div className="flex items-center gap-4">
          <p className="flex items-center gap-1.5">
            <DollarSign className="size-3.5 text-teal-600 shrink-0" />
            <span className="text-teal-600 font-medium">{String(transaction.amount ?? "—")}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Package className="size-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-600">Qty: {String(transaction.quantity ?? "—")}</span>
          </p>
        </div>
        <p className="flex items-center gap-1.5">
          <Cpu className="size-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-500 text-xs">{String(transaction.machine_code ?? "—")}</span>
        </p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SuperAdminMachineVisit() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const machine = state?.machine

  const [stockView, setStockView] = useState("batch")
  const [activeTab, setActiveTab] = useState("stock-levels")
  const [userTransactions, setUserTransactions] = useState<Record<string, unknown>[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Record<string, unknown>[]>([])
  const [brands, setBrands] = useState<Record<string, unknown>[]>([])
  const [brandFillings, setBrandFillings] = useState<Record<string, unknown>[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  const [chartData, setChartData] = useState<NivoBarData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [chartLoading, setChartLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [view, setView] = useState<"monthly" | "weekly">("monthly")
  const [metric, setMetric] = useState<"revenue" | "transactions">("transactions")

  // Guard: redirect if no machine state
  useEffect(() => {
    if (!machine) navigate(-1)
  }, [machine, navigate])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMachineDetails() }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchChartData(view) }, [view])

  const fetchMachineDetails = async () => {
    try {
      setDetailsLoading(true)
      setDetailsError(null)
      const res: MachineDetailsResponse = await postRequest(`/superadmin/machineDetailsWithMachineCode`, {
        machine_code: machine.machine_code,
      })
      const enriched = res.transactions.map((tx: Record<string, unknown>) => {
        const brand = res.brands.find((b: Record<string, unknown>) => b.id === tx.brand_id)
        return { ...tx, brand_id: brand ? brand.name : tx.brand_id }
      })
      setUserTransactions(enriched)
      setFilteredTransactions(enriched)
      setBrandFillings(res.fillings)
      setBrands(res.brands)
    } catch (err) {
      console.error("Error fetching machine details:", err)
      setDetailsError("Failed to load machine details.")
    } finally {
      setDetailsLoading(false)
    }
  }

  const fetchChartData = async (type: "monthly" | "weekly") => {
    setChartLoading(true)
    try {
      const res = await postRequest<ApiResponse>(
        "/superadmin/BarChartMainDashboardSanitaryByMachineCode",
        { machine_code: machine.machine_code },
      )
      const revenueArr = type === "weekly" ? res.data.weekly.Revenue : res.data.monthly.Revenue
      const transactionArr = type === "weekly" ? res.data.weekly.Transaction : res.data.monthly.Transaction

      const transformed: NivoBarData[] = revenueArr.map((revObj, i) => {
        const label = Object.keys(revObj)[0]
        const revenue = Object.values(revObj)[0]
        const transactions = Object.values(transactionArr[i])[0]
        return { id: label, label, revenue, transactions }
      })

      setChartData(transformed)
      setTotalRevenue(transformed.reduce((sum, d) => sum + d.revenue, 0))
      setTotalTransactions(transformed.reduce((sum, d) => sum + d.transactions, 0))
      setChartError(null)
    } catch (err) {
      console.error("Error fetching bar chart data:", err)
      setChartError("⚠️ Failed to load bar chart.")
    } finally {
      setChartLoading(false)
    }
  }

  // ── Month filter ─────────────────────────────────────────────────────────────
  const filterTransactionsByMonth = (month: string) => {
    setSelectedMonth(month)
    if (!month) {
      setFilteredTransactions(userTransactions)
      setCurrentPage(1)
      return
    }
    const filtered = userTransactions.filter((tx) => {
      const d = new Date(tx.created_at as string)
      return d.toISOString().slice(0, 7) === month
    })
    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  const monthOptions = useMemo(() => {
    const months = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      months.unshift({
        value: `${year}-${month}`,
        label: date.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      })
    }
    return months
  }, [])

  // ── CSV export ───────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No data to export!")
      return
    }
    const headers = ["SNO", "Phone", "Product", "Amount", "Quantity", "Machine Code", "Created At"]
    const csvData = filteredTransactions.map((tx, i) => [
      i + 1,
      tx.msisdn,
      tx.brand_id,
      tx.amount,
      tx.quantity,
      tx.machine_code,
      tx.created_at,
    ])
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `transactions_${machine?.machine_code ?? "machine"}_${selectedMonth || "all-time"}_${new Date().toISOString().split("T")[0]}.csv`
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ── Stats computation ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!userTransactions || userTransactions.length === 0) return null;

    const userFreq: Record<string, number> = {}
    const hourCounts = new Array(24).fill(0)
    const dayCounts = new Array(7).fill(0)
    const dailyTxMap: Record<string, Set<string>> = {}

    for (const tx of userTransactions) {
      const phone = String(tx.msisdn ?? "unknown")
      userFreq[phone] = (userFreq[phone] || 0) + 1
      const d = moment(tx.created_at as string).tz("Asia/Karachi")
      hourCounts[d.hour()]++
      dayCounts[d.day()]++
      const dateKey = d.format("YYYY-MM-DD")
      if (!dailyTxMap[dateKey]) dailyTxMap[dateKey] = new Set()
      dailyTxMap[dateKey].add(phone)
    }

    const totalUsers = Object.keys(userFreq).length;
    const returningUsers = Object.values(userFreq).filter((c) => c > 1).length;
    const newUsers = totalUsers - returningUsers;
    const repeatRate =
      totalUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0;

    const freq = { once: 0, low: 0, mid: 0, high: 0 }
    for (const count of Object.values(userFreq)) {
      if (count === 1) freq.once++;
      else if (count <= 3) freq.low++;
      else if (count <= 10) freq.mid++;
      else freq.high++;
    }

    const topUsers = Object.entries(userFreq).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const totalDays = Object.keys(dailyTxMap).length || 1
    const avgTxPerDay = (userTransactions.length / totalDays).toFixed(1)
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const peakDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))]

    const hourlyData = hourCounts.map((count, h) => ({
      id: `${h.toString().padStart(2, "0")}:00`,
      label: `${h.toString().padStart(2, "0")}:00`,
      transactions: count,
    }))
    const dailyData = dayNames.map((name, i) => ({
      id: name.slice(0, 3),
      label: name.slice(0, 3),
      transactions: dayCounts[i],
    }))
    const freqData = [
      { id: "1x", label: "1 time", users: freq.once },
      { id: "2-3x", label: "2-3 times", users: freq.low },
      { id: "4-10x", label: "4-10 times", users: freq.mid },
      { id: "10x+", label: "10+ times", users: freq.high },
    ];

    return { totalUsers, newUsers, returningUsers, repeatRate, topUsers, avgTxPerDay, peakHour, peakDay, hourlyData, dailyData, freqData, totalDays }
  }, [userTransactions])

  if (!machine) return null

  return (
    <div>
      <SiteHeader title="🌍 Super Admin Machine Dashboard" />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-3 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* ── Tabs – scrollable on mobile ── */}
            <div className="overflow-x-auto pb-1 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="flex min-w-max bg-green-100 rounded-xl p-1 shadow-sm">
                <TabsTrigger value="stock-levels" className="text-xs sm:text-sm px-2 sm:px-4">
                  📦 <span className="hidden sm:inline ml-1">Stock Levels</span><span className="sm:hidden ml-1">Stock</span>
                </TabsTrigger>
                <TabsTrigger value="sales-usage" className="text-xs sm:text-sm px-2 sm:px-4">
                  📊 <span className="hidden sm:inline ml-1">Sales & Usage</span><span className="sm:hidden ml-1">Sales</span>
                </TabsTrigger>
                <TabsTrigger value="update-price" className="text-xs sm:text-sm px-2 sm:px-4">
                  💲 <span className="hidden sm:inline ml-1">Update Price</span><span className="sm:hidden ml-1">Price</span>
                </TabsTrigger>
                <TabsTrigger value="user-transactions" className="text-xs sm:text-sm px-2 sm:px-4">
                  👥 <span className="hidden sm:inline ml-1">Transactions</span><span className="sm:hidden ml-1">Tx</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs sm:text-sm px-2 sm:px-4">
                  📈 Stats
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── STOCK LEVELS ── */}
            <TabsContent value="stock-levels" className="space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={stockView === "batch" ? "default" : "outline"}
                    onClick={() => setStockView("batch")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm"
                  >
                    📦 Batch Refill
                  </Button>
                  <Button
                    variant={stockView === "realtime" ? "default" : "outline"}
                    onClick={() => setStockView("realtime")}
                    className={`rounded-lg text-xs sm:text-sm ${stockView === "realtime" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  >
                    ⏱ Real-Time
                  </Button>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Stock
                </Button>
              </div>

              {detailsLoading ? (
                <p className="text-center py-8 text-emerald-600">Loading stock data…</p>
              ) : detailsError ? (
                <p className="text-center py-8 text-red-500">{detailsError}</p>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <AnimatePresence>
                    {brandFillings.map((item) => (
                      <motion.div
                        key={String(item.id)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card className="border border-emerald-200 shadow-md rounded-2xl hover:shadow-lg transition-all">
                          <CardHeader>
                            <CardTitle className="text-emerald-700">{String(item.name ?? "—")}</CardTitle>
                            <CardDescription>
                              {stockView === "batch" ? "Batch Refill Details" : "Real-Time Stock Status"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {stockView === "batch" ? (
                              <>
                                <p><span className="font-medium">📦 Quantity:</span> {String(item.quantity ?? "—")}</p>
                                <p><span className="font-medium">📅 Created At:</span> {String(item.created_at ?? "—")}</p>
                                <p><span className="font-medium">🔖 Batch No:</span> {String(item.batch_number ?? "—")}</p>
                              </>
                            ) : (
                              <>
                                <p><span className="font-medium">🕒 Last Batch Refill:</span> {String(item.lastBatchRefill ?? "—")}</p>
                                <p><span className="font-medium text-red-600">❌ Stocks Out:</span> {String(item.stockOut ?? "—")}</p>
                                <p><span className="font-medium text-green-600">✅ Current Stock:</span> {String(item.currentStock ?? "—")}</p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>

            {/* ── SALES & USAGE ── */}
            <TabsContent value="sales-usage" className="space-y-4 sm:space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-emerald-700">
                      📊 Sales & Usage Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-base sm:text-lg">📈 Revenue & Transactions</CardTitle>
                            <CardDescription>
                              {view === "monthly" ? "📅 Monthly" : "📆 Weekly"}{" "}
                              —{" "}
                              {metric === "transactions"
                                ? "Transactions"
                                : "Revenue"}
                            </CardDescription>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div><strong>💰 Total Revenue:</strong> Rs {totalRevenue.toLocaleString()}</div>
                              <div><strong>🛒 Total Transactions:</strong> {totalTransactions.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button size="sm" variant={metric === "transactions" ? "default" : "outline"} onClick={() => setMetric("transactions")}>
                                🛒 Transactions
                              </Button>
                              <Button size="sm" variant={metric === "revenue" ? "default" : "outline"} onClick={() => setMetric("revenue")}>
                                💰 Revenue
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant={view === "weekly" ? "default" : "outline"} onClick={() => setView("weekly")}>📆 Weekly</Button>
                            <Button size="sm" variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>📅 Monthly</Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-64 sm:h-96">
                        {chartLoading ? (
                          <div className="flex justify-center items-center h-full animate-pulse text-emerald-600">⏳ Loading...</div>
                        ) : chartError ? (
                          <div className="flex justify-center items-center h-full text-red-600">{chartError}</div>
                        ) : (
                          <ResponsiveBar
                            data={chartData}
                            keys={[metric]}
                            indexBy="label"
                            margin={{ top: 30, right: 20, bottom: 50, left: 50 }}
                            padding={0.3}
                            indexScale={{ type: "band", round: true }}
                            axisBottom={{
                              legend: view === "weekly" ? "Date" : "Month",
                              legendPosition: "middle",
                              legendOffset: 32,
                              tickRotation: -30,
                            }}
                            axisLeft={{
                              legend:
                                metric === "revenue"
                                  ? "Revenue (Rs)"
                                  : "Transactions",
                              legendPosition: "middle",
                              legendOffset: -40,
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            colors={
                              metric === "revenue" ? "#34d399" : "#60a5fa"
                            }
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

            {/* ── UPDATE PRICE ── */}
            <TabsContent value="update-price" className="space-y-4 sm:space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-700">💲 Update Price</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
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
                          <TableRow key={String(item.id)}>
                            <TableCell>{String(item.name ?? "—")}</TableCell>
                            <TableCell className="text-emerald-700 font-bold">{String(item.price ?? "—")}</TableCell>
                            <TableCell>{String(item.id ?? "—")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ── USER TRANSACTIONS ── */}
            <TabsContent value="user-transactions" className="space-y-4 sm:space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-emerald-700">👥 User Transactions</h1>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                    onClick={exportToCSV}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                </div>

                {/* Month filter */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="month-filter" className="text-sm font-medium">📅 Filter by Month</Label>
                    <Select value={selectedMonth} onValueChange={filterTransactionsByMonth}>
                      <SelectTrigger className="w-48" id="month-filter">
                        <SelectValue placeholder="Select month..." />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMonth && (
                    <Button variant="outline" onClick={() => filterTransactionsByMonth("")} className="text-red-600 hover:text-red-700">
                      Clear Filter
                    </Button>
                  )}
                </div>

                {detailsLoading ? (
                  <p className="text-center py-8 text-emerald-600">Loading transactions…</p>
                ) : detailsError ? (
                  <p className="text-center py-8 text-red-500">{detailsError}</p>
                ) : (
                  <Card className="rounded-2xl shadow-lg">
                    <CardContent className="p-3 sm:p-6">
                      {/* Mobile: card view */}
                      <div className="sm:hidden space-y-3">
                        {paginatedTransactions.length > 0 ? (
                          paginatedTransactions.map((tx, i) => (
                            <MobileTransactionCard
                              key={String(tx.id ?? i)}
                              transaction={tx}
                              index={i}
                              startIndex={startIndex}
                            />
                          ))
                        ) : (
                          <p className="text-center py-8 text-muted-foreground text-sm">
                            {selectedMonth ? "No transactions found for the selected month" : "No transactions available"}
                          </p>
                        )}
                      </div>

                      {/* Desktop: table view */}
                      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader className="bg-teal-600">
                            <TableRow>
                              <TableHead className="text-white font-semibold">#</TableHead>
                              <TableHead className="text-white font-semibold">📱 Phone</TableHead>
                              <TableHead className="text-white font-semibold">🏷 Product</TableHead>
                              <TableHead className="text-white font-semibold">💵 Amount</TableHead>
                              <TableHead className="text-white font-semibold">📦 Quantity</TableHead>
                              <TableHead className="text-white font-semibold">🏭 Machine</TableHead>
                              <TableHead className="text-white font-semibold">⏰ Created At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTransactions.length > 0 ? (
                              paginatedTransactions.map((tx, index) => (
                                <TableRow key={String(tx.id ?? index)}>
                                  <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                                  <TableCell className="text-blue-600">{String(tx.msisdn ?? "—")}</TableCell>
                                  <TableCell className="text-emerald-700 font-bold">{String(tx.brand_id ?? "—")}</TableCell>
                                  <TableCell className="text-teal-600">{String(tx.amount ?? "—")}</TableCell>
                                  <TableCell>{String(tx.quantity ?? "—")}</TableCell>
                                  <TableCell>{String(tx.machine_code ?? "—")}</TableCell>
                                  <TableCell className="text-sm text-slate-500">
                                    {moment(tx.created_at as string).tz("Asia/Karachi").format("MMMM Do YYYY, h:mm a")}
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
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pagination */}
                {filteredTransactions.length > 0 && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3 px-1">
                    {/* Rows per page (desktop) */}
                    <div className="hidden sm:flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {paginatedTransactions.length} of {filteredTransactions.length}
                      </p>
                      <Label htmlFor="rows-per-page" className="text-sm font-medium ml-4">Rows per page</Label>
                      <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1) }}
                      >
                        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                          <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[5, 10, 20, 50, 100].map((ps) => (
                            <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-1">
                      <Button variant="outline" size="icon" className="size-8 border-violet-200 hover:bg-violet-50"
                        onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        <ChevronsLeft className="size-4 text-violet-500" />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8 border-blue-200 hover:bg-blue-50"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="size-4 text-blue-500" />
                      </Button>
                      <span className="text-sm font-medium tabular-nums px-2">
                        {currentPage} / {totalPages || 1}
                      </span>
                      <Button variant="outline" size="icon" className="size-8 border-teal-200 hover:bg-teal-50"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="size-4 text-teal-500" />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        <ChevronsRight className="size-4 text-emerald-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── STATS ── */}
            <TabsContent value="stats" className="space-y-4 sm:space-y-6">
              {!stats ? (
                <Card className="rounded-2xl shadow-lg">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No transaction data available to generate stats.
                  </CardContent>
                </Card>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 sm:space-y-6">

                  {/* User Retention */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-700">👥 User Retention & Engagement</CardTitle>
                      <CardDescription>How users interact with this machine over time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="border border-emerald-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.totalUsers}</p>
                            <p className="text-xs text-muted-foreground">Total Unique Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-blue-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.newUsers}</p>
                            <p className="text-xs text-muted-foreground">One-Time Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-violet-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-violet-700">{stats.returningUsers}</p>
                            <p className="text-xs text-muted-foreground">Returning Users</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-amber-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-amber-700">{stats.repeatRate}%</p>
                            <p className="text-xs text-muted-foreground">Repeat Rate</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base sm:text-lg text-emerald-700">📊 User Frequency Distribution</CardTitle>
                          <CardDescription>How often users return to this machine</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                          <ResponsiveBar
                            data={stats.freqData}
                            keys={["users"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 40, left: 45 }}
                            padding={0.4}
                            colors="#8b5cf6"
                            borderRadius={8}
                            enableGridY={false}
                            axisBottom={{ legend: "Frequency", legendPosition: "middle", legendOffset: 32 }}
                            axisLeft={{ legend: "Users", legendPosition: "middle", legendOffset: -38 }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                          />
                        </CardContent>
                      </Card>

                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base sm:text-lg text-emerald-700">🏆 Top 5 Users</CardTitle>
                          <CardDescription>Most frequent users of this machine</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
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
                                  <TableCell className="font-medium">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="text-blue-600">
                                    {phone}
                                  </TableCell>
                                  <TableCell className="font-bold text-emerald-700">
                                    {count}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  {/* Usage Patterns */}
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-700">⚡ Machine Usage Patterns</CardTitle>
                      <CardDescription>When and how often this machine is used</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="border border-teal-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-teal-700">{stats.avgTxPerDay}</p>
                            <p className="text-xs text-muted-foreground">Avg Tx / Day</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-emerald-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{userTransactions.length}</p>
                            <p className="text-xs text-muted-foreground">Total Transactions</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-blue-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.peakHour.toString().padStart(2, "0")}:00</p>
                            <p className="text-xs text-muted-foreground">Peak Hour</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-orange-200">
                          <CardContent className="pt-4 pb-4 text-center">
                            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mx-auto mb-2" />
                            <p className="text-lg sm:text-2xl font-bold text-orange-700 truncate">{stats.peakDay}</p>
                            <p className="text-xs text-muted-foreground">Peak Day</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base sm:text-lg text-emerald-700">🕐 Hourly Usage Distribution</CardTitle>
                          <CardDescription>Transaction volume by hour of day</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                          <ResponsiveBar
                            data={stats.hourlyData}
                            keys={["transactions"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 50, left: 45 }}
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
                            axisLeft={{ legend: "Transactions", legendPosition: "middle", legendOffset: -38 }}
                            labelSkipWidth={16}
                            labelSkipHeight={12}
                          />
                        </CardContent>
                      </Card>

                      <Card className="border border-emerald-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base sm:text-lg text-emerald-700">📅 Day of Week Distribution</CardTitle>
                          <CardDescription>Transaction volume by day of the week</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                          <ResponsiveBar
                            data={stats.dailyData}
                            keys={["transactions"]}
                            indexBy="id"
                            margin={{ top: 20, right: 20, bottom: 40, left: 45 }}
                            padding={0.4}
                            colors="#60a5fa"
                            borderRadius={8}
                            enableGridY={false}
                            axisBottom={{ legend: "Day", legendPosition: "middle", legendOffset: 32 }}
                            axisLeft={{ legend: "Transactions", legendPosition: "middle", legendOffset: -38 }}
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
