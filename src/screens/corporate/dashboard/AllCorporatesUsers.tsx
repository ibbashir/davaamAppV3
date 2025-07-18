"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"
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

function getPaginationRange(current: number, total: number): (number | "...")[] {
    const delta = 1 // how many numbers to show beside current
    const range: (number | "...")[] = []

    const left = Math.max(2, current - delta)
    const right = Math.min(total - 1, current + delta)

    range.push(1) // always show first page

    if (left > 2) {
        range.push("...")
    }

    for (let i = left; i <= right; i++) {
        range.push(i)
    }

    if (right < total - 1) {
        range.push("...")
    }

    if (total > 1) {
        range.push(total)
    }

    return range
}


const AllCorporatesUsers = () => {
    const [users, setUsers] = useState<CorporateUser[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [usersPerPage] = useState(10)

    const fetchCorporateUsers = async () => {
        setLoading(true)
        try {
            const storedCodes = localStorage.getItem("machines")
            const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

            const res = await postRequest<{ data: CorporateUser[] }>("/corporates/getAllCorporatesUsers", {
                machine_code: machineCodes,
            })
            setUsers(res.data)
        } catch (err) {
            console.error("Error fetching corporate users:", err)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCorporateUsers()
    }, [])

    // Get current users for the page
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser)

    // Calculate total pages
    const totalPages = Math.ceil(users.length / usersPerPage)

    // Change page
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">All Corporate Users</h2>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                            ) : currentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentUsers.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{indexOfFirstUser + index + 1}</TableCell>
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
                                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); prevPage(); }} />
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
                                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); nextPage(); }} />
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
