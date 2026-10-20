import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, Download } from "lucide-react"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { COMPANY_SALES_REPORT_BASE, MACHINE_MACHINES } from "@/constants/Constant"
import { formatUnixTimestamp } from "@/utils/formatters"
import type {
  ApiMachine,
  DispensingBrand,
  MachinesResponse,
  VendingBrand,
} from "../machines/Types"

type RangeKey = "today" | "7" | "30"

type Transaction = {
  id?: number | string
  brand_id: number | string
  amount: number | string
  quantity: number | string
  created_at: string
}

type Brand = { id: number | string; name: string; price?: string }

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
]

const PRIMARY = "#0f6b5c"
const GOLD = "#a8803a"

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const parseDate = (s: string) => new Date(String(s).replace(" ", "T"))
const fmtShort = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
const fmtLong = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })
const fmtSale = (d: Date) => {
  const today = startOfDay(new Date())
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" ", "")
  if (dayKey(d) === dayKey(today)) return `Today, ${time}`
  if (dayKey(d) === dayKey(addDays(today, -1))) return `Yesterday, ${time}`
  return `${fmtShort(d)}, ${time}`
}
const rs = (n: number) => `Rs ${n.toLocaleString()}`

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm ${className}`}>
    {children}
  </div>
)

const MachineStats = () => {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { state } = useAuth()
  const { user } = state

  const machineCodes = useMemo(
    () =>
      Array.isArray(user?.machines)
        ? user.machines.map((m) => m.machine_code)
        : [],
    [user?.machines]
  )

  const id = routeId ?? (machineCodes[0] !== undefined ? String(machineCodes[0]) : undefined)

  const [machines, setMachines] = useState<ApiMachine[]>([])
  const [slots, setSlots] = useState<(DispensingBrand | VendingBrand)[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [range, setRange] = useState<RangeKey>("30")
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const machine = machines.find((m) => String(m.machine_code) === String(id))

  // Machine list + live stock (also feeds the machine switcher)
  useEffect(() => {
    if (machineCodes.length === 0) return
    postRequest<MachinesResponse>("/corporates/getAllMachineStockAndStatusByMachineCode", {
      machine_code: machineCodes,
    })
      .then((res) => {
        const { machines: grouped, brands: b } = res.data
        setMachines(Object.values(grouped).flat())
        setSlots(
          [...b.vending, ...b.dispensing]
            .filter((x) => String(x.machine_code) === String(id))
            .sort((a, c) => a.row_num - c.row_num)
        )
      })
      .catch(() => setError("Could not load machine stock."))
  }, [machineCodes, id])

  // Sales history for the selected machine
  useEffect(() => {
    if (!id) return
    setLoading(true)
    setShowAll(false)
    postRequest<{ transactions?: Transaction[]; brands?: Brand[] }>(
      "/corporates/machineDetailsWithMachineCode",
      { machine_code: id }
    )
      .then((res) => {
        setTransactions(res.transactions ?? [])
        setBrands(res.brands ?? [])
        setError(null)
      })
      .catch(() => setError("Could not load sales for this machine."))
      .finally(() => setLoading(false))
  }, [id])

  const brandName = (brandId: number | string) =>
    brands.find((b) => String(b.id) === String(brandId))?.name ?? `Product ${brandId}`

  const days = RANGES.find((r) => r.key === range)!.days
  const today = startOfDay(new Date())
  const rangeStart = addDays(today, -(days - 1))

  const sales = useMemo(
    () =>
      transactions
        .map((t) => ({
          ...t,
          date: parseDate(t.created_at),
          qty: Number(t.quantity) || 0,
          amt: Number(t.amount) || 0,
        }))
        .filter((t) => !isNaN(t.date.getTime()))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [transactions]
  )

  const inRange = sales.filter((t) => t.date >= rangeStart)
  const padsSold = inRange.reduce((s, t) => s + t.qty, 0)
  const money = inRange.reduce((s, t) => s + t.amt, 0)
  const salesPerWeek = Math.round((inRange.length / days) * 7)
  const perPad = padsSold ? Math.round(money / padsSold) : 0

  const padsLeft = slots.reduce((s, b) => s + b.availableQuantity, 0)
  const capacity = slots.reduce((s, b) => s + (b.latestFilling?.quantity ?? b.availableQuantity), 0)
  const lastRefill = slots
    .map((b) => b.latestFilling?.epoch_time ?? 0)
    .reduce((a, b) => Math.max(a, b), 0)

  const daily = useMemo(() => {
    const counts = new Map<string, number>()
    inRange.forEach((t) => counts.set(dayKey(t.date), (counts.get(dayKey(t.date)) ?? 0) + t.qty))
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(rangeStart, i)
      return { date: d, count: counts.get(dayKey(d)) ?? 0 }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange.length, days, transactions])
  const maxDaily = Math.max(1, ...daily.map((d) => d.count))

  const popular = useMemo(() => {
    const map = new Map<string, number>()
    sales.forEach((t) => map.set(brandName(t.brand_id), (map.get(brandName(t.brand_id)) ?? 0) + t.qty))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, brands])
  const maxPopular = Math.max(1, ...popular.map((p) => p[1]))

  const lowSlots = slots.filter((s) => {
    const cap = s.latestFilling?.quantity ?? 0
    return cap > 0 && s.availableQuantity < cap / 4
  })

  const visibleSales = showAll ? sales : sales.slice(0, 6)

  const downloadReport = () => {
    const rows = [
      [`Machine: ${machine?.machine_name ?? "N/A"} (Code: ${id})`],
      [],
      ["Date", "Product", "Quantity", "Amount"],
      ...sales.map((t) => [t.date.toLocaleString(), brandName(t.brand_id), t.qty, t.amt]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `sales_${id}_${dayKey(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const working = machine?.statusCode === "g"

  return (
    <div className="min-h-screen bg-[#f5f4ef] px-4 py-8 text-[#1d2b27] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <button
          onClick={() => navigate(MACHINE_MACHINES)}
          className="inline-flex items-center gap-1 text-xs font-medium"
          style={{ color: PRIMARY }}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All machines
        </button>

        {/* Title row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {machine?.machine_name ?? `Machine ${id}`}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
                  working ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${working ? "bg-emerald-500" : "bg-red-500"}`}
                />
                {working ? "Working" : "Not working"}
              </span>
              {machine?.machine_location && <span>{machine.machine_location}</span>}
              {machine?.lastUpdated && (
                <span>· Last checked {formatUnixTimestamp(machine.lastUpdated)}</span>
              )}
            </div>
          </div>

          {machines.length > 1 && (
            <div className="sm:w-64">
              <label className="mb-1 block text-[11px] text-gray-500">Viewing machine</label>
              <select
                value={id}
                onChange={(e) => navigate(`${COMPANY_SALES_REPORT_BASE}/${e.target.value}`)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.machine_code}>
                    {m.machine_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Range selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-black/5 p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                  range === r.key ? "bg-white shadow-sm" : "text-gray-500"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {days === 1 ? fmtLong(today) : `${fmtLong(rangeStart)} · ${fmtLong(today)}`}
          </span>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-xs text-gray-500">Pads sold</div>
            <div className="mt-2 text-4xl font-bold">{loading ? "–" : padsSold}</div>
            <div className="mt-1 text-xs text-gray-500">About {salesPerWeek} sales a week</div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Money collected</div>
            <div className="mt-2 text-4xl font-bold">{loading ? "–" : rs(money)}</div>
            <div className="mt-1 text-xs text-gray-500">{rs(perPad)} per pad</div>
          </Card>
          <div className="rounded-2xl p-6 text-white shadow-sm" style={{ background: PRIMARY }}>
            <div className="text-xs opacity-90">Pads left in machine</div>
            <div className="mt-2 text-4xl font-bold">
              {padsLeft} <span className="text-base font-medium opacity-80">of {capacity}</span>
            </div>
            <div className="mt-1 text-xs opacity-90">
              {lowSlots.length === 0 ? "All slots stocked" : `${lowSlots.length} slot(s) running low`}
              {lastRefill ? ` · refilled ${fmtShort(new Date(lastRefill * 1000))}` : ""}
            </div>
          </div>
        </div>

        {/* Chart + slots */}
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <h2 className="font-semibold">Sales each day</h2>
            <p className="text-xs text-gray-500">
              {days === 1 ? "Today" : `Last ${days} days`}
            </p>
            <div className="mt-6 flex h-48 items-end gap-[3px]">
              {daily.map((d) => (
                <div
                  key={dayKey(d.date)}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                  title={`${fmtShort(d.date)}: ${d.count}`}
                >
                  {d.count > 0 && (
                    <span className="mb-1 text-[10px] font-semibold" style={{ color: PRIMARY }}>
                      {d.count}
                    </span>
                  )}
                  <div
                    className="w-full max-w-5 rounded-sm"
                    style={{
                      height: d.count > 0 ? `${(d.count / maxDaily) * 80}%` : 2,
                      background: d.count > 0 ? PRIMARY : "#e5e5df",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-500">
              <span>{fmtShort(rangeStart)}</span>
              <span className="font-semibold text-gray-800">Today</span>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Stock in each slot</h2>
            <p className="text-xs text-gray-500">Live from the machine</p>
            <div className="mt-5 space-y-4">
              {slots.length === 0 && <p className="text-sm text-gray-500">No slot data.</p>}
              {slots.map((s) => {
                const cap = s.latestFilling?.quantity ?? s.availableQuantity
                const pct = cap ? Math.min(100, (s.availableQuantity / cap) * 100) : 0
                return (
                  <div key={`${s.machine_code}-${s.row_num}-${s.id}`}>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">Slot {s.row_num}</span>
                      <span className="text-gray-500">
                        {s.availableQuantity} of {cap} left
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#eceae3]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: pct < 25 ? "#c0392b" : PRIMARY }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 rounded-lg bg-[#f1f3ef] p-3 text-xs text-gray-500">
              {lowSlots.length === 0
                ? "No slot needs a refill yet. We'll flag any slot that drops below a quarter."
                : `Slot ${lowSlots.map((s) => s.row_num).join(", ")} dropped below a quarter. Refill soon.`}
            </div>
          </Card>
        </div>

        {/* Recent sales + popular */}
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent sales</h2>
              <button
                onClick={downloadReport}
                disabled={sales.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Download report
              </button>
            </div>
            <div className="mt-4 divide-y divide-gray-100">
              {!loading && visibleSales.length === 0 && (
                <p className="py-6 text-sm text-gray-500">No sales yet.</p>
              )}
              {visibleSales.map((t, i) => (
                <div key={t.id ?? i} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-semibold">{brandName(t.brand_id)}</div>
                    <div className="text-[11px] text-gray-500">{fmtSale(t.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{rs(t.amt)}</div>
                    <div className="text-[11px] text-gray-500">Paid at machine</div>
                  </div>
                </div>
              ))}
            </div>
            {sales.length > 6 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 text-xs font-medium"
                style={{ color: PRIMARY }}
              >
                {showAll ? "Show fewer" : `See all ${sales.length} sales`}
              </button>
            )}
          </Card>

          <Card className="self-start">
            <h2 className="font-semibold">Most popular</h2>
            <p className="text-xs text-gray-500">All sales since the machine started</p>
            <div className="mt-5 space-y-4">
              {popular.length === 0 && <p className="text-sm text-gray-500">No sales yet.</p>}
              {popular.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{name}</span>
                    <span className="text-gray-500">{count} sold</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#eceae3]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / maxPopular) * 100}%`, background: GOLD }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex justify-between pt-2 text-[11px] text-gray-500">
          <span>Machine {id}</span>
          <span>Need help? Contact Davaam support</span>
        </div>
      </div>
    </div>
  )
}

export default MachineStats
