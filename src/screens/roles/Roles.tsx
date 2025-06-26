"use client"

import React, { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconPlus, IconEdit, IconTrash, IconUsers, IconShield } from "@tabler/icons-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const existingRoles = [
    { id: 1, name: "Super Admin", description: "Full system access", permissions: ["All"], users: 2, status: "Active" },
    {
        id: 2,
        name: "Manager",
        description: "Department management",
        permissions: ["Users", "Reports"],
        users: 5,
        status: "Active",
    },
    {
        id: 3,
        name: "Operator",
        description: "Machine operations",
        permissions: ["Machines", "Points"],
        users: 12,
        status: "Active",
    },
    { id: 4, name: "Viewer", description: "Read-only access", permissions: ["View"], users: 8, status: "Inactive" },
]

const Roles = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [roleName, setRoleName] = useState("")
    const [roleDescription, setRoleDescription] = useState("")
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

    const permissions = [
        "Dashboard Access",
        "User Management",
        "Machine Control",
        "Points Management",
        "Location Management",
        "Financial Operations",
        "Notifications",
        "Reports & Analytics",
    ]
    return (
        <div>
            <SiteHeader title='Roles' />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
                        <p className="text-muted-foreground">Create and manage user roles and permissions</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700">
                                <IconPlus className="mr-2 h-4 w-4" />
                                Create Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Role</DialogTitle>
                                <DialogDescription>Define a new role with specific permissions and access levels.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="role-name">Role Name</Label>
                                    <Input
                                        id="role-name"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="Enter role name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role-description">Description</Label>
                                    <Textarea
                                        id="role-description"
                                        value={roleDescription}
                                        onChange={(e) => setRoleDescription(e.target.value)}
                                        placeholder="Describe the role responsibilities"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Permissions</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {permissions.map((permission) => (
                                            <div key={permission} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={permission}
                                                    className="rounded border-gray-300"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedPermissions([...selectedPermissions, permission])
                                                        } else {
                                                            setSelectedPermissions(selectedPermissions.filter((p) => p !== permission))
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={permission} className="text-sm">
                                                    {permission}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsDialogOpen(false)}>
                                    Create Role
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                            <IconShield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">4</div>
                            <p className="text-xs text-muted-foreground">Active roles in system</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">27</div>
                            <p className="text-xs text-muted-foreground">Users with assigned roles</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                            <IconShield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-muted-foreground">Currently active roles</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Roles</CardTitle>
                        <CardDescription>Manage and edit existing user roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {existingRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.map((permission) => (
                                                    <Badge key={permission} variant="secondary" className="text-xs">
                                                        {permission}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>{role.users}</TableCell>
                                        <TableCell>
                                            <Badge variant={role.status === "Active" ? "default" : "secondary"}>{role.status}</Badge>
                                        </TableCell>
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
        </div>
    )
}

export default Roles
