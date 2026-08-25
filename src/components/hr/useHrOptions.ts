import * as React from "react"
import { hrList, hrGet } from "./hr-api"
import type { Option } from "./ResourceScreen"
import type { EmployeeOption } from "@/Types/hr"

/**
 * Loads the lookup lists that most HR forms need (employees, departments,
 * designations, leave types, shifts…). Every module that renders a picker
 * pulls from here so the option lists stay consistent and are fetched once per
 * screen rather than per field.
 *
 * Pass only the keys a screen actually uses — nothing else is requested.
 */
export type OptionKey =
  | "employees"
  | "managers"
  | "reportsTo"
  | "departments"
  | "designations"
  | "shifts"
  | "leaveTypes"
  | "jobPostings"
  | "candidates"
  | "trainings"
  | "reviewCycles"
  | "assets"
  | "pieceWorkRates"
  | "letterTemplates"
  | "payrollRuns"
  | "separations"
  | "travelRequests"

const ENDPOINTS: Record<Exclude<OptionKey, "employees" | "managers" | "reportsTo">, { path: string; label: (r: Record<string, unknown>) => string }> = {
  departments: { path: "/departments", label: (r) => String(r.name ?? "") },
  designations: { path: "/designations", label: (r) => String(r.title ?? "") },
  shifts: {
    path: "/shifts",
    label: (r) => `${r.name} (${r.start_time}–${r.end_time})`,
  },
  leaveTypes: { path: "/leave-types", label: (r) => String(r.name ?? "") },
  jobPostings: { path: "/job-postings", label: (r) => String(r.title ?? "") },
  candidates: { path: "/candidates", label: (r) => String(r.full_name ?? "") },
  trainings: { path: "/trainings", label: (r) => String(r.title ?? "") },
  reviewCycles: { path: "/review-cycles", label: (r) => String(r.name ?? "") },
  assets: {
    path: "/assets",
    label: (r) => `${r.asset_code} — ${r.name}`,
  },
  pieceWorkRates: {
    path: "/piece-work-rates",
    label: (r) => `${r.task_name} (${r.rate_per_unit}/${r.unit})`,
  },
  letterTemplates: { path: "/letter-templates", label: (r) => String(r.name ?? "") },
  payrollRuns: {
    path: "/payroll-runs",
    label: (r) => `${String(r.period_month).padStart(2, "0")}/${r.period_year}`,
  },
  separations: { path: "/separations", label: (r) => `Separation #${r.id}` },
  travelRequests: {
    path: "/travel-requests",
    label: (r) => `${r.request_code ?? r.id} — ${r.destination ?? ""}`,
  },
}

export function useHrOptions(keys: OptionKey[]) {
  const [options, setOptions] = React.useState<Record<string, Option[]>>({})
  const [loading, setLoading] = React.useState(true)

  // Stable dependency so a fresh array literal doesn't re-trigger the effect
  const keyList = keys.join(",")

  const load = React.useCallback(async () => {
    setLoading(true)
    const next: Record<string, Option[]> = {}
    const wanted = keyList ? (keyList.split(",") as OptionKey[]) : []

    await Promise.all(
      wanted.map(async (key) => {
        try {
          if (key === "employees" || key === "managers" || key === "reportsTo") {
            // "reportsTo" is the same list plus the hidden-but-still-a-manager
            // accounts (the CEO) — see hiddenEmployees.js. Only the pickers that
            // choose somebody's manager ask for it.
            const res = await hrGet<{ data: EmployeeOption[] }>("/employees/options", {
              managersOnly: key === "managers" ? "true" : undefined,
              includeManagers: key === "reportsTo" ? "true" : undefined,
            })
            next[key] = (res.data ?? []).map((e) => ({
              value: e.id,
              label: `${e.name} (${e.employee_code})`,
            }))
            return
          }

          const config = ENDPOINTS[key]
          if (!config) return
          const res = await hrList(config.path, { limit: 200 })
          next[key] = (res.data ?? []).map((r) => ({
            value: Number(r.id),
            label: config.label(r as Record<string, unknown>),
          }))
        } catch {
          // A failed lookup shouldn't blank the whole form — leave it empty
          next[key] = []
        }
      }),
    )

    setOptions(next)
    setLoading(false)
  }, [keyList])

  React.useEffect(() => {
    load()
  }, [load])

  return { options, loading, reload: load }
}

/** Turns a string enum into Select options with humanised labels. */
export function enumOptions(values: string[]): Option[] {
  return values.map((v) => ({
    value: v,
    label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}
