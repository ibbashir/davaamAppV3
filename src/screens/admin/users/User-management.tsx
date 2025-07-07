"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
import {
    IconSearch,
    IconDownload,
    IconUserPlus,
    IconCreditCard,
    IconTrash,
    IconUsers,
    IconWallet,
    IconLoader2,
} from "@tabler/icons-react"
import moment from "moment"
import { SiteHeader } from "@/components/admin/site-header"

// Validation schemas
const addUserSchema = z.object({
    name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
    phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(/^03\d{9}$/, "Phone number must be in format 03XXXXXXXXX"),
    initialBalance: z
        .string()
        .min(1, "Initial balance is required")
        .refine((val) => {
            const num = Number.parseFloat(val)
            return num >= 0
        }, "Initial balance must be 0 or greater"),
})

const addRfidSchema = z.object({
    phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(/^03\d{9}$/, "Phone number must be in format 03XXXXXXXXX"),
    cardNumber: z
        .string()
        .min(1, "Card number is required")
        .regex(/^\d{4,6}$/, "Card number must be 4-6 digits"),
})

type AddUserFormData = z.infer<typeof addUserSchema>
type AddRfidFormData = z.infer<typeof addRfidSchema>

interface User {
    id: string
    name: string
    phoneNumber: string
    balance: number
    cardNumber: string
    createdAt: string
}

// Mock data
const mockUsers: User[] = [
    {
        id: "1",
        name: "John Doe",
        phoneNumber: "03251235122",
        balance: 49,
        cardNumber: "9356",
        createdAt: "2023-02-02T18:05:00Z",
    },
    {
        id: "2",
        name: "Jane Smith",
        phoneNumber: "03215654544",
        balance: 49,
        cardNumber: "24700",
        createdAt: "2023-02-02T18:11:00Z",
    },
    {
        id: "3",
        name: "Mike Johnson",
        phoneNumber: "03211876345",
        balance: 49,
        cardNumber: "27628",
        createdAt: "2023-02-02T18:33:00Z",
    },
    {
        id: "4",
        name: "Sarah Wilson",
        phoneNumber: "03124567653",
        balance: 49,
        cardNumber: "8420",
        createdAt: "2023-02-03T15:27:00Z",
    },
    {
        id: "5",
        name: "David Brown",
        phoneNumber: "03001234567",
        balance: 49,
        cardNumber: "4199",
        createdAt: "2023-02-06T16:19:00Z",
    },
]

export function AdminUsersManagement() {
    const [users, setUsers] = useState<User[]>(mockUsers)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isAddRfidOpen, setIsAddRfidOpen] = useState(false)

    // Add user form
    const addUserForm = useForm<AddUserFormData>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            name: "",
            phoneNumber: "",
            initialBalance: "",
        },
    })

    // Add RFID form
    const addRfidForm = useForm<AddRfidFormData>({
        resolver: zodResolver(addRfidSchema),
        defaultValues: {
            phoneNumber: "",
            cardNumber: "",
        },
    })

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phoneNumber.includes(searchTerm) ||
            user.cardNumber.includes(searchTerm),
    )

    const onAddUserSubmit = async (data: AddUserFormData) => {
        try {
            console.log("Adding user:", data)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const newUser: User = {
                id: Date.now().toString(),
                name: data.name,
                phoneNumber: data.phoneNumber,
                balance: Number.parseFloat(data.initialBalance),
                cardNumber: Math.floor(Math.random() * 90000 + 10000).toString(),
                createdAt: new Date().toISOString(),
            }

            setUsers([...users, newUser])
            addUserForm.reset()
            setIsAddUserOpen(false)
        } catch (error) {
            console.error("Add user error:", error)
        }
    }

    const onAddRfidSubmit = async (data: AddRfidFormData) => {
        try {
            console.log("Adding RFID:", data)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update user with new card number
            setUsers(
                users.map((user) => (user.phoneNumber === data.phoneNumber ? { ...user, cardNumber: data.cardNumber } : user)),
            )

            addRfidForm.reset()
            setIsAddRfidOpen(false)
        } catch (error) {
            console.error("Add RFID error:", error)
        }
    }

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter((user) => user.id !== userId))
    }

    const handleExportCSV = () => {
        console.log("Exporting CSV...")
        // CSV export logic would go here
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US").format(amount)
    }

    const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)
    const averageBalance = users.length > 0 ? totalBalance / users.length : 0

    return (
        <div>
            <SiteHeader title="Users" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Users</h1> */}
                        <p className="text-muted-foreground">
                            A list of all the users in your account including their Phone numbers and balance
                        </p>
                    </div>
                    <div className="flex gap-2">
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
                                    <DialogDescription>Create a new user account with phone number and initial balance.</DialogDescription>
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
                                            name="initialBalance"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Initial Balance</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0" {...field} />
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

                        <Dialog open={isAddRfidOpen} onOpenChange={setIsAddRfidOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <IconCreditCard className="mr-2 h-4 w-4" />
                                    Add rfid
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add RFID Card</DialogTitle>
                                    <DialogDescription>Associate an RFID card number with an existing user phone number.</DialogDescription>
                                </DialogHeader>
                                <Form {...addRfidForm}>
                                    <form onSubmit={addRfidForm.handleSubmit(onAddRfidSubmit)} className="space-y-4">
                                        <FormField
                                            control={addRfidForm.control}
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
                                            control={addRfidForm.control}
                                            name="cardNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Card Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter 4-6 digit card number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsAddRfidOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={addRfidForm.formState.isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {addRfidForm.formState.isSubmitting ? (
                                                    <>
                                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    "Add RFID"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.length}</div>
                            <p className="text-xs text-muted-foreground">Registered users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                            <IconWallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBalance)}</div>
                            <p className="text-xs text-muted-foreground">Combined balance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
                            <IconWallet className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(Math.round(averageBalance))}</div>
                            <p className="text-xs text-muted-foreground">Per user</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
                            <IconCreditCard className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{users.filter((user) => user.cardNumber).length}</div>
                            <p className="text-xs text-muted-foreground">With RFID cards</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>User Directory</CardTitle>
                                <CardDescription>Manage user accounts and RFID cards</CardDescription>
                            </div>
                            <Button onClick={handleExportCSV} className="bg-teal-600 hover:bg-teal-700">
                                <IconDownload className="mr-2 h-4 w-4" />
                                Export as csv
                            </Button>
                        </div>
                        <div className="pt-4">
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Phone number"
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
                                        <TableHead className="font-semibold">Phone Number</TableHead>
                                        <TableHead className="font-semibold">Balance</TableHead>
                                        <TableHead className="font-semibold">Card Number</TableHead>
                                        <TableHead className="font-semibold">Created at</TableHead>
                                        <TableHead className="font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="font-mono">{user.phoneNumber}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {formatCurrency(user.balance)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono">{user.cardNumber}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {moment(user.createdAt).format("ddd, MMM D, YYYY h:mm A")}
                                                </TableCell>
                                                <TableCell>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <IconTrash className="mr-2 h-4 w-4" />
                                                                Delete user
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the user account for{" "}
                                                                    <strong>{user.name}</strong> and remove their data from our servers.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {searchTerm ? "No users found matching your search." : "No users available."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredUsers.length > 0 && (
                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <span>
                                    Showing {filteredUsers.length} of {users.length} users
                                    {searchTerm && ` (filtered by "${searchTerm}")`}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
