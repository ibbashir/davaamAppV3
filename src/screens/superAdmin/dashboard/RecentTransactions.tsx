import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

import { getRequest } from "@/Apis/Api"
import type { ApiTransaction, ButterflyApiResponse, OtherApiResponse, Transactions } from "@/Types/SuperAdmin/RecentTransactions"
import { categories, paymentTypes } from "@/constants/Constant"

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

    const fetchLatestTransactions = async (page = 1) => {
        try {
            setLoading(true)

            if (activeCategory === "butterfly") {
                const res = await getRequest<ButterflyApiResponse>(
                    `/superadmin/getAllButterflyTransactions/${activeCategory}?page=${page}`,
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
                    `/superadmin/getAllButterflyTransactions/${activeCategory}?page=${page}`,
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

    const searchTransactions = async (searchQuery: string, page = 1) => {
        if (!searchQuery.trim()) {
            setIsSearching(false)
            fetchLatestTransactions(page)
            return
        }

        try {
            setLoading(true)
            setIsSearching(true)

            if (activeCategory === "butterfly") {
                const res = await getRequest<ButterflyApiResponse>(
                    `/superadmin/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}`,
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
                    `/superadmin/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}`,
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
                searchTransactions(searchTerm, currentPage)
            } else {
                fetchLatestTransactions(currentPage)
            }
        }

        loadData()
    }, [activeCategory, currentPage, activePaymentType])

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
            searchTransactions(searchTerm, 1)
        } else {
            setIsSearching(false)
            fetchLatestTransactions(1)
        }
    }

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)

        // If search is cleared, fetch all transactions
        if (!value.trim()) {
            setIsSearching(false)
            setCurrentPage(1)
            fetchLatestTransactions(1)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePaymentTypeChange = (paymentType: string) => {
        setActivePaymentType(paymentType)
        setCurrentPage(1) // Reset to first page when changing payment type
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
                                <TableHead>Date</TableHead>
                                <TableHead>Phone Number / RFID</TableHead>
                                <TableHead>Machine Code</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Brand Name</TableHead>
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
                                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono text-sm">{transaction.msisdn}</TableCell>
                                        <TableCell className="font-medium text-blue-600">{transaction.machine_code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Rs. {transaction.amount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{transaction.quantity}</TableCell>
                                        <TableCell className="font-medium">{transaction.brand_name}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages} ({totalCount} total transactions)
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className={currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700" : ""}
                                                disabled={loading}
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
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
