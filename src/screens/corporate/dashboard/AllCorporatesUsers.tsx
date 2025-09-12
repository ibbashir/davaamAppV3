"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
        `/corporates/getAllCorporatesUsers?page=${page}&limit=${usersPerPage}&search=${encodeURIComponent(searchQuery)}`,
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

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">All Corporate Users</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* 🔎 Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name, Phone, or Machine Code"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1) // reset to first page when search changes
              }}
              className="pl-10"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Machine Code</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{(currentPage - 1) * usersPerPage + index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.mobile_number}</TableCell>
                    <TableCell>Rs. {user.balance}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-red-600 font-medium">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>{user.machine_code}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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

export default AllCorporatesUsers
