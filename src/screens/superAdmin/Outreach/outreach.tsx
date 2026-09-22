import { useEffect, useCallback, useMemo, useRef, useState } from "react"
import moment from "moment"
import { toast } from "sonner"
import { getRequest, postRequest, putRequest, deleteRequest } from "@/Apis/Api"
import { uploadFileToFirebase } from "@/lib/firebase"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/alert-dialog"
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconStar,
  IconPhotoPlus,
  IconX,
  IconPencil,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react"

// Confirmed against the getOutreach / postOutreach controllers: `id` and
// `event_datetime` always come back from GET, and postOutreach only writes
// event_name, event_location, event_datetime, event_gallery, event_sponsored.
// Anything else the API happens to return is still surfaced generically via
// the "Additional details" section in the event dialog rather than dropped.
interface Outreach {
  id: number
  event_datetime: string
  event_name?: string
  event_location?: string
  event_gallery?: string[] | string | null
  event_sponsored?: string | boolean
  description?: string
  male_attendants?: number | string
  female_attendants?: number | string
  total_attendants?: number | string
  attendant_include?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

interface OutreachApiResponse {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  totalEvents: number
  totalAttendants: number
  outreach: Outreach[]
}

const OUTREACH_ENDPOINT = "/superadmin/getOutreach"

const KNOWN_KEYS = new Set([
  "id",
  "event_datetime",
  "event_name",
  "event_location",
  "event_gallery",
  "event_sponsored",
  "description",
  "male_attendants",
  "female_attendants",
  "total_attendants",
  "attendant_include",
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
])

const eventTitle = (o: Outreach) => o.event_name || "Outreach Event"
const eventLocationText = (o: Outreach) => o.event_location || null

const eventGalleryUrls = (o: Outreach): string[] => {
  const g = o.event_gallery
  if (Array.isArray(g)) return g.filter((x): x is string => typeof x === "string" && x.length > 0)
  if (typeof g === "string" && g) return [g]
  return []
}

const prettyKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())

const extraEntries = (o: Outreach) =>
  Object.entries(o).filter(
    ([key, value]) => !KNOWN_KEYS.has(key) && value !== null && value !== undefined && value !== ""
  )

/** Returns "Sponsored by X" for a text sponsor, a bare "Sponsored" for legacy boolean data, or null. */
const sponsoredLabel = (o: Outreach): string | null => {
  const s = o.event_sponsored
  if (typeof s === "string" && s.trim()) return `Sponsored by ${s.trim()}`
  if (s === true) return "Sponsored"
  return null
}

function SponsoredBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <Badge className={`gap-1 border-transparent bg-amber-500 text-white hover:bg-amber-500 ${className}`}>
      <IconStar className="h-3 w-3 fill-current" />
      {label}
    </Badge>
  )
}

const emptyForm = {
  event_name: "",
  event_location: "",
  event_datetime: "",
  event_sponsored: "",
  description: "",
  male_attendants: "",
  female_attendants: "",
  total_attendants: "",
  attendant_include: false,
}

interface GalleryItem {
  id: string
  file?: File // absent for images already on the event when editing
  previewUrl: string
  status: "uploading" | "done" | "error"
  url?: string
}

export default function Outreach() {
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [detailEvent, setDetailEvent] = useState<Outreach | null>(null)

  // ─── Lightbox: full-size, navigable viewer for an event's gallery images ───
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const showPrevImage = useCallback(
    () => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb)),
    []
  )
  const showNextImage = useCallback(
    () => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb)),
    []
  )

  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrevImage()
      if (e.key === "ArrowRight") showNextImage()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightbox, showPrevImage, showNextImage])

  // ─── Calendar view: pulls a batch of events once and groups them by day
  // client-side, since the backend only supports page/limit (no date filter).
  const [calendarEvents, setCalendarEvents] = useState<Outreach[]>([])
  const [calendarLimit, setCalendarLimit] = useState(100)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => moment().startOf("month"))
  const [selectedDay, setSelectedDay] = useState(() => moment().startOf("day"))
  const [totalEventsCount, setTotalEventsCount] = useState(0)
  const [totalAttendantsCount, setTotalAttendantsCount] = useState(0)

  const fetchCalendarEvents = useCallback(async () => {
    setCalendarLoading(true)
    try {
      const res = await getRequest<OutreachApiResponse>(
        `${OUTREACH_ENDPOINT}?page=1&limit=${calendarLimit}`
      )
      setCalendarEvents(res.outreach ?? [])
      setTotalEventsCount(res.totalEvents ?? 0)
      setTotalAttendantsCount(res.totalAttendants ?? 0)
    } catch (err) {
      console.error("Failed to fetch outreach events:", err)
      setCalendarEvents([])
      setTotalEventsCount(0)
      setTotalAttendantsCount(0)
    } finally {
      setCalendarLoading(false)
    }
  }, [calendarLimit])

  useEffect(() => {
    fetchCalendarEvents()
  }, [fetchCalendarEvents])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Outreach[]>()
    for (const ev of calendarEvents) {
      if (!ev.event_datetime) continue
      const key = moment(ev.event_datetime).format("YYYY-MM-DD")
      const bucket = map.get(key) ?? []
      bucket.push(ev)
      map.set(key, bucket)
    }
    return map
  }, [calendarEvents])

  const calendarDays = useMemo(() => {
    const start = currentMonth.clone().startOf("month").startOf("week")
    const end = currentMonth.clone().endOf("month").endOf("week")
    const days = []
    const cursor = start.clone()
    while (cursor.isSameOrBefore(end, "day")) {
      days.push(cursor.clone())
      cursor.add(1, "day")
    }
    return days
  }, [currentMonth])

  const selectedDayEvents = eventsByDay.get(selectedDay.format("YYYY-MM-DD")) ?? []

  // ─── List view: exact server-side pagination the backend returns ───
  const [listEvents, setListEvents] = useState<Outreach[]>([])
  const [listPage, setListPage] = useState(1)
  const [listLimit, setListLimit] = useState(10)
  const [listTotalCount, setListTotalCount] = useState(0)
  const [listTotalPages, setListTotalPages] = useState(1)
  const [listLoading, setListLoading] = useState(false)

  const fetchListEvents = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await getRequest<OutreachApiResponse>(
        `${OUTREACH_ENDPOINT}?page=${listPage}&limit=${listLimit}`
      )
      setListEvents(res.outreach ?? [])
      setListTotalCount(res.totalCount ?? 0)
      setListTotalPages(res.totalPages ?? 1)
    } catch (err) {
      console.error("Failed to fetch outreach events:", err)
      setListEvents([])
      setListTotalCount(0)
      setListTotalPages(1)
    } finally {
      setListLoading(false)
    }
  }, [listPage, listLimit])

  useEffect(() => {
    if (view !== "list") return
    fetchListEvents()
  }, [view, fetchListEvents])

  const today = moment().startOf("day")

  // ─── Post/Edit Outreach: create or update an event. Each newly picked
  // gallery image uploads to Firebase Storage the instant it's picked, so by
  // the time "Save" is clicked the download URLs are already in hand and the
  // event_gallery array is just read off state — no upload work happens at
  // submit time. Editing pre-fills the same form/gallery state from the event.
  const [postOpen, setPostOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Outreach | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetPostForm = useCallback(() => {
    // Only picked files get a blob: preview URL — existing gallery images
    // (when editing) reuse their remote URL as the preview and must not be revoked.
    galleryItems.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl)
    })
    setForm(emptyForm)
    setGalleryItems([])
  }, [galleryItems])

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const picked = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
    }))
    const newItems: GalleryItem[] = picked.map(({ id, file }) => ({
      id,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }))
    setGalleryItems((prev) => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ""

    picked.forEach(({ id, file }) => {
      uploadFileToFirebase(file)
        .then((url) => {
          setGalleryItems((prev) => prev.map((g) => (g.id === id ? { ...g, status: "done", url } : g)))
        })
        .catch((err) => {
          console.error("Failed to upload image:", err)
          setGalleryItems((prev) => prev.map((g) => (g.id === id ? { ...g, status: "error" } : g)))
          toast.error(`Failed to upload ${file.name}`)
        })
    })
  }

  const removeGalleryFile = (id: string) => {
    setGalleryItems((prev) => {
      const item = prev.find((g) => g.id === id)
      if (item && item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((g) => g.id !== id)
    })
  }

  const openEditDialog = (ev: Outreach) => {
    setEditingEvent(ev)
    setForm({
      event_name: ev.event_name ?? "",
      event_location: ev.event_location ?? "",
      event_datetime: ev.event_datetime ? moment(ev.event_datetime).format("YYYY-MM-DDTHH:mm") : "",
      event_sponsored: typeof ev.event_sponsored === "string" ? ev.event_sponsored : "",
      description: ev.description ?? "",
      male_attendants: ev.male_attendants != null ? String(ev.male_attendants) : "",
      female_attendants: ev.female_attendants != null ? String(ev.female_attendants) : "",
      total_attendants: ev.total_attendants != null ? String(ev.total_attendants) : "",
      attendant_include: !!ev.attendant_include,
    })
    setGalleryItems(
      eventGalleryUrls(ev).map((url, i) => ({
        id: `existing-${i}`,
        previewUrl: url,
        status: "done",
        url,
      }))
    )
    setPostOpen(true)
  }

  const stillUploading = galleryItems.some((g) => g.status === "uploading")

  const handleSubmitOutreach = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.event_name.trim() || !form.event_location.trim() || !form.event_datetime) {
      toast.error("Event name, location and date & time are required")
      return
    }
    if (stillUploading) {
      toast.error("Please wait for images to finish uploading")
      return
    }

    const failed = galleryItems.filter((g) => g.status === "error")
    if (failed.length > 0) {
      toast.error(`Remove the ${failed.length} image(s) that failed to upload before saving`)
      return
    }

    setSubmitting(true)
    try {
      const event_gallery = galleryItems
        .filter((g): g is GalleryItem & { url: string } => g.status === "done" && !!g.url)
        .map((g) => g.url)

      const payload = {
        event_name: form.event_name.trim(),
        event_location: form.event_location.trim(),
        event_datetime: moment(form.event_datetime).toISOString(),
        event_gallery,
        event_sponsored: form.event_sponsored.trim(),
        description: form.description.trim(),
        male_attendants: form.male_attendants ? Number(form.male_attendants) : 0,
        female_attendants: form.female_attendants ? Number(form.female_attendants) : 0,
        total_attendants: form.total_attendants ? Number(form.total_attendants) : 0,
        attendant_include: form.attendant_include,
      }

      if (editingEvent) {
        await putRequest(`/superadmin/updateOutreach/${editingEvent.id}`, payload)
        toast.success("Outreach event updated")
      } else {
        await postRequest("/superadmin/postOutreach", payload)
        toast.success("Outreach event posted")
      }

      setPostOpen(false)
      resetPostForm()
      setEditingEvent(null)
      fetchCalendarEvents()
      if (view === "list") fetchListEvents()
    } catch (err) {
      console.error("Failed to save outreach event:", err)
      toast.error(editingEvent ? "Failed to update outreach event" : "Failed to post outreach event")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete Outreach ───
  const [deleteTarget, setDeleteTarget] = useState<Outreach | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteOutreach = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRequest(`/superadmin/deleteOutreach/${deleteTarget.id}`)
      toast.success("Outreach event deleted")
      if (detailEvent?.id === deleteTarget.id) setDetailEvent(null)
      setDeleteTarget(null)
      fetchCalendarEvents()
      if (view === "list") fetchListEvents()
    } catch (err) {
      console.error("Failed to delete outreach event:", err)
      toast.error("Failed to delete outreach event")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <SiteHeader title="📅 Outreach Events" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Community and marketing outreach events, by calendar or list
          </p>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              className="bg-teal-700 hover:bg-teal-800"
              onClick={() => {
                setEditingEvent(null)
                resetPostForm()
                setPostOpen(true)
              }}
            >
              <IconPlus className="h-4 w-4" />
              Post Outreach
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                <IconCalendarEvent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-2xl font-semibold">{totalEventsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <IconUsers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Attendants</p>
                <p className="text-2xl font-semibold">{totalAttendantsCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {view === "calendar" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => setCurrentMonth((m) => m.clone().subtract(1, "month"))}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="min-w-36 text-center text-base">
                    {currentMonth.format("MMMM YYYY")}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => setCurrentMonth((m) => m.clone().add(1, "month"))}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentMonth(moment().startOf("month"))
                      setSelectedDay(moment().startOf("day"))
                    }}
                  >
                    Today
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Events loaded</Label>
                  <Select
                    value={`${calendarLimit}`}
                    onValueChange={(v) => setCalendarLimit(Number(v))}
                  >
                    <SelectTrigger size="sm" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[50, 100, 200, 500].map((s) => (
                        <SelectItem key={s} value={`${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {calendarLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <IconLoader2 className="h-5 w-5 animate-spin" />
                    <span>Loading events...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d} className="py-2">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const key = day.format("YYYY-MM-DD")
                        const dayEvents = eventsByDay.get(key) ?? []
                        const inMonth = day.isSame(currentMonth, "month")
                        const isToday = day.isSame(today, "day")
                        const isSelected = day.isSame(selectedDay, "day")

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDay(day.clone())}
                            className={`flex min-h-20 flex-col items-start gap-1 rounded-md border p-1.5 text-left text-xs transition-colors hover:bg-muted/60 ${
                              inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"
                            } ${isSelected ? "border-teal-600 ring-1 ring-teal-600" : "border-border"}`}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                                isToday ? "bg-teal-600 text-white" : ""
                              }`}
                            >
                              {day.date()}
                            </span>
                            <div className="flex w-full flex-col gap-0.5">
                              {dayEvents.slice(0, 2).map((ev) => (
                                <span
                                  key={ev.id}
                                  className="flex items-center gap-0.5 truncate rounded bg-teal-100 px-1 py-0.5 text-[10px] text-teal-800"
                                  title={sponsoredLabel(ev) ? `${eventTitle(ev)} — ${sponsoredLabel(ev)}` : eventTitle(ev)}
                                >
                                  {sponsoredLabel(ev) && (
                                    <IconStar className="h-2.5 w-2.5 shrink-0 fill-current text-amber-600" />
                                  )}
                                  <span className="truncate">{eventTitle(ev)}</span>
                                </span>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedDay.format("dddd, MMM D, YYYY")}</CardTitle>
                <CardDescription>
                  {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? "" : "s"} on this day
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No outreach events on this day.
                  </p>
                ) : (
                  selectedDayEvents
                    .slice()
                    .sort((a, b) => moment(a.event_datetime).diff(moment(b.event_datetime)))
                    .map((ev) => (
                      <div
                        key={ev.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailEvent(ev)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setDetailEvent(ev)
                        }}
                        className="flex flex-col gap-1 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{eventTitle(ev)}</span>
                          {sponsoredLabel(ev) && <SponsoredBadge label={sponsoredLabel(ev)!} />}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconClock className="h-3 w-3" />
                          {moment(ev.event_datetime).format("h:mm A")}
                        </span>
                        {eventLocationText(ev) && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconMapPin className="h-3 w-3" />
                            {eventLocationText(ev)}
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(ev)
                            }}
                          >
                            <IconPencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(ev)
                            }}
                          >
                            <IconTrash className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Outreach Events</CardTitle>
              <CardDescription>All outreach events, most recent first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-600 hover:bg-teal-700">
                      <TableHead className="font-semibold text-white border-none">Event</TableHead>
                      <TableHead className="font-semibold text-white border-none">Date & Time</TableHead>
                      <TableHead className="font-semibold text-white border-none">Location</TableHead>
                      <TableHead className="font-semibold text-white border-none">Sponsored</TableHead>
                      <TableHead className="font-semibold text-white border-none text-right">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <IconLoader2 className="h-5 w-5 animate-spin" />
                            <span>Loading events...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : listEvents.length > 0 ? (
                      listEvents.map((ev) => (
                        <TableRow key={ev.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconCalendarEvent className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                              <span className="font-medium">{eventTitle(ev)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {ev.event_datetime
                              ? moment(ev.event_datetime).format("MMM D, YYYY h:mm A")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {eventLocationText(ev) ?? "—"}
                          </TableCell>
                          <TableCell>
                            {sponsoredLabel(ev) ? (
                              <SponsoredBadge label={sponsoredLabel(ev)!} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => setDetailEvent(ev)}>
                                <IconInfoCircle className="h-4 w-4" />
                                View
                              </Button>
                              <Button variant="outline" size="icon" className="size-8" onClick={() => openEditDialog(ev)}>
                                <span className="sr-only">Edit</span>
                                <IconPencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteTarget(ev)}
                              >
                                <span className="sr-only">Delete</span>
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No outreach events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {listTotalCount > 0 && (
                <div className="mt-4 flex items-center justify-between px-4">
                  <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                    Showing {listEvents.length} of {listTotalCount} events
                  </div>
                  <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                      <Label className="text-sm font-medium">Rows per page</Label>
                      <Select
                        value={`${listLimit}`}
                        onValueChange={(v) => {
                          setListLimit(Number(v))
                          setListPage(1)
                        }}
                      >
                        <SelectTrigger size="sm" className="w-20">
                          <SelectValue placeholder={listLimit} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[5, 10, 20, 50, 100].map((s) => (
                            <SelectItem key={s} value={`${s}`}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                      Page {listPage} of {listTotalPages}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                      <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                        onClick={() => setListPage(1)}
                        disabled={listPage === 1}
                      >
                        <span className="sr-only">Go to first page</span>
                        <IconChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="size-8 bg-transparent"
                        size="icon"
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        disabled={listPage === 1}
                      >
                        <span className="sr-only">Previous page</span>
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="size-8 bg-transparent"
                        size="icon"
                        onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                        disabled={listPage === listTotalPages}
                      >
                        <span className="sr-only">Next page</span>
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="hidden size-8 lg:flex bg-transparent"
                        size="icon"
                        onClick={() => setListPage(listTotalPages)}
                        disabled={listPage === listTotalPages}
                      >
                        <span className="sr-only">Go to last page</span>
                        <IconChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event details dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{eventTitle(detailEvent)}</DialogTitle>
                <DialogDescription>
                  {moment(detailEvent.event_datetime).format("dddd, MMMM D, YYYY [at] h:mm A")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                {eventGalleryUrls(detailEvent).length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {eventGalleryUrls(detailEvent)
                      .slice(0, 6)
                      .map((url, i) => {
                        const gallery = eventGalleryUrls(detailEvent)
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setLightbox({ images: gallery, index: i })}
                            className="relative block overflow-hidden rounded-md"
                          >
                            <img
                              src={url}
                              alt={`${eventTitle(detailEvent)} ${i + 1}`}
                              className="h-20 w-full object-cover transition-transform hover:scale-105"
                            />
                            {i === 5 && gallery.length > 6 && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
                                +{gallery.length - 6} more
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                )}

                {sponsoredLabel(detailEvent) ? (
                  <SponsoredBadge label={sponsoredLabel(detailEvent)!} className="w-fit" />
                ) : (
                  <Badge variant="outline" className="w-fit text-muted-foreground">
                    Not sponsored
                  </Badge>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{eventLocationText(detailEvent) ?? "No location provided"}</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {detailEvent.description || "No description provided"}
                </p>

                <div className="rounded-md border p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <IconUsers className="h-3.5 w-3.5 text-muted-foreground" />
                      Attendants
                    </span>
                    <Badge variant={detailEvent.attendant_include ? "default" : "outline"} className="text-[10px]">
                      {detailEvent.attendant_include ? "Included" : "Not included"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-base font-semibold">{detailEvent.male_attendants ?? 0}</div>
                      <div className="text-muted-foreground">Male</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold">{detailEvent.female_attendants ?? 0}</div>
                      <div className="text-muted-foreground">Female</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold">{detailEvent.total_attendants ?? 0}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border p-3 text-xs">
                  <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
                    <span className="text-muted-foreground">Event ID</span>
                    <span className="truncate font-medium">{detailEvent.id}</span>
                  </div>
                  {detailEvent.created_at && (
                    <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
                      <span className="text-muted-foreground">Created</span>
                      <span className="truncate font-medium">
                        {moment(detailEvent.created_at).format("MMM D, YYYY h:mm A")}
                      </span>
                    </div>
                  )}
                  {detailEvent.updated_at && (
                    <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="truncate font-medium">
                        {moment(detailEvent.updated_at).format("MMM D, YYYY h:mm A")}
                      </span>
                    </div>
                  )}
                </div>

                {extraEntries(detailEvent).length > 0 && (
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border p-3 text-xs">
                    {extraEntries(detailEvent).map(([key, value]) => (
                      <div key={key} className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
                        <span className="text-muted-foreground">{prettyKey(key)}</span>
                        <span className="truncate font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDeleteTarget(detailEvent)}
                >
                  <IconTrash className="h-4 w-4" />
                  Delete
                </Button>
                <Button
                  className="bg-teal-700 hover:bg-teal-800"
                  onClick={() => {
                    openEditDialog(detailEvent)
                    setDetailEvent(null)
                  }}
                >
                  <IconPencil className="h-4 w-4" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Post/edit outreach event dialog */}
      <Dialog
        open={postOpen}
        onOpenChange={(open) => {
          if (!submitting) {
            setPostOpen(open)
            if (!open) {
              resetPostForm()
              setEditingEvent(null)
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Outreach Event" : "Post Outreach Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update this outreach event." : "Publish a new outreach event."} Gallery
              images are uploaded to Firebase Storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOutreach} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="event_name">Event Name</Label>
              <Input
                id="event_name"
                value={form.event_name}
                onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))}
                placeholder="e.g. Community Health Drive"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="event_location">Event Location</Label>
              <Input
                id="event_location"
                value={form.event_location}
                onChange={(e) => setForm((f) => ({ ...f, event_location: e.target.value }))}
                placeholder="e.g. Gulshan-e-Iqbal, Karachi"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="event_datetime">Event Date & Time</Label>
              <Input
                id="event_datetime"
                type="datetime-local"
                value={form.event_datetime}
                onChange={(e) => setForm((f) => ({ ...f, event_datetime: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="event_sponsored">Sponsored By</Label>
              <Input
                id="event_sponsored"
                value={form.event_sponsored}
                onChange={(e) => setForm((f) => ({ ...f, event_sponsored: e.target.value }))}
                placeholder="e.g. Acme Corp (leave blank if not sponsored)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the event"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="male_attendants">Male Attendants</Label>
                <Input
                  id="male_attendants"
                  type="number"
                  min={0}
                  value={form.male_attendants}
                  onChange={(e) =>
                    setForm((f) => {
                      const male_attendants = e.target.value
                      return {
                        ...f,
                        male_attendants,
                        total_attendants: String(
                          (Number(male_attendants) || 0) + (Number(f.female_attendants) || 0)
                        ),
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="female_attendants">Female Attendants</Label>
                <Input
                  id="female_attendants"
                  type="number"
                  min={0}
                  value={form.female_attendants}
                  onChange={(e) =>
                    setForm((f) => {
                      const female_attendants = e.target.value
                      return {
                        ...f,
                        female_attendants,
                        total_attendants: String(
                          (Number(f.male_attendants) || 0) + (Number(female_attendants) || 0)
                        ),
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="total_attendants">Total Attendants</Label>
                <Input
                  id="total_attendants"
                  type="number"
                  value={form.total_attendants}
                  readOnly
                  disabled
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="attendant_include"
                checked={form.attendant_include}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, attendant_include: checked === true }))
                }
              />
              <Label htmlFor="attendant_include" className="font-normal">
                Include attendants count for this event
              </Label>
            </div>

            <div className="grid gap-1.5">
              <Label>Event Gallery</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleAddFiles(e.target.files)}
              />
              <div className="flex flex-wrap gap-2">
                {galleryItems.map((item, i) => (
                  <div
                    key={item.id}
                    className={`group relative h-16 w-16 overflow-hidden rounded-md border ${
                      item.status === "error" ? "border-red-400" : ""
                    }`}
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Selected ${i + 1}`}
                      className={`h-full w-full object-cover ${item.status === "uploading" ? "opacity-50" : ""}`}
                    />
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <IconLoader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-[10px] font-medium text-red-700">
                        Failed
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryFile(item.id)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-teal-600 hover:text-teal-600"
                >
                  <IconPhotoPlus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setPostOpen(false)
                  resetPostForm()
                  setEditingEvent(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800"
                disabled={submitting || stillUploading}
              >
                {submitting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    {editingEvent ? "Saving..." : "Posting..."}
                  </>
                ) : stillUploading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Uploading images...
                  </>
                ) : editingEvent ? (
                  "Save Changes"
                ) : (
                  "Post Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery lightbox: full-size, navigable image viewer */}
      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl border-none bg-transparent p-0 shadow-none sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">Gallery image</DialogTitle>
          {lightbox && (
            <div className="relative flex items-center justify-center">
              <img
                src={lightbox.images[lightbox.index]}
                alt={`Gallery image ${lightbox.index + 1} of ${lightbox.images.length}`}
                className="max-h-[80vh] w-full rounded-md object-contain"
              />

              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 rounded-full bg-white p-1.5 text-black shadow hover:bg-gray-100"
              >
                <IconX className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>

              {lightbox.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <IconChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Previous image</span>
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <IconChevronRight className="h-5 w-5" />
                    <span className="sr-only">Next image</span>
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    {lightbox.index + 1} / {lightbox.images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this outreach event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `"${eventTitle(deleteTarget)}" will be permanently deleted. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteOutreach()
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
