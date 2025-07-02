"use client"

import { SiteHeader } from '@/components/site-header'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
} from "@tabler/icons-react"
import moment from "moment"

interface FeedbackEntry {
    id: string
    name: string
    message: string
    createdAt: string
    phone: string
    category?: string
}

const mockFeedback: FeedbackEntry[] = [
    {
        id: "1",
        name: "",
        message: "i enter my number for registration it says error occurred",
        createdAt: "1970-01-21T01:04:00Z",
        phone: "03361890702",
        category: "registration",
    },
    {
        id: "2",
        name: "Hassab",
        message: "Something was broken",
        createdAt: "1970-01-21T01:01:00Z",
        phone: "03212990048",
        category: "technical",
    },
    {
        id: "3",
        name: "Hassab",
        message: "Technical issues",
        createdAt: "1970-01-21T01:01:00Z",
        phone: "03212990048",
        category: "technical",
    },
    {
        id: "4",
        name: "Hassab",
        message: "Too many notifications",
        createdAt: "1970-01-21T12:51:00Z",
        phone: "03212990048",
        category: "notifications",
    },
    {
        id: "5",
        name: "Fatima",
        message: "Incorrect number before",
        createdAt: "1970-01-21T12:42:00Z",
        phone: "03214287706",
        category: "account",
    },
    {
        id: "6",
        name: "",
        message: "Internal server error",
        createdAt: "1970-01-21T12:41:00Z",
        phone: "03363641111",
        category: "technical",
    },
    {
        id: "7",
        name: "",
        message: "Its says an error occur and cant creat an account",
        createdAt: "1970-01-21T12:38:00Z",
        phone: "03376112835",
        category: "registration",
    },
    {
        id: "8",
        name: "Hassab",
        message: "Privacy concerns",
        createdAt: "1970-01-21T12:33:00Z",
        phone: "03212990048",
        category: "privacy",
    },
    {
        id: "9",
        name: "Hassab",
        message: "Skdjhkajsduasgduagsduygyasudgasd",
        createdAt: "1970-01-21T12:33:00Z",
        phone: "03212990048",
        category: "other",
    },
    {
        id: "10",
        name: "Adnan Ali",
        message: "Technical issues",
        createdAt: "1970-01-21T12:33:00Z",
        phone: "03403161451",
        category: "technical",
    },
]

const ITEMS_PER_PAGE = 10

const Feedback = () => {
    const [feedback, setFeedback] = useState<FeedbackEntry[]>(mockFeedback)
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)

    const filteredFeedback = feedback.filter((entry) => {
        const matchesSearch =
            entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.phone.includes(searchTerm)
        const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    // Add pagination calculations
    const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex)

    // Reset to first page when filters change
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleCategoryChange = (category: string) => {
        setCategoryFilter(category)
        setCurrentPage(1)
    }

    const goToPage = (page: number) => {
        setCurrentPage(page)
    }

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }

    const handleExportCSV = () => {
        console.log("Exporting feedback CSV...")
        // CSV export logic would go here
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
                return <IconMessageCircle className="h-3 w-3" />
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

    const totalFeedback = feedback.length
    const technicalIssues = feedback.filter((f) => f.category === "technical").length
    const registrationIssues = feedback.filter((f) => f.category === "registration").length
    const uniqueUsers = new Set(feedback.map((f) => f.phone)).size

    return (
        <div>
            <SiteHeader title='Feedback' />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground">User feedback and issues reported through the mobile application</p>
                    </div>
                    <Button onClick={handleExportCSV} className="bg-teal-600 hover:bg-teal-700">
                        <IconDownload className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                            <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalFeedback}</div>
                            <p className="text-xs text-muted-foreground">All feedback entries</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Technical Issues</CardTitle>
                            <IconBug className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{technicalIssues}</div>
                            <p className="text-xs text-muted-foreground">Require attention</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Registration Issues</CardTitle>
                            <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{registrationIssues}</div>
                            <p className="text-xs text-muted-foreground">Account creation problems</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{uniqueUsers}</div>
                            <p className="text-xs text-muted-foreground">Provided feedback</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
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
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={categoryFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryChange("all")}
                                    className={categoryFilter === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={categoryFilter === "technical" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryChange("technical")}
                                    className={categoryFilter === "technical" ? "bg-red-600 hover:bg-red-700" : ""}
                                >
                                    <IconBug className="mr-1 h-3 w-3" />
                                    Technical
                                </Button>
                                <Button
                                    variant={categoryFilter === "registration" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryChange("registration")}
                                    className={categoryFilter === "registration" ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                    <IconUsers className="mr-1 h-3 w-3" />
                                    Registration
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Name</TableHead>
                                        <TableHead className="font-semibold">Message</TableHead>
                                        <TableHead className="font-semibold">Created at</TableHead>
                                        <TableHead className="font-semibold">Phone</TableHead>
                                        <TableHead className="font-semibold">Category</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedFeedback.length > 0 ? (
                                        paginatedFeedback.map((entry, index) => (
                                            <TableRow key={`${entry.id}-${index}`} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    {entry.name || <span className="text-muted-foreground italic">Anonymous</span>}
                                                </TableCell>
                                                <TableCell className="max-w-md">
                                                    <div className="truncate" title={entry.message}>
                                                        {entry.message}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <IconClock className="h-3 w-3" />
                                                        {moment(entry.createdAt).format("ddd, MMM D, YYYY h:mm A")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <IconPhone className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-mono">{entry.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{entry.category && getCategoryBadge(entry.category)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {searchTerm || categoryFilter !== "all"
                                                    ? "No feedback entries found matching your criteria."
                                                    : "No feedback entries available."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredFeedback.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredFeedback.length)} of {filteredFeedback.length}{" "}
                                    feedback entries
                                    {(searchTerm || categoryFilter !== "all") && " (filtered)"}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className="h-8 w-8 p-0 bg-transparent"
                                        >
                                            <IconChevronLeft className="h-4 w-4" />
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => goToPage(page)}
                                                            className={`h-8 w-8 p-0 ${currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                                                        >
                                                            {page}
                                                        </Button>
                                                    )
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return (
                                                        <span key={page} className="px-1 text-muted-foreground">
                                                            ...
                                                        </span>
                                                    )
                                                }
                                                return null
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className="h-8 w-8 p-0 bg-transparent"
                                        >
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Feedback
