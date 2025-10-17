"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    IconSearch,
    IconDownload,
    IconMessageCircle,
    IconUsers,
    IconClock,
    IconPhone,
    IconAlertTriangle,
    IconBug,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconMessage,
} from "@tabler/icons-react"
import moment from "moment"
import { getRequest } from "@/Apis/Api"
import { SiteHeader } from "@/components/superAdmin/site-header"

// Types
type AppFeedback = {
    phone_number: string
    error_message: string
    issue_type: string
    epoch_time: number
    id: number
    name: string | null
}

type AppFeedbackApiResponse = {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    technical_issue: string
    general_issue: string
    appFeedback: AppFeedback[]
}

const Feedback = () => {
    const [feedback, setFeedback] = useState<AppFeedback[]>([])
    const [generalIssue, setGeneralIssue] = useState<string>("")
    const [technicalIssue, setTechnicalIssue] = useState<string>("")
    const [totalCount, setTotalCount] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const getFeedback = async () => {
            // Construct query parameters for pagination and filtering
            const params = new URLSearchParams()
            params.append("page", currentPage.toString())
            params.append("limit", itemsPerPage.toString())

            if (searchTerm) {
                params.append("search", searchTerm)
            }

            const queryString = params.toString()
            const url = `/superadmin/getAllAppFeedbacks${queryString ? `?${queryString}` : ""}`

            try {
                const res = await getRequest<AppFeedbackApiResponse>(url)
                setFeedback(res.appFeedback)
                setTotalCount(res.totalCount)
                setTotalPages(res.totalPages)
                setGeneralIssue(res.general_issue)
                setTechnicalIssue(res.technical_issue)
            } catch (error) {
                console.error("Failed to fetch feedback:", error)
                // Handle error, e.g., set feedback to empty array, show error message
                setFeedback([])
                setTotalCount(0)
                setTotalPages(1)
            }
        }
        getFeedback()
    }, [currentPage, searchTerm, itemsPerPage]) // Re-fetch when these dependencies change

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Technical":
                return <IconBug className="h-3 w-3" />
            case "General":
                return <IconUsers className="h-3 w-3" />
            default:
                return <IconMessage className="h-3 w-3" />
        }
    }

    const getCategoryBadge = (category: string) => {
        const colors = {
            Technical: "bg-red-100 text-red-800",
            General: "bg-blue-100 text-blue-800",
        }
        return (
            <Badge variant="outline" className={`${colors[category as keyof typeof colors]} flex items-center gap-1`}>
                {getCategoryIcon(category)}
                {category}
            </Badge>
        )
    }

    const totalFeedback = totalCount 

    return (
        <div>
            <SiteHeader title='Feedback' />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">User feedback and issues reported through the mobile application</p>
                    <Button onClick={() => console.log("Export CSV")}>
                        {" "}
                        <IconDownload className="mr-2 h-4 w-4" /> Export CSV{" "}
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Total Feedback</CardTitle>
                            <IconMessageCircle className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalFeedback}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Technical Issues</CardTitle>
                            <IconBug className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{technicalIssue}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">General Issues</CardTitle>
                            <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{generalIssue}</div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle>Feedback Entries</CardTitle>
                                <CardDescription>All user feedback and reported issues</CardDescription>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="relative flex-1">
                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search feedback by name, message, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border overflow-hidden">
                            <Table>
                                <TableHeader>
                                <TableRow className="bg-teal-600 text-white hover:bg-teal-700">
                                    <TableHead className="text-center font-semibold text-white border-none">
                                    Name
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-white border-none">
                                    Message
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-white border-none">
                                    Created at
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-white border-none">
                                    Phone
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-white border-none">
                                    Category
                                    </TableHead>
                                </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {feedback.length > 0 ? (
                                        feedback.map((entry) => (
                                            <TableRow key={entry.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    {entry.name || <span className="italic text-muted-foreground">Anonymous</span>}
                                                </TableCell>
                                                <TableCell className="max-w-md truncate" title={entry.error_message}>
                                                    {entry.error_message}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <IconClock className="h-3 w-3" />
                                                        {moment.unix(entry.epoch_time).format("ddd, MMM D, YYYY h:mm A")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <IconPhone className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-mono">{entry.phone_number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getCategoryBadge(entry.issue_type)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No feedback entries found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalCount > 0 && ( 
                            <div className="flex items-center justify-between px-4 mt-4">
                                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                    Showing {feedback.length} of {totalCount} feedback entries
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
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <IconChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <IconChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="sr-only">Go to next page</span>
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex bg-transparent"
                                            size="icon"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <IconChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Feedback