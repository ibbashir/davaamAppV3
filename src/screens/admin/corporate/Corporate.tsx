"use client"

import { SiteHeader } from '@/components/admin/site-header'
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    IconPlus,
    IconDownload,
    IconBuilding,
    IconWallet,
    IconCalendar,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconLoader2,
} from "@tabler/icons-react"
import moment from "moment"

// Validation schema for adding topup
const addTopupSchema = z.object({
    clientName: z.string().min(1, "Client name is required"),
    amount: z
        .string()
        .min(1, "Amount is required")
        .refine((val) => {
            const num = Number.parseFloat(val)
            return num > 0
        }, "Amount must be greater than 0"),
    purpose: z.string().min(1, "Purpose is required").max(500, "Purpose must be less than 500 characters"),
})

type AddTopupFormData = z.infer<typeof addTopupSchema>

interface TopupEntry {
    id: string
    name: string
    amount: number
    date: string
    purpose: string
}

interface ClientEntry {
    id: string
    name: string
    cardNumber: string
    createdAt: string
    balance: number
    selected?: boolean
}

// Mock data for Corporate Topups
const mockTopupHistory: TopupEntry[] = [
    {
        id: "1",
        name: "Tapal Raiwand",
        amount: 1000,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for Tapal Raiwand amount of 1000",
    },
    {
        id: "2",
        name: "MG Apparels Multan",
        amount: 50,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for MG Apparels Multan amount of 50",
    },
    {
        id: "3",
        name: "Jaffer broth",
        amount: 150,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for Jaffer broth amount of 150",
    },
    {
        id: "4",
        name: "EFU",
        amount: 100,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for EFU amount of 100",
    },
    {
        id: "5",
        name: "JP coats",
        amount: 100,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for JP coats amount of 100",
    },
    {
        id: "6",
        name: "EBM",
        amount: 250,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for EBM amount of 250",
    },
    {
        id: "7",
        name: "National foods",
        amount: 150,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for National foods amount of 150",
    },
    {
        id: "8",
        name: "Merit",
        amount: 350,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for Merit amount of 350",
    },
    {
        id: "9",
        name: "Ibex",
        amount: 100,
        date: "2025-06-30T02:31:00Z",
        purpose: "monthly topup for Ibex amount of 100",
    },
    {
        id: "10",
        name: "Tapal Raiwand",
        amount: 1000,
        date: "2025-06-02T12:59:00Z",
        purpose: "monthly topup for Tapal Raiwand amount of 1000",
    },
    {
        id: "11",
        name: "MG Apparels Multan",
        amount: 50,
        date: "2025-06-02T12:59:00Z",
        purpose: "monthly topup for MG Apparels Multan amount of 50",
    },
]

// Mock data for individual client tabs
const generateClientData = (clientName: string, count = 51): ClientEntry[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${clientName.toLowerCase()}-${i + 1}`,
        name: clientName.toUpperCase(),
        cardNumber: Math.floor(Math.random() * 90000 + 10000).toString(),
        createdAt: new Date(
            2023 + Math.floor(Math.random() * 2),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28),
        ).toISOString(),
        balance: Math.floor(Math.random() * 500 + 100),
    }))
}

const ITEMS_PER_PAGE = 10

const Corporate = () => {
    const [activeTab, setActiveTab] = useState("corporate-topups")
    const [topupHistory, setTopupHistory] = useState<TopupEntry[]>(mockTopupHistory)
    const [isAddTopupOpen, setIsAddTopupOpen] = useState(false)

    // Client data states
    const [ibexData, setIbexData] = useState<ClientEntry[]>(generateClientData("IBEX"))
    const [tapalData, setTapalData] = useState<ClientEntry[]>(generateClientData("TAPAL"))
    const [meritData, setMeritData] = useState<ClientEntry[]>(generateClientData("MERIT"))
    const [jpCoatsData, setJpCoatsData] = useState<ClientEntry[]>(generateClientData("JP COATS"))
    const [ebmData, setEbmData] = useState<ClientEntry[]>(generateClientData("EBM"))

    // Filters and pagination
    const [nameFilter, setNameFilter] = useState("")
    const [cardFilter, setCardFilter] = useState("")
    const [dateFilter, setDateFilter] = useState("")
    const [minBalance, setMinBalance] = useState("")
    const [maxBalance, setMaxBalance] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedItems, setSelectedItems] = useState<string[]>([])

    // Add topup form
    const addTopupForm = useForm<AddTopupFormData>({
        resolver: zodResolver(addTopupSchema),
        defaultValues: {
            clientName: "",
            amount: "",
            purpose: "",
        },
    })

    const onAddTopupSubmit = async (data: AddTopupFormData) => {
        try {
            console.log("Adding topup:", data)
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const newTopup: TopupEntry = {
                id: Date.now().toString(),
                name: data.clientName,
                amount: Number.parseFloat(data.amount),
                date: new Date().toISOString(),
                purpose: data.purpose,
            }

            setTopupHistory([newTopup, ...topupHistory])
            addTopupForm.reset()
            setIsAddTopupOpen(false)
        } catch (error) {
            console.error("Add topup error:", error)
        }
    }

    const getClientData = (tabName: string): ClientEntry[] => {
        switch (tabName) {
            case "ibex":
                return ibexData
            case "tapal":
                return tapalData
            case "merit-packaging":
                return meritData
            case "jp-coats":
                return jpCoatsData
            case "ebm":
                return ebmData
            default:
                return []
        }
    }

    const getFilteredClientData = (data: ClientEntry[]) => {
        return data.filter((item) => {
            const matchesName = item.name.toLowerCase().includes(nameFilter.toLowerCase())
            const matchesCard = item.cardNumber.includes(cardFilter)
            const matchesDate = dateFilter === "" || moment(item.createdAt).format("YYYY-MM-DD").includes(dateFilter)
            const matchesMinBalance = minBalance === "" || item.balance >= Number.parseFloat(minBalance)
            const matchesMaxBalance = maxBalance === "" || item.balance <= Number.parseFloat(maxBalance)

            return matchesName && matchesCard && matchesDate && matchesMinBalance && matchesMaxBalance
        })
    }

    const handleSelectItem = (itemId: string) => {
        setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
    }

    const handleSelectAll = (data: ClientEntry[]) => {
        const allIds = data.map((item) => item.id)
        setSelectedItems((prev) => (prev.length === allIds.length ? [] : allIds))
    }

    const resetFilters = () => {
        setNameFilter("")
        setCardFilter("")
        setDateFilter("")
        setMinBalance("")
        setMaxBalance("")
        setCurrentPage(1)
        setSelectedItems([])
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        resetFilters()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US").format(amount)
    }

    const totalTopupAmount = topupHistory.reduce((sum, item) => sum + item.amount, 0)
    const uniqueClients = new Set(topupHistory.map((item) => item.name)).size
    return (
        <div>
            <SiteHeader title='Corporate Clients' />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Corporate Clients</h1> */}
                        <p className="text-muted-foreground">Manage corporate client accounts and topup history</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                            <IconBuilding className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{uniqueClients}</div>
                            <p className="text-xs text-muted-foreground">Active corporate clients</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Topups</CardTitle>
                            <IconWallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{topupHistory.length}</div>
                            <p className="text-xs text-muted-foreground">All time topups</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <IconWallet className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalTopupAmount)}</div>
                            <p className="text-xs text-muted-foreground">Total topup value</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <IconCalendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {topupHistory.filter((item) => moment(item.date).isSame(moment(), "month")).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Recent topups</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="corporate-topups">Corporate Topups</TabsTrigger>
                        <TabsTrigger value="ibex">Ibex</TabsTrigger>
                        <TabsTrigger value="tapal">Tapal</TabsTrigger>
                        <TabsTrigger value="merit-packaging">Merit Packaging</TabsTrigger>
                        <TabsTrigger value="jp-coats">Jp Coats</TabsTrigger>
                        <TabsTrigger value="ebm">Ebm</TabsTrigger>
                    </TabsList>

                    <TabsContent value="corporate-topups" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Corporate Topup History</CardTitle>
                                        <CardDescription>
                                            A list of all the corporate topup history in your account including their name, amount, purpose and
                                            date.
                                        </CardDescription>
                                    </div>
                                    <Dialog open={isAddTopupOpen} onOpenChange={setIsAddTopupOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-teal-600 hover:bg-teal-700">
                                                <IconPlus className="mr-2 h-4 w-4" />
                                                Add Topup
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Add Corporate Topup</DialogTitle>
                                                <DialogDescription>Add a new topup entry for a corporate client.</DialogDescription>
                                            </DialogHeader>
                                            <Form {...addTopupForm}>
                                                <form onSubmit={addTopupForm.handleSubmit(onAddTopupSubmit)} className="space-y-4">
                                                    <FormField
                                                        control={addTopupForm.control}
                                                        name="clientName"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Client Name</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter client name" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={addTopupForm.control}
                                                        name="amount"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Amount</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" placeholder="Enter amount" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={addTopupForm.control}
                                                        name="purpose"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Purpose</FormLabel>
                                                                <FormControl>
                                                                    <Textarea placeholder="Enter purpose of topup" rows={3} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <DialogFooter>
                                                        <Button type="button" variant="outline" onClick={() => setIsAddTopupOpen(false)}>
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={addTopupForm.formState.isSubmitting}
                                                            className="bg-teal-600 hover:bg-teal-700"
                                                        >
                                                            {addTopupForm.formState.isSubmitting ? (
                                                                <>
                                                                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Adding...
                                                                </>
                                                            ) : (
                                                                "Add Topup"
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">Name</TableHead>
                                                <TableHead className="font-semibold">Amount</TableHead>
                                                <TableHead className="font-semibold">Date</TableHead>
                                                <TableHead className="font-semibold">Purpose</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topupHistory.length > 0 ? (
                                                topupHistory.map((entry) => (
                                                    <TableRow key={entry.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-medium">{entry.name}</TableCell>
                                                        <TableCell className="font-medium text-green-600">{formatCurrency(entry.amount)}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {moment(entry.date).format("ddd, MMM D, YYYY h:mm A")}
                                                        </TableCell>
                                                        <TableCell className="max-w-md">
                                                            <div className="truncate" title={entry.purpose}>
                                                                {entry.purpose}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        No topup history available.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {["ibex", "tapal", "merit-packaging", "jp-coats", "ebm"].map((tabName) => {
                        const clientData = getClientData(tabName)
                        const filteredData = getFilteredClientData(clientData)
                        const totalPages = Math.ceil(filteredData.length / itemsPerPage)
                        const startIndex = (currentPage - 1) * itemsPerPage
                        const endIndex = startIndex + itemsPerPage
                        const paginatedData = filteredData.slice(startIndex, endIndex)

                        return (
                            <TabsContent key={tabName} value={tabName} className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>
                                                    {tabName.charAt(0).toUpperCase() + tabName.slice(1).replace("-", " ")} Client Data
                                                </CardTitle>
                                                <CardDescription>Manage {tabName} corporate client accounts and balances</CardDescription>
                                            </div>
                                            <Button onClick={() => console.log("Export", tabName)} className="bg-teal-600 hover:bg-teal-700">
                                                <IconDownload className="mr-2 h-4 w-4" />
                                                Export
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="w-12">
                                                            <Checkbox
                                                                checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                                                                onCheckedChange={() => handleSelectAll(paginatedData)}
                                                            />
                                                        </TableHead>
                                                        <TableHead className="font-semibold">
                                                            <div className="space-y-2">
                                                                <span>Name</span>
                                                                <Input
                                                                    placeholder="Search..."
                                                                    value={nameFilter}
                                                                    onChange={(e) => setNameFilter(e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="font-semibold">
                                                            <div className="space-y-2">
                                                                <span>Card number</span>
                                                                <Input
                                                                    placeholder="Search..."
                                                                    value={cardFilter}
                                                                    onChange={(e) => setCardFilter(e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="font-semibold">
                                                            <div className="space-y-2">
                                                                <span>Created at</span>
                                                                <Input
                                                                    placeholder="Search..."
                                                                    value={dateFilter}
                                                                    onChange={(e) => setDateFilter(e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="font-semibold">
                                                            <div className="space-y-2">
                                                                <span>Balance</span>
                                                                <div className="flex gap-1">
                                                                    <Input
                                                                        placeholder="Min"
                                                                        value={minBalance}
                                                                        onChange={(e) => setMinBalance(e.target.value)}
                                                                        className="h-8 w-16"
                                                                    />
                                                                    <Input
                                                                        placeholder="Max"
                                                                        value={maxBalance}
                                                                        onChange={(e) => setMaxBalance(e.target.value)}
                                                                        className="h-8 w-16"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedData.length > 0 ? (
                                                        paginatedData.map((entry) => (
                                                            <TableRow key={entry.id} className="hover:bg-muted/50">
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={selectedItems.includes(entry.id)}
                                                                        onCheckedChange={() => handleSelectItem(entry.id)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium">{entry.name}</TableCell>
                                                                <TableCell className="font-mono">{entry.cardNumber}</TableCell>
                                                                <TableCell className="text-muted-foreground">
                                                                    {moment(entry.createdAt).format("ddd, MMM D, YYYY h:mm A")}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="font-mono">
                                                                        {formatCurrency(entry.balance)}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                No data found matching your criteria.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(1)}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <IconChevronsLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <IconChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <IconChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(totalPages)}
                                                        disabled={currentPage === totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <IconChevronsRight className="h-4 w-4" />
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        Page {currentPage} of {totalPages}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Go to page:</span>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={totalPages}
                                                        value={currentPage}
                                                        onChange={(e) => {
                                                            const page = Number.parseInt(e.target.value)
                                                            if (page >= 1 && page <= totalPages) {
                                                                setCurrentPage(page)
                                                            }
                                                        }}
                                                        className="h-8 w-16"
                                                    />
                                                    <Select
                                                        value={itemsPerPage.toString()}
                                                        onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}
                                                    >
                                                        <SelectTrigger className="h-8 w-20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="10">Show 10</SelectItem>
                                                            <SelectItem value="25">Show 25</SelectItem>
                                                            <SelectItem value="50">Show 50</SelectItem>
                                                            <SelectItem value="100">Show 100</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </div>
        </div>
    )
}

export default Corporate
