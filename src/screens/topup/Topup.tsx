"use client"

import { useState } from "react"
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
import {
    IconPhone,
    IconCreditCard,
    IconHistory,
    IconWallet,
    IconSearch,
    IconDownload,
    IconLoader2,
} from "@tabler/icons-react"
import moment from "moment"
import { SiteHeader } from "@/components/site-header"

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
    cardHolderName: z.string().min(1, "Card holder name is required").min(2, "Name must be at least 2 characters"),
    cardNumber: z
        .string()
        .min(1, "Card number is required")
        .regex(/^\d{16}$/, "Card number must be 16 digits")
        .transform((val) => val.replace(/\s/g, "")),
    expiryDate: z
        .string()
        .min(1, "Expiry date is required")
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
    cvv: z
        .string()
        .min(1, "CVV is required")
        .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
})

type PhoneTopupFormData = z.infer<typeof phoneTopupSchema>
type CardTopupFormData = z.infer<typeof cardTopupSchema>

// Mock data for topup history
const topupHistory = [
    {
        id: 1,
        name: "Hazik",
        phoneRfid: "03213525496",
        totalBalance: 100000,
        previousBalance: 96667,
        balanceAdded: 3333,
        createdAt: "2025-07-01T15:16:00Z",
        accountHolder: "salman@davaam.pk",
        paymentPurpose: "test",
    },
    {
        id: 2,
        name: "Hazik",
        phoneRfid: "03213525496",
        totalBalance: 96667,
        previousBalance: 66667,
        balanceAdded: 30000,
        createdAt: "2025-07-01T15:16:00Z",
        accountHolder: "salman@davaam.pk",
        paymentPurpose: "test",
    },
    {
        id: 3,
        name: "Shoaib_test",
        phoneRfid: "2597",
        totalBalance: 30000,
        previousBalance: 0,
        balanceAdded: 30000,
        createdAt: "2025-07-01T11:11:00Z",
        accountHolder: "salman@davaam.pk",
        paymentPurpose: "testing topup - shoaib",
    },
    {
        id: 4,
        name: "Hassab",
        phoneRfid: "03212990048",
        totalBalance: 3000,
        previousBalance: 0,
        balanceAdded: 3000,
        createdAt: "2025-06-30T15:04:00Z",
        accountHolder: "salman@davaam.pk",
        paymentPurpose: "test",
    },
]

export function Topup() {
    const [searchTerm, setSearchTerm] = useState("")

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
            phoneNumber: "",
            amount: "",
            description: "",
            cardHolderName: "",
            cardNumber: "",
            expiryDate: "",
            cvv: "",
        },
    })

    const filteredHistory = topupHistory.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phoneRfid.includes(searchTerm) ||
            item.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const onPhoneTopupSubmit = async (data: PhoneTopupFormData) => {
        try {
            console.log("Phone topup:", data)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000))
            phoneForm.reset()
        } catch (error) {
            console.error("Phone topup error:", error)
        }
    }

    const onCardTopupSubmit = async (data: CardTopupFormData) => {
        try {
            console.log("Card topup:", data)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000))
            cardForm.reset()
        } catch (error) {
            console.error("Card topup error:", error)
        }
    }

    const handlePhoneReset = () => {
        phoneForm.reset()
    }

    const handleCardReset = () => {
        cardForm.reset()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US").format(amount)
    }

    const getBalanceBadge = (balance: number) => {
        if (balance >= 50000) return <Badge className="bg-green-100 text-green-800">{formatCurrency(balance)}</Badge>
        if (balance >= 10000) return <Badge className="bg-yellow-100 text-yellow-800">{formatCurrency(balance)}</Badge>
        return <Badge className="bg-red-100 text-red-800">{formatCurrency(balance)}</Badge>
    }

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ""
        const parts = []
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }
        if (parts.length) {
            return parts.join(" ")
        } else {
            return v
        }
    }

    const formatExpiryDate = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4)
        }
        return v
    }

    return (
        <div>
            <SiteHeader title="Topup" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Topup</h1> */}
                        <p className="text-muted-foreground">Add balance to user accounts via phone or card payment</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Topups</CardTitle>
                            <IconWallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{topupHistory.length}</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <IconWallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(topupHistory.reduce((sum, item) => sum + item.balanceAdded, 0))}
                            </div>
                            <p className="text-xs text-muted-foreground">Total added</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <IconPhone className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {new Set(topupHistory.map((item) => item.phoneRfid)).size}
                            </div>
                            <p className="text-xs text-muted-foreground">Unique accounts</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Topup</CardTitle>
                            <IconWallet className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {formatCurrency(
                                    Math.round(topupHistory.reduce((sum, item) => sum + item.balanceAdded, 0) / topupHistory.length),
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="phone" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="phone" className="flex items-center gap-2">
                            <IconPhone className="h-4 w-4" />
                            Pay with Phone
                        </TabsTrigger>
                        <TabsTrigger value="card" className="flex items-center gap-2">
                            <IconCreditCard className="h-4 w-4" />
                            Pay with Card
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <IconHistory className="h-4 w-4" />
                            Topup History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="phone" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconPhone className="h-5 w-5 text-teal-600" />
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
                                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconPhone className="mr-2 h-4 w-4" />
                                                        Topup with Phone
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handlePhoneReset}
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

                    <TabsContent value="card" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconCreditCard className="h-5 w-5 text-teal-600" />
                                    Card Payment
                                </CardTitle>
                                <CardDescription>Add balance using credit/debit card</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...cardForm}>
                                    <form onSubmit={cardForm.handleSubmit(onCardTopupSubmit)} className="space-y-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormField
                                                control={cardForm.control}
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
                                                control={cardForm.control}
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
                                            control={cardForm.control}
                                            name="cardHolderName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Card Holder Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter card holder name"
                                                            {...field}
                                                            className="focus:border-teal-500 focus:ring-teal-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <FormField
                                                control={cardForm.control}
                                                name="cardNumber"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>Card Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="1234 5678 9012 3456"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const formatted = formatCardNumber(e.target.value)
                                                                    field.onChange(formatted.replace(/\s/g, ""))
                                                                    e.target.value = formatted
                                                                }}
                                                                maxLength={19}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={cardForm.control}
                                                name="cvv"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>CVV</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="123"
                                                                {...field}
                                                                maxLength={4}
                                                                className="focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={cardForm.control}
                                            name="expiryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expiry Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="MM/YY"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const formatted = formatExpiryDate(e.target.value)
                                                                field.onChange(formatted)
                                                                e.target.value = formatted
                                                            }}
                                                            maxLength={5}
                                                            className="focus:border-teal-500 focus:ring-teal-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
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
                                                disabled={cardForm.formState.isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {cardForm.formState.isSubmitting ? (
                                                    <>
                                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconCreditCard className="mr-2 h-4 w-4" />
                                                        Topup with Card
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCardReset}
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
                                            <IconHistory className="h-5 w-5 text-teal-600" />
                                            Topup History
                                        </CardTitle>
                                        <CardDescription>View all previous topup transactions</CardDescription>
                                    </div>
                                    <Button variant="outline">
                                        <IconDownload className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                                <div className="pt-4">
                                    <div className="relative">
                                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, phone, or account holder..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
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
                                                <TableHead className="font-semibold">Payment Purpose</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredHistory.length > 0 ? (
                                                filteredHistory.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="font-mono">{item.phoneRfid}</TableCell>
                                                        <TableCell>{getBalanceBadge(item.totalBalance)}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {formatCurrency(item.previousBalance)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-green-100 text-green-800">+{formatCurrency(item.balanceAdded)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {moment(item.createdAt).format("ddd, MMM D, YYYY h:mm A")}
                                                        </TableCell>
                                                        <TableCell className="text-sm">{item.accountHolder}</TableCell>
                                                        <TableCell className="text-sm">{item.paymentPurpose}</TableCell>
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
                                {filteredHistory.length > 0 && (
                                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                        <span>
                                            Showing {filteredHistory.length} of {topupHistory.length} transactions
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
