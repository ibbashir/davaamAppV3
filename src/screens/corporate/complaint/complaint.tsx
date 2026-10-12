import { useCallback, useEffect, useMemo, useState } from "react"
import moment from "moment"
import { toast } from "sonner"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { SiteHeader } from "@/components/corporate/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconLoader2, IconPlus, IconSend } from "@tabler/icons-react"

// NOTE: the complaint endpoints below are assumed — adjust to match the backend.
const POST_COMPLAINT_ENDPOINT = "/corporates/raiseComplaint"
const GET_COMPLAINTS_ENDPOINT = "/corporates/getRaisedComplaint"
const GET_MACHINE_NAMES_ENDPOINT = "/corporates/getMachineNames"

const CATEGORIES = [
  "Machine not dispensing",
  "Machine out of order / offline",
  "Payment or coin issue",
  "Product stuck / wrong product",
  "Low stock / refill required",
  "Cleanliness / hygiene",
  "Physical damage",
  "Other",
] as const

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const

interface Complaint {
  id: number
  title?: string
  description?: string
  priority?: string
  status?: string
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

interface ComplaintsResponse {
  data?: Complaint[]
}

// Machine and category are stored as "Machine: x" / "Category: y" lines in the description.
const parseDetail = (description: string | undefined, label: string) =>
  description?.match(new RegExp(`^${label}:\s*(.+)$`, "m"))?.[1]?.trim()

interface MachineNamesResponse {
  data?: { machine_code: string | number; machine_name?: string }[]
}

interface Attachment {
  id: string
  previewUrl: string
  status: "uploading" | "done" | "error"
  url?: string
}

const emptyForm = {
  machine_code: "",
  category: "",
  priority: "Medium",
  subject: "",
  description: "",
  contact_phone: "",
}

const priorityClass: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
}

// Tracker issue statuses: todo, in_progress, in_review, done.
const statusStyle: Record<string, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  in_review: { label: "In Review", className: "bg-amber-100 text-amber-700" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700" },
}

export default function CorporateComplaint() {
  const { state } = useAuth()
  const { user } = state

  const machineCodes = useMemo<string[]>(
    () => (Array.isArray(user?.machines) ? user.machines.map((m) => m.machine_code) : []),
    [user?.machines]
  )

  const [machineNames, setMachineNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (machineCodes.length === 0) return
    postRequest<MachineNamesResponse>(GET_MACHINE_NAMES_ENDPOINT, { machines: machineCodes })
      .then((res) => {
        setMachineNames(
          Object.fromEntries(
            (res.data ?? []).flatMap((m) =>
              m.machine_name ? [[String(m.machine_code), m.machine_name]] : []
            )
          )
        )
      })
      .catch((err) => console.error("Failed to fetch machine names:", err))
  }, [machineCodes])

  const [form, setForm] = useState(emptyForm)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [listLoading, setListLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [searched, setSearched] = useState("")

  const userId = user?.id

  // Complaints are fetched by reporter id; the optional title narrows them down.
  const fetchComplaints = useCallback(async (title: string) => {
    if (!userId) return
    const trimmed = title.trim()
    setSearched(trimmed)
    setListLoading(true)
    try {
      const res = await postRequest<ComplaintsResponse>(GET_COMPLAINTS_ENDPOINT, { reporterId: userId, ...(trimmed && { title: trimmed }) })
      setComplaints(res.data ?? [])
    } catch (err) {
      console.error("Failed to fetch complaints:", err)
      setComplaints([])
    } finally {
      setListLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchComplaints("")
  }, [fetchComplaints])

  const resetForm = () => {
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl))
    setForm(emptyForm)
    setAttachments([])
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (submitting) return
    setFormOpen(open)
    if (!open) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.machine_code || !form.category || !form.subject.trim() || !form.description.trim()) {
      toast.error("Machine, category, subject and description are required")
      return
    }
    const failed = attachments.filter((a) => a.status === "error")
    if (failed.length > 0) {
      toast.error(`Remove the ${failed.length} image(s) that failed to upload before submitting`)
      return
    }

    setSubmitting(true)
    try {
      // The API only takes project_id/title/description/priority (type is fixed to
      // "bug" server-side), so machine, category, phone and photos go in the description.
      const photoUrls = attachments.flatMap((a) => (a.url ? [a.url] : []))
      const details = [
        `Machine: ${machineNames[form.machine_code] ? `${machineNames[form.machine_code]} (${form.machine_code})` : form.machine_code}`,
        `Category: ${form.category}`,
        form.contact_phone.trim() && `Contact: ${form.contact_phone.trim()}`,
      ].filter(Boolean)
      const description = [
        details.join("\n"),
        form.description.trim(),
        photoUrls.length > 0 && `Photos:\n${photoUrls.join("\n")}`,
      ]
        .filter(Boolean)
        .join("\n\n")

      await postRequest(POST_COMPLAINT_ENDPOINT, {
        title: form.subject.trim(),
        description,
        priority: form.priority.toLowerCase(),
      })
      toast.success("Complaint submitted. Our team will look into it.")
      const subject = form.subject
      resetForm()
      setFormOpen(false)
      setSearch(subject.trim())
      fetchComplaints(subject)
    } catch (err) {
      console.error("Failed to submit complaint:", err)
      toast.error("Failed to submit complaint")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <SiteHeader title="📝 Complaints" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Issues you have reported about your machines
          </p>
          <Button className="bg-teal-700 hover:bg-teal-800" onClick={() => setFormOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Raise Complaint
          </Button>
        </div>

        <Dialog open={formOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raise a Complaint</DialogTitle>
              <DialogDescription>Report an issue with one of your machines.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Machine</Label>
                  <Select
                    value={form.machine_code}
                    onValueChange={(v) => setForm((f) => ({ ...f, machine_code: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machineCodes.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No machines assigned</div>
                      ) : (
                        machineCodes.map((code) => (
                          <SelectItem key={code} value={String(code)}>
                            {machineNames[String(code)]
                              ? `${machineNames[String(code)]} (${code})`
                              : `Machine ${code}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Issue Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Short summary of the issue"
                  maxLength={120}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What happened? When did it start? Any error shown on the machine?"
                  rows={5}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconSend className="h-4 w-4" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>My Complaints</CardTitle>
            <CardDescription>Complaints you have raised and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                fetchComplaints(search)
              }}
            >
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your complaints by title (leave empty for all)"
              />
              <Button type="submit" variant="outline" disabled={listLoading}>
                Search
              </Button>
            </form>
            <div className="overflow-hidden rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600 hover:bg-teal-700">
                    <TableHead className="font-semibold text-white border-none">Date</TableHead>
                    <TableHead className="font-semibold text-white border-none">Machine</TableHead>
                    <TableHead className="font-semibold text-white border-none">Subject</TableHead>
                    <TableHead className="font-semibold text-white border-none">Category</TableHead>
                    <TableHead className="font-semibold text-white border-none">Priority</TableHead>
                    <TableHead className="font-semibold text-white border-none">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <IconLoader2 className="h-5 w-5 animate-spin" />
                          <span>Loading complaints...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : complaints.length > 0 ? (
                    complaints.map((c) => {
                      const created = c.created_at ?? c.createdAt
                      const machine = parseDetail(c.description, "Machine")
                      const category = parseDetail(c.description, "Category")
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {created ? moment(created).format("MMM D, YYYY h:mm A") : "—"}
                          </TableCell>
                          <TableCell>{machine ?? "—"}</TableCell>
                          <TableCell className="font-medium">{c.title ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{category ?? "—"}</TableCell>
                          <TableCell>
                            {c.priority ? (
                              <Badge
                                className={`border-transparent capitalize ${priorityClass[c.priority.toLowerCase()] ?? ""} hover:bg-transparent`}
                              >
                                {c.priority}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const status = statusStyle[c.status ?? "todo"]
                              return (
                                <Badge
                                  className={`border-transparent hover:bg-transparent ${status?.className ?? "bg-slate-100 text-slate-700"}`}
                                >
                                  {status?.label ?? c.status}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {searched ? "No complaints found." : "No complaints raised yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
