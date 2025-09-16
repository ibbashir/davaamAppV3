"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { postRequest } from "@/Apis/Api"
import { Search } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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

function getPaginationRange(current: number, total: number): (number | "...")[] {
  const delta = 1
  const range: (number | "...")[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push("...")
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push("...")
  if (total > 1) range.push(total)

  return range
}

const SanitaryTransactionTable = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const itemsPerPage = 10

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
    } catch (err) {
      console.error("Error fetching sanitary transactions:", err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch])

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

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
        </div>

        {/* Pagination (logic unchanged) */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      paginate(currentPage - 1)
                    }}
                  />
                </PaginationItem>
                {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <span className="px-2 text-muted-foreground">...</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault()
                          paginate(page as number)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      paginate(currentPage + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

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
