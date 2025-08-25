"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Phone,
    CreditCard,
    History,
    Wallet,
    Search,
    Download,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"
import moment from "moment"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { getRequest, postRequest } from "@/Apis/Api"

// Validation schemas
const phoneTopupSchema = z.object({
    phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(/^03\d{9}$/, "Phone number must be in format 03XXXXXXXXX"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .refine((val) => {
            const num = Number.parseFloat(val)
            return num >= 1 && num <= 30000
        }, "Amount must be between 1 and 30,000"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
})

const cardTopupSchema = z.object({
    cardNumber: z
        .string()
        .min(1, "Card number is required")
        .transform((val) => val.replace(/\s/g, "")),
    amount: z
        .string()
        .min(1, "Amount is required")
        .refine((val) => {
            const num = Number.parseFloat(val)
            return num >= 1 && num <= 30000
        }, "Amount must be between 1 and 30,000"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
})

type PhoneTopupFormData = z.infer<typeof phoneTopupSchema>
type CardTopupFormData = z.infer<typeof cardTopupSchema>

interface Topup {
  id: number
  user_id: number
  msisdn: string
  balance_added: string
  previous_balance: string
  total_balance: string
  created_at: string
  description: string | null
  user_email: string | null
  name: string
}

interface ApiResponse {
  status: number
  activeUsers: number
  totalCount: number
  totalBalance: number
  topupBalance: Topup[]
}


export function Topup() {
    const [searchTerm, setSearchTerm] = useState("")
  const [topupHistory, setTopupHistory] = useState<Topup[]>([])
  const [stats, setStats] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState(true)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const fetchTopupHistory = async () => {
        try {
            setLoading(true)
            const res = await getRequest<ApiResponse>("/superadmin/getTopUpHistory")
            setStats(res)
            setTopupHistory(res.topupBalance || [])

        } catch (err) {
            console.log(err)
            setTopupHistory([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTopupHistory()
    }, [])

    // Reset to first page when search term changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Phone topup form
    const phoneForm = useForm<PhoneTopupFormData>({
        resolver: zodResolver(phoneTopupSchema),
        defaultValues: {
            phoneNumber: "",
            amount: "",
            description: "",
        },
    })

    // Card topup form
    const cardForm = useForm<CardTopupFormData>({
        resolver: zodResolver(cardTopupSchema),
        defaultValues: {
            cardNumber: "",
            amount: "",
            description: "",
        },
    })

    // Memoized filtered and paginated data
    const { paginatedHistory, totalPages, totalItems } = useMemo(() => {
        const filtered = topupHistory.filter(
            (item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.msisdn.includes(searchTerm) ||
                (item.user_email && item.user_email.toLowerCase().includes(searchTerm.toLowerCase())),
        )

        const total = Math.ceil(filtered.length / itemsPerPage)
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginated = filtered.slice(startIndex, endIndex)

        return {
            filteredHistory: filtered,
            paginatedHistory: paginated,
            totalPages: total,
            totalItems: filtered.length,
        }
    }, [topupHistory, searchTerm, currentPage, itemsPerPage])

    const onPhoneTopupSubmit = async (data: PhoneTopupFormData) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            await postRequest("/superadmin/topupUsers/phone", data);
        } catch (error) {
            console.error("Phone topup error:", error)
        } finally {
            phoneForm.reset()
        }
    }

    const handlePhoneReset = async (data: PhoneTopupFormData) => {
        if (!data.phoneNumber) {
            alert("Phone Number Missing")
            return;
        }
        try {
            await postRequest("/superadmin/topupUsersResetZero/phone", { phoneNumber: data.phoneNumber });
        } catch (error) {
            console.error(error);
        } finally {
            phoneForm.reset()
        }
    }

    const onCardTopupSubmit = async (data: CardTopupFormData) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            await postRequest("/superadmin/topupUsers/card", data)
        } catch (error) {
            console.error("Card topup error:", error)
        } finally {
            cardForm.reset()
        }
    }

    const handleCardReset = async (data: CardTopupFormData) => {
        if (!data.cardNumber) {
            alert("Card Number Missing")
            return;
        }
        try {
            await postRequest("/superadmin/topupUsersResetZero/card", { cardNumber: data.cardNumber })
        } catch (err) {
            console.log(err)
        } finally {
            cardForm.reset()
        }
    }

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
        return new Intl.NumberFormat("en-US").format(numAmount)
    }

    const getBalanceBadge = (balance: number | string) => {
        const numBalance = typeof balance === "string" ? Number.parseFloat(balance) : balance
        if (numBalance >= 50000) return <Badge className="bg-green-100 text-green-800">{formatCurrency(numBalance)}</Badge>
        if (numBalance >= 10000)
            return <Badge className="bg-yellow-100 text-yellow-800">{formatCurrency(numBalance)}</Badge>
        return <Badge className="bg-red-100 text-red-800">{formatCurrency(numBalance)}</Badge>
    }

    const formatTimestamp = (timestamp: string) => {
        // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
        const numTimestamp = Number.parseInt(timestamp)
        const date = numTimestamp.toString().length === 10 ? new Date(numTimestamp * 1000) : new Date(numTimestamp)

        return moment(date).format("ddd, MMM D, YYYY h:mm A")
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div>
            <SiteHeader title="Topup" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground">Add balance to user accounts via phone or card payment</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Topups</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <Wallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalBalance || 0)}</div>
                            <p className="text-xs text-muted-foreground">Total added</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Phone className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.activeUsers || 0}</div>
                            <p className="text-xs text-muted-foreground">Unique accounts</p>
                        </CardContent>
                    </Card>
                </div>
                <Tabs defaultValue="phone" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Pay with Phone
                        </TabsTrigger>
                        <TabsTrigger value="card" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Pay with Card
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Topup History
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="phone" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-teal-600" />
                                    Phone Topup
                                </CardTitle>
                                <CardDescription>Add balance using phone number payment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...phoneForm}>
                                    <form onSubmit={phoneForm.handleSubmit(onPhoneTopupSubmit)} className="space-y-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormField
                                                control={phoneForm.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="03*********"
                                                                {...field}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={phoneForm.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Amount</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount b/w 1 to 30,000"
                                                                {...field}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={phoneForm.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Purpose of payment"
                                                            rows={3}
                                                            {...field}
                                                            className="focus:border-teal-500 focus:ring-teal-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex gap-4">
                                            <Button
                                                type="submit"
                                                disabled={phoneForm.formState.isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {phoneForm.formState.isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Phone className="mr-2 h-4 w-4" />
                                                        Topup with Phone
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handlePhoneReset(phoneForm.getValues())}
                                                className="border-teal-600 text-teal-600 hover:bg-teal-50 bg-transparent"
                                            >
                                                Reset balance to Zero
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="card" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-teal-600" />
                                    Card Payment
                                </CardTitle>
                                <CardDescription>Add balance using credit/debit card</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <Form {...cardForm}>
                                    <form onSubmit={cardForm.handleSubmit(onCardTopupSubmit)} className="space-y-6">
                                        {/* Card Number & Amount Side by Side */}
                                        <div className="flex flex-col md:flex-row gap-4">
                                            {/* Card Number */}
                                            <FormField
                                                control={cardForm.control}
                                                name="cardNumber"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>Card Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="XXXXXX"
                                                                {...field}
                                                                maxLength={10}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Amount */}
                                            <FormField
                                                control={cardForm.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>Amount</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount b/w 1 to 30,000"
                                                                {...field}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Description Below */}
                                        <FormField
                                            control={cardForm.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Purpose of payment"
                                                            rows={3}
                                                            {...field}
                                                            className="focus:border-teal-500 focus:ring-teal-500 resize-none"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Buttons */}
                                        <div className="flex gap-4 pt-2">
                                            <Button
                                                type="submit"
                                                disabled={cardForm.formState.isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {cardForm.formState.isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Topup with Card
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleCardReset(cardForm.getValues())}
                                                className="border-teal-600 text-teal-600 hover:bg-teal-50 bg-transparent"
                                            >
                                                Reset to Zero
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="h-5 w-5 text-teal-600" />
                                            Topup History
                                        </CardTitle>
                                        <CardDescription>View all previous topup transactions</CardDescription>
                                    </div>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                                <div className="pt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name, phone, or account holder..."
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">Name</TableHead>
                                                <TableHead className="font-semibold">Phone Number/RFID</TableHead>
                                                <TableHead className="font-semibold">Total Balance</TableHead>
                                                <TableHead className="font-semibold">Previous Balance</TableHead>
                                                <TableHead className="font-semibold">Balance Added</TableHead>
                                                <TableHead className="font-semibold">Created At</TableHead>
                                                <TableHead className="font-semibold">Account Holder</TableHead>
                                                <TableHead className="font-semibold">Description</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedHistory.length > 0 ? (
                                                paginatedHistory.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-medium">{item.name || "N/A"}</TableCell>
                                                        <TableCell className="font-mono">{item.msisdn}</TableCell>
                                                        <TableCell>{getBalanceBadge(item.total_balance)}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatCurrency(item.previous_balance)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-green-100 text-green-800">
                                                                +{formatCurrency(item.balance_added)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{formatTimestamp(item.created_at)}</TableCell>
                                                        <TableCell className="text-sm">{item.user_email || "N/A"}</TableCell>
                                                        <TableCell className="text-sm">{item.description || "N/A"}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                        {searchTerm ? "No results found for your search." : "No topup history available."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                                            {searchTerm && ` (filtered from ${topupHistory.length} total entries)`}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                                                <ChevronLeft className="h-4 w-4" />
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
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Summary when no pagination needed */}
                                {totalPages <= 1 && totalItems > 0 && (
                                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                        <span>
                                            Showing {totalItems} of {topupHistory.length} transactions
                                            {searchTerm && ` (filtered by "${searchTerm}")`}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
