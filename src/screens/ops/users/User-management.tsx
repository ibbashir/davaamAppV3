"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    IconWallet,
    IconTrash,
    IconUserPlus,
    IconLoader2,
    IconSearch,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconLoader,
} from "@tabler/icons-react"
import moment from "moment"
import { SiteHeader } from "@/components/ops/site-header"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getRequest } from "@/Apis/Api"
import { toast } from "sonner"

const addUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phoneNumber: z.string().regex(/^03\d{9}$/, "Phone number must be in format 03XXXXXXXXX"),
    pin: z.string().regex(/^\d{4}$/, "PIN must be a 4-digit number"),
})

type AddUserFormData = z.infer<typeof addUserSchema>

interface ApiUser {
    id: number
    card_number: number | null
    name: string
    mobile_number: string
    balance: number
    created_at: string
}

interface ApiUserResponse {
    users: ApiUser[]
    currentPage: number
    totalPages: number
    totalUsers: number
    limit: number
}

export function OpsUsersManagement() {
    const [users, setUsers] = useState<ApiUser[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [apiPagination, setApiPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10,
    })
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    // API call function for regular fetch
    const fetchMobileUsers = async (page = 1, limit = 10) => {
        try {
            setLoading(true)
            const res: ApiUserResponse = await getRequest(`/ops/mobileAppUsers?page=${page}&limit=${limit}`)
            setUsers(res.users)
            setApiPagination({
                currentPage: res.currentPage,
                totalPages: res.totalPages,
                totalUsers: res.totalUsers,
                limit: res.limit,
            })
        } catch (error) {
            console.error("Failed to fetch users", error)
            toast.error("Failed to fetch mobile users")
            setUsers([])
            setApiPagination({
                currentPage: 1,
                totalPages: 1,
                totalUsers: 0,
                limit: 10,
            })
        } finally {
            setLoading(false)
        }
    }

    // API call function for search
    const searchMobileUsers = async (searchQuery: string, page = 1) => {
        if (!searchQuery.trim()) {
            setIsSearching(false)
            fetchMobileUsers(page, pagination.pageSize)
            return
        }

        try {
            setLoading(true)
            setIsSearching(true)
            const res: ApiUserResponse = await getRequest(
                `/ops/searchAllMobileAppUsers/search/${searchQuery}?page=${page}`,
            )
            setUsers(res.users)
            setApiPagination({
                currentPage: res.currentPage,
                totalPages: res.totalPages,
                totalUsers: res.totalUsers,
                limit: res.limit,
            })
        } catch (error) {
            console.error("Error searching mobile users:", error)
            toast.error("Failed to search mobile users")
            setUsers([])
            setApiPagination({
                currentPage: 1,
                totalPages: 1,
                totalUsers: 0,
                limit: 10,
            })
        } finally {
            setLoading(false)
        }
    }

    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination((prev) => ({ ...prev, pageIndex: 0 })) // Reset to first page
        if (searchTerm.trim()) {
            searchMobileUsers(searchTerm, 1)
        } else {
            setIsSearching(false)
            fetchMobileUsers(1, pagination.pageSize)
        }
    }

    // Handle search input change
    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        // If search is cleared, fetch all users
        if (!value.trim()) {
            setIsSearching(false)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            fetchMobileUsers(1, pagination.pageSize)
        }
    }

    // Clear search
    const clearSearch = () => {
        setSearchTerm("")
        setIsSearching(false)
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        fetchMobileUsers(1, pagination.pageSize)
    }

    // Effect for initial load and pagination changes
    useEffect(() => {
        if (isSearching && searchTerm.trim()) {
            searchMobileUsers(searchTerm, pagination.pageIndex + 1)
        } else {
            fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)
        }
    }, [pagination.pageIndex, pagination.pageSize])

    const addUserForm = useForm<AddUserFormData>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            name: "",
            phoneNumber: "",
            pin: "",
        },
    })

    const onAddUserSubmit = async (data: AddUserFormData) => {
        console.log("Adding user:", data)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsAddUserOpen(false)
        addUserForm.reset()
        // Refresh current page
        if (isSearching && searchTerm.trim()) {
            searchMobileUsers(searchTerm, pagination.pageIndex + 1)
        } else {
            fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)
        }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US").format(amount)

    // Navigation functions
    const goToFirstPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    const goToLastPage = () => setPagination((prev) => ({ ...prev, pageIndex: apiPagination.totalPages - 1 }))
    const goToPreviousPage = () => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))
    const goToNextPage = () =>
        setPagination((prev) => ({ ...prev, pageIndex: Math.min(apiPagination.totalPages - 1, prev.pageIndex + 1) }))

    const canPreviousPage = pagination.pageIndex > 0
    const canNextPage = pagination.pageIndex < apiPagination.totalPages - 1

    if (loading && users.length === 0) {
        return (
            <div>
                <SiteHeader title="Users" />
                <div className="flex items-center justify-center h-64">
                    <IconLoader className="size-6 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <SiteHeader title="Users" />
            <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground">
                            A list of all the users in your account including their Phone numbers and balance
                        </p>
                        {isSearching && (
                            <Badge variant="outline" className="text-xs">
                                Search results for "{searchTerm}"
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (isSearching && searchTerm.trim()) {
                                    searchMobileUsers(searchTerm, pagination.pageIndex + 1)
                                } else {
                                    fetchMobileUsers(pagination.pageIndex + 1, pagination.pageSize)
                                }
                            }}
                            disabled={loading}
                        >
                            <IconLoader className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <IconUserPlus className="mr-2 h-4 w-4" />
                                    Add user
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>Create a new user account with phone number and PIN.</DialogDescription>
                                </DialogHeader>
                                <Form {...addUserForm}>
                                    <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                                        <FormField
                                            control={addUserForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter full name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addUserForm.control}
                                            name="phoneNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="03XXXXXXXXX" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addUserForm.control}
                                            name="pin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>4-digit PIN</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" maxLength={4} placeholder="e.g. 1234" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={addUserForm.formState.isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {addUserForm.formState.isSubmitting ? (
                                                    <>
                                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    "Add User"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, mobile number, or card number"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        className="pl-10 pr-10"
                    />
                    {searchTerm && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        >
                            <IconX className="h-4 w-4" />
                            <span className="sr-only">Clear search</span>
                        </Button>
                    )}
                </form>

                <Card>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <IconLoader className="size-4 animate-spin" />
                                                    {isSearching ? "Searching..." : "Loading..."}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell className="font-mono">{user.mobile_number}</TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    <IconWallet className="size-4 text-muted-foreground" />
                                                    <Badge variant={user.balance > 0 ? "default" : "secondary"}>{formatCurrency(user.balance)}</Badge>
                                                </TableCell>
                                                <TableCell className="pl-10">{user.card_number || "—"}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {moment(user.created_at).format("MMM D, YYYY h:mm A")}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                {isSearching ? `No users found for "${searchTerm}"` : "No users found."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Enhanced Pagination Controls */}
                        <div className="flex items-center justify-between px-4 mt-4">
                            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                Showing {users.length} of {apiPagination.totalUsers} user(s).
                            </div>
                            <div className="flex w-full items-center gap-8 lg:w-fit">
                                <div className="hidden items-center gap-2 lg:flex">
                                    <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                        Rows per page
                                    </Label>
                                    <Select
                                        value={`${pagination.pageSize}`}
                                        onValueChange={(value) => {
                                            setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))
                                        }}
                                    >
                                        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                            <SelectValue placeholder={pagination.pageSize} />
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
                                    Page {apiPagination.currentPage} of {apiPagination.totalPages}
                                </div>
                                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                    <Button
                                        variant="outline"
                                        className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                                        onClick={goToFirstPage}
                                        disabled={!canPreviousPage || loading}
                                    >
                                        <span className="sr-only">Go to first page</span>
                                        <IconChevronsLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={goToPreviousPage}
                                        disabled={!canPreviousPage || loading}
                                    >
                                        <span className="sr-only">Go to previous page</span>
                                        <IconChevronLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="size-8 bg-transparent"
                                        size="icon"
                                        onClick={goToNextPage}
                                        disabled={!canNextPage || loading}
                                    >
                                        <span className="sr-only">Go to next page</span>
                                        <IconChevronRight />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="hidden size-8 lg:flex bg-transparent"
                                        size="icon"
                                        onClick={goToLastPage}
                                        disabled={!canNextPage || loading}
                                    >
                                        <span className="sr-only">Go to last page</span>
                                        <IconChevronsRight />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
export default OpsUsersManagement
