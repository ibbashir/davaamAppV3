import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { ChevronDown, Download } from "lucide-react"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { formatDate, formatUnixTimestamp } from "@/utils/formatters"
import { Pager } from "@/components/machine-visit/parts"
import type { TransactionPage } from "@/components/machine-visit/types"
import type {
  ApiMachine,
  DispensingBrand,
  MachinesResponse,
  VendingBrand,
} from "../machines/Types"

type Mode = "7d" | "month" | "custom"
type Slot = DispensingBrand | VendingBrand

type RawTransaction = {
  id?: number | string
  brand_id: number | string
  amount: number | string
  quantity: number | string
  created_at: string
}
type Brand = { id: number | string; name: string }
type Sale = {
  key: string
  machineCode: string
  date: Date
  product: string
  qty: number
  amt: number
}

const TEAL = "#0E6B62"
const GOLD = "#A9802F"
const MS_DAY = 86400000

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const pad = (n: number) => String(n).padStart(2, "0")
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const parseKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
// Keep the wall-clock time exactly as stored in the database: ignore any "Z"/offset
// instead of letting the browser convert it to the viewer's timezone.
const parseDate = (s: string) => {
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!m) return new Date(NaN)
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))
}
const fmt = (d: Date, year = false) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) })
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const isOnline = (m: ApiMachine) => m.statusCode === "g"
const neverOnline = (m: ApiMachine) => !m.lastUpdated

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

const MachineStats = () => {
  const { id: routeId } = useParams()
  const { state } = useAuth()
  const { user } = state

  const machineCodes = useMemo(
    () => (Array.isArray(user?.machines) ? user.machines.map((m) => String(m.machine_code)) : []),
    [user?.machines]
  )

  const [machines, setMachines] = useState<ApiMachine[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("7d")
  const [month, setMonth] = useState(monthKey(new Date()))
  const [from, setFrom] = useState(dayKey(addDays(new Date(), -29)))
  const [to, setTo] = useState(dayKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [brandNames, setBrandNames] = useState<Record<string, string>>({})
  const [txMachine, setTxMachine] = useState<string | null>(null)
  const [txPage, setTxPage] = useState(1)
  const [txPerPage, setTxPerPage] = useState(20)
  const [txData, setTxData] = useState<TransactionPage | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const pickerBtnRef = useRef<HTMLButtonElement>(null)

  const today = startOfDay(new Date())
  const todayKey = dayKey(today)

  // Machines + live stock
  useEffect(() => {
    if (machineCodes.length === 0) return
    postRequest<MachinesResponse>("/corporates/getAllMachineStockAndStatusByMachineCode", {
      machine_code: machineCodes,
    })
      .then((res) => {
        const { machines: grouped, brands } = res.data
        const list = Object.values(grouped).flat()
        setMachines(list)
        setSlots([...brands.vending, ...brands.dispensing].sort((a, b) => a.row_num - b.row_num))
        setSelected(
          (prev) =>
            prev ??
            new Set(
              routeId && list.some((m) => String(m.machine_code) === routeId)
                ? [routeId]
                : list.map((m) => String(m.machine_code))
            )
        )
      })
      .catch(() => setError("Could not load machine stock."))
  }, [machineCodes, routeId])

  // Sales history for every machine
  useEffect(() => {
    if (machineCodes.length === 0) return
    setLoading(true)
    Promise.all(
      machineCodes.map((code) =>
        postRequest<{ transactions?: RawTransaction[]; brands?: Brand[] }>(
          "/corporates/machineDetailsWithMachineCode",
          { machine_code: code }
        )
          .then((res) => {
            const name = (bid: number | string) =>
              res.brands?.find((b) => String(b.id) === String(bid))?.name ?? `Product ${bid}`
            setBrandNames((prev) => {
              const next = { ...prev }
              res.brands?.forEach((b) => (next[`${code}:${b.id}`] = b.name))
              return next
            })
            return (res.transactions ?? []).map<Sale>((t, i) => ({
              key: `${code}-${t.id ?? i}`,
              machineCode: code,
              date: parseDate(t.created_at),
              product: name(t.brand_id),
              qty: Number(t.quantity) || 1,
              amt: Number(t.amount) || 0,
            }))
          })
          .catch(() => {
            setError("Could not load sales for some machines.")
            return [] as Sale[]
          })
      )
    )
      .then((all) =>
        setSales(
          all
            .flat()
            .filter((s) => !isNaN(s.date.getTime()))
            .sort((a, b) => b.date.getTime() - a.date.getTime())
        )
      )
      .finally(() => setLoading(false))
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

  const sel = selected ?? new Set<string>()
  const chosen = machines.filter((m) => sel.has(String(m.machine_code)))
  const n = chosen.length
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

  const rows = useMemo(
    () =>
      sales.filter((s) => {
        const d = startOfDay(s.date)
        return sel.has(s.machineCode) && d >= range.start && d <= range.end
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sales, selected, range]
  )
  const padsSold = rows.reduce((t, s) => t + s.qty, 0)
  const lastSale = sales.find((s) => sel.has(s.machineCode))

  // Stock
  const slotsFor = (code: string) => slots.filter((s) => String(s.machine_code) === code)
  const slotCap = (s: Slot) => s.latestFilling?.quantity ?? s.availableQuantity
  const stocked = chosen.filter((m) => slotsFor(String(m.machine_code)).length > 0)
  const left = stocked.reduce(
    (t, m) => t + slotsFor(String(m.machine_code)).reduce((a, s) => a + s.availableQuantity, 0),
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

  // Chart
  const perDay = new Map<string, number>()
  rows.forEach((s) => perDay.set(dayKey(s.date), (perDay.get(dayKey(s.date)) ?? 0) + s.qty))
  const maxDaily = Math.max(1, ...perDay.values())
  const step = Math.max(1, Math.ceil(range.days / 7))
  const gap = range.days <= 7 ? 14 : range.days <= 31 ? 4 : range.days <= 62 ? 2 : 1
  const dense = range.days > 31
  const chartDays = Array.from({ length: range.days }, (_, i) => addDays(range.start, i))

  // Popular
  const popular = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((s) => map.set(s.product, (map.get(s.product) ?? 0) + s.qty))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  // Paginated transactions for one machine (server-side paging)
  const activeTxMachine =
    txMachine && chosen.some((m) => String(m.machine_code) === txMachine)
      ? txMachine
      : chosen[0]
        ? String(chosen[0].machine_code)
        : null
  const fromEpoch = Math.floor(range.start.getTime() / 1000)
  const toEpoch = Math.floor(addDays(range.end, 1).getTime() / 1000) - 1

  useEffect(() => {
    if (!activeTxMachine) return
    let cancelled = false
    setTxLoading(true)
    postRequest<TransactionPage>("/corporates/machineTransactionWithMachineCode", {
      machine_code: activeTxMachine,
      page: txPage,
      perPage: txPerPage,
      from: fromEpoch,
      to: toEpoch,
    })
      .then((res) => !cancelled && setTxData(res))
      .catch(() => !cancelled && setTxData({ transactions: [], total: 0, totalPages: 1 }))
      .finally(() => !cancelled && setTxLoading(false))
    return () => {
      cancelled = true
    }
  }, [activeTxMachine, txPage, txPerPage, fromEpoch, toEpoch])

  // A new machine or date range starts from the first page
  useEffect(() => {
    setTxPage(1)
  }, [activeTxMachine, fromEpoch, toEpoch])

  const txTotal = txData?.total ?? 0
  const txRows = txData?.transactions ?? []

  const downloadCsv = () => {
    if (!rows.length) return
    const lines: (string | number)[][] = [
      ["Date", "Time", "Machine", "Machine no.", "Product", "Quantity", "Paid by", "Amount (Rs)"],
      ...rows.map((s) => [
        fmt(s.date, true),
        fmtTime(s.date),
        shortName(s.machineCode),
        s.machineCode,
        s.product,
        s.qty,
        "At machine",
        s.amt,
      ]),
    ]
    const csv = lines
      .map((r) =>
        r
          .map((v) => {
            const t = String(v)
            return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
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
  }

  const company = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Your company"
  const first = chosen[0]
  const subtitle =
    n === 0
      ? `${company} · no machines selected`
      : n === machines.length
        ? `${company} · all ${n} machine${n === 1 ? "" : "s"}`
        : n === 1
          ? `${company} · ${first.machine_name}`
          : `${company} · ${n} of ${machines.length} machines`
  const pickerValue =
    n === machines.length && n > 0
      ? `All machines (${n})`
      : n === 0
        ? "Choose machines"
        : n === 1
          ? first.machine_name
          : `${n} machines`

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
      <main className="mx-auto flex flex-col gap-7 px-4 pb-16 pt-8 sm:px-6 sm:pt-9">
        {/* Header + machine picker */}
        <section className="flex flex-wrap items-end justify-between gap-5">
          <div>
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
              <span>{pickerValue}</span>
              <ChevronDown
                className={`h-[18px] w-[18px] shrink-0 text-[#5E6B69] transition-transform ${
                  pickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full rounded-2xl border border-[#E1E6E3] bg-white p-2 shadow-[0_16px_40px_rgba(18,33,31,0.16)] sm:left-auto sm:right-0 sm:w-[380px]">
                <fieldset className="m-0 border-0 p-0">
                  <legend className="px-3 pb-1.5 pt-2.5 text-[13px] font-semibold text-[#5E6B69]">
                    Show sales for
                  </legend>
                  <div className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto">
                    {machines.map((m) => {
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
                      onClick={() => setSelected(new Set(machines.map((m) => String(m.machine_code))))}
                    >
                      Select all
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
            <b className="text-[17px]">{machines.length ? "No machine selected" : "Loading machines…"}</b>
            <span className="text-[15px] text-[#5E6B69]">
              {machines.length
                ? "Choose at least one machine from the Machines menu to see its sales."
                : "Fetching your machines."}
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
                <span className="text-sm font-semibold text-[#CFE8E3]">Pads sold</span>
                <span className="text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
                  {loading ? "–" : padsSold}
                </span>
                <span className="text-sm text-[#CFE8E3]">
                  {lastSale
                    ? `Last sale ${fmt(lastSale.date)} at ${fmtTime(lastSale.date)}`
                    : loading
                      ? "Loading sales…"
                      : "No sales yet on these machines"}
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-[20px] border border-[#E7EAE8] bg-white px-[26px] py-6">
                <span className="text-sm font-semibold text-[#5E6B69]">Pads left in machines</span>
                <span className="text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
                  {stocked.length ? left : "—"}{" "}
                  {stocked.length > 0 && (
                    <span className="text-xl font-semibold tracking-normal text-[#5E6B69]">of {cap}</span>
                  )}
                </span>
                <span className="text-sm text-[#5E6B69]">
                  {!stocked.length
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
                  {online.length}{" "}
                  <span className="text-xl font-semibold tracking-normal text-[#5E6B69]">of {n}</span>
                </span>
                <span className="text-sm text-[#5E6B69]">
                  {offline.length
                    ? `${offline.map((m) => m.machine_name).join(", ")} ${
                        offline.every(neverOnline) ? "not connected yet" : "offline"
                      }`
                    : "All selected machines are online"}
                </span>
              </div>
            </section>

            {/* Chart + popular */}
            <section className="flex flex-wrap items-stretch gap-5">
              <Panel className="flex-[3_1_480px]">
                <div>
                  <h2 className="text-[19px] font-bold">Pads sold each day</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">
                    {rangeLabel}
                    {rows.length ? "" : " · no sales in these dates"}
                  </p>
                </div>
                <div>
                  <div
                    role="img"
                    aria-label={`${padsSold} pads sold between ${rangeLabel}`}
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
                                {c} pad{c === 1 ? "" : "s"} sold
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
                    {popular.map(([name, count]) => (
                      <div key={name}>
                        <div className="mb-2 flex justify-between gap-3 text-[15px]">
                          <b className="font-semibold">{name}</b>
                          <span className="whitespace-nowrap text-[#5E6B69]">{count} sold</span>
                        </div>
                        <Track pct={Math.round((count / popular[0][1]) * 100)} color={GOLD} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty title="No sales in these dates" hint="Try a longer date range." />
                )}
              </Panel>
            </section>

            {/* Machines & stock */}
            <Panel>
              <div>
                <h2 className="text-[19px] font-bold">Machines &amp; stock</h2>
                <p className="mt-1 text-sm text-[#5E6B69]">Live from each selected machine</p>
              </div>
              <div className="flex flex-col gap-[22px]">
                {chosen.map((m) => {
                  const code = String(m.machine_code)
                  const ms = slotsFor(code)
                  return (
                    <div key={code} className="flex flex-col gap-3 border-t border-[#EEF1EF] pt-[18px]">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="flex flex-wrap items-center gap-2.5 text-base font-bold">
                          {m.machine_name} <Pill machine={m} />
                        </span>
                        <span className="flex flex-wrap gap-4 text-[13px] text-[#5E6B69]">
                          <span>
                            Last online:{" "}
                            <b className="font-semibold text-[#3F4D4B]">
                              {neverOnline(m) ? "Not yet online" : formatUnixTimestamp(m.lastUpdated as number)}
                            </b>
                          </span>
                          <span>
                            Installed:{" "}
                            <b className="font-semibold text-[#3F4D4B]">
                              {m.created_at ? formatDate(m.created_at * 1000) : "N/A"}
                            </b>
                          </span>
                        </span>
                      </div>
                      {ms.length ? (
                        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                          {ms.map((s) => {
                            const c = slotCap(s)
                            const pct = c ? Math.min(100, Math.round((s.availableQuantity / c) * 100)) : 0
                            return (
                              <div
                                key={`${code}-${s.row_num}-${s.id}`}
                                className="flex flex-col gap-2.5 rounded-2xl bg-[#F7F9F8] px-5 py-[18px]"
                              >
                                <span className="text-sm font-semibold text-[#5E6B69]">Slot {s.row_num}</span>
                                <span className="text-[30px] font-bold leading-none tracking-[-0.02em]">
                                  {s.availableQuantity}{" "}
                                  <small className="text-[15px] font-medium tracking-normal text-[#5E6B69]">
                                    of {c} left
                                  </small>
                                </span>
                                <div className="overflow-hidden rounded-full bg-[#E3E9E6]" style={{ height: 8 }}>
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${pct}%`, background: pct < 25 ? "#C0392B" : TEAL }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[14px] border border-dashed border-[#DCE1DF] px-[18px] py-4 text-sm text-[#5E6B69]">
                          {isOnline(m)
                            ? "Online, but no stock has been loaded yet."
                            : "Not connected yet, so stock can’t be read."}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Transactions */}
            <Panel className="!gap-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold">Transactions</h2>
                  <p className="mt-1 text-sm text-[#5E6B69]">
                    {txTotal
                      ? `${txTotal} ${txTotal === 1 ? "sale" : "sales"} · ${rangeLabel} · newest first`
                      : rangeLabel}
                  </p>
                </div>
                {chosen.length > 1 && (
                  <select
                    aria-label="Machine"
                    value={activeTxMachine ?? ""}
                    onChange={(e) => setTxMachine(e.target.value)}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    {chosen.map((m) => (
                      <option key={m.machine_code} value={String(m.machine_code)}>
                        {m.machine_name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={downloadCsv}
                  disabled={!rows.length}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl px-[22px] text-[15px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:!bg-[#E3E7E5] disabled:!text-[#5E6B69]"
                  style={{ background: TEAL }}
                >
                  <Download className="h-[18px] w-[18px]" />
                  Download
                </button>
              </div>

              {txRows.length ? (
                <div
                  className={`-mx-5 overflow-x-auto px-5 transition-opacity sm:-mx-[26px] sm:px-[26px] ${
                    txLoading ? "opacity-60" : ""
                  }`}
                >
                  <table className="w-full min-w-[680px] border-collapse text-[15px]">
                    <thead>
                      <tr>
                        {["#", "Date & time", "Machine", "Product", "Paid by", "Amount"].map((h) => (
                          <th
                            key={h}
                            className={`border-b border-[#E7EAE8] px-2 pb-3 text-[13px] font-semibold text-[#5E6B69] ${
                              h === "Amount" ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txRows.map((t, i) => {
                        const d = t.epoch_time ? new Date(t.epoch_time * 1000) : parseDate(t.created_at)
                        const qty = Number(t.quantity) || 1
                        return (
                          <tr key={t.id}>
                            <td className="w-11 border-b border-[#F0F2F1] px-2 py-3.5 text-[#5E6B69]">
                              {(txPage - 1) * txPerPage + i + 1}
                            </td>
                            <td className="border-b border-[#F0F2F1] px-2 py-3.5">
                              <span className="block font-semibold">{fmt(d, true)}</span>
                              <span className="text-[13px] text-[#5E6B69]">{fmtTime(d)}</span>
                            </td>
                            <td className="border-b border-[#F0F2F1] px-2 py-3.5 text-[#3F4D4B]">
                              {shortName(String(t.machine_code ?? activeTxMachine))}
                            </td>
                            <td className="border-b border-[#F0F2F1] px-2 py-3.5 font-medium">
                              {brandNames[`${activeTxMachine}:${t.brand_id}`] ?? `Product ${t.brand_id}`}
                              {qty > 1 ? ` ×${qty}` : ""}
                            </td>
                            <td className="border-b border-[#F0F2F1] px-2 py-3.5 text-[#3F4D4B]">
                              {t.payment_method || "At machine"}
                            </td>
                            <td className="border-b border-[#F0F2F1] px-2 py-3.5 text-right font-semibold">
                              Rs {(Number(t.amount) || 0).toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  solid
                  title={txLoading ? "Loading transactions…" : "No transactions in these dates"}
                  hint={txLoading ? "This can take a moment." : "Choose a longer range or another machine."}
                />
              )}

              {txTotal > 0 && (
                <Pager
                  id="stats-transactions-per-page"
                  page={txPage}
                  totalPages={Math.max(1, txData?.totalPages ?? 1)}
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
