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

type CorporateUser = {
  id: number
  card_number: string | null
  pin: string
  name: string
  mobile_number: string
  balance: number
  is_active: number
  created_at: string
  machine_code: string
}

type ApiResponse = {
  data: CorporateUser[]
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

const AllCorporatesUsers = () => {
  const [users, setUsers] = useState<CorporateUser[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const usersPerPage = 10

  // ⏳ Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // reset page when searching
    }, 1000)

    return () => clearTimeout(handler)
  }, [search])

  const fetchCorporateUsers = async (page: number, searchQuery: string = "") => {
    setLoading(true)
    try {
      const storedCodes = localStorage.getItem("machines")
      const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

      const res = await postRequest<ApiResponse>(
        `/corporates/getAllCorporatesUsers?page=${page}&limit=${usersPerPage}&search=${encodeURIComponent(
          searchQuery
        )}`,
        { machine_code: machineCodes }
      )

      setUsers(res.data)
      setTotalPages(res.totalPages || 1)
      setCurrentPage(res.currentPage || page)
    } catch (err) {
      console.error("Error fetching corporate users:", err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCorporateUsers(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch])

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // view action overlay state
  const [activeUser, setActiveUser] = useState<CorporateUser | null>(null)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">All Corporate Users </h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* 🔎 Search Input (logic unchanged) */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="🔎 by Name, Phone, or Machine Code"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1) // reset to first page when search changes
              }}
              className="pl-10"
            />
          </div>

          {/* Cards Grid: 5 per row responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-5 text-center p-8">Loading...</div>
            ) : users.length === 0 ? (
              <div className="col-span-5 text-center p-8">No users found</div>
            ) : (
              users.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 12px 30px rgba(16,185,129,0.12)" }}
                >
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-green-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">#{(currentPage - 1) * usersPerPage + idx + 1}</div>
                        <div className="text-lg font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">Phone: {user.mobile_number}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Machine</div>
                        <div className="font-medium">{user.machine_code || "N/A"}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="font-semibold">Rs. {user.balance}</div>
                      </div>
                      <div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        onClick={() => setActiveUser(user)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                      >
                        🔎 View Details
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

        {/* View Action Overlay (shows all details) */}
        {activeUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setActiveUser(null)}
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
                  <h3 className="text-xl font-semibold">{activeUser.name}</h3>
          
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{activeUser.mobile_number}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Machine Code</div>
                    <div className="font-medium">{activeUser.machine_code || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                    <div className="font-medium">Rs. {activeUser.balance}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">{activeUser.is_active ? "Active" : "Inactive"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Card Number</div>
                    <div className="font-medium">{activeUser.card_number || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Created At</div>
                    <div className="font-medium">{new Date(activeUser.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-6 text-right">
                  <button onClick={() => setActiveUser(null)} className="px-4 py-2 rounded-lg bg-gray-100">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AllCorporatesUsers
