"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    IconSearch,
    IconDownload,
    IconArrowRight,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
} from "@tabler/icons-react"
import moment from "moment-timezone"

interface PointsShareData {
    id: number
    amount: string
    created_at: string
    user_i: number
    status: string
    msisdn: string
    transaction_number: string
    alternate_msisdn: string
    user_name: string
    alternate_name: string
}

interface PointsShareTableProps {
    tableData: PointsShareData[]
}

function PointsShareTable({ tableData }: PointsShareTableProps) {
    const [searchTerm, setSearchTerm] = useState("")

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Reset to first page when search term changes
    useState(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Memoized filtered and paginated data
    const { filteredData, paginatedData, totalPages, totalItems } = useMemo(() => {
        // Enhanced search functionality
        const filtered = searchTerm
            ? tableData.filter((item: PointsShareData) => {
                const search = searchTerm.toLowerCase()
                return (
                    item.msisdn.toLowerCase().includes(search) ||
                    item.alternate_msisdn.toLowerCase().includes(search) ||
                    item.user_name.toLowerCase().includes(search) ||
                    item.alternate_name.toLowerCase().includes(search) ||
                    item.transaction_number.toLowerCase().includes(search) ||
                    item.id.toString().includes(search) ||
                    item.status.toLowerCase().includes(search)
                )
            })
            : tableData

        const total = Math.ceil(filtered.length / itemsPerPage)
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginated = filtered.slice(startIndex, endIndex)

        return {
            filteredData: filtered,
            paginatedData: paginated,
            totalPages: total,
            totalItems: filtered.length,
        }
    }, [tableData, searchTerm, currentPage, itemsPerPage])

    const getStatusBadge = (status: string) => {
        const variant =
            status.toLowerCase() === "completed"
                ? "default"
                : status.toLowerCase() === "pending"
                    ? "secondary"
                    : status.toLowerCase() === "failed"
                        ? "destructive"
                        : "outline"
        return <Badge variant={variant}>{status}</Badge>
    }

    // Pagination handlers
    const goToFirstPage = () => setCurrentPage(1)
    const goToLastPage = () => setCurrentPage(totalPages)
    const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1))
    const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1))
    const goToPage = (page: number) => setCurrentPage(page)

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, "...")
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages)
        } else {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    const formatCurrency = (amount: string) => {
        return `$${Number.parseFloat(amount).toFixed(2)}`
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">Points Share</CardTitle>
                            <CardDescription className="mt-2 text-sm text-gray-700">
                                A list of all Points Share between Users
                            </CardDescription>
                        </div>
                        <Button variant="outline" className="hidden sm:flex bg-transparent">
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export as CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by phone number, name, transaction ID, or status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value))
                                    setCurrentPage(1)
                                }}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-center font-semibold">Transfer Names</TableHead>
                                    <TableHead className="text-center font-semibold">Transfer Phone</TableHead>
                                    <TableHead className="text-center font-semibold">Amount</TableHead>
                                    <TableHead className="text-center font-semibold">Transfer Date</TableHead>
                                    <TableHead className="text-center font-semibold">Transaction ID</TableHead>
                                    <TableHead className="text-center font-semibold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((item: PointsShareData) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-medium">{item.alternate_name}</span>
                                                    <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span>{item.user_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-medium font-mono">{item.msisdn}</span>
                                                    <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-mono">{item.alternate_msisdn}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-green-600">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {moment(item.created_at).tz("Etc/GMT-0").format("MMM DD, YYYY h:mm A")}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-sm">{item.transaction_number}</TableCell>
                                            <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {searchTerm ? "No results found for your search." : "No data available."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                                {totalItems} entries
                                {searchTerm && ` (filtered from ${tableData.length} total entries)`}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                                    <IconChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                                    <IconChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {getPageNumbers().map((pageNumber, index) => (
                                        <Button
                                            key={index}
                                            variant={pageNumber === currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => typeof pageNumber === "number" && goToPage(pageNumber)}
                                            disabled={pageNumber === "..."}
                                            className="min-w-[40px]"
                                        >
                                            {pageNumber}
                                        </Button>
                                    ))}
                                </div>

                                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                                    <IconChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                                    <IconChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Summary when no pagination needed or mobile export button */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {totalPages <= 1 && totalItems > 0 && (
                            <span>
                                Showing {totalItems} of {tableData.length} entries
                                {searchTerm && ` (filtered by "${searchTerm}")`}
                            </span>
                        )}
                        <Button variant="outline" size="sm" className="sm:hidden bg-transparent ml-auto">
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default PointsShareTable
