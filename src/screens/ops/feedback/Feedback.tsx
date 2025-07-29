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
    IconShield,
    IconSettings,
    IconChevronLeft,
    IconChevronRight,
    IconMessage,
    IconChevronsLeft,
    IconChevronsRight
} from "@tabler/icons-react"
import { toast } from "sonner"
import moment from "moment"
import { getRequest } from "@/Apis/Api"
import { SiteHeader } from "@/components/ops/site-header"

// Types
interface FeedbackItem {
    id: number
    name: string | null
    phone_number: string
    error_message: string
    epoch_time: number
}

interface AppFeedbackResponse {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    appFeedback: FeedbackItem[]
}

const Feedback = () => {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")

    // pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
    })

    const fetchFeedback = async (page = 1, limit = 10) => {
        try {
            setLoading(true)
            const res = await getRequest<AppFeedbackResponse>(`/Ops/getAllAppFeedbacks?page=${page}&limit=${limit}`)
            setFeedback(res.appFeedback)
            setTotalCount(res.totalCount)
            setPagination({
                currentPage: res.page,
                totalPages: res.totalPages,
                totalCount: res.totalCount,
                limit: res.limit,
            })
        } catch (error) {
            toast.error("Failed to fetch feedback")
            setFeedback([])
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                limit: 10,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeedback();
    }, [])


    const getCategory = (message: string): string => {
        const msg = message.toLowerCase()
        if (msg.includes("technical") || msg.includes("error")) return "technical"
        if (msg.includes("register") || msg.includes("number")) return "registration"
        if (msg.includes("privacy")) return "privacy"
        if (msg.includes("notification")) return "notifications"
        if (msg.includes("account")) return "account"
        return "other"
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "technical":
                return <IconBug className="h-3 w-3" />
            case "registration":
                return <IconUsers className="h-3 w-3" />
            case "privacy":
                return <IconShield className="h-3 w-3" />
            case "notifications":
                return <IconSettings className="h-3 w-3" />
            case "account":
                return <IconUsers className="h-3 w-3" />
            default:
                return <IconMessage className="h-3 w-3" />
        }
    }

    const getCategoryBadge = (category: string) => {
        const colors = {
            technical: "bg-red-100 text-red-800",
            registration: "bg-blue-100 text-blue-800",
            privacy: "bg-purple-100 text-purple-800",
            notifications: "bg-yellow-100 text-yellow-800",
            account: "bg-green-100 text-green-800",
            other: "bg-gray-100 text-gray-800",
        }
        return (
            <Badge variant="outline" className={`${colors[category as keyof typeof colors]} flex items-center gap-1`}>
                {getCategoryIcon(category)}
                {category}
            </Badge>
        )
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
            fetchFeedback(newPage, pagination.limit)
        }
    }

    // Handle page size changes
    const handlePageSizeChange = (newLimit: string) => {
        const limit = Number.parseInt(newLimit)
        setPagination((prev) => ({ ...prev, limit }))
        fetchFeedback(1, limit)
    }

    const totalFeedback = totalCount
    const technicalIssues = feedback.filter((f) => getCategory(f.error_message) === "technical").length
    const registrationIssues = feedback.filter((f) => getCategory(f.error_message) === "registration").length
    const uniqueUsers = new Set(feedback.map((f) => f.phone_number)).size

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
                            <div className="text-2xl font-bold text-red-600">{technicalIssues}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Registration Issues</CardTitle>
                            <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{registrationIssues}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Unique Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{uniqueUsers}</div>
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
                                    }}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                {["all", "technical", "registration"].map((cat) => (
                                    <Button
                                        key={cat}
                                        variant={categoryFilter === cat ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setCategoryFilter(cat)
                                        }}
                                        className={categoryFilter === cat ? "bg-teal-600 hover:bg-teal-700" : ""}
                                    >
                                        {cat === "technical" ? (
                                            <IconBug className="mr-1 h-3 w-3" />
                                        ) : cat === "registration" ? (
                                            <IconUsers className="mr-1 h-3 w-3" />
                                        ) : (
                                            "All"
                                        )}
                                        {cat !== "all" && cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Created at</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Category</TableHead>
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
                                                <TableCell>{getCategoryBadge(getCategory(entry.error_message))}</TableCell>
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
                            <div className="flex items-center justify-between px-4 py-4">
                                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                    Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} users
                                </div>
                                <div className="flex w-full items-center gap-8 lg:w-fit">
                                    <div className="hidden items-center gap-2 lg:flex">
                                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                            Rows per page
                                        </Label>
                                        <Select value={`${pagination.limit}`} onValueChange={handlePageSizeChange}>
                                            <SelectTrigger className="w-20" id="rows-per-page">
                                                <SelectValue placeholder={pagination.limit} />
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
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                        <Button
                                            variant="outline"
                                            className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                                            onClick={() => handlePageChange(1)}
                                            disabled={pagination.currentPage === 1 || loading}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <IconChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1 || loading}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <IconChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8 bg-transparent"
                                            size="icon"
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                        >
                                            <span className="sr-only">Go to next page</span>
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex bg-transparent"
                                            size="icon"
                                            onClick={() => handlePageChange(pagination.totalPages)}
                                            disabled={pagination.currentPage === pagination.totalPages || loading}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <IconChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Feedback
