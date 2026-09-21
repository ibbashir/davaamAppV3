import * as React from "react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  IconLoader2, IconPlus, IconSearch, IconTrash, IconPencil, IconRefresh,
  IconUsers, IconUserCheck, IconUserOff, IconWallet, IconChevronLeft, IconChevronRight,
  IconAlertTriangle, IconArrowUp, IconArrowDown,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { getRequest, postRequest, putRequest, deleteRequest } from "@/Apis/Api"
import { BASE_URL } from "@/constants/Constant"
import { cn } from "@/lib/utils"

const API = `${BASE_URL}/superadmin/cardUsers`

interface CardUser {
  id: number
  card_number: string | null
  name: string | null
  mobile_number: string | null
  pin: string | null
  balance: number | string | null
  is_active: number | null
  machine_code: string | null
  email: string | null
  created_at: string | null
  updated_at: string | null
}

interface ListResponse {
  statusCode: number; message: string
  page: number; limit: number; total: number; totalPages: number
  data: CardUser[]
}

interface Stats {
  total: number; active: number; inactive: number
  with_balance: number; total_balance: number
}

/** The server rejects anything outside this set, so the UI offers only these. */
type SortKey = "id" | "name" | "card_number" | "mobile_number" | "balance" | "created_at"

const money = (v: unknown) =>
  `${Number(v ?? 0).toLocaleString("en-PK")}`

const shortDate = (v: unknown) => {
  if (!v) return "—"
  const d = new Date(String(v))
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

const errText = (err: unknown, fallback: string) => {
  const r = (err as { response?: { data?: { message?: string } } })?.response?.data
  return r?.message || fallback
}

/** Pulls the 409 payload the server sends when an identifier is taken. */
const conflictOf = (err: unknown) =>
  (err as { response?: { data?: { data?: { transaction_count?: number; balance?: number } } } })
    ?.response?.data?.data

const blank = {
  name: "", card_number: "", mobile_number: "", email: "",
  machine_code: "", balance: "0", pin: "", is_active: true,
}

function UserDialog({ open, onOpenChange, user, onSaved }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Present = edit, absent = create. */
  user?: CardUser | null
  onSaved: () => void
}) {
  const [form, setForm] = React.useState(blank)
  const [saving, setSaving] = React.useState(false)
  const editing = Boolean(user?.id)

  React.useEffect(() => {
    if (!open) return
    setForm(user ? {
      name: user.name ?? "",
      card_number: user.card_number ?? "",
      mobile_number: user.mobile_number ?? "",
      email: user.email ?? "",
      machine_code: user.machine_code ?? "",
      balance: String(user.balance ?? 0),
      // Prefilled to match the table: what is on screen is what saves.
      pin: user.pin ?? "",
      is_active: user.is_active !== 0,
    } : blank)
  }, [open, user])

  const set = (k: keyof typeof blank, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.card_number.trim() && !form.mobile_number.trim()) {
      return toast.error("Enter a card number or a mobile number — the machines look a card up by one of the two.")
    }
    setSaving(true)
    try {
      if (editing && user) {
        const res = await putRequest<{ message: string }>(`${API}/${user.id}`, form)
        toast.success(res.message)
      } else {
        await postRequest(`${API}`, form)
        toast.success("Card user created")
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(errText(err, "Could not save the card user"))
    } finally {
      setSaving(false)
    }
  }

  const balanceChanged = editing && String(user?.balance ?? 0) !== form.balance

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit card #${user?.id}` : "New card user"}</DialogTitle>
          <DialogDescription>
            A card is found at the machine by its card number or its mobile number, so at least one is required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Card number</Label>
            <Input
              value={form.card_number}
              onChange={(e) => set("card_number", e.target.value)}
              placeholder="RFID / card code"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Mobile number</Label>
            <Input
              value={form.mobile_number}
              onChange={(e) => set("mobile_number", e.target.value)}
              placeholder="03001234567"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Balance</Label>
            <Input
              type="number" min={0}
              value={form.balance}
              onChange={(e) => set("balance", e.target.value)}
            />
            {balanceChanged && (
              <p className="text-xs font-medium text-amber-600">
                Changes real wallet value: {money(user?.balance)} → {money(form.balance)}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>PIN</Label>
            <Input
              value={form.pin}
              onChange={(e) => set("pin", e.target.value)}
              placeholder={editing ? "Blank stores an empty PIN" : "Optional"}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-1.5">
            <Label>Machine code</Label>
            <Input
              value={form.machine_code}
              onChange={(e) => set("machine_code", e.target.value)}
              placeholder="Optional, e.g. 3101"
            />
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm sm:col-span-2">
            <Checkbox checked={form.is_active} onCheckedChange={(v) => set("is_active", Boolean(v))} />
            Active — an inactive card is refused at the machine
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create card user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CardUsers = () => {
  const [rows, setRows] = React.useState<CardUser[]>([])
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(25)
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState<SortKey>("id")
  const [sortDir, setSortDir] = React.useState<"ASC" | "DESC">("DESC")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CardUser | null>(null)
  // Set when a delete is refused because the card carries transaction history.
  const [pendingDelete, setPendingDelete] = React.useState<
    { user: CardUser; count: number; balance: number } | null
  >(null)

  // Debounced so typing a name does not fire a query per keystroke against a
  // 3,700-row table.
  React.useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        page: String(page), limit: String(limit),
        sort_by: sortBy, sort_dir: sortDir,
      })
      if (search.trim()) qs.set("search", search.trim())
      if (activeFilter !== "all") qs.set("is_active", activeFilter)

      const res = await getRequest<ListResponse>(`${API}?${qs.toString()}`)
      setRows(res.data ?? [])
      setTotal(res.total ?? 0)
      setTotalPages(res.totalPages ?? 1)
    } catch (err) {
      toast.error(errText(err, "Could not load card users"))
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, activeFilter, sortBy, sortDir])

  const loadStats = React.useCallback(async () => {
    try {
      const res = await getRequest<{ data: Stats }>(`${API}/stats`)
      setStats(res.data)
    } catch { /* tiles are supplementary — the table still works without them */ }
  }, [])

  React.useEffect(() => { load() }, [load])
  React.useEffect(() => { loadStats() }, [loadStats])

  const refresh = () => { load(); loadStats() }

  const sort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"))
    else { setSortBy(key); setSortDir("ASC") }
    setPage(1)
  }

  const remove = async (user: CardUser, force = false) => {
    if (!force && !window.confirm(`Delete "${user.name || user.card_number || user.mobile_number}"?`)) return
    try {
      const res = await deleteRequest<{ message: string }>(`${API}/${user.id}${force ? "?force=true" : ""}`)
      toast.success(res.message)
      setPendingDelete(null)
      refresh()
    } catch (err) {
      const info = conflictOf(err)
      if (info?.transaction_count) {
        setPendingDelete({ user, count: info.transaction_count, balance: info.balance ?? 0 })
        return
      }
      toast.error(errText(err, "Could not delete the card user"))
    }
  }

  const deactivate = async (user: CardUser) => {
    try {
      await putRequest(`${API}/${user.id}`, { is_active: false })
      toast.success("Card deactivated — it will be refused at the machine")
      setPendingDelete(null)
      refresh()
    } catch (err) {
      toast.error(errText(err, "Could not deactivate the card"))
    }
  }

  const SortHead = ({ k, children, className }: {
    k: SortKey; children: React.ReactNode; className?: string
  }) => (
    <TableHead className={className}>
      <button onClick={() => sort(k)} className="flex items-center gap-1 hover:text-foreground">
        {children}
        {sortBy === k && (sortDir === "ASC"
          ? <IconArrowUp className="h-3.5 w-3.5" />
          : <IconArrowDown className="h-3.5 w-3.5" />)}
      </button>
    </TableHead>
  )

  const tiles = [
    { label: "Total Cards", value: stats?.total ?? 0, icon: IconUsers, accent: "bg-teal-50 text-teal-600" },
    { label: "Active", value: stats?.active ?? 0, icon: IconUserCheck, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Inactive", value: stats?.inactive ?? 0, icon: IconUserOff, accent: "bg-slate-100 text-slate-600" },
    { label: "With Balance", value: stats?.with_balance ?? 0, icon: IconWallet, accent: "bg-cyan-50 text-cyan-600" },
    { label: "Total Balance", value: money(stats?.total_balance), icon: IconWallet, accent: "bg-teal-50 text-teal-700" },
  ]

  return (
    <>
      <SiteHeader title="Card Users" />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Card Users</h1>
            <p className="text-sm text-muted-foreground">
              The wallet records the machines charge against. Search by name, card number, mobile number or id.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh className={cn("mr-1 h-4 w-4", loading && "animate-spin")} /> Refresh
            </Button>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => { setEditing(null); setDialogOpen(true) }}
            >
              <IconPlus className="mr-1 h-4 w-4" /> Add user
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <Card key={t.label} className="py-4">
              <CardContent className="flex flex-col gap-2 px-4">
                <div className={cn("flex size-9 items-center justify-center rounded-lg", t.accent)}>
                  <t.icon className="size-5" />
                </div>
                <div className="text-2xl font-semibold tabular-nums">{t.value}</div>
                <div className="text-xs text-muted-foreground">{t.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingDelete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <IconAlertTriangle className="h-4 w-4 text-amber-600" />
              "{pendingDelete.user.name || pendingDelete.user.card_number}" has {pendingDelete.count} transaction(s)
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deleting the card leaves that history pointing at nobody. Balance on the card:{" "}
              {money(pendingDelete.balance)}. Deactivating stops it working and keeps the record.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => deactivate(pendingDelete.user)}>
                Deactivate instead
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(pendingDelete.user, true)}>
                Delete anyway
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1 sm:max-w-sm">
            <IconSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, card number, mobile or id…"
              className="pl-8"
            />
          </div>
          <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="1">Active only</SelectItem>
              <SelectItem value="0">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 200].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {total.toLocaleString()} card user(s)
          </span>
        </div>

        <div className="rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead k="id" className="w-20">ID</SortHead>
                  <SortHead k="name">Name</SortHead>
                  <SortHead k="card_number">Card No.</SortHead>
                  <SortHead k="mobile_number">Mobile</SortHead>
                  <TableHead>PIN</TableHead>
                  <SortHead k="balance" className="text-right">Balance</SortHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Status</TableHead>
                  <SortHead k="created_at">Created</SortHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-sm text-muted-foreground">
                      {search ? `Nothing matches "${search}".` : "No card users yet."}
                    </TableCell>
                  </TableRow>
                ) : rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.card_number || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.mobile_number || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.pin ? u.pin : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(u.balance)}</TableCell>
                    <TableCell>{u.machine_code || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={u.is_active === 0
                          ? "border-slate-200 bg-slate-100 text-slate-600"
                          : "border-emerald-200 bg-emerald-100 text-emerald-700"}
                      >
                        {u.is_active === 0 ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{shortDate(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditing(u); setDialogOpen(true) }}
                          title="Edit"
                        >
                          <IconPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-red-600"
                          onClick={() => remove(u)}
                          title="Delete"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        onSaved={refresh}
      />
    </>
  )
}

export default CardUsers
