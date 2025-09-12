"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  // ⏳ Debounce search input
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Amount (Rs)</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Transaction Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No data found</TableCell>
                </TableRow>
              ) : (
                transactions.map((t, index) => (
                  <TableRow key={t.id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>{t.msisdn || "N/A"}</TableCell>
                    <TableCell>{t.merchant}</TableCell>
                    <TableCell>Rs. {t.amount}</TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 📑 Pagination */}
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
                          paginate(page)
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
      </CardContent>
    </Card>
  )
}

export default SanitaryTransactionTable
