import * as React from "react"
import { HrTabbedPage } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
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
import { IconDoorExit, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrAction, errorMessage, formatMoney, todayISO } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const TYPES = ["resignation", "termination", "retirement", "end_of_contract", "absconded"]
const STATUSES = ["initiated", "in_clearance", "cleared", "settled", "cancelled"]

function SeparationsTab() {
  const { options } = useHrOptions(["employees"])
  const [refresh, setRefresh] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    employee_id: "",
    separation_type: "resignation",
    resignation_date: todayISO(),
    last_working_day: "",
    notice_period_days: "30",
    reason: "",
  })

  const initiate = async () => {
    if (!form.employee_id) {
      toast.error("Select an employee")
      return
    }
    try {
      const res = await hrAction<{ message: string }>("/separations/initiate", {
        ...form,
        employee_id: Number(form.employee_id),
        notice_period_days: Number(form.notice_period_days) || null,
        last_working_day: form.last_working_day || null,
      })
      toast.success(res.message)
      setOpen(false)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not initiate the separation"))
    }
  }

  const setStatus = async (row: HrRow, status: string) => {
    try {
      await hrAction(`/separations/${row.id}/status`, { status })
      toast.success(`Separation marked ${status}`)
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the separation"))
    }
  }

  const fields: Field[] = [
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      hideInForm: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "separation_type", label: "Type", type: "select", options: enumOptions(TYPES) },
    { name: "resignation_date", label: "Resigned", type: "date" },
    { name: "last_working_day", label: "Last Day", type: "date" },
    { name: "notice_period_days", label: "Notice (days)", type: "number", hideInTable: true },
    { name: "notice_served", label: "Notice served", type: "checkbox", hideInTable: true },
    { name: "status", label: "Status", hideInForm: true },
    {
      name: "clearance_items",
      label: "Clearance",
      hideInForm: true,
      render: (row: HrRow) => {
        const items = (row.clearance_items as Array<{ status: string }>) ?? []
        if (!items.length) return "—"
        const cleared = items.filter((i) => i.status !== "pending").length
        return `${cleared}/${items.length}`
      },
    },
    {
      name: "final_settlement_amount",
      label: "Settlement",
      type: "money",
      render: (row: HrRow) => formatMoney(row.final_settlement_amount),
    },
    { name: "exit_interview_done", label: "Exit interview done", type: "checkbox", hideInTable: true },
    { name: "rehire_eligible", label: "Eligible for rehire", type: "checkbox", hideInTable: true },
    { name: "reason", label: "Reason", type: "textarea", hideInTable: true },
    { name: "exit_interview_notes", label: "Exit Interview Notes", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "In Clearance",
      show: (row) => row.status === "initiated",
      onClick: (row) => setStatus(row, "in_clearance"),
    },
    {
      label: "Mark Cleared",
      icon: IconCheck,
      show: (row) => row.status === "in_clearance",
      onClick: (row) => setStatus(row, "cleared"),
    },
    {
      label: "Settle",
      show: (row) => row.status === "cleared",
      onClick: (row) => setStatus(row, "settled"),
    },
  ]

  return (
    <>
      <ResourceScreen
        embedded
        title="Separations"
        singular="Separation"
        endpoint="/separations"
        fields={fields}
        optionSources={options}
        rowActions={actions}
        refreshToken={refresh}
        canCreate={false}
        filters={[
          { name: "status", label: "Status", options: enumOptions(STATUSES) },
          { name: "separation_type", label: "Types", options: enumOptions(TYPES) },
        ]}
        toolbar={
          <Button onClick={() => setOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <IconDoorExit className="h-4 w-4" />
            Initiate exit
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate separation</DialogTitle>
            <DialogDescription>
              Moves the employee to notice period and raises the standard clearance checklist,
              plus one line per asset still in their custody.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Employee</Label>
              <Select
                value={form.employee_id}
                onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee…" />
                </SelectTrigger>
                <SelectContent>
                  {(options.employees ?? []).map((o) => (
                    <SelectItem key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.separation_type}
                onValueChange={(v) => setForm((f) => ({ ...f, separation_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Notice period (days)</Label>
              <Input
                type="number"
                value={form.notice_period_days}
                onChange={(e) => setForm((f) => ({ ...f, notice_period_days: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Resignation date</Label>
              <Input
                type="date"
                value={form.resignation_date}
                onChange={(e) => setForm((f) => ({ ...f, resignation_date: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Last working day</Label>
              <Input
                type="date"
                value={form.last_working_day}
                onChange={(e) => setForm((f) => ({ ...f, last_working_day: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Reason</Label>
              <Textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={initiate} className="bg-teal-600 hover:bg-teal-700">
              Initiate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ClearanceTab() {
  const { options } = useHrOptions(["separations"])

  const fields: Field[] = [
    {
      name: "separation_id",
      label: "Separation",
      type: "select",
      optionsKey: "separations",
      required: true,
    },
    { name: "department", label: "Department", required: true },
    { name: "item", label: "Item", required: true, wide: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["pending", "cleared", "not_applicable"]),
      defaultValue: "pending",
    },
    { name: "remarks", label: "Remarks", type: "textarea", hideInTable: true },
  ]

  return (
    <ResourceScreen
      embedded
      title="Clearance Items"
      singular="Clearance Item"
      endpoint="/clearance-items"
      fields={fields}
      optionSources={options}
      description="A separation cannot be marked cleared or settled while any item is still pending."
      filters={[
        { name: "status", label: "Status", options: enumOptions(["pending", "cleared", "not_applicable"]) },
      ]}
    />
  )
}

const SeparationScreen = () => (
  <HrTabbedPage
    title="Separation / Offboarding"
    description="Settling an exit closes the employee record and releases any assets still assigned to them."
    tabs={[
      { value: "separations", label: "Separations", content: <SeparationsTab /> },
      { value: "clearance", label: "Clearance", content: <ClearanceTab /> },
    ]}
  />
)

export default SeparationScreen
