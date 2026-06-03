import { useEffect, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import Select, {
  type OptionProps,
  type MultiValueProps,
  type MultiValue,
} from "react-select";
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
import { Search, User, Mail, Calendar, Cpu } from "lucide-react";

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

interface UserData {
  id: number;
  email: string;
  password?: string;
  user_role: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company_code: string;
  role_code: string;
  machine_type: string | null;
  update_at: string;
  superAdminRoles: number;
  adminRoles: number;
  opsRoles: number;
  companyRoles: number;
  machines: Machine[];
}

interface MachineListResponse {
  data: Machine[];
}

interface ApiResponse {
  statusCode: string;
  message: string;
  data: UserData[];
  pagination?: { total: number };
  total?: number;
  superAdminRoles?: number;
  adminRoles?: number;
  opsRoles?: number;
  companyRoles?: number;
  fulfillRoles?: number;
  financeRoles?: number;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

// Constants
const DEFAULT_PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "super admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "ops", label: "Ops" },
  { value: "fulfillment", label: "Fulfillment / Operations" },
  { value: "company", label: "Corporate" },
  { value: "finance", label: "Finance" },
];

const MACHINE_TYPE_OPTIONS = [
  { value: "liquid", label: "Liquid" },
  { value: "product", label: "Product" },
];

// Pure helpers
const getRoleCode = (role: string): string => {
  const roleMap: Record<string, string> = {
    "super admin": "0",
    superadmin: "0",
    admin: "1",
    ops: "2",
    company: "3",
    corporate: "3",
    fulfillment: "4",
    "Fulfill":"4",
    finance: "5",
  };
  return roleMap[role.toLowerCase()] ?? "3";
};

const getRoleBadgeColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    "super admin": "bg-red-500 text-white border-transparent hover:bg-red-500",
    superadmin: "bg-red-500 text-white border-transparent hover:bg-red-500",
    admin: "bg-blue-500 text-white border-transparent hover:bg-blue-500",
    ops: "bg-orange-500 text-white border-transparent hover:bg-orange-500",
    company: "bg-cyan-500 text-white border-transparent hover:bg-cyan-500",
    corporate: "bg-cyan-500 text-white border-transparent hover:bg-cyan-500",
    fulfillment: "bg-purple-500 text-white border-transparent hover:bg-purple-500",
    finance: "bg-green-500 text-white border-transparent hover:bg-green-500",
  };
  return roleColors[role.toLowerCase()] ?? "bg-gray-500 text-white border-transparent";
};

const formatRoleDisplay = (role: string): string => {
  if (!role) return "Unknown";
  const roleMap: Record<string, string> = {
    "super admin": "Super Admin",
    superadmin: "Super Admin",
    admin: "Admin",
    ops: "Ops",
    operations: "Ops",
    company: "Corporate",
    corporate: "Corporate",
    fulfillment: "Fulfillment",
    finance: "Finance",
  };
  return (
    roleMap[role.toLowerCase()] ??
    role.charAt(0).toUpperCase() + role.slice(1)
  );
};

// const getRowBgColor = (role: string): string => {
//   const roleColors: Record<string, string> = {
//     "super admin": "bg-red-50",
//     superadmin: "bg-red-50",
//     admin: "bg-blue-50",
//     ops: "bg-orange-50",
//     company: "bg-cyan-50",
//     corporate: "bg-cyan-50",
//     fulfillment: "bg-purple-50",
//     finance: "bg-green-50",
//   };
//   return roleColors[role.toLowerCase()] ?? "";
// };

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Custom React Select components
const CustomOption = ({
  innerProps,
  label,
  isSelected,
}: OptionProps<MachineOption>) => (
  <div
    {...innerProps}
    className={`p-2 cursor-pointer hover:bg-gray-100 ${isSelected ? "bg-teal-50" : ""}`}
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

const CustomMultiValue = ({
  innerProps,
  data,
  removeProps,
}: MultiValueProps<MachineOption>) => (
  <div
    {...innerProps}
    className="bg-teal-600 text-white rounded px-2 py-1 m-1 text-sm flex items-center gap-1"
  >
    <span>{data.machine_name}</span>
    <button
      {...(removeProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      className="ml-1 hover:bg-teal-700 rounded-full w-4 h-4 flex items-center justify-center text-white"
    >
      ×
    </button>
  </div>
);

// Mobile user card
function MobileUserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: UserData;
  onEdit: (user: UserData) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm flex items-center gap-1.5 truncate">
          <User className="size-3.5 text-teal-600 shrink-0" />
          {user.first_name} {user.last_name}
        </p>
        <Badge className={`shrink-0 ${getRoleBadgeColor(user.user_role)}`}>
          {formatRoleDisplay(user.user_role)}
        </Badge>
      </div>
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-teal-600truncate">
          <Mail className="size-3 shrink-0 text-teal-600" />
          {user.email}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3 shrink-0 text-teal-600" />
          {formatDate(user.created_at)}
        </p>
        {user.machines.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Cpu className="size-3 shrink-0 mt-0.5 text-teal-600" />
            <div className="flex flex-wrap gap-1">
              {user.machines.slice(0, 3).map((m, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {m.machine_code}
                </Badge>
              ))}
              {user.machines.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.machines.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
          <IconEdit className="h-4 w-4 text-teal-600" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(user.id)}>
          <IconTrash className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

const Roles = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalRoleList, setTotalRolesList] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [machineType, setMachineType] = useState<string>("");
  const [machineOptions, setMachineOptions] = useState<MachineOption[]>([]);
  const [currentUserForEdit, setCurrentUserForEdit] =
    useState<UserData | null>(null);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const totalPages = Math.ceil(totalRecords / pageSize);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<UserFormData>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchRoles(1, pageSize, debouncedSearch);
  }, [debouncedSearch]);

  const fetchRoles = async (
    page: number = 1,
    limit: number = pageSize,
    search: string = debouncedSearch,
  ) => {
    try {
      setLoading(true);
      const res = await getRequest<ApiResponse>(
        `/superadmin/getAllRoleLists?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      );
      if (res) {
        setTotalRolesList(res);
        setUsers(res.data);
        setTotalRecords(res.total ?? res.data.length);
        setCurrentPage(page);
      }
    } catch (error: unknown) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles data");
    } finally {
      setLoading(false);
    }
  };

  const getAllMachineList = async (selectedType: string) => {
    try {
      const res = await getRequest<MachineListResponse>(
        `/superadmin/getAllMachines?machine_type=${selectedType}`,
      );
      if (res.data) {
        const options: MachineOption[] = res.data.map((machine) => ({
          value: machine.machine_code,
          label: `${machine.machine_name} | ${machine.machine_code}`,
          machine_name: machine.machine_name,
          machine_code: machine.machine_code,
        }));
        setMachineOptions(options);
      }
    } catch (error: unknown) {
      console.error("Error fetching machines:", error);
      toast.error("Failed to fetch machine data");
    }
  };

  useEffect(() => {
    fetchRoles(1, pageSize);
  }, []);

  useEffect(() => {
    if (machineType) {
      getAllMachineList(machineType);
      if (!editDialogOpen) setSelectedMachines([]);
    } else {
      setMachineOptions([]);
      setSelectedMachines([]);
    }
  }, [machineType, editDialogOpen]);

  useEffect(() => {
    if (editDialogOpen && currentUserForEdit) {
      setValue("firstName", currentUserForEdit.first_name);
      setValue("lastName", currentUserForEdit.last_name);
      setValue("email", currentUserForEdit.email);
      setValue("password", currentUserForEdit.password);
      setUserRole(currentUserForEdit.user_role);
      setMachineType(currentUserForEdit.machine_type ?? "");
      if (
        currentUserForEdit.user_role === "company" &&
        currentUserForEdit.machines.length > 0
      ) {
        setSelectedMachines(
          currentUserForEdit.machines.map((m) => m.machine_code),
        );
      } else {
        setSelectedMachines([]);
      }
    } else if (!editDialogOpen) {
      resetForm();
    }
  }, [editDialogOpen, currentUserForEdit, setValue, reset]);

  const resetForm = () => {
    reset();
    setUserRole("");
    setMachineType("");
    setSelectedMachines([]);
    setCurrentUserForEdit(null);
    setMachineOptions([]);
  };

  const onSubmit = async (data: UserFormData) => {
    if (!userRole) {
      toast.error("User role is required");
      return;
    }
    try {
      setCreating(true);
      const isCorporate = userRole === "company";
      await postRequest("/superadmin/addNewRole", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        userRole,
        machine_type: isCorporate ? machineType || null : null,
        roleCode: getRoleCode(userRole),
        machine_code: isCorporate
          ? selectedMachines.map((m) => ({ machine_code: m }))
          : [],
      });
      toast.success("User created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchRoles(currentPage, pageSize);
    } catch (error: unknown) {
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
      await putRequest(`/superadmin/updateRole/${currentUserForEdit.id}`, {
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyCode: 0,
        user_role: currentUserForEdit.user_role,
        roleCode: currentUserForEdit.role_code,
        machine_type:
          currentUserForEdit.user_role === "company"
            ? machineType || null
            : null,
        machine_code:
          userRole === "company"
            ? selectedMachines.map((m) => ({ machine_code: m }))
            : [],
      });
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      fetchRoles(currentPage, pageSize);
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteRequest(`/superadmin/deleteRole/${userId}`);
      toast.success("User deleted successfully");
      fetchRoles(currentPage, pageSize);
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = Number(size);
    setPageSize(newSize);
    setCurrentPage(1);
    fetchRoles(1, newSize, debouncedSearch);
  };

  const handleMachineSelectionChange = (
    selectedOptions: MultiValue<MachineOption>,
  ) => {
    setSelectedMachines(
      selectedOptions ? selectedOptions.map((o) => o.value) : [],
    );
  };

  const machineSelectJsx = (
    <div className="flex-1">
      <Label className="mb-2 block">Select Machine Type</Label>
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
        value={machineOptions.filter((o) => selectedMachines.includes(o.value))}
        onChange={handleMachineSelectionChange}
        isDisabled={!machineType}
        placeholder={machineType ? "Select machines..." : "Select machine type first"}
        className="react-select-container"
        classNamePrefix="react-select"
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        components={{ Option: CustomOption, MultiValue: CustomMultiValue }}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: "#d1d5db",
            "&:hover": { borderColor: "#9ca3af" },
            minHeight: "42px",
          }),
          menu: (base) => ({ ...base, zIndex: 50 }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#0d9488",
            color: "white",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "white",
            fontWeight: "500",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "white",
            ":hover": { backgroundColor: "#0f766e", color: "white" },
          }),
        }}
      />
      {!machineType && (
        <p className="text-sm text-teal-600 mt-1">
          Please select a machine type first
        </p>
      )}
      {machineType && machineOptions.length === 0 && (
        <p className="text-sm text-teal-600 mt-1">
          No machines available for this type
        </p>
      )}
    </div>
  );

  const renderMachineSelection = () =>
    userRole === "company" ? machineSelectJsx : null;

  const renderEditMachineSelection = () =>
    currentUserForEdit?.user_role === "company" ? machineSelectJsx : null;

  return (
    <div>
      <SiteHeader title="Roles" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Roles</h1>


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
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
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
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
                        message:
                          "Password must be at least 8 characters, include uppercase, lowercase, number, and special character",
                      },
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
                      <Label htmlFor="userRole" className="mb-2 block">User Role</Label>
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
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={creating}>
                    {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit User Details</DialogTitle>
                <DialogDescription>Change the user's information</DialogDescription>
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
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
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
                      minLength: { value: 6, message: "Password must be at least 6 characters" },
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
                      <Label htmlFor="editUserRole" className="mb-2 block">User Role</Label>
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
                      
                      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-md bg-yellow-50 border border-yellow-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 text-yellow-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-medium text-yellow-700">Cannot change user role</p>
                      </div>
                    </div>
                    {renderEditMachineSelection()}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={editing}>
                    {editing && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        {/* Statistics Cards — 2×2 on mobile, 3 cols on md, 6 cols on lg */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Super Admins</CardTitle>
              <IconShield className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.superAdminRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">System administrators</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Admins</CardTitle>
              <IconShield className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.adminRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">Business development</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Ops</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.opsRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">Operations staff</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Fulfillment</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.fulfillRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">Fulfillment team</p>
            </CardContent>
          </Card>

          <Card className="bg-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Corporate</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.companyRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">Corporate accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Finance</CardTitle>
              <IconUsers className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalRoleList?.financeRoles ?? 0}
              </div>
              <p className="text-xs text-white/80">Finance team</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles Management</CardTitle>
            <CardDescription>Manage users and their assigned roles</CardDescription>
          </CardHeader>
          <div className="relative px-3 sm:px-6 py-3 border-b">
            <Search className="absolute left-6 sm:left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
            <Input
              placeholder="Search by Name / Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden space-y-3">
                  {users.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No users found.
                    </div>
                  ) : (
                    users.map((user) => (
                      <MobileUserCard
                        key={user.id}
                        user={user}
                        onEdit={(u) => {
                          setCurrentUserForEdit(u);
                          setEditDialogOpen(true);
                        }}
                        onDelete={handleDeleteUser}
                      />
                    ))
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-hidden rounded-t-lg border border-gray-200 shadow-sm">
                  <Table>
                    <TableHeader className="bg-teal-600">
                      <TableRow>
                        {["Name", "Email", "Role", "Created", "Machines", "Actions"].map(
                          (head) => (
                            <TableHead key={head} className="!text-white font-semibold">
                              {head}
                            </TableHead>
                          ),
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} >
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-1.5">
                                <User className="size-3.5 text-teal-600 shrink-0" />
                                {user.first_name} {user.last_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                <Mail className="size-3.5  shrink-0 text-teal-600" />
                                {user.email}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.user_role)}>
                                {formatRoleDisplay(user.user_role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-teal-600 shrink-0" />
                                {formatDate(user.created_at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                {user.machines.length > 0 ? (
                                  <>
                                    <Cpu className="size-3.5 text-teal-600 shrink-0" />
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
                                  <span className="text-teal-600 text-sm">—</span>
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
                                  <IconEdit className="h-4 w-4 text-teal-600" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteUser(user.id)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <IconTrash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start sm:gap-6">
                    <p className="text-sm tabular-nums">
                      {totalRecords.toLocaleString()} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="rows-per-page-roles"
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Rows per page
                      </Label>
                      <ShadcnSelect
                        value={`${pageSize}`}
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger size="sm" className="w-16" id="rows-per-page-roles">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[5, 10, 20, 30, 40, 50].map((ps) => (
                            <SelectItem key={ps} value={`${ps}`}>
                              {ps}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShadcnSelect>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                      onClick={() => fetchRoles(1, pageSize)}
                      disabled={currentPage === 1 || loading}
                    >
                      <span className="sr-only">First page</span>
                      <IconChevronsLeft className="size-4 text-violet-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => fetchRoles(currentPage - 1, pageSize)}
                      disabled={currentPage === 1 || loading}
                    >
                      <span className="sr-only">Previous page</span>
                      <IconChevronLeft className="size-4 text-blue-500" />
                    </Button>
                    <span className="px-2 text-sm font-medium tabular-nums">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                      onClick={() => fetchRoles(currentPage + 1, pageSize)}
                      disabled={currentPage === totalPages || loading}
                    >
                      <span className="sr-only">Next page</span>
                      <IconChevronRight className="size-4 text-teal-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                      onClick={() => fetchRoles(totalPages, pageSize)}
                      disabled={currentPage === totalPages || loading}
                    >
                      <span className="sr-only">Last page</span>
                      <IconChevronsRight className="size-4 text-emerald-500" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roles;
