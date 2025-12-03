import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { getRequest } from "@/Apis/Api"
import type { ApiTransaction, ButterflyApiResponse, OtherApiResponse, Transactions } from "@/Types/SuperAdmin/RecentTransactions"
import { categories, paymentTypes } from "@/constants/Constant"
import moment from "moment-timezone"

const RecentTransactions = () => {
    const [activeCategory, setActiveCategory] = useState("butterfly")
    const [activePaymentType, setActivePaymentType] = useState("online")
    const [recentTransactions, setRecentTransactions] = useState<ApiTransaction[]>([])
    const [loading, setLoading] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [pageSize, setPageSize] = useState(10)

    const fetchLatestTransactions = async (page = 1, size = pageSize) => {
        try {
            setLoading(true)

            if (activeCategory === "butterfly") {
                const res = await getRequest<ButterflyApiResponse>(
                    `/fulfillment/getAllButterflyTransactions/${activeCategory}?page=${page}&limit=${size}`,
                )

                // Combine both cash and online transactions with payment type info
                const cashTransactions = res.data.cashTransactions.map((t) => ({
                    ...t,
                    paymentType: "cash" as const,
                }))
                const onlineTransactions = res.data.onlineTransactions.map((t) => ({
                    ...t,
                    paymentType: "online" as const,
                }))

                setRecentTransactions([...onlineTransactions, ...cashTransactions])
                setTotalCount(res.totalCount)
                // For butterfly, we need to calculate total pages based on payment type
                if (activePaymentType === "cash") {
                    setTotalPages(res.totalCashPages)
                } else {
                    setTotalPages(res.totalOnlinePages)
                }
            } else {
                const res = await getRequest<OtherApiResponse>(
                    `/fulfillment/getAllButterflyTransactions/${activeCategory}?page=${page}&limit=${size}`,
                )

                // For other categories, add a default payment type
                const transactionsWithPaymentType = res.data.map((t) => ({
                    ...t,
                    paymentType: "online" as const, // Default for non-butterfly categories
                }))

                setRecentTransactions(transactionsWithPaymentType)
                setTotalCount(res.totalCount)
                setTotalPages(res.totalPages)
            }
        } catch (error) {
            console.error("Error fetching transactions:", error)
            setRecentTransactions([])
            setTotalCount(0)
            setTotalPages(0)
        } finally {
            setLoading(false)
        }
    }

    const searchTransactions = async (searchQuery: string, page = 1, size = pageSize) => {
        if (!searchQuery.trim()) {
            setIsSearching(false)
            fetchLatestTransactions(page, size)
            return
        }

        try {
            setLoading(true)
            setIsSearching(true)

            if (activeCategory === "butterfly") {
                const res = await getRequest<ButterflyApiResponse>(
                    `/fulfillment/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}&limit=${size}`,
                )

                // Combine both cash and online transactions with payment type info
                const cashTransactions = res.data.cashTransactions.map((t) => ({
                    ...t,
                    paymentType: "cash" as const,
                }))
                const onlineTransactions = res.data.onlineTransactions.map((t) => ({
                    ...t,
                    paymentType: "online" as const,
                }))

                setRecentTransactions([...onlineTransactions, ...cashTransactions])
                setTotalCount(res.totalCount)
                if (activePaymentType === "cash") {
                    setTotalPages(res.totalCashPages)
                } else {
                    setTotalPages(res.totalOnlinePages)
                }
            } else {
                const res = await getRequest<OtherApiResponse>(
                    `/fulfillment/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}&limit=${size}`,
                )

                const transactionsWithPaymentType = res.data.map((t) => ({
                    ...t,
                    paymentType: "online" as const,
                }))

                setRecentTransactions(transactionsWithPaymentType)
                setTotalCount(res.totalCount)
                setTotalPages(res.totalPages)
            }
        } catch (error) {
            console.error("Error searching transactions:", error)
            setRecentTransactions([])
            setTotalCount(0)
            setTotalPages(0)
        } finally {
            setLoading(false)
        }
    }

    // Filter transactions based on selected filters
    const filteredTransactions = recentTransactions.filter((transaction) => {
        if (activeCategory === "butterfly") {
            return (transaction as Transactions).paymentType === activePaymentType
        }
        return true // For other categories, show all transactions
    })

    // Get counts for payment types (only for butterfly)
    const getPaymentTypeCount = (paymentType: string) => {
        if (activeCategory !== "butterfly") return 0
        return recentTransactions.filter((t: Transactions) => t.paymentType === paymentType).length
    }

    useEffect(() => {
        const loadData = () => {
            if (searchTerm.trim()) {
                searchTransactions(searchTerm, currentPage, pageSize)
            } else {
                fetchLatestTransactions(currentPage, pageSize)
            }
        }

        loadData()
    }, [activeCategory, currentPage, activePaymentType, pageSize])

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId)
        setCurrentPage(1)
        setSearchTerm("") // Clear search when changing category
        setIsSearching(false)
        if (categoryId === "butterfly") {
            setActivePaymentType("online") // Reset to online when switching to butterfly
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        if (searchTerm.trim()) {
            searchTransactions(searchTerm, 1, pageSize)
        } else {
            setIsSearching(false)
            fetchLatestTransactions(1, pageSize)
        }
    }

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)

        // If search is cleared, fetch all transactions
        if (!value.trim()) {
            setIsSearching(false)
            setCurrentPage(1)
            fetchLatestTransactions(1, pageSize)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePaymentTypeChange = (paymentType: string) => {
        setActivePaymentType(paymentType)
        setCurrentPage(1) // Reset to first page when changing payment type
    }

    const handlePageSizeChange = (size: string) => {
        const newSize = Number(size)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when changing page size
    }

    return (
        <div className="space-y-6 p-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Recent Transactions ({totalCount})</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by phone number, user name, or machine code..."
                                value={searchTerm}
                                onChange={handleSearchInputChange}
                                className="pl-10"
                            />
                        </form>

                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <Button
                                    key={category.id}
                                    variant={activeCategory === category.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryChange(category.id)}
                                    className={activeCategory === category.id ? "bg-teal-600 hover:bg-teal-700" : ""}
                                >
                                    {category.label}
                                </Button>
                            ))}
                        </div>

                        {/* Payment Type Filters - Only show for Butterfly category */}
                        {activeCategory === "butterfly" && (
                            <div className="flex flex-wrap gap-2">
                                {paymentTypes.map((paymentType) => (
                                    <Button
                                        key={paymentType.id}
                                        variant={activePaymentType === paymentType.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePaymentTypeChange(paymentType.id)}
                                        className={activePaymentType === paymentType.id ? "bg-teal-600 hover:bg-teal-700" : ""}
                                    >
                                        {paymentType.label} ({getPaymentTypeCount(paymentType.id)})
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Name</TableHead>
                                <TableHead>Phone Number / RFID</TableHead>
                                <TableHead>Machine Code</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Brand Name</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        {isSearching
                                            ? "No transactions found for your search."
                                            : "No transactions found for the selected filters."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">{transaction.user_name || transaction.merchant || "N/A"}</TableCell>
                                        <TableCell className="font-mono text-sm">{transaction.msisdn}</TableCell>
                                        <TableCell className="font-medium text-blue-600">{transaction.machine_code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Rs. {transaction.amount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{transaction.quantity}</TableCell>
                                        <TableCell className="font-medium">{transaction.brand_name}</TableCell>
                                        <TableCell>{moment(transaction.created_at).format('dddd HH:MM A YYYY')}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 mt-4">
                            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                Showing {filteredTransactions.length} of {totalCount} transaction(s)
                            </div>
                            <div className="flex w-full items-center gap-8 lg:w-fit">
                                <div className="hidden items-center gap-2 lg:flex">
                                    <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                        Rows per page
                                    </Label>
                                    <Select
                                        value={`${pageSize}`}
                                        onValueChange={handlePageSizeChange}
                                    >
                                        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                            <SelectValue placeholder={pageSize} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 40, 50].map((pageSize) => (
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
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1 || loading}
                                    >
                                        <span className="sr-only">Go to first page</span>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                    >
                                        <span className="sr-only">Go to previous page</span>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || loading}
                                    >
                                        <span className="sr-only">Go to next page</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="hidden size-8 lg:flex bg-transparent"
                                        size="icon"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages || loading}
                                    >
                                        <span className="sr-only">Go to last page</span>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {filteredTransactions.length > 0 && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            {isSearching && `Search results for "${searchTerm}" - `}
                            Showing {filteredTransactions.length} transactions for{" "}
                            {categories.find((c) => c.id === activeCategory)?.label}
                            {activeCategory === "butterfly" && ` - ${paymentTypes.find((p) => p.id === activePaymentType)?.label}`}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default RecentTransactions