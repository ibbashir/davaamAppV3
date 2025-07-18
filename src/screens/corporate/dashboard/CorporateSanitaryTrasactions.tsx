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

function getPaginationRange(current: number, total: number): (number | "...")[] {
    const delta = 1 // how many pages to show on each side of current
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
        range.push(total) // always show last page
    }

    return range
}


const SanitaryTransactionTable = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    const fetchTransactions = async () => {
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

            const res = await postRequest<{ data: Transaction[] }>(
                "corporates/getAllCorporateSanitaryTrasactions",
                { machine_code: machineCodes }
            )

            setTransactions(res.data)
        } catch (err) {
            console.error("Error fetching sanitary transactions:", err)
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = transactions.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(transactions.length / itemsPerPage)

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
    const nextPage = () => currentPage < totalPages && setCurrentPage(prev => prev + 1)
    const prevPage = () => currentPage > 1 && setCurrentPage(prev => prev - 1)

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">Corporate Sanitary Transactions</h2>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                            ) : currentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No data found</TableCell>
                                </TableRow>
                            ) : (
                                currentItems.map((t, index) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{indexOfFirstItem + index + 1}</TableCell>
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

                {/* Pagination UI */}
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

export default SanitaryTransactionTable
