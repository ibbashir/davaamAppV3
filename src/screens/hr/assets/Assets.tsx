import * as React from "react"
import { StatTile } from "@/components/hr/HrPage"
import { ResourceScreen, type Field } from "@/components/hr/ResourceScreen"
import { enumOptions } from "@/components/hr/useHrOptions"
import { hrGet, formatMoney } from "@/components/hr/hr-api"
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

/** The asset register — everything the company owns and what state it is in. */
const Assets = () => {
  const [summary, setSummary] = React.useState<AssetSummary | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await hrGet<{ data: AssetSummary }>("/assets/summary")
        setSummary(res.data)
      } catch {
        setSummary(null)
      }
    })()
  }, [])

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

  return (
    <ResourceScreen
      title="Asset Register"
      singular="Asset"
      endpoint="/assets"
      fields={fields}
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
  )
}

export default Assets
