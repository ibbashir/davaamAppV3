"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconUsers,
    IconShield,
    IconLoader2,
    IconEyeOff,
    IconEye,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconRefresh
} from "@tabler/icons-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { deleteRequest, getRequest, postRequest, putRequest } from "@/Apis/Api"

interface User {
    id: number
    email: string
    user_role: string
    password: string
    created_at: string
    first_name: string
    last_name: string
    company_code: string
    role_code: string
    machine_type: string | null
    update_at: string
    machines: Array<{ machine_code: string }>
}

interface ApiResponse {
    statusCode: number
    message: string
    page: number
    limit: number
    total: number
    data: User[]
}

const Roles = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState(false)
    const [userRole, setUserRole] = useState<string>("")
    const [machineType, setMachineType] = useState<string>("")
    const [currentUserForEdit, setCurrentUserForEdit] = useState<User | null>(null)
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({})

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: 10,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const fetchRoles = async (page = 1, limit = 10) => {
        try {
            setLoading(true)
            const res: ApiResponse = await getRequest(`/superadmin/getAllRoleLists?page=${page}&limit=${limit}`)
            setUsers(res.data)
            setPagination({
                currentPage: res.page,
                totalPages: Math.ceil(res.total / res.limit),
                total: res.total,
                limit: res.limit,
            })
        } catch (error) {
            console.log(error)
            toast.error("Failed to fetch roles data")
            setUsers([])
            setPagination({
                currentPage: 1,
                totalPages: 1,
                total: 0,
                limit: 10,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
            fetchRoles(newPage, pagination.limit)
        }
    }

    // Handle page size changes
    const handlePageSizeChange = (newLimit: string) => {
        const limit = Number.parseInt(newLimit)
        setPagination((prev) => ({ ...prev, limit }))
        fetchRoles(1, limit) // Reset to first page when changing page size
    }

    // Effect to pre-fill the edit form when the dialog opens or currentUserForEdit changes
    useEffect(() => {
        if (editDialogOpen && currentUserForEdit) {
            reset({
                firstName: currentUserForEdit.first_name,
                lastName: currentUserForEdit.last_name,
                email: currentUserForEdit.email,
                password: currentUserForEdit.password,
            })
            setUserRole(currentUserForEdit.user_role)
            setMachineType(currentUserForEdit.machine_type || "")
        } else if (!editDialogOpen) {
            reset()
            setCurrentUserForEdit(null)
            setUserRole("")
            setMachineType("")
        }
    }, [editDialogOpen, currentUserForEdit, reset])

    const onSubmit = async (data: any) => {
        if (!userRole) {
            toast.error("User role is required")
            return
        }
        try {
            setCreating(true)
            const newUser = {
                ...data,
                userRole: userRole,
                machine_type: machineType,
                roleCode: userRole === "admin" ? "1" : userRole === "ops" ? "2" : "3",
                company_code: "0",
            }
            console.log(newUser)
            await postRequest("/superadmin/addNewRole", newUser)
            toast.success("User created successfully")
            setIsDialogOpen(false)
            reset()
            setUserRole("")
            fetchRoles(pagination.currentPage, pagination.limit) // Refresh current page
        } catch (error) {
            console.error(error)
            toast.error("Failed to create user")
        } finally {
            setCreating(false)
        }
    }

    const editsubmit = async (data: any) => {
        if (!currentUserForEdit) {
            toast.error("No user selected for editing.")
            return
        }
        try {
            setEditing(true)
            const updatedUser = {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                user_role: currentUserForEdit.user_role,
                roleCode: currentUserForEdit.role_code || "",
                machine_code:
                    currentUserForEdit.user_role === "company" && currentUserForEdit.machines.length > 0
                        ? currentUserForEdit.machines[0].machine_code
                        : null,
                machine_type: currentUserForEdit.user_role === "company" ? machineType : null,
            }
            console.log("Updating user:", updatedUser)
            await putRequest(`/superadmin/updateRole/${currentUserForEdit.id}`, updatedUser)
            toast.success("User updated successfully")
            setEditDialogOpen(false)
            fetchRoles(pagination.currentPage, pagination.limit) // Refresh current page
        } catch (error) {
            console.error(error)
            toast.error("Failed to update user")
        } finally {
            setEditing(false)
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role.toLowerCase()) {
            case "super admin":
                return "destructive"
            case "admin":
                return "default"
            case "ops":
                return "secondary"
            case "company":
                return "outline"
            default:
                return "secondary"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const deleteUser = async (userId: number) => {
        try {
            await deleteRequest(`/superadmin/deleteRole/${userId}`)
            toast.success("User deleted successfully")
            // Check if current page becomes empty after deletion
            const remainingUsers = users.length - 1
            const shouldGoToPreviousPage = remainingUsers === 0 && pagination.currentPage > 1
            const targetPage = shouldGoToPreviousPage ? pagination.currentPage - 1 : pagination.currentPage
            fetchRoles(targetPage, pagination.limit)
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete user")
        }
    }

    const roleStats = users.reduce(
        (acc, user) => {
            acc[user.user_role] = (acc[user.user_role] || 0) + 1
            return acc
        },
        {} as Record<string, number>,
    )

    return (
        <div>
            <SiteHeader title="Roles" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground">Create and manage user roles and permissions</p>
                        <Badge variant="secondary">{pagination.total} total users</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRoles(pagination.currentPage, pagination.limit)}
                            disabled={loading}
                        >
                            <IconRefresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <IconPlus className="mr-2 h-4 w-4" /> Create User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>Fill in the user's details and assign a role.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            {...register("firstName", { required: true })}
                                            placeholder="Enter first name"
                                        />
                                        {errors.firstName && <p className="text-red-500 text-sm">First name is required</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" {...register("lastName", { required: true })} placeholder="Enter last name" />
                                        {errors.lastName && <p className="text-red-500 text-sm">Last name is required</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register("email", { required: true })}
                                            placeholder="Enter email"
                                        />
                                        {errors.email && <p className="text-red-500 text-sm">Email is required</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register("password", { required: true })}
                                            placeholder="Enter password"
                                        />
                                        {errors.password && <p className="text-red-500 text-sm">Password is required</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <Label htmlFor="userRole" className="mb-2">
                                                    User Role
                                                </Label>
                                                <Select onValueChange={setUserRole} value={userRole}>
                                                    <SelectTrigger id="userRole">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ops">Ops</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="company">Company</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {userRole === "company" && (
                                                <div className="flex-1">
                                                    <Label htmlFor="machineType" className="mb-2">
                                                        Select Machine Type
                                                    </Label>
                                                    <Select onValueChange={setMachineType} value={machineType}>
                                                        <SelectTrigger id="machineType">
                                                            <SelectValue placeholder="Select Machine Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Oil">Oil</SelectItem>
                                                            <SelectItem value="Butterfly">Butterfly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={creating}>
                                            {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />} Create User
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Edit Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Edit User Details</DialogTitle>
                                <DialogDescription>Change the user's information</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(editsubmit)} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="editFirstName">First Name</Label>
                                    <Input
                                        id="editFirstName"
                                        {...register("firstName", { required: true })}
                                        placeholder="Enter first name"
                                    />
                                    {errors.firstName && <p className="text-red-500 text-sm">First name is required</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editLastName">Last Name</Label>
                                    <Input
                                        id="editLastName"
                                        {...register("lastName", { required: true })}
                                        placeholder="Enter last name"
                                    />
                                    {errors.lastName && <p className="text-red-500 text-sm">Last name is required</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editEmail">Email</Label>
                                    <Input
                                        id="editEmail"
                                        type="email"
                                        {...register("email", { required: true })}
                                        placeholder="Enter email"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm">Email is required</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editPassword">Password</Label>
                                    <Input
                                        id="editPassword"
                                        type="password"
                                        {...register("password", { required: true })}
                                        placeholder="Enter password"
                                    />
                                    {errors.password && <p className="text-red-500 text-sm">Password is required</p>}
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex justify-between gap-4">
                                        <div className="flex-1">
                                            <Label htmlFor="editUserRole" className="mb-2">
                                                User Role
                                            </Label>
                                            <Select value={userRole} onValueChange={setUserRole} disabled>
                                                <SelectTrigger id="editUserRole">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ops">Ops</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="company">Company</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-muted-foreground mt-1">Cannot change user role</p>
                                        </div>
                                        {currentUserForEdit?.user_role === "company" && (
                                            <div className="flex-1">
                                                <Label htmlFor="editMachineType" className="mb-2">
                                                    Select Machine Type
                                                </Label>
                                                <Select onValueChange={setMachineType} value={machineType}>
                                                    <SelectTrigger id="editMachineType">
                                                        <SelectValue placeholder="Select Machine Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Oil">Oil</SelectItem>
                                                        <SelectItem value="Butterfly">Butterfly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="mt-4">
                                                    <Label className="mb-2">Associated Machines</Label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {currentUserForEdit.machines && currentUserForEdit.machines.length > 0 ? (
                                                            currentUserForEdit.machines.map((machine, index) => (
                                                                <Badge key={index} variant="secondary">
                                                                    {machine.machine_code}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">No machines associated.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={editing}>
                                        {editing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pagination.total}</div>
                            <p className="text-xs text-muted-foreground">Registered users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                            <IconShield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roleStats["super admin"] || 0}</div>
                            <p className="text-xs text-muted-foreground">System administrators</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Companies</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roleStats["company"] || 0}</div>
                            <p className="text-xs text-muted-foreground">Company accounts</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Operators</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roleStats["ops"] || 0}</div>
                            <p className="text-xs text-muted-foreground">Operations staff</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Roles Management</CardTitle>
                        <CardDescription>Manage users and their assigned roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <IconLoader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Loading users...</span>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Password</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Machines</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    <span className="text-sm">{visiblePasswords[user.id] ? user.password : "••••••••"}</span>
                                                    <button
                                                        onClick={() => setVisiblePasswords((prev) => ({ ...prev, [user.id]: !prev[user.id] }))}
                                                        className="focus:outline-none"
                                                        title={visiblePasswords[user.id] ? "Hide Password" : "Show Password"}
                                                    >
                                                        {visiblePasswords[user.id] ? (
                                                            <IconEyeOff className="w-4 h-4 text-muted-foreground" />
                                                        ) : (
                                                            <IconEye className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getRoleBadgeVariant(user.user_role)}>{user.user_role}</Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(user.created_at)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.machines.length > 0 ? (
                                                            user.machines.slice(0, 2).map((machine, index) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {machine.machine_code}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm"></span>
                                                        )}
                                                        {user.machines.length > 2 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{user.machines.length - 2} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                setCurrentUserForEdit(user)
                                                                setEditDialogOpen(true)
                                                            }}
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <IconEdit className="h-4 w-4" />
                                                        </Button>
                                                        <Button onClick={() => deleteUser(user.id)} variant="ghost" size="sm">
                                                            <IconTrash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between px-4 py-4">
                                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                        Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} users
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
                                                disabled={pagination.currentPage === pagination.totalPages || loading}
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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Roles
