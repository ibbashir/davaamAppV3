import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import moment from "moment-timezone"
import { ChevronDown, Download, Search } from "lucide-react"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { canExportData } from "@/utils/companyAccess"
import { formatDate, formatUnixTimestamp } from "@/utils/formatters"
import { Pager } from "@/components/machine-visit/parts"
import type {
  ApiMachine,
  DispensingBrand,
  MachinesResponse,
  VendingBrand,
} from "../machines/Types"

type Mode = "7d" | "month" | "custom"
type Slot = DispensingBrand | VendingBrand
type Totals = { transactions: number; units: number; revenue: number }
type ReportTransaction = {
  id: string
  machine_code: string
  product: string
  units: number
  amount: number
  payment: string
  epoch_time: number
}
/** POST /corporates/salesReport: everything the page shows for one date range. */
type SalesReport = {
  unit: "pcs" | "L" | "mixed"
  totals: Totals
  lastSale: { machine_code: string; epoch_time: number } | null
  series: (Totals & { key: string })[]
  products: (Totals & { name: string })[]
  machines: (Totals & { machine_code: string; last_at: number | null })[]
  transactions: ReportTransaction[]
  total: number
  totalPages: number
  truncated: boolean
}
type MachineSort = "sold" | "stock" | "name"

const TEAL = "#0E6B62"
const GOLD = "#A9802F"
const MS_DAY = 86400000
const TZ = "Asia/Karachi"
const TOP_PRODUCTS = 6
// Picking machines one by one shouldn't send a request per tick
const SELECTION_SETTLE_MS = 400

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const pad = (n: number) => String(n).padStart(2, "0")
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const parseKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const fmt = (d: Date, year = false) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) })
// Sale times are shown in Pakistan time, wherever the viewer is
const pktStart = (key: string) => moment.tz(key, "YYYY-MM-DD", TZ).unix()
const fmtEpochDate = (epoch: number, year = false) =>
  moment.unix(epoch).tz(TZ).format(year ? "D MMM YYYY" : "D MMM")
const fmtEpochTime = (epoch: number) => moment.unix(epoch).tz(TZ).format("h:mm a")
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const isOnline = (m: ApiMachine) => m.statusCode === "g"
const neverOnline = (m: ApiMachine) => !m.lastUpdated

/** The selection, after it has stopped changing for a moment. The first one is used at once. */
function useSettled(value: string, ms: number) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    if (!settled) {
      setSettled(value)
      return
    }
    const t = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(t)
  }, [value, ms, settled])
  return settled
}

const Pill = ({ machine }: { machine: ApiMachine }) => {
  const online = isOnline(machine)
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        online ? "bg-[#E7F5EC] text-[#17663A]" : "bg-[#FDF1DC] text-[#8A5300]"
      }`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${online ? "bg-[#22A05A]" : "bg-[#D98A0B]"}`} />
      {online ? "Online" : neverOnline(machine) ? "Not connected yet" : "Offline"}
    </span>
  )
}

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`flex min-w-0 flex-col gap-[22px] rounded-[20px] border border-[#E7EAE8] bg-white p-5 sm:p-[26px] ${className}`}
  >
    {children}
  </div>
)

const Track = ({ pct, color, h = 10 }: { pct: number; color: string; h?: number }) => (
  <div className="overflow-hidden rounded-full bg-[#EEF1EF]" style={{ height: h }}>
    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
  </div>
)

const Empty = ({ title, hint, solid = false }: { title: string; hint: string; solid?: boolean }) => (
  <div
    className={`flex flex-1 flex-col items-center justify-center gap-1.5 px-3 py-7 text-center ${
      solid ? "border-t border-[#E7EAE8]" : "rounded-[14px] border border-dashed border-[#DCE1DF]"
    }`}
  >
    <b className="text-[15px]">{title}</b>
    <span className="text-sm text-[#5E6B69]">{hint}</span>
  </div>
)

const thCls = "border-b border-[#E7EAE8] px-2 pb-3 text-[13px] font-semibold text-[#5E6B69]"
const tdCls = "border-b border-[#F0F2F1] px-2 py-3.5"

const MachineStats = () => {
  const { id: routeId } = useParams()
  const { state } = useAuth()
  const { user } = state
  // View-only companies (e.g. Butterfly) see their sales but can't download them
  const exportAllowed = canExportData(user)

  const machineCodes = useMemo(
    () => (Array.isArray(user?.machines) ? user.machines.map((m) => String(m.machine_code)) : []),
    [user?.machines]
  )

  const [machines, setMachines] = useState<ApiMachine[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const [mode, setMode] = useState<Mode>("7d")
  const [month, setMonth] = useState(monthKey(new Date()))
  const [from, setFrom] = useState(dayKey(addDays(new Date(), -29)))
  const [to, setTo] = useState(dayKey(new Date()))
  const [error, setError] = useState<string | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [report, setReport] = useState<SalesReport | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txPerPage, setTxPerPage] = useState(20)
  const [mSearch, setMSearch] = useState("")
  const [mSort, setMSort] = useState<MachineSort>("sold")
  const [mPage, setMPage] = useState(1)
  const [mPerPage, setMPerPage] = useState(10)
  const pickerRef = useRef<HTMLDivElement>(null)
  const pickerBtnRef = useRef<HTMLButtonElement>(null)

  const today = startOfDay(new Date())
  const todayKey = dayKey(today)

  // Start with every machine (or the one in the URL) from the login, so sales
  // load alongside stock instead of after it
  useEffect(() => {
    if (machineCodes.length === 0) return
    setSelected(
      (prev) => prev ?? new Set(routeId && machineCodes.includes(routeId) ? [routeId] : machineCodes)
    )
  }, [machineCodes, routeId])

  // Machines + live stock
  useEffect(() => {
    if (machineCodes.length === 0) return
    postRequest<MachinesResponse>("/corporates/getAllMachineStockAndStatusByMachineCode", {
      machine_code: machineCodes,
    })
      .then((res) => {
        const { machines: grouped, brands } = res.data
        setMachines(Object.values(grouped).flat())
        setSlots([...brands.vending, ...brands.dispensing].sort((a, b) => a.row_num - b.row_num))
      })
      .catch(() => setError("Could not load machine stock."))
  }, [machineCodes])

  // Close picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return
    const onClick = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPickerOpen(false)
        pickerBtnRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [pickerOpen])

  const sel = useMemo(() => selected ?? new Set<string>(), [selected])
  const chosen = useMemo(() => machines.filter((m) => sel.has(String(m.machine_code))), [machines, sel])
  // Count machines that exist; an account can list a code that isn't a machine any more
  const n = machines.length ? chosen.length : sel.size
  const byCode = useMemo(() => new Map(machines.map((m) => [String(m.machine_code), m])), [machines])
  const shortName = (code: string) => byCode.get(code)?.machine_name ?? `Machine ${code}`

  const toggle = (code: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev ?? [])
      if (on) next.add(code)
      else next.delete(code)
      return next
    })

  // Month options: current month back 6 months
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        return {
          value: monthKey(d),
          label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayKey]
  )

  // Date range
  const range = useMemo(() => {
    let start: Date
    let end: Date
    if (mode === "month") {
      const m = parseKey(`${month}-01`)
      start = m
      end = new Date(m.getFullYear(), m.getMonth() + 1, 0)
    } else if (mode === "custom") {
      let a = parseKey(from)
      let b = parseKey(to)
      if (isNaN(a.getTime())) a = addDays(today, -6)
      if (isNaN(b.getTime())) b = today
      if (a > b) [a, b] = [b, a]
      start = a
      end = b
    } else {
      end = today
      start = addDays(today, -6)
    }
    if (end > today) end = today
    if (start > end) start = end
    const days = Math.round((end.getTime() - start.getTime()) / MS_DAY) + 1
    return { start, end, days }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, month, from, to, todayKey])

  const sameYear = range.start.getFullYear() === range.end.getFullYear()
  const rangeLabel =
    range.days === 1 ? fmt(range.end, true) : `${fmt(range.start, !sameYear)} – ${fmt(range.end, true)}`
  const fromEpoch = pktStart(dayKey(range.start))
  const toEpoch = pktStart(dayKey(addDays(range.end, 1)))

  // ── Sales report: one request for totals, chart, products and a page of sales
  const selectionKey = useMemo(() => [...sel].sort().join(","), [sel])
  const settledKey = useSettled(selectionKey, SELECTION_SETTLE_MS)
  const settledCodes = useMemo(() => (settledKey ? settledKey.split(",") : []), [settledKey])

  // A new selection or date range starts from the first page
  useEffect(() => {
    setTxPage(1)
  }, [settledKey, fromEpoch, toEpoch])

  useEffect(() => {
    if (settledCodes.length === 0) {
      setReport(null)
      setReportLoading(false)
      return
    }
    let cancelled = false
    setReportLoading(true)
    postRequest<SalesReport>("/corporates/salesReport", {
      from: fromEpoch,
      to: toEpoch,
      machine_codes: settledCodes,
      page: txPage,
      perPage: txPerPage,
    })
      .then((res) => {
        if (cancelled) return
        setReport(res)
        setError(null)
      })
      .catch(() => !cancelled && setError("Could not load sales."))
      .finally(() => !cancelled && setReportLoading(false))
    return () => {
      cancelled = true
    }
  }, [settledCodes, fromEpoch, toEpoch, txPage, txPerPage])

  const unitWord = report?.unit === "L" ? "litres" : report?.unit === "mixed" ? "units" : "pads"
  const UnitWord = unitWord.charAt(0).toUpperCase() + unitWord.slice(1)
  const soldTotal = report?.totals.units ?? 0
  const lastSale = report?.lastSale ?? null

  // ── Stock
  const slotsByCode = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const code = String(s.machine_code)
      if (!map.has(code)) map.set(code, [])
      map.get(code)!.push(s)
    }
    return map
  }, [slots])
  const slotsFor = (code: string) => slotsByCode.get(code) ?? []
  const slotCap = (s: Slot) => s.latestFilling?.quantity ?? s.availableQuantity
  const stocked = chosen.filter((m) => slotsFor(String(m.machine_code)).length > 0)
  const left = stocked.reduce(
    (t, m) => t + slotsFor(String(m.machine_code)).reduce((a, s) => a + Math.max(0, s.availableQuantity), 0),
    0
  )
  const cap = stocked.reduce(
    (t, m) => t + slotsFor(String(m.machine_code)).reduce((a, s) => a + slotCap(s), 0),
    0
  )
  const lastRefill = (code: string) =>
    slotsFor(code).reduce((mx, s) => Math.max(mx, s.latestFilling?.epoch_time ?? 0), 0)

  const online = chosen.filter(isOnline)
  const offline = chosen.filter((m) => !isOnline(m))
  const neverConnected = offline.filter(neverOnline).length
  const offlineText =
    offline.length === 0
      ? "All selected machines are online"
      : offline.length <= 2
        ? `${offline.map((m) => m.machine_name).join(" and ")} ${
            offline.every(neverOnline) ? "not connected yet" : "offline"
          }`
        : `${offline.length} offline${neverConnected ? `, ${neverConnected} never connected` : ""}`

  // ── Chart
  const perDay = useMemo(
    () => new Map((report?.series ?? []).map((p) => [p.key, p.units])),
    [report]
  )
  const maxDaily = Math.max(1, ...perDay.values())
  const step = Math.max(1, Math.ceil(range.days / 7))
  const gap = range.days <= 7 ? 14 : range.days <= 31 ? 4 : range.days <= 62 ? 2 : 1
  const dense = range.days > 31
  const chartDays = Array.from({ length: range.days }, (_, i) => addDays(range.start, i))

  const popular = report?.products ?? []

  // ── Machines table: search, sort and pages
  const soldBy = useMemo(
    () => new Map((report?.machines ?? []).map((m) => [m.machine_code, m])),
    [report]
  )
  const machineRows = useMemo(() => {
    const term = mSearch.trim().toLowerCase()
    const lowest = (m: ApiMachine) => {
      const s = slotsByCode.get(String(m.machine_code)) ?? []
      return s.length ? Math.min(...s.map((x) => x.availableQuantity)) : Number.POSITIVE_INFINITY
    }
    const sold = (m: ApiMachine) => soldBy.get(String(m.machine_code))?.units ?? 0
    const byName = (a: ApiMachine, b: ApiMachine) => a.machine_name.localeCompare(b.machine_name)
    return chosen
      .filter(
        (m) =>
          !term ||
          m.machine_name.toLowerCase().includes(term) ||
          String(m.machine_code).includes(term)
      )
      .sort((a, b) =>
        mSort === "sold"
          ? sold(b) - sold(a) || byName(a, b)
          : mSort === "stock"
            ? lowest(a) - lowest(b) || byName(a, b)
            : byName(a, b)
      )
  }, [chosen, mSearch, mSort, slotsByCode, soldBy])
  const mTotalPages = Math.max(1, Math.ceil(machineRows.length / mPerPage))
  const shownMachines = machineRows.slice((mPage - 1) * mPerPage, mPage * mPerPage)

  useEffect(() => {
    setMPage(1)
  }, [mSearch, mSort, selectionKey])

  // ── Transactions (paged by the server)
  const txTotal = report?.total ?? 0
  const txRows = report?.transactions ?? []

  const downloadCsv = async () => {
    if (!exportAllowed || !txTotal || exporting) return
    setExporting(true)
    try {
      const res = await postRequest<SalesReport>("/corporates/salesReport", {
        from: fromEpoch,
        to: toEpoch,
        machine_codes: settledCodes,
        export: true,
      })
      const lines: (string | number)[][] = [
        ["Date", "Time", "Machine", "Machine no.", "Product", "Quantity", "Paid by", "Amount (Rs)"],
        ...res.transactions.map((t) => [
          fmtEpochDate(t.epoch_time, true),
          fmtEpochTime(t.epoch_time),
          shortName(t.machine_code),
          t.machine_code,
          t.product,
          t.units,
          t.payment,
          t.amount,
        ]),
      ]
      const csv = lines
        .map((r) =>
          r
            .map((v) => {
              const s = String(v)
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
            })
            .join(",")
        )
        .join("\r\n")
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `davaam-sales-${dayKey(range.start)}-to-${dayKey(range.end)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError("Could not download sales.")
    } finally {
      setExporting(false)
    }
  }

  const company = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Your company"
  const total = machines.length || machineCodes.length
  const onlyOne =
    n === 1 ? (chosen[0]?.machine_name ?? byCode.get([...sel][0])?.machine_name ?? `Machine ${[...sel][0]}`) : ""
  const subtitle =
    n === 0
      ? `${company} · no machines selected`
      : n === total
        ? `${company} · all ${n} machine${n === 1 ? "" : "s"}`
        : n === 1
          ? `${company} · ${onlyOne}`
          : `${company} · ${n} of ${total} machines`
  const pickerValue =
    n === total && n > 0 ? `All machines (${n})` : n === 0 ? "Choose machines" : n === 1 ? onlyOne : `${n} machines`

  const pickerTerm = pickerSearch.trim().toLowerCase()
  const pickerList = pickerTerm
    ? machines.filter(
        (m) => m.machine_name.toLowerCase().includes(pickerTerm) || String(m.machine_code).includes(pickerTerm)
      )
    : machines

  const segBtn = (m: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className={`min-h-11 flex-1 rounded-[10px] px-2 text-sm font-semibold sm:flex-none sm:px-[18px] ${
        mode === m ? "bg-white text-[#12211F] shadow-[0_1px_3px_rgba(18,33,31,0.12)]" : "text-[#4A5856]"
      }`}
    >
      {label}
    </button>
  )

  const fieldCls =
    "min-h-11 rounded-xl border border-[#DCE1DF] bg-white px-3 text-[15px] font-medium text-[#12211F]"

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#12211F] [font-variant-numeric:tabular-nums]">
      <main className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pb-16 pt-8 sm:px-6 sm:pt-9">
        {/* Header + machine picker */}
        <section className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[34px]">
              Sales summary
            </h1>
            <p className="mt-1.5 text-base text-[#5E6B69]">{subtitle}</p>
          </div>

          <div ref={pickerRef} className="relative flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[280px]">
            <span className="text-[13px] font-semibold text-[#5E6B69]">Machines</span>
            <button
              ref={pickerBtnRef}
              type="button"
              aria-haspopup="true"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((o) => !o)}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[#DCE1DF] bg-white px-4 text-left text-[15px] font-semibold"
            >
              <span className="truncate">{pickerValue}</span>
              <ChevronDown
                className={`h-[18px] w-[18px] shrink-0 text-[#5E6B69] transition-transform ${
                  pickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full rounded-2xl border border-[#E1E6E3] bg-white p-2 shadow-[0_16px_40px_rgba(18,33,31,0.16)] sm:left-auto sm:right-0 sm:w-[380px]">
                {machines.length > 8 && (
                  <div className="relative px-1.5 pt-1.5">
                    <Search className="pointer-events-none absolute left-4 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-[#5E6B69]" />
                    <input
                      type="search"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search machines"
                      aria-label="Search machines"
                      className={`${fieldCls} w-full pl-9`}
                    />
                  </div>
                )}
                <fieldset className="m-0 border-0 p-0">
                  <legend className="px-3 pb-1.5 pt-2.5 text-[13px] font-semibold text-[#5E6B69]">
                    Show sales for
                  </legend>
                  <div className="flex max-h-[50vh] flex-col gap-0.5 overflow-y-auto">
                    {pickerList.length === 0 && (
                      <p className="px-3 py-4 text-sm text-[#5E6B69]">No machine matches “{pickerSearch}”.</p>
                    )}
                    {pickerList.map((m) => {
                      const code = String(m.machine_code)
                      const on = sel.has(code)
                      return (
                        <label
                          key={code}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ${
                            on ? "bg-[#F1F8F6]" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => toggle(code, e.target.checked)}
                            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                            style={{ accentColor: TEAL }}
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[15px] font-semibold">{m.machine_name}</span>
                              <Pill machine={m} />
                            </span>
                            <span className="text-[13px] text-[#5E6B69]">
                              {neverOnline(m)
                                ? "never online"
                                : `last online ${formatUnixTimestamp(m.lastUpdated as number)}`}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-[#EEF1EF] px-1.5 pb-1 pt-2.5">
                  <div>
                    <button
                      type="button"
                      className="min-h-10 rounded-[10px] px-3 text-sm font-semibold"
                      style={{ color: TEAL }}
                      onClick={() =>
                        setSelected((prev) => {
                          const next = new Set(pickerTerm ? (prev ?? []) : [])
                          pickerList.forEach((m) => next.add(String(m.machine_code)))
                          return next
                        })
                      }
                    >
                      {pickerTerm ? `Select these ${pickerList.length}` : "Select all"}
                    </button>
                    <button
                      type="button"
                      className="min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#4A5856]"
                      onClick={() => setSelected(new Set())}
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false)
                      pickerBtnRef.current?.focus()
                    }}
                    className="inline-flex min-h-11 items-center rounded-[10px] px-5 text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: TEAL }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {n === 0 ? (
          <section className="flex flex-col items-center justify-center gap-1.5 rounded-[20px] border border-dashed border-[#DCE1DF] bg-white px-6 py-12 text-center">
            <b className="text-[17px]">{machineCodes.length ? "No machine selected" : "No machines on this account"}</b>
            <span className="text-[15px] text-[#5E6B69]">
              {machineCodes.length
                ? "Choose at least one machine from the Machines menu to see its sales."
                : "Machines assigned to your company will appear here."}
            </span>
          </section>
        ) : (
          <>
            {/* Date range */}
            <section
              aria-label="Date range"
              className="flex flex-wrap items-end justify-between gap-3.5 rounded-[18px] border border-[#E7EAE8] bg-white px-5 py-[18px]"
            >
              <div className="flex w-full flex-wrap items-end gap-3.5 sm:w-auto">
                <div role="group" aria-label="Date range" className="inline-flex w-full gap-1 rounded-[14px] bg-[#ECEFEC] p-1 sm:w-auto">
                  {segBtn("7d", "Last 7 days")}
                  {segBtn("month", "Month")}
                  {segBtn("custom", "Custom dates")}
                </div>
                {mode === "month" && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="month-pick" className="text-[13px] font-semibold text-[#5E6B69]">
                      Month
                    </label>
                    <select
                      id="month-pick"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className={`${fieldCls} min-w-[190px] cursor-pointer`}
                    >
                      {monthOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {mode === "custom" && (
                  <div className="flex flex-wrap gap-2.5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="from-date" className="text-[13px] font-semibold text-[#5E6B69]">
                        From
                      </label>
                      <input
                        id="from-date"
                        type="date"
                        value={from}
                        max={todayKey}
                        onChange={(e) => setFrom(e.target.value)}
                        className={fieldCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="to-date" className="text-[13px] font-semibold text-[#5E6B69]">
                        To
                      </label>
                      <input
                        id="to-date"
                        type="date"
                        value={to}
                        max={todayKey}
                        onChange={(e) => setTo(e.target.value)}
                        className={fieldCls}
                      />
                    </div>
                  </div>
                )}
              </div>
              <span className="pb-2.5 text-[15px] font-semibold text-[#3F4D4B]">{rangeLabel}</span>
            </section>

            {/* Summary cards */}
            <section aria-label="Summary" className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              <div className="flex flex-col gap-2 rounded-[20px] border border-[#0E6B62] bg-[#0E6B62] px-[26px] py-6 text-white">
                <span className="text-sm font-semibold text-[#CFE8E3]">{UnitWord} sold</span>
                <span className="text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
                  {report ? soldTotal.toLocaleString() : "–"}
                </span>
                <span className="text-sm text-[#CFE8E3]">
                  {report
                    ? `Rs ${report.totals.revenue.toLocaleString()} · ${
                        lastSale
                          ? `last sale ${fmtEpochDate(lastSale.epoch_time)} at ${fmtEpochTime(lastSale.epoch_time)}`
                          : "no sales yet on these machines"
                      }`
                    : "Loading sales…"}
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-[20px] border border-[#E7EAE8] bg-white px-[26px] py-6">
                <span className="text-sm font-semibold text-[#5E6B69]">{UnitWord} left in machines</span>
                <span className="text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
                  {stocked.length ? left.toLocaleString() : "—"}{" "}
                  {stocked.length > 0 && (
                    <span className="text-xl font-semibold tracking-normal text-[#5E6B69]">
                      of {cap.toLocaleString()}
                    </span>
                  )}
                </span>
                <span className="text-sm text-[#5E6B69]">
                  {!machines.length
                    ? "Loading stock…"
                    : !stocked.length
                      ? "No stock loaded on these machines"
                      : stocked.length === 1
                        ? `${stocked[0].machine_name}${
                            lastRefill(String(stocked[0].machine_code))
                              ? ` · refilled ${fmt(new Date(lastRefill(String(stocked[0].machine_code)) * 1000))}`
                              : ""
                          }`
                        : `Across ${stocked.length} machines`}
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-[20px] border border-[#E7EAE8] bg-white px-[26px] py-6">
                <span className="text-sm font-semibold text-[#5E6B69]">Machines online</span>
                <span className="text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
                  {machines.length ? online.length : "–"}{" "}
                  <span className="text-xl font-semibold tracking-normal text-[#5E6B69]">of {n}</span>
                </span>
                <span className="text-sm text-[#5E6B69]">{machines.length ? offlineText : "Loading machines…"}</span>
              </div>
            </section>

            {/* Chart + popular */}
            <section className={`flex flex-wrap items-start gap-5 transition-opacity ${reportLoading ? "opacity-60" : ""}`}>
              <Panel className="flex-[3_1_480px]">
                <div>
                  <h2 className="text-[19px] font-bold">{UnitWord} sold each day</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">
                    {rangeLabel}
                    {report && !report.totals.transactions ? " · no sales in these dates" : ""}
                  </p>
                </div>
                <div>
                  <div
                    role="img"
                    aria-label={`${soldTotal} ${unitWord} sold between ${rangeLabel}`}
                    className="flex h-[170px] items-end border-b border-[#EEF1EF] pb-1"
                    style={{ gap }}
                  >
                    {chartDays.map((d, i) => {
                      const c = perDay.get(dayKey(d)) ?? 0
                      const isToday = dayKey(d) === todayKey
                      const h = Math.max(8, Math.round((c / maxDaily) * 120))
                      const hovered = hoverIdx === i
                      const align =
                        i < chartDays.length * 0.2
                          ? "left-0"
                          : i > chartDays.length * 0.8
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2"
                      return (
                        <div
                          key={dayKey(d)}
                          onMouseEnter={() => setHoverIdx(i)}
                          onMouseLeave={() => setHoverIdx(null)}
                          className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 ${
                            hovered ? "bg-[#F1F6F5]" : ""
                          }`}
                        >
                          {hovered && (
                            <div
                              role="tooltip"
                              className={`pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md bg-[#12211F] px-2.5 py-1.5 text-xs text-white shadow-lg ${align}`}
                            >
                              <div className="text-[#B7CFCA]">{fmt(d, true)}</div>
                              <div className="font-bold">
                                {c} {unitWord} sold
                              </div>
                            </div>
                          )}
                          <span className="min-h-4 text-[13px] font-bold" style={{ color: TEAL }}>
                            {c && range.days <= 31 ? c : ""}
                          </span>
                          {c ? (
                            <div
                              className={`w-full max-w-10 ${dense ? "rounded-sm" : "rounded-t-lg rounded-b-[3px]"}`}
                              style={{ height: h, background: TEAL }}
                            />
                          ) : (
                            <div
                              className="h-[3px] w-full max-w-10 rounded-sm"
                              style={{ background: isToday ? "#B7CFCA" : "#E3E7E5" }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div aria-hidden="true" className="mt-2.5 flex" style={{ gap }}>
                    {chartDays.map((d, i) => {
                      const isToday = dayKey(d) === todayKey
                      const show = (range.days - 1 - i) % step === 0
                      return (
                        <span
                          key={dayKey(d)}
                          className={`flex min-w-0 flex-1 justify-center whitespace-nowrap text-xs ${
                            isToday ? "font-bold text-[#12211F]" : "text-[#5E6B69]"
                          }`}
                        >
                          {show
                            ? isToday
                              ? "Today"
                              : range.days <= 7
                                ? `${WEEKDAY[d.getDay()]} ${d.getDate()}`
                                : fmt(d)
                            : ""}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </Panel>

              <Panel className="flex-[2_1_320px]">
                <div>
                  <h2 className="text-[19px] font-bold">Most popular</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">In the selected dates</p>
                </div>
                {popular.length ? (
                  <div className="flex flex-col gap-[18px]">
                    {popular.slice(0, TOP_PRODUCTS).map((p) => (
                      <div key={p.name}>
                        <div className="mb-2 flex justify-between gap-3 text-[15px]">
                          <b className="min-w-0 truncate font-semibold">{p.name}</b>
                          <span className="whitespace-nowrap text-[#5E6B69]">{p.units.toLocaleString()} sold</span>
                        </div>
                        <Track pct={Math.round((p.units / popular[0].units) * 100)} color={GOLD} />
                      </div>
                    ))}
                    {popular.length > TOP_PRODUCTS && (
                      <span className="text-sm text-[#5E6B69]">
                        and {popular.length - TOP_PRODUCTS} more product{popular.length - TOP_PRODUCTS === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                ) : (
                  <Empty
                    title={report ? "No sales in these dates" : "Loading…"}
                    hint={report ? "Try a longer date range." : "Fetching sales."}
                  />
                )}
              </Panel>
            </section>

            {/* Machines & stock */}
            <Panel className="!gap-[18px]">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold">Machines &amp; stock</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">
                    Live stock per slot, with each machine's sales in {rangeLabel}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
                  <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6B69]" />
                    <input
                      type="search"
                      value={mSearch}
                      onChange={(e) => setMSearch(e.target.value)}
                      placeholder="Search machines"
                      aria-label="Search machines"
                      className={`${fieldCls} w-full pl-9`}
                    />
                  </div>
                  <select
                    aria-label="Sort machines"
                    value={mSort}
                    onChange={(e) => setMSort(e.target.value as MachineSort)}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="sold">Most sold</option>
                    <option value="stock">Lowest stock</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>

              {!machines.length ? (
                <Empty solid title="Loading machines…" hint="Reading live stock from each machine." />
              ) : shownMachines.length === 0 ? (
                <Empty solid title={`No machine matches “${mSearch}”`} hint="Try another name or number." />
              ) : (
                <div className="-mx-5 overflow-x-auto px-5 sm:-mx-[26px] sm:px-[26px]">
                  <table className="w-full min-w-[760px] border-collapse text-[15px]">
                    <thead>
                      <tr>
                        <th className={`${thCls} text-left`}>Machine</th>
                        <th className={`${thCls} text-left`}>Status</th>
                        <th className={`${thCls} text-right`}>Sold</th>
                        <th className={`${thCls} text-left`}>Stock per slot</th>
                        <th className={`${thCls} text-left`}>Last online</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownMachines.map((m) => {
                        const code = String(m.machine_code)
                        const ms = slotsFor(code)
                        const sold = soldBy.get(code)
                        return (
                          <tr key={code}>
                            <td className={tdCls}>
                              <span className="block font-semibold">{m.machine_name}</span>
                              <span className="text-[13px] text-[#5E6B69]">
                                #{code}
                                {m.created_at ? ` · installed ${formatDate(m.created_at * 1000)}` : ""}
                              </span>
                            </td>
                            <td className={tdCls}>
                              <Pill machine={m} />
                            </td>
                            <td className={`${tdCls} text-right font-semibold`}>
                              {report ? (sold?.units ?? 0).toLocaleString() : "–"}
                            </td>
                            <td className={tdCls}>
                              {ms.length ? (
                                <div className="flex gap-1.5 whitespace-nowrap">
                                  {ms.map((s) => {
                                    const c = slotCap(s)
                                    const qty = s.availableQuantity
                                    const tone =
                                      qty <= 0
                                        ? "bg-[#FDECEA] text-[#B42318]"
                                        : c && qty / c < 0.25
                                          ? "bg-[#FDF1DC] text-[#8A5300]"
                                          : "bg-[#F1F4F3] text-[#3F4D4B]"
                                    return (
                                      <span
                                        key={`${code}-${s.row_num}-${s.id}`}
                                        title={`Slot ${s.row_num}: ${Math.max(0, qty)} of ${c} left`}
                                        className={`inline-flex items-baseline gap-1 rounded-md px-2 py-1 text-[13px] ${tone}`}
                                      >
                                        <span className="opacity-70">S{s.row_num}</span>
                                        <b className="font-semibold">{Math.max(0, qty)}</b>
                                        <span className="opacity-60">/{c}</span>
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="text-sm text-[#5E6B69]">No stock loaded</span>
                              )}
                            </td>
                            <td className={`${tdCls} whitespace-nowrap text-sm text-[#3F4D4B]`}>
                              {neverOnline(m) ? "Not yet online" : formatUnixTimestamp(m.lastUpdated as number)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {machineRows.length > 10 && (
                <Pager
                  id="stats-machines-per-page"
                  page={mPage}
                  totalPages={mTotalPages}
                  perPage={mPerPage}
                  pageSizes={[10, 20, 50]}
                  onPageChange={setMPage}
                  onPerPageChange={(size) => {
                    setMPerPage(size)
                    setMPage(1)
                  }}
                />
              )}
            </Panel>

            {/* Transactions */}
            <Panel className="!gap-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold">Transactions</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">
                    {txTotal
                      ? `${txTotal.toLocaleString()} ${txTotal === 1 ? "sale" : "sales"} · ${rangeLabel} · newest first`
                      : rangeLabel}
                  </p>
                </div>
                {exportAllowed && (
                  <button
                    type="button"
                    onClick={downloadCsv}
                    disabled={!txTotal || exporting}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl px-[22px] text-[15px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:!bg-[#E3E7E5] disabled:!text-[#5E6B69]"
                    style={{ background: TEAL }}
                  >
                    <Download className="h-[18px] w-[18px]" />
                    {exporting ? "Preparing…" : "Download"}
                  </button>
                )}
              </div>

              {txRows.length ? (
                <div
                  className={`-mx-5 overflow-x-auto px-5 transition-opacity sm:-mx-[26px] sm:px-[26px] ${
                    reportLoading ? "opacity-60" : ""
                  }`}
                >
                  <table className="w-full min-w-[680px] border-collapse text-[15px]">
                    <thead>
                      <tr>
                        {["#", "Date & time", "Machine", "Product", "Paid by", "Amount"].map((h) => (
                          <th key={h} className={`${thCls} ${h === "Amount" ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txRows.map((t, i) => (
                        <tr key={t.id}>
                          <td className={`${tdCls} w-11 text-[#5E6B69]`}>{(txPage - 1) * txPerPage + i + 1}</td>
                          <td className={tdCls}>
                            <span className="block font-semibold">{fmtEpochDate(t.epoch_time, true)}</span>
                            <span className="text-[13px] text-[#5E6B69]">{fmtEpochTime(t.epoch_time)}</span>
                          </td>
                          <td className={`${tdCls} text-[#3F4D4B]`}>{shortName(t.machine_code)}</td>
                          <td className={`${tdCls} font-medium`}>
                            {t.product}
                            {t.units > 1 ? ` ×${t.units}` : ""}
                          </td>
                          <td className={`${tdCls} text-[#3F4D4B]`}>{t.payment}</td>
                          <td className={`${tdCls} text-right font-semibold`}>Rs {t.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  solid
                  title={reportLoading ? "Loading transactions…" : "No transactions in these dates"}
                  hint={reportLoading ? "This can take a moment." : "Choose a longer range or other machines."}
                />
              )}

              {txTotal > 0 && (
                <Pager
                  id="stats-transactions-per-page"
                  page={txPage}
                  totalPages={Math.max(1, report?.totalPages ?? 1)}
                  perPage={txPerPage}
                  pageSizes={[10, 20, 50, 100]}
                  onPageChange={setTxPage}
                  onPerPageChange={(size) => {
                    setTxPerPage(size)
                    setTxPage(1)
                  }}
                />
              )}
            </Panel>
          </>
        )}
      </main>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap justify-center gap-3 px-4 pb-10 text-center text-[13px] text-[#5E6B69] sm:px-6">
        <span>Copyrights Reserved by Davaam Life Pvt Limited</span>
      </footer>
    </div>
  )
}

export default MachineStats
