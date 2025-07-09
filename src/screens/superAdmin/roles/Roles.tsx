"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconPlus, IconEdit, IconTrash, IconUsers, IconShield, IconLoader2 } from "@tabler/icons-react"
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
import { getRequest } from "@/Apis/Api"

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
    statusCode: string
    message: string
    data: User[]
}

const Roles = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [roleName, setRoleName] = useState("")
    const [roleDescription, setRoleDescription] = useState("")
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const fetchRoles = async () => {
        try {
            setLoading(true)
            const res: ApiResponse = await getRequest("/superadmin/getAllRoleLists")
            console.log(res.data)
            setUsers(res.data)
        } catch (error) {
            console.log(error)
            toast.error("Failed to fetch roles data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

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

    const handleCreateRole = async () => {
        if (!roleName.trim()) {
            toast.error("Role name is required")
            return
        }

        try {
            setCreating(true)
            // Replace with your actual API endpoint for creating roles
            const newRole = {
                name: roleName,
                description: roleDescription,
                permissions: selectedPermissions,
            }

            // await postRequest("/superadmin/createRole", newRole)

            toast.success("Role created successfully")

            setIsDialogOpen(false)
            setRoleName("")
            setRoleDescription("")
            setSelectedPermissions([])
            fetchRoles() // Refresh the data
        } catch (error) {
            console.log(error)
            toast.error("Failed to create role")
        } finally {
            setCreating(false)
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

    // Get role statistics
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
                    <div>
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
                                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleCreateRole} disabled={creating}>
                                    {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Role
                                </Button>
                            </DialogFooter>
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
                            <div className="text-2xl font-bold">{users.length}</div>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Roles
