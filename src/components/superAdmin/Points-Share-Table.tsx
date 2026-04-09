import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
    const { paginatedData, totalPages, totalItems } = useMemo(() => {
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

    const formatCurrency = (amount: string) => {
        return `Rs: ${Number.parseFloat(amount).toFixed(2)}`
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
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
                    </div>

                    
                    <div className="rounded-2xl border overflow-hidden shadow-sm">
                    <Table className="border-collapse">
                        <TableHeader className="text-white">
                        <TableRow className="bg-teal-600 hover:bg-teal-600 text-white">
                            <TableHead className="text-center font-semibold text-white rounded-tl-2xl">
                            Transfer Names
                            </TableHead>
                            <TableHead className="text-center font-semibold text-white">
                            Transfer Phone
                            </TableHead>
                            <TableHead className="text-center font-semibold text-white">
                            Amount
                            </TableHead>
                            <TableHead className="text-center font-semibold text-white">
                            Transfer Date
                            </TableHead>
                            <TableHead className="text-center font-semibold text-white">
                            Transaction ID
                            </TableHead>
                            <TableHead className="text-center font-semibold text-white rounded-tr-2xl">
                            Status
                            </TableHead>
                        </TableRow>
                        </TableHeader>

                        <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item: PointsShareData) => (
                            <TableRow
                                key={item.id}
                                className="hover:bg-muted/50 transition-colors"
                            >
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
                                {moment(item.created_at)
                                    .tz("Etc/GMT-0")
                                    .format("MMM DD, YYYY h:mm A")}
                                </TableCell>

                                <TableCell className="text-center font-mono text-sm">
                                {item.transaction_number}
                                </TableCell>

                                <TableCell className="text-center">
                                {getStatusBadge(item.status)}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                            >
                                {searchTerm
                                ? "No results found for your search."
                                : "No data available."}
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>


                    {/* Updated Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4">
                            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                Showing {paginatedData.length} of {totalItems} transaction(s)
                                {searchTerm && ` (filtered from ${tableData.length} total entries)`}
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
                                    <Button
                                        variant="outline"
                                        className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                                        onClick={goToFirstPage}
                                        disabled={currentPage === 1}
                                    >
                                        <span className="sr-only">Go to first page</span>
                                        <IconChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                    >
                                        <span className="sr-only">Go to previous page</span>
                                        <IconChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <span className="sr-only">Go to next page</span>
                                        <IconChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="hidden size-8 lg:flex bg-transparent"
                                        size="icon"
                                        onClick={goToLastPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <span className="sr-only">Go to last page</span>
                                        <IconChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
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