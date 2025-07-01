"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconUsers, IconUserPlus, IconSearch, IconEdit, IconTrash, IconMail, IconPhone } from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const users = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@company.com",
        phone: "+1 (555) 123-4567",
        role: "Manager",
        status: "Active",
        lastLogin: "2 hours ago",
        avatar: "/avatars/john.jpg",
        joinDate: "2023-01-15",
    },
    {
        id: 2,
        name: "Sarah Wilson",
        email: "sarah.wilson@company.com",
        phone: "+1 (555) 234-5678",
        role: "Operator",
        status: "Active",
        lastLogin: "1 day ago",
        avatar: "/avatars/sarah.jpg",
        joinDate: "2023-03-22",
    },
    {
        id: 3,
        name: "Mike Johnson",
        email: "mike.johnson@company.com",
        phone: "+1 (555) 345-6789",
        role: "Viewer",
        status: "Inactive",
        lastLogin: "1 week ago",
        avatar: "/avatars/mike.jpg",
        joinDate: "2023-02-10",
    },
    {
        id: 4,
        name: "Emily Davis",
        email: "emily.davis@company.com",
        phone: "+1 (555) 456-7890",
        role: "Super Admin",
        status: "Active",
        lastLogin: "30 mins ago",
        avatar: "/avatars/emily.jpg",
        joinDate: "2022-11-05",
    },
]

export function Users() {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
        const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()
        return matchesSearch && matchesRole && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        const variant = status === "Active" ? "default" : "secondary"
        return <Badge variant={variant}>{status}</Badge>
    }

    const getRoleBadge = (role: string) => {
        const colors = {
            "Super Admin": "bg-red-100 text-red-800",
            Manager: "bg-blue-100 text-blue-800",
            Operator: "bg-green-100 text-green-800",
            Viewer: "bg-gray-100 text-gray-800",
        }
        return (
            <Badge variant="outline" className={colors[role as keyof typeof colors]}>
                {role}
            </Badge>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage system users and their permissions</p>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700">
                    <IconUserPlus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
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
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <IconUsers className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "Active").length}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <IconUsers className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {users.filter((u) => u.role.includes("Admin")).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Admin users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                        <IconUserPlus className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">2</div>
                        <p className="text-xs text-muted-foreground">Recent additions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                    <div className="flex gap-4 pt-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="super admin">Super Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="operator">Operator</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                                <AvatarFallback>
                                                    {user.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <IconMail className="h-3 w-3 text-muted-foreground" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <IconPhone className="h-3 w-3" />
                                                {user.phone}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm">
                                                <IconEdit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
