import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
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
import { IconLoader2, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  essGet,
  essPost,
  errorMessage,
  statusClass,
  humanise,
  formatDate,
  formatMoney,
  todayISO,
} from "@/components/hr/hr-api"

const EXPENSE_CATEGORIES = [
  "travel",
  "fuel",
  "meals",
  "accommodation",
  "medical",
  "communication",
  "stationery",
  "other",
]
const TICKET_CATEGORIES = [
  "payroll",
  "leave",
  "attendance",
  "it",
  "facilities",
  "policy",
  "grievance",
  "other",
]

interface Row {
  id: number
  status: string
  [key: string]: unknown
}

/** Shared list + create shell for the three self-service request types. */
function RequestList({
  path,
  columns,
  emptyMessage,
  formFields,
  buildPayload,
  createLabel,
  notLinkedRef,
}: {
  path: string
  columns: Array<{ label: string; render: (row: Row) => React.ReactNode }>
  emptyMessage: string
  formFields: React.ReactNode
  buildPayload: () => Record<string, unknown> | null
  createLabel: string
  notLinkedRef: React.MutableRefObject<boolean>
}) {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [notLinked, setNotLinked] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await essGet<{ data: Row[] }>(path)
      setRows(res.data ?? [])
      setNotLinked(false)
    } catch (err) {
      const anyErr = err as { response?: { status?: number } }
      if (anyErr?.response?.status === 404) {
        setNotLinked(true)
        notLinkedRef.current = true
      } else {
        toast.error(errorMessage(err, "Could not load your requests"))
      }
    } finally {
      setLoading(false)
    }
  }, [path, notLinkedRef])

  React.useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    const payload = buildPayload()
    if (!payload) return
    setSaving(true)
    try {
      await essPost(path, payload)
      toast.success("Submitted")
      setOpen(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not submit"))
    } finally {
      setSaving(false)
    }
  }

  if (notLinked) return <NotLinked />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <IconPlus className="h-4 w-4" />
          {createLabel}
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map((c) => (
                    <TableHead key={c.label}>{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((c) => (
                        <TableCell key={c.label}>{c.render(row)}</TableCell>
                      ))}
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
            <DialogTitle>{createLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const statusCell = (row: Row) => (
  <Badge variant="outline" className={cn("font-medium", statusClass(row.status))}>
    {humanise(row.status)}
  </Badge>
)

function ExpensesTab({ notLinkedRef }: { notLinkedRef: React.MutableRefObject<boolean> }) {
  const [form, setForm] = React.useState({
    category: "other",
    expense_date: todayISO(),
    amount: "",
    description: "",
    receipt_url: "",
  })

  return (
    <RequestList
      path="/expenses"
      notLinkedRef={notLinkedRef}
      createLabel="New expense claim"
      emptyMessage="You haven't filed any expense claims"
      columns={[
        { label: "Claim", render: (r) => String(r.claim_code ?? r.id) },
        { label: "Category", render: (r) => humanise(r.category) },
        { label: "Date", render: (r) => formatDate(r.expense_date) },
        { label: "Amount", render: (r) => formatMoney(r.amount) },
        { label: "Status", render: statusCell },
      ]}
      buildPayload={() => {
        if (!form.amount) {
          toast.error("Enter an amount")
          return null
        }
        return { ...form, amount: Number(form.amount) }
      }}
      formFields={
        <>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {humanise(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Receipt URL</Label>
            <Input
              value={form.receipt_url}
              onChange={(e) => setForm((f) => ({ ...f, receipt_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </>
      }
    />
  )
}

function TravelTab({ notLinkedRef }: { notLinkedRef: React.MutableRefObject<boolean> }) {
  const [form, setForm] = React.useState({
    destination: "",
    purpose: "",
    from_date: todayISO(),
    to_date: todayISO(),
    mode: "road",
    estimated_cost: "",
  })

  return (
    <RequestList
      path="/travel"
      notLinkedRef={notLinkedRef}
      createLabel="New travel request"
      emptyMessage="You haven't raised any travel requests"
      columns={[
        { label: "Request", render: (r) => String(r.request_code ?? r.id) },
        { label: "Destination", render: (r) => String(r.destination ?? "—") },
        { label: "From", render: (r) => formatDate(r.from_date) },
        { label: "To", render: (r) => formatDate(r.to_date) },
        { label: "Est. Cost", render: (r) => formatMoney(r.estimated_cost) },
        { label: "Status", render: statusCell },
      ]}
      buildPayload={() => {
        if (!form.destination || !form.purpose) {
          toast.error("Destination and purpose are required")
          return null
        }
        return {
          ...form,
          estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        }
      }}
      formFields={
        <>
          <div className="grid gap-1.5">
            <Label>Destination</Label>
            <Input
              value={form.destination}
              onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["road", "air", "rail", "company_vehicle", "other"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {humanise(m)}
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
          <div className="grid gap-1.5">
            <Label>Estimated cost</Label>
            <Input
              type="number"
              value={form.estimated_cost}
              onChange={(e) => setForm((f) => ({ ...f, estimated_cost: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Purpose</Label>
            <Textarea
              rows={3}
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            />
          </div>
        </>
      }
    />
  )
}

function TicketsTab({ notLinkedRef }: { notLinkedRef: React.MutableRefObject<boolean> }) {
  const [form, setForm] = React.useState({
    category: "other",
    subject: "",
    description: "",
    priority: "medium",
  })

  return (
    <RequestList
      path="/tickets"
      notLinkedRef={notLinkedRef}
      createLabel="Raise a ticket"
      emptyMessage="You haven't raised any tickets"
      columns={[
        { label: "Ticket", render: (r) => String(r.ticket_code ?? r.id) },
        { label: "Subject", render: (r) => String(r.subject ?? "—") },
        { label: "Category", render: (r) => humanise(r.category) },
        { label: "Priority", render: (r) => humanise(r.priority) },
        { label: "Status", render: statusCell },
      ]}
      buildPayload={() => {
        if (!form.subject) {
          toast.error("Enter a subject")
          return null
        }
        return { ...form }
      }}
      formFields={
        <>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {humanise(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {humanise(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </>
      }
    />
  )
}

const MyRequests = () => {
  const notLinkedRef = React.useRef(false)

  return (
    <HrTabbedPage
      title="My Requests"
      description="Expense claims, travel requests and HR help desk tickets you have raised."
      tabs={[
        { value: "expenses", label: "Expenses", content: <ExpensesTab notLinkedRef={notLinkedRef} /> },
        { value: "travel", label: "Travel", content: <TravelTab notLinkedRef={notLinkedRef} /> },
        { value: "tickets", label: "Help Desk", content: <TicketsTab notLinkedRef={notLinkedRef} /> },
      ]}
    />
  )
}

export default MyRequests
