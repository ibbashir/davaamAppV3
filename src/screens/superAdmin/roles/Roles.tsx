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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { deleteRequest, getRequest, postRequest } from "@/Apis/Api"

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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [machineType, setMachineType] = useState<string>("")
  const [currentUserForEdit, setCurrentUserForEdit] = useState<User | null>(null) // State for the user being edited

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const res: ApiResponse = await getRequest("/superadmin/getAllRoleLists")
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

  // Effect to pre-fill the edit form when the dialog opens or currentUserForEdit changes
  useEffect(() => {
    if (editDialogOpen && currentUserForEdit) {
      reset({
        firstName: currentUserForEdit.first_name,
        lastName: currentUserForEdit.last_name,
        email: currentUserForEdit.email,
        password: currentUserForEdit.password, // Note: Pre-filling passwords is not recommended for security in production apps.
      })
      setUserRole(currentUserForEdit.user_role) // Set the userRole state for the Select
      setMachineType(currentUserForEdit.machine_type || "") // Set machineType state
    } else if (!editDialogOpen) {
      // Clear form and states when dialog closes
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
      fetchRoles()
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
        id: currentUserForEdit.id, // User ID is crucial for update
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password, // Note: Pre-filling passwords is not recommended for security in production apps.
        user_role: currentUserForEdit.user_role, // User role cannot be changed as per requirement
        role_code: currentUserForEdit.role_code, // Role code cannot be changed
        company_code: currentUserForEdit.company_code, // Keep existing company_code
        machine_type: currentUserForEdit.user_role === "company" ? machineType : null, // Only update if role is company
      }
      console.log("Updating user:", updatedUser)
      await postRequest(`/superadmin/updateRole/${currentUserForEdit.id}`, updatedUser) // Assuming POST for update based on existing API usage
      toast.success("User updated successfully")
      setEditDialogOpen(false)
      fetchRoles()
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
      fetchRoles()
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
          <p className="text-muted-foreground">Create and manage user roles and permissions</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <IconPlus className="mr-2 h-4 w-4" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Fill in the user’s details and assign a role.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register("firstName", { required: true })} placeholder="Enter first name" />
                  {errors.firstName && <p className="text-red-500 text-sm">First name is required</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register("lastName", { required: true })} placeholder="Enter last name" />
                  {errors.lastName && <p className="text-red-500 text-sm">Last name is required</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email", { required: true })} placeholder="Enter email" />
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
                          <SelectItem value="super admin">Super Admin</SelectItem>
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
          {/* edit dialog */}
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
                        {" "}
                        {/* User role is disabled */}
                        <SelectTrigger id="editUserRole">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ops">Ops</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="super admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">Cannot change user role</p> {/* Message */}
                    </div>
                    {currentUserForEdit?.user_role === "company" && ( // Conditional rendering for machine type
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Roles
