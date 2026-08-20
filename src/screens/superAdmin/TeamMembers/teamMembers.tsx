import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconEdit,
  IconLoader2,
  IconBrandLinkedin,
  IconBriefcase,
  IconCamera,
  IconUserCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getRequest } from "@/Apis/Api";
import { BASE_URL, BASE_URL_TWO } from "@/constants/Constant";
import { User, Search } from "lucide-react";

// Backend returns a server-relative path (e.g. "/uploads/team_members/xyz.png"),
// so resolve it against the API host — BASE_URL_TWO is the root, unlike BASE_URL
// which already includes the /api/dashboard prefix.
const getTeamImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL_TWO.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

interface TeamMember {
  id: number;
  employee_name: string;
  designation: string;
  linkedin: string;
  image?: string | null;
}

interface TeamMemberFormData {
  employee_name: string;
  designation: string;
  linkedin: string;
}

const extractTeamList = (res: unknown): TeamMember[] => {
  if (Array.isArray(res)) return res as TeamMember[];
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>;
    const candidate = obj.data ?? obj.team ?? obj.members ?? obj.results;
    if (Array.isArray(candidate)) return candidate as TeamMember[];
  }
  return [];
};

const buildTeamFormData = (data: TeamMemberFormData, image: File | null): FormData => {
  const formData = new FormData();
  formData.append("employee_name", data.employee_name);
  formData.append("designation", data.designation);
  formData.append("linkedin", data.linkedin);
  if (image) formData.append("image", image);
  return formData;
};

// Uses raw fetch (not the axios `api` instance) so the browser can set the
// multipart boundary itself — the axios instance forces Content-Type: application/json.
const submitTeamForm = async (url: string, method: "POST" | "PUT", formData: FormData) => {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json().catch(() => null);
};

function PhotoPicker({
  label,
  previewUrl,
  onSelect,
}: {
  label: string;
  previewUrl: string | null;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Avatar className="size-16 border">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Team member photo" className="object-cover" />
          ) : null}
          <AvatarFallback>
            <IconUserCircle className="size-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <IconCamera className="mr-2 h-4 w-4" />
          {previewUrl ? "Change Photo" : "Upload Photo"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

const TeamMembers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentMemberForEdit, setCurrentMemberForEdit] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<TeamMemberFormData>();

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await getRequest<unknown>("/superadmin/getTeam");
      setMembers(extractTeamList(res));
    } catch (error: unknown) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (editDialogOpen && currentMemberForEdit) {
      setValue("employee_name", currentMemberForEdit.employee_name);
      setValue("designation", currentMemberForEdit.designation);
      setValue("linkedin", currentMemberForEdit.linkedin);
      setEditPhotoPreview(getTeamImageUrl(currentMemberForEdit.image) ?? null);
      setEditPhotoFile(null);
    } else if (!editDialogOpen) {
      reset();
      setCurrentMemberForEdit(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    }
  }, [editDialogOpen, currentMemberForEdit, setValue, reset]);

  const selectAddPhoto = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const selectEditPhoto = (file: File) => {
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setCreating(true);
      await submitTeamForm("/superadmin/addTeam", "POST", buildTeamFormData(data, photoFile));
      toast.success("Team member added successfully");
      setIsDialogOpen(false);
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchTeam();
    } catch (error: unknown) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    } finally {
      setCreating(false);
    }
  };

  const onEditSubmit = async (data: TeamMemberFormData) => {
    if (!currentMemberForEdit) {
      toast.error("No team member selected for editing");
      return;
    }
    try {
      setEditing(true);
      await submitTeamForm(
        `/superadmin/updateTeam/${currentMemberForEdit.id}`,
        "PUT",
        buildTeamFormData(data, editPhotoFile),
      );
      toast.success("Team member updated successfully");
      setEditDialogOpen(false);
      fetchTeam();
    } catch (error: unknown) {
      console.error("Error updating team member:", error);
      toast.error("Failed to update team member");
    } finally {
      setEditing(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      m.employee_name?.toLowerCase().includes(term) ||
      m.designation?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <SiteHeader title="Team Members" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Team Members</h1>

          {/* Add Team Member Dialog */}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                reset();
                setPhotoFile(null);
                setPhotoPreview(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <IconPlus className="mr-2 h-4 w-4" /> Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Fill in the team member's details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <PhotoPicker label="Photo" previewUrl={photoPreview} onSelect={selectAddPhoto} />
                <div className="grid gap-2">
                  <Label htmlFor="employee_name">Employee Name</Label>
                  <Input
                    id="employee_name"
                    {...register("employee_name", { required: "Employee name is required" })}
                    placeholder="Enter employee name"
                  />
                  {errors.employee_name && (
                    <p className="text-red-500 text-sm">{errors.employee_name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...register("designation", { required: "Designation is required" })}
                    placeholder="Enter designation"
                  />
                  {errors.designation && (
                    <p className="text-red-500 text-sm">{errors.designation.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    {...register("linkedin", {
                      required: "LinkedIn URL is required",
                      pattern: {
                        value: /^https?:\/\/.+/i,
                        message: "Enter a valid URL",
                      },
                    })}
                    placeholder="https://www.linkedin.com/in/username"
                  />
                  {errors.linkedin && (
                    <p className="text-red-500 text-sm">{errors.linkedin.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={creating}>
                    {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Team Member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Team Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>Update the team member's information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onEditSubmit)} className="grid gap-4 py-4">
              <PhotoPicker label="Photo" previewUrl={editPhotoPreview} onSelect={selectEditPhoto} />
              <div className="grid gap-2">
                <Label htmlFor="editEmployeeName">Employee Name</Label>
                <Input
                  id="editEmployeeName"
                  {...register("employee_name", { required: "Employee name is required" })}
                  placeholder="Enter employee name"
                />
                {errors.employee_name && (
                  <p className="text-red-500 text-sm">{errors.employee_name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDesignation">Designation</Label>
                <Input
                  id="editDesignation"
                  {...register("designation", { required: "Designation is required" })}
                  placeholder="Enter designation"
                />
                {errors.designation && (
                  <p className="text-red-500 text-sm">{errors.designation.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLinkedin">LinkedIn URL</Label>
                <Input
                  id="editLinkedin"
                  type="url"
                  {...register("linkedin", {
                    required: "LinkedIn URL is required",
                    pattern: {
                      value: /^https?:\/\/.+/i,
                      message: "Enter a valid URL",
                    },
                  })}
                  placeholder="https://www.linkedin.com/in/username"
                />
                {errors.linkedin && (
                  <p className="text-red-500 text-sm">{errors.linkedin.message}</p>
                )}
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

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage the team members shown on the company profile.</CardDescription>
          </CardHeader>
          <div className="relative px-3 sm:px-6 py-3 border-b">
            <Search className="absolute left-6 sm:left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
            <Input
              placeholder="Search by name / designation"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading team members...</span>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden space-y-3">
                  {filteredMembers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No team members found.
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const imageUrl = getTeamImageUrl(member.image);
                      return (
                      <div key={member.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="size-9 border shrink-0">
                              {imageUrl ? (
                                <AvatarImage src={imageUrl} alt={member.employee_name} className="object-cover" />
                              ) : null}
                              <AvatarFallback>
                                <User className="size-4 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm truncate">{member.employee_name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentMemberForEdit(member);
                              setEditDialogOpen(true);
                            }}
                          >
                            <IconEdit className="h-4 w-4 text-teal-600" />
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconBriefcase className="size-3.5 shrink-0 text-teal-600" />
                            {member.designation}
                          </p>
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline truncate"
                          >
                            <IconBrandLinkedin className="size-3.5 shrink-0" />
                            {member.linkedin}
                          </a>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-hidden rounded-t-lg border border-gray-200 shadow-sm">
                  <Table>
                    <TableHeader className="bg-teal-600">
                      <TableRow>
                        {["Photo", "Employee Name", "Designation", "LinkedIn", "Actions"].map((head) => (
                          <TableHead key={head} className="!text-white font-semibold">
                            {head}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No team members found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((member) => {
                          const imageUrl = getTeamImageUrl(member.image);
                          return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Avatar className="size-9 border">
                                {imageUrl ? (
                                  <AvatarImage src={imageUrl} alt={member.employee_name} className="object-cover" />
                                ) : null}
                                <AvatarFallback>
                                  <User className="size-4 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{member.employee_name}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                <IconBriefcase className="size-3.5 shrink-0 text-teal-600" />
                                {member.designation}
                              </span>
                            </TableCell>
                            <TableCell>
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-teal-600 hover:underline"
                              >
                                <IconBrandLinkedin className="size-3.5 shrink-0" />
                                View Profile
                              </a>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => {
                                  setCurrentMemberForEdit(member);
                                  setEditDialogOpen(true);
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                <IconEdit className="h-4 w-4 text-teal-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamMembers;