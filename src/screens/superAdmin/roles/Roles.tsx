"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Select from 'react-select';
import { SiteHeader } from "@/components/superAdmin/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/Apis/Api";

// Interfaces
interface Machine {
  machine_code: string;
  machine_name: string;
}

interface MachineOption {
  value: string;
  label: string;
  machine_name: string;
  machine_code: string;
}

interface User {
  id: number;
  email: string;
  user_role: string;
  password: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company_code: string;
  role_code: string;
  machine_type: string | null;
  update_at: string;
  superAdminRoles: number;
  adminRoles:number;
  opsRoles:number;
  companyRoles: number;
  machines: Machine[];
}

interface ApiResponse {
  statusCode: string;
  message: string;
  data: User[];
  pagination?: {
    total: number;
  };
  total?: number;
  superAdminRoles?: number;
  adminRoles?: number;
  opsRoles?: number;
  companyRoles?: number;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Constants
const DEFAULT_PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "ops", label: "Ops" },
  { value: "admin", label: "Admin" },
  { value: "company", label: "Company" },
];

const MACHINE_TYPE_OPTIONS = [
  { value: "liquid", label: "Liquid" },
  { value: "product", label: "Product" },
];

// Custom components for React Select
const CustomOption = ({ innerProps, label, data, isSelected }: any) => (
  <div
    {...innerProps}
    className={`p-2 cursor-pointer hover:bg-gray-100 ${
      isSelected ? 'bg-teal-50' : ''
    }`}
  >
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        className="mr-2 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      {label}
    </div>
  </div>
);

const CustomMultiValue = ({ innerProps, data, removeProps }: any) => (
  <div
    {...innerProps}
    className="bg-teal-600 text-white rounded px-2 py-1 m-1 text-sm flex items-center"
  >
    <span>{data.machine_name}</span>
    <button
      {...removeProps}
      className="ml-1 hover:bg-teal-700 rounded-full w-4 h-4 flex items-center justify-center"
    >
      ×
    </button>
  </div>
);

const Roles = () => {
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalRoleList, setTotalRolesList] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [machineType, setMachineType] = useState<string>("");
  const [machineData, setMachineData] = useState<Machine[]>([]);
  const [machineOptions, setMachineOptions] = useState<MachineOption[]>([]);
  const [currentUserForEdit, setCurrentUserForEdit] = useState<User | null>(null);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.ceil(totalRecords / pageSize);

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<UserFormData>();

  // Data fetching
  const fetchRoles = async (page: number = 1, limit: number = pageSize) => {
    try {
      setLoading(true);
      const res: ApiResponse = await getRequest(
        `/superadmin/getAllRoleLists?page=${page}&limit=${limit}`
      );

      if (res) {
        setTotalRolesList(res);
        setUsers(res.data);
        setTotalRecords(res.total || res.data.length);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles data");
    } finally {
      setLoading(false);
    }
  };

  const getAllMachineList = async (selectedType: string) => { 
    try {
      const res = await getRequest(
        `/superadmin/getAllMachines?machine_type=${selectedType}`
      );
      if (res.data) {
        setMachineData(res.data);
        // Transform machine data to React Select options
        const options: MachineOption[] = res.data.map((machine: Machine) => ({
          value: machine.machine_code,
          label: `${machine.machine_name} | ${machine.machine_code}`,
          machine_name: machine.machine_name,
          machine_code: machine.machine_code
        }));
        setMachineOptions(options);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
      toast.error("Failed to fetch machine data");
    }
  };

  // Effects
  useEffect(() => {
    fetchRoles(1, pageSize);
  }, []);

  useEffect(() => {
    if (machineType) {
      getAllMachineList(machineType);
      if (!editDialogOpen) {
        setSelectedMachines([]);
      }
    } else {
      setMachineOptions([]);
      setSelectedMachines([]);
    }
  }, [machineType, editDialogOpen]);

  useEffect(() => {
    if (editDialogOpen && currentUserForEdit) {
      // Pre-fill form for editing
      setValue("firstName", currentUserForEdit.first_name);
      setValue("lastName", currentUserForEdit.last_name);
      setValue("email", currentUserForEdit.email);
      setValue("password", currentUserForEdit.password);
      
      // Set user role
      setUserRole(currentUserForEdit.user_role);
      
      // Set machine type if exists
      if (currentUserForEdit.machine_type) {
        setMachineType(currentUserForEdit.machine_type);
      } else {
        setMachineType("");
      }
      
      // Set selected machines for company role
      if (
        currentUserForEdit.user_role === "company" &&
        currentUserForEdit.machines.length > 0
      ) {
        const machineCodes = currentUserForEdit.machines.map(machine => machine.machine_code);
        setSelectedMachines(machineCodes);
      } else {
        setSelectedMachines([]);
      }
    } else if (!editDialogOpen) {
      // Reset form when dialog closes
      resetForm();
    }
  }, [editDialogOpen, currentUserForEdit, setValue, reset]);

  // Helper functions
  const resetForm = () => {
    reset();
    setUserRole("");
    setMachineType("");
    setSelectedMachines([]);
    setCurrentUserForEdit(null);
    setMachineOptions([]);
  };

  const getRoleCode = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      admin: "1",
      ops: "2",
      company: "3"
    };
    return roleMap[role] || "3";
  };

  const getRoleBadgeVariant = (role: string) => {
    const roleVariants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "super admin": "destructive",
      "admin": "default",
      "ops": "secondary",
      "company": "outline",
    };
    return roleVariants[role.toLowerCase()] || "secondary";
  };

  const formatRoleDisplay = (role: string) => {
    if (!role) return "Unknown";
    
    const roleLower = role.toLowerCase();
    const roleMap: { [key: string]: string } = {
      "super admin": "Super Admin",
      "superadmin": "Super Admin",
      "admin": "Admin",
      "ops": "Ops",
      "operations": "Ops",
      "company": "Company",
    };
    
    return roleMap[roleLower] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Event handlers
  const onSubmit = async (data: UserFormData) => {
    if (!userRole) {
      toast.error("User role is required");
      return;
    }

    try {
      setCreating(true);
      const newUser = { 
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        userRole: userRole,
        machine_type: userRole === "company" ? machineType || null : null,
        roleCode: getRoleCode(userRole),
        machine_code: userRole === "company"
          ? selectedMachines.map(m => ({ machine_code: m }))
          : [],
      };

      await postRequest("/superadmin/addNewRole", newUser);
      toast.success("User created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchRoles(currentPage, pageSize);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const onEditSubmit = async (data: UserFormData) => {
    if (!currentUserForEdit) {
      toast.error("No user selected for editing");
      return;
    }

    try {
      setEditing(true);
      const updatedUser = {
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyCode:0,
        user_role: currentUserForEdit.user_role,
        roleCode: currentUserForEdit.role_code,
        machine_type: currentUserForEdit.user_role === "company" ? machineType || null : null,
        machine_code: userRole === "company"
          ? selectedMachines.map(m => ({ machine_code: m }))
          : [],
      };

      await putRequest(
        `/superadmin/updateRole/${currentUserForEdit.id}`,
        updatedUser
      );

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      fetchRoles(currentPage, pageSize);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteRequest(`/superadmin/deleteRole/${userId}`);
      toast.success("User deleted successfully");
      fetchRoles(currentPage, pageSize);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = Number(size);
    setPageSize(newSize);
    setCurrentPage(1);
    fetchRoles(1, newSize);
  };

  const handleMachineSelectionChange = (selectedOptions: any) => {
    const selectedValues = selectedOptions 
      ? selectedOptions.map((option: MachineOption) => option.value)
      : [];
    setSelectedMachines(selectedValues);
  };

  // Render functions
  const renderMachineSelection = () => {
    if (userRole !== "company") return null;

    return (
      <div className="flex-1">
        <Label htmlFor="machineType" className="mb-2 block">
          Select Machine Type
        </Label>
        <ShadcnSelect value={machineType} onValueChange={setMachineType}>
          <SelectTrigger>
            <SelectValue placeholder="Select Machine Type" />
          </SelectTrigger>
          <SelectContent>
            {MACHINE_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>

        <Label className="mt-4 mb-2 block">Select Machines</Label>
        <Select
          isMulti
          options={machineOptions}
          value={machineOptions.filter(option => 
            selectedMachines.includes(option.value)
          )}
          onChange={handleMachineSelectionChange}
          isDisabled={!machineType}
          placeholder={machineType ? "Select machines..." : "Select machine type first"}
          className="react-select-container"
          classNamePrefix="react-select"
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          components={{
            Option: CustomOption,
            MultiValue: CustomMultiValue
          }}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: '#d1d5db',
              '&:hover': {
                borderColor: '#9ca3af'
              },
              minHeight: '42px'
            }),
            menu: (base) => ({
              ...base,
              zIndex: 50
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: '#0d9488',
              color: 'white'
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: 'white',
              fontWeight: '500'
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: 'white',
              ':hover': {
                backgroundColor: '#0f766e',
                color: 'white'
              }
            })
          }}
        />
        {!machineType && (
          <p className="text-sm text-muted-foreground mt-1">
            Please select a machine type first
          </p>
        )}
        {machineType && machineOptions.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            No machines available for this type
          </p>
        )}
      </div>
    );
  };

  const renderEditMachineSelection = () => {
    if (currentUserForEdit?.user_role !== "company") return null;

    return (
      <div className="flex-1">
        <Label htmlFor="editMachineType" className="mb-2 block">
          Select Machine Type
        </Label>
        <ShadcnSelect value={machineType} onValueChange={setMachineType}>
          <SelectTrigger>
            <SelectValue placeholder="Select Machine Type" />
          </SelectTrigger>
          <SelectContent>
            {MACHINE_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>

        <Label className="mt-4 mb-2 block">Select Machines</Label>
        <Select
          isMulti
          options={machineOptions}
          value={machineOptions.filter(option => 
            selectedMachines.includes(option.value)
          )}
          onChange={handleMachineSelectionChange}
          isDisabled={!machineType}
          placeholder={machineType ? "Select machines..." : "Select machine type first"}
          className="react-select-container"
          classNamePrefix="react-select"
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          components={{
            Option: CustomOption,
            MultiValue: CustomMultiValue
          }}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: '#d1d5db',
              '&:hover': {
                borderColor: '#9ca3af'
              },
              minHeight: '42px'
            }),
            menu: (base) => ({
              ...base,
              zIndex: 50
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: '#0d9488',
              color: 'white'
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: 'white',
              fontWeight: '500'
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: 'white',
              ':hover': {
                backgroundColor: '#0f766e',
                color: 'white'
              }
            })
          }}
        />
        {!machineType && (
          <p className="text-sm text-muted-foreground mt-1">
            Please select a machine type first
          </p>
        )}
        {machineType && machineOptions.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            No machines available for this type
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <SiteHeader title="Roles" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Create and manage user roles and permissions
          </p>
          
          {/* Create User Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <IconPlus className="mr-2 h-4 w-4" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Fill in the user's details and assign a role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName", { required: "First name is required" })}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("lastName", { required: "Last name is required" })}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address"
                      }
                    })}
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    })}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="userRole" className="mb-2 block">
                        User Role
                      </Label>
                      <ShadcnSelect value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShadcnSelect>
                    </div>
                    {renderMachineSelection()}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={creating}
                  >
                    {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit User Details</DialogTitle>
                <DialogDescription>
                  Change the user's information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onEditSubmit)} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    {...register("firstName", { required: "First name is required" })}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    {...register("lastName", { required: "Last name is required" })}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address"
                      }
                    })}
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="editPassword">Password</Label>
                  <Input
                    id="editPassword"
                    type="password"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    })}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="editUserRole" className="mb-2 block">
                        User Role
                      </Label>
                      <ShadcnSelect value={userRole} onValueChange={setUserRole} disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShadcnSelect>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cannot change user role
                      </p>
                    </div>
                    {renderEditMachineSelection()}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={editing}
                  >
                    {editing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-green-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRoleList?.total || 0}</div>
              <p className="text-xs text-black">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-red-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Super Admins</CardTitle>
              <IconShield className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRoleList?.superAdminRoles || 0}</div>
              <p className="text-xs text-black">System administrators</p>
            </CardContent>
          </Card>

          <Card className="bg-cyan-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Companies</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRoleList?.companyRoles || 0}</div>
              <p className="text-xs text-black">Company accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Operators</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRoleList?.opsRoles || 0}</div>
              <p className="text-xs text-black">Operations staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles Management</CardTitle>
            <CardDescription>
              Manage users and their assigned roles
            </CardDescription>
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
              <TableHeader className="bg-teal-600 rounded-t-2xl">
                <TableRow>
                  <TableHead className="text-center text-white font-semibold rounded-tl-2xl">Name</TableHead>
                  <TableHead className="text-center text-white font-semibold">Email</TableHead>
                  <TableHead className="text-center text-white font-semibold">Password</TableHead>
                  <TableHead className="text-center text-white font-semibold">Role</TableHead>
                  <TableHead className="text-center text-white font-semibold">Created</TableHead>
                  <TableHead className="text-center text-white font-semibold">Machines</TableHead>
                  <TableHead className="text-center text-white font-semibold rounded-tr-2xl">Actions</TableHead>
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
                          <span className="text-sm">
                            {visiblePasswords[user.id] ? user.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
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
                          <Badge variant={getRoleBadgeVariant(user.user_role)}>
                            {formatRoleDisplay(user.user_role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.machines.length > 0 ? (
                              <>
                                {user.machines.slice(0, 2).map((machine, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {machine.machine_code}
                                  </Badge>
                                ))}
                                {user.machines.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.machines.length - 2} more
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setCurrentUserForEdit(user);
                                setEditDialogOpen(true);
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Updated Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 mt-4">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                      Showing {users.length} of {totalRecords} user(s)
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                      <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                          Rows per page
                        </Label>
                        <ShadcnSelect
                          value={`${pageSize}`}
                          onValueChange={handlePageSizeChange}
                        >
                          <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                            <SelectValue placeholder={pageSize} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                              <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                      </div>
                      <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                          onClick={() => fetchRoles(1, pageSize)}
                          disabled={currentPage === 1 || loading}
                        >
                          <span className="sr-only">Go to first page</span>
                          <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8 bg-transparent"
                          size="icon"
                          onClick={() => fetchRoles(currentPage - 1, pageSize)}
                          disabled={currentPage === 1 || loading}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="size-8 bg-transparent"
                          size="icon"
                          onClick={() => fetchRoles(currentPage + 1, pageSize)}
                          disabled={currentPage === totalPages || loading}
                        >
                          <span className="sr-only">Go to next page</span>
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="hidden size-8 lg:flex bg-transparent"
                          size="icon"
                          onClick={() => fetchRoles(totalPages, pageSize)}
                          disabled={currentPage === totalPages || loading}
                        >
                          <span className="sr-only">Go to last page</span>
                          <IconChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roles;