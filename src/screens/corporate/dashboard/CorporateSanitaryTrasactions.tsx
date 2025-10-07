"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { postRequest } from "@/Apis/Api"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { motion } from "framer-motion"

type Transaction = {
  id: number
  user_id: string
  msisdn: string
  quantity: number
  amount: string
  status: number
  created_at: string
  epoch_time: number
  merchant: string
  transaction_number: string
  brand_id: number
  machine_code: string
}

type ApiResponse = {
  data: Transaction[]
  totalPages: number
  currentPage: number
  totalItems: number
}

const SanitaryTransactionTable = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // ⏳ Debounce search input (logic unchanged)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // reset page when searching
    }, 1000)

    return () => clearTimeout(handler)
  }, [search])

  const fetchTransactions = async (page: number, query: string = "") => {
    setLoading(true)
    try {
      const storedCodes = localStorage.getItem("machines")
      const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

      if (machineCodes.length === 0) {
        console.warn("No machine codes found in localStorage.")
        setTransactions([])
        setLoading(false)
        return
      }

      const res = await postRequest<ApiResponse>(
        `/corporates/getAllCorporateSanitaryTrasactions?page=${page}&limit=${itemsPerPage}&search=${query}`,
        { machine_code: machineCodes }
      )

      setTransactions(res.data || [])
      setTotalPages(res.totalPages || 1)
      setCurrentPage(res.currentPage || page)
      setTotalItems(res.totalRecords || 0)
    } catch (err) {
      console.error("Error fetching sanitary transactions:", err)
      setTransactions([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, itemsPerPage])

  // view details overlay state
  const [activeTx, setActiveTx] = useState<Transaction | null>(null)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Corporate Sanitary Transactions</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* 🔍 Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Machine Id, Merchant, or Phone"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Cards grid (5 per row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-5 text-center p-8">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="col-span-5 text-center p-8">No data found</div>
            ) : (
              transactions.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.04 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 12px 30px rgba(16,185,129,0.08)" }}
                >
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-green-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + idx + 1}</div>
                        <div className="text-lg font-semibold">Rs. {t.amount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Qty</div>
                        <div className="font-medium">{t.quantity}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-muted-foreground">
                      <div>Number: {t.msisdn || "N/A"}</div>
                      <div>Time: {new Date(t.created_at).toLocaleString()}</div>
                      {t.machine_code && <div>Machine: {t.machine_code}</div>}
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        onClick={() => setActiveTx(t)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                      >
                        🔍 View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Fixed Pagination */}
          {transactions.length > 0 && (
            <div className="flex items-center justify-between px-4 mt-6">
              <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                Showing {transactions.length} of {totalItems} transactions
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
                  <button
                    className="hidden h-8 w-8 p-0 lg:flex items-center justify-center bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="size-8 bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="size-8 bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    className="hidden size-8 lg:flex items-center justify-center bg-transparent border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Details Overlay (animated) */}
        {activeTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setActiveTx(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-[92%] md:w-3/4 lg:w-2/4"
            >
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">Transaction Details 💳</h3>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{activeTx.msisdn || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-medium">Rs. {activeTx.amount}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Quantity</div>
                    <div className="font-medium">{activeTx.quantity}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Merchant</div>
                    <div className="font-medium">{activeTx.merchant || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Transaction Time</div>
                    <div className="font-medium">{new Date(activeTx.created_at).toLocaleString()}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Machine Code</div>
                    <div className="font-medium">{activeTx.machine_code || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Transaction Number</div>
                    <div className="font-small">{activeTx.transaction_number || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">{activeTx.status}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Epoch Time</div>
                    <div className="font-medium">{activeTx.epoch_time}</div>
                  </div>
                </div>

                <div className="mt-6 text-right">
                  <button onClick={() => setActiveTx(null)} className="px-4 py-2 rounded-lg bg-gray-100">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SanitaryTransactionTable