import * as React from "react"
import { HrPage, StatTile } from "@/components/hr/HrPage"
import { NotLinked } from "./EssHub"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconPlus, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  essPost,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
  todayISO,
} from "@/components/hr/hr-api"

interface Balance {
  leave_type_id: number
  leave_type: string
  entitled: number
  used: number
  available: number
}

interface Request {
  id: number
  from_date: string
  to_date: string
  days: string | number
  status: string
  reason: string | null
  decision_note: string | null
  leave_type?: { name?: string }
}

const MyLeave = () => {
  const [balances, setBalances] = React.useState<Balance[]>([])
  const [requests, setRequests] = React.useState<Request[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notLinked, setNotLinked] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    leave_type_id: "",
    from_date: todayISO(),
    to_date: todayISO(),
    is_half_day: false,
    reason: "",
    contact_during_leave: "",
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [b, r] = await Promise.all([
        essGet<{ data: Balance[] }>("/leave/balances"),
        essGet<{ data: Request[] }>("/leave"),
      ])
      setBalances(b.data ?? [])
      setRequests(r.data ?? [])
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) setNotLinked(true)
      else toast.error(errorMessage(err, "Could not load your leave"))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const apply = async () => {
    if (!form.leave_type_id) {
      toast.error("Select a leave type")
      return
    }
    setSaving(true)
    try {
      await essPost("/leave", {
        ...form,
        leave_type_id: Number(form.leave_type_id),
      })
      toast.success("Leave request submitted")
      setOpen(false)
      setForm((f) => ({ ...f, reason: "", contact_during_leave: "" }))
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not submit your request"))
    } finally {
      setSaving(false)
    }
  }

  const withdraw = async (request: Request) => {
    try {
      await essPost(`/leave/${request.id}/cancel`, {})
      toast.success("Request withdrawn")
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not withdraw the request"))
    }
  }

  if (notLinked) {
    return (
      <HrPage title="My Leave">
        <NotLinked />
      </HrPage>
    )
  }

  return (
    <HrPage title="My Leave">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Requests go to your reporting manager, or to HR if you have none.
        </p>
        <Button onClick={() => setOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <IconPlus className="h-4 w-4" />
          Apply for leave
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {balances.map((b) => (
          <StatTile
            key={b.leave_type_id}
            label={b.leave_type}
            value={b.available}
            hint={`${b.used} used of ${b.entitled}`}
            tone={b.available > 0 ? "teal" : "amber"}
          />
        ))}
        {!loading && balances.length === 0 && (
          <p className="text-sm text-muted-foreground">No leave types configured yet.</p>
        )}
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      You haven't applied for any leave yet
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.leave_type?.name ?? "—"}</TableCell>
                      <TableCell>{formatDate(r.from_date)}</TableCell>
                      <TableCell>{formatDate(r.to_date)}</TableCell>
                      <TableCell>{String(r.days)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", statusClass(r.status))}>
                          {humanise(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {r.decision_note ?? r.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => withdraw(r)}>
                            <IconX className="h-3.5 w-3.5" />
                            Withdraw
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for leave</DialogTitle>
            <DialogDescription>
              Your balance is checked before the request is created, and overlapping dates are rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Leave type</Label>
              <Select
                value={form.leave_type_id}
                onValueChange={(v) => setForm((f) => ({ ...f, leave_type_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((b) => (
                    <SelectItem key={b.leave_type_id} value={String(b.leave_type_id)}>
                      {b.leave_type} ({b.available} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={form.from_date}
                onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={form.to_date}
                onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_half_day}
                  onChange={(e) => setForm((f) => ({ ...f, is_half_day: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-muted-foreground">Half day (counts as 0.5)</span>
              </label>
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Contact during leave</Label>
              <Input
                value={form.contact_during_leave}
                onChange={(e) => setForm((f) => ({ ...f, contact_during_leave: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrPage>
  )
}

export default MyLeave
