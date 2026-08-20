import * as React from "react"
import { HrTabbedPage, StatTile } from "@/components/hr/HrPage"
import { ResourceScreen, type Field, type RowAction } from "@/components/hr/ResourceScreen"
import { useHrOptions, enumOptions } from "@/components/hr/useHrOptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { IconArrowsExchange, IconArrowBackUp } from "@tabler/icons-react"
import { toast } from "sonner"
import { hrGet, hrAction, errorMessage, formatMoney, todayISO } from "@/components/hr/hr-api"
import type { HrRow } from "@/Types/hr"

const CATEGORIES = [
  "laptop",
  "desktop",
  "mobile",
  "vehicle",
  "furniture",
  "tool",
  "sim",
  "uniform",
  "other",
]
const ASSET_STATUSES = ["available", "assigned", "in_repair", "lost", "retired"]
const CONDITIONS = ["new", "good", "fair", "damaged"]

interface AssetSummary {
  total: number
  total_value: number
  warranty_expiring_60d: number
  by_status: Record<string, number>
}

function RegisterTab() {
  const [summary, setSummary] = React.useState<AssetSummary | null>(null)
  const [refresh, setRefresh] = React.useState(0)
  const { options } = useHrOptions(["employees"])
  const [assignFor, setAssignFor] = React.useState<HrRow | null>(null)
  const [assignTo, setAssignTo] = React.useState("")
  const [assignDate, setAssignDate] = React.useState(todayISO())

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{ data: AssetSummary }>("/assets/summary")
        setSummary(res.data)
      } catch {
        setSummary(null)
      }
    })()
  }, [refresh])

  const assign = async () => {
    if (!assignFor || !assignTo) {
      toast.error("Select an employee")
      return
    }
    try {
      await hrAction("/asset-assignments/assign", {
        asset_id: assignFor.id,
        employee_id: Number(assignTo),
        assigned_date: assignDate,
      })
      toast.success("Asset assigned")
      setAssignFor(null)
      setAssignTo("")
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not assign the asset"))
    }
  }

  const fields: Field[] = [
    { name: "asset_code", label: "Code", placeholder: "Auto-generated if blank" },
    { name: "name", label: "Asset", required: true },
    { name: "category", label: "Category", type: "select", options: enumOptions(CATEGORIES), defaultValue: "other" },
    { name: "serial_number", label: "Serial No." },
    {
      name: "purchase_cost",
      label: "Cost",
      type: "money",
      render: (row: HrRow) => formatMoney(row.purchase_cost),
    },
    { name: "purchase_date", label: "Purchased", type: "date", hideInTable: true },
    { name: "vendor", label: "Vendor", hideInTable: true },
    { name: "warranty_expiry", label: "Warranty Ends", type: "date" },
    {
      name: "asset_condition",
      label: "Condition",
      type: "select",
      options: enumOptions(CONDITIONS),
      defaultValue: "good",
    },
    { name: "status", label: "Status", type: "select", options: enumOptions(ASSET_STATUSES), defaultValue: "available" },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Assign",
      icon: IconArrowsExchange,
      show: (row) => row.status === "available",
      onClick: (row) => {
        setAssignFor(row)
        setAssignTo("")
        setAssignDate(todayISO())
      },
    },
  ]

  return (
    <>
      <ResourceScreen
        embedded
        title="Asset Register"
        singular="Asset"
        endpoint="/assets"
        fields={fields}
        rowActions={actions}
        refreshToken={refresh}
        filters={[
          { name: "status", label: "Status", options: enumOptions(ASSET_STATUSES) },
          { name: "category", label: "Categories", options: enumOptions(CATEGORIES) },
        ]}
        searchPlaceholder="Search assets…"
        header={
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total Assets" value={summary?.total ?? 0} tone="teal" />
            <StatTile label="Assigned" value={summary?.by_status?.assigned ?? 0} />
            <StatTile label="Available" value={summary?.by_status?.available ?? 0} tone="emerald" />
            <StatTile
              label="Warranty Expiring"
              value={summary?.warranty_expiring_60d ?? 0}
              hint="Next 60 days"
              tone={summary?.warranty_expiring_60d ? "amber" : "default"}
            />
          </div>
        }
      />

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign asset</DialogTitle>
            <DialogDescription>
              {String(assignFor?.name ?? "")} ({String(assignFor?.asset_code ?? "")})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Employee</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
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
              <Label>Assigned date</Label>
              <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)}>
              Cancel
            </Button>
            <Button onClick={assign} className="bg-teal-600 hover:bg-teal-700">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AssignmentsTab() {
  const { options } = useHrOptions(["employees", "assets"])
  const [refresh, setRefresh] = React.useState(0)

  const returnAsset = async (row: HrRow) => {
    try {
      await hrAction(`/asset-assignments/${row.id}/return`, { status: "returned" })
      toast.success("Asset returned to the pool")
      setRefresh((r) => r + 1)
    } catch (err) {
      toast.error(errorMessage(err, "Could not return the asset"))
    }
  }

  const fields: Field[] = [
    {
      name: "asset_id",
      label: "Asset",
      type: "select",
      optionsKey: "assets",
      required: true,
      render: (row: HrRow) => {
        const a = row.asset as { asset_code?: string; name?: string } | undefined
        return a ? `${a.asset_code} — ${a.name}` : "—"
      },
    },
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      optionsKey: "employees",
      required: true,
      render: (row: HrRow) => {
        const e = row.employee as { first_name?: string; last_name?: string } | undefined
        return `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "—"
      },
    },
    { name: "assigned_date", label: "Assigned", type: "date", required: true },
    { name: "returned_date", label: "Returned", type: "date" },
    { name: "condition_on_issue", label: "On Issue", hideInTable: true },
    { name: "condition_on_return", label: "On Return", hideInTable: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: enumOptions(["assigned", "returned", "lost", "damaged"]),
      defaultValue: "assigned",
    },
    { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
  ]

  const actions: RowAction[] = [
    {
      label: "Return",
      icon: IconArrowBackUp,
      show: (row) => row.status === "assigned",
      onClick: returnAsset,
    },
  ]

  return (
    <ResourceScreen
      embedded
      title="Assignments"
      singular="Assignment"
      endpoint="/asset-assignments"
      fields={fields}
      optionSources={options}
      rowActions={actions}
      refreshToken={refresh}
      filters={[
        { name: "status", label: "Status", options: enumOptions(["assigned", "returned", "lost", "damaged"]) },
      ]}
    />
  )
}

const Assets = () => (
  <HrTabbedPage
    title="Assets Management"
    description="Assigning or returning an asset updates the register automatically, so the two never disagree."
    tabs={[
      { value: "register", label: "Register", content: <RegisterTab /> },
      { value: "assignments", label: "Assignments", content: <AssignmentsTab /> },
    ]}
  />
)

export default Assets
