import { useState, useRef, useEffect, useCallback } from "react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { getRequest, postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/utils/formatters"
import { toast } from "sonner"
import {
  IconRobot,
  IconSend2,
  IconLoader2,
  IconSparkles,
  IconTrash,
  IconCopy,
  IconCheck,
  IconChartBar,
  IconTable,
  IconHistory,
} from "@tabler/icons-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"

type ChatRole = "user" | "assistant"

type ChatColumn = { key: string; label: string }

type ChatChartSpec = { type: string; xKey: string; yKeys: string[] }

type ChatRow = Record<string, string | number | null>

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  isError?: boolean
  presentation?: string
  columns?: ChatColumn[]
  chart?: ChatChartSpec
  rows?: ChatRow[]
  rowCount?: number
  truncated?: boolean
}

type AskChatbotResponse = {
  answer?: string
  reply?: string
  message?: string
  response?: string
  data?: string
  presentation?: string
  columns?: ChatColumn[]
  chart?: ChatChartSpec
  rows?: ChatRow[]
  rowCount?: number
  truncated?: boolean
}

type ChatHistoryItem = {
  id?: string | number
  user_id?: string | number
  question?: string
  prompt?: string
  query?: string
  created_at?: string | number
  createdAt?: string | number
  timestamp?: string | number
  // The history API nests the full askChatbot response (text + presentation +
  // chart/table data) under `answer` — not a flat string.
  answer?: AskChatbotResponse | string
}

const HISTORY_PAGE_SIZE = 10

const SUGGESTED_PROMPTS = [
  "Summarize total cash collected this month",
]

// Validated categorical palette — fixed hue order, CVD-safe (see dataviz skill).
// Slots 2/3/7 sit below 3:1 contrast by design; relief is the always-present table view.
const CHART_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
]
const MAX_CATEGORICAL_POINTS = 12
const MAX_LINE_POINTS = 60
const GRID_COLOR = "#e1e0d9"
const AXIS_TICK_COLOR = "#898781"

const pickFirstString = (...values: (string | undefined)[]): string | undefined =>
  values.find((v) => typeof v === "string" && v.trim().length > 0)

const extractReply = (data: AskChatbotResponse | string): string => {
  if (typeof data === "string") return data
  return (
    pickFirstString(data?.answer, data?.reply, data?.message, data?.response, data?.data) ??
    "I couldn't generate a response for that. Please try rephrasing your question."
  )
}

const extractHistoryList = (res: unknown): ChatHistoryItem[] => {
  if (Array.isArray(res)) return res as ChatHistoryItem[]
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>
    const candidate = obj.history ?? obj.data ?? obj.items ?? obj.results
    if (Array.isArray(candidate)) return candidate as ChatHistoryItem[]
  }
  return []
}

const historyQuestion = (item: ChatHistoryItem): string =>
  pickFirstString(item.question, item.prompt, item.query) ?? "Untitled question"

const historyAnswer = (item: ChatHistoryItem): string =>
  item.answer !== undefined ? extractReply(item.answer) : "No answer recorded."

const historyStructured = (item: ChatHistoryItem): AskChatbotResponse | undefined =>
  typeof item.answer === "object" && item.answer !== null ? item.answer : undefined

const historyTimestamp = (item: ChatHistoryItem): string | number | undefined =>
  item.created_at ?? item.createdAt ?? item.timestamp

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === "number") return value
  const n = parseFloat(String(value ?? ""))
  return Number.isFinite(n) ? n : 0
}

const columnLabel = (columns: ChatColumn[] | undefined, key: string): string =>
  columns?.find((c) => c.key === key)?.label ?? key

const formatCellValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "—"
  const str = String(value).trim()
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return toNumber(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return str
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const formatCompact = (value: number): string => {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const isNumericColumn = (rows: ChatRow[], key: string): boolean =>
  rows.some((row) => row[key] !== null && row[key] !== undefined && row[key] !== "") &&
  rows.every((row) => {
    const v = row[key]
    if (v === null || v === undefined || v === "") return true
    return /^-?\d+(\.\d+)?$/.test(String(v).trim())
  })

type TickPayload = { x?: number; y?: number; payload?: { value: string | number } }

function RotatedTick({ x, y, payload }: TickPayload) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={9}
        dx={-4}
        textAnchor="end"
        transform="rotate(-35)"
        fontSize={11}
        fill={AXIS_TICK_COLOR}
      >
        {String(payload?.value ?? "")}
      </text>
    </g>
  )
}

function HorizontalTick({ x, y, payload }: TickPayload) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={11} fill={AXIS_TICK_COLOR}>
        {String(payload?.value ?? "")}
      </text>
    </g>
  )
}

type TooltipEntry = { dataKey?: string | number; value?: number | string; color?: string }

function ChatChartTooltip({
  active,
  payload,
  label,
  columns,
  xLabel,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  columns?: ChatColumn[]
  xLabel: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-muted-foreground">
        {xLabel}: <span className="text-foreground">{label}</span>
      </p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={String(entry.dataKey ?? i)} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{columnLabel(columns, String(entry.dataKey ?? ""))}</span>
            <span className="ml-auto pl-3 font-semibold text-foreground [font-variant-numeric:tabular-nums]">
              {toNumber(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatChart({
  chart,
  rows,
  columns,
}: {
  chart: ChatChartSpec
  rows: ChatRow[]
  columns?: ChatColumn[]
}) {
  const type = chart.type === "line" ? "line" : chart.type === "pie" ? "pie" : "bar"
  const displayRows = rows.slice(0, type === "line" ? MAX_LINE_POINTS : MAX_CATEGORICAL_POINTS)
  const xLabel = columnLabel(columns, chart.xKey)
  const rotateTicks = displayRows.length > 6
  // Extra height reserves room for the diagonal label band so it never gets clipped.
  const height = rotateTicks ? 300 : 260
  const xAxisHeight = rotateTicks ? 58 : 28

  if (type === "pie") {
    const yKey = chart.yKeys[0]
    const pieData = displayRows.map((row) => ({
      name: String(row[chart.xKey] ?? ""),
      value: toNumber(row[yKey]),
    }))
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
            ))}
          </Pie>
          <RechartsTooltip
            content={<ChatChartTooltip columns={columns} xLabel={xLabel} />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: AXIS_TICK_COLOR }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={displayRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey={chart.xKey}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            height={xAxisHeight}
            interval={0}
            tick={rotateTicks ? <RotatedTick /> : <HorizontalTick />}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_TICK_COLOR }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={formatCompact}
          />
          <RechartsTooltip
            content={<ChatChartTooltip columns={columns} xLabel={xLabel} />}
            cursor={{ stroke: GRID_COLOR }}
          />
          {chart.yKeys.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 11, color: AXIS_TICK_COLOR }} iconType="line" />
          )}
          {chart.yKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={displayRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={chart.xKey}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
          height={xAxisHeight}
          interval={0}
          tick={rotateTicks ? <RotatedTick /> : <HorizontalTick />}
        />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS_TICK_COLOR }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={formatCompact}
        />
        <RechartsTooltip
          content={<ChatChartTooltip columns={columns} xLabel={xLabel} />}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        {chart.yKeys.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 11, color: AXIS_TICK_COLOR }} iconType="square" />
        )}
        {chart.yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

const THIN_SCROLLBAR =
  "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"

function ChatTable({
  columns,
  rows,
  barKey,
}: {
  columns: ChatColumn[]
  rows: ChatRow[]
  barKey?: string
}) {
  const numericKeys = new Set(columns.map((c) => c.key).filter((key) => isNumericColumn(rows, key)))
  const resolvedBarKey = barKey && numericKeys.has(barKey) ? barKey : undefined
  const maxBarValue = resolvedBarKey
    ? Math.max(1, ...rows.map((row) => toNumber(row[resolvedBarKey])))
    : 0

  // A single scroll container (both axes) is used instead of nesting the shared
  // <Table> component's own overflow-x wrapper inside this one — two nested
  // overflow containers break `sticky` header positioning.
  return (
    <div
      className={cn(
        "max-h-80 w-full overflow-auto rounded-lg border border-border",
        THIN_SCROLLBAR
      )}
    >
      <table className="w-full caption-bottom border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/95 shadow-[0_1px_0_0] shadow-border backdrop-blur-sm">
          <tr>
            <th className="h-10 w-10 whitespace-nowrap px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-10 whitespace-nowrap px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  numericKeys.has(col.key) && "text-right"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/60 last:border-0 even:bg-muted/20 hover:bg-primary/5 transition-colors"
            >
              <td className="whitespace-nowrap px-3 py-2 align-middle text-xs text-muted-foreground [font-variant-numeric:tabular-nums]">
                {i + 1}
              </td>
              {columns.map((col) => {
                const isNumeric = numericKeys.has(col.key)
                const showBar = col.key === resolvedBarKey
                const pct = showBar ? Math.max(2, (toNumber(row[col.key]) / maxBarValue) * 100) : 0
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "relative whitespace-nowrap px-3 py-2 align-middle",
                      isNumeric && "text-right font-medium [font-variant-numeric:tabular-nums]"
                    )}
                  >
                    {showBar && (
                      <span
                        aria-hidden
                        className="absolute inset-y-1 left-0 z-0 rounded-sm bg-primary/12"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative z-10">{formatCellValue(row[col.key])}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChatDataBlock({
  message,
  expanded,
  onToggleTable,
}: {
  message: ChatMessage
  expanded: boolean
  onToggleTable: () => void
}) {
  const rows = message.rows ?? []
  if (rows.length === 0) return null

  const columns = message.columns?.length
    ? message.columns
    : Object.keys(rows[0]).map((key) => ({ key, label: key }))

  const chart = message.presentation === "chart" && message.chart?.yKeys?.length ? message.chart : undefined
  const maxPoints = chart?.type === "line" ? MAX_LINE_POINTS : MAX_CATEGORICAL_POINTS
  const isTruncatedForChart = Boolean(chart) && rows.length > maxPoints
  const totalRows = message.rowCount ?? rows.length

  return (
    <div className="w-full max-w-full rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md",
              chart ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {chart ? <IconChartBar className="size-3" /> : <IconTable className="size-3" />}
          </span>
          <span>
            {totalRows.toLocaleString()} row{totalRows === 1 ? "" : "s"}
            {isTruncatedForChart ? ` · top ${maxPoints} shown in chart` : ""}
            {message.truncated ? " · truncated" : ""}
          </span>
        </div>
        {chart && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTable}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Hide table" : "View table"}
          </Button>
        )}
      </div>

      {chart && <ChatChart chart={chart} rows={rows} columns={message.columns} />}

      {(!chart || expanded) && (
        <div className={chart ? "mt-3" : ""}>
          <ChatTable columns={columns} rows={rows} barKey={chart?.yKeys?.[0]} />
        </div>
      )}
    </div>
  )
}

const AskChatbot = () => {
  const { state } = useAuth()
  const firstName = state.user?.first_name || "there"

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedTableIds, setExpandedTableIds] = useState<Set<string>>(new Set())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([])
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE)
  const [historyLoading, setHistoryLoading] = useState(false)

  const toggleTable = (id: string) => {
    setExpandedTableIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    textareaRef.current?.focus()

    try {
      const res = await postRequest<AskChatbotResponse | string>("/superadmin/askChatbot", {
        question: trimmed,
      })
      const structured = typeof res === "object" ? res : undefined

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: extractReply(res),
        createdAt: Date.now(),
        presentation: structured?.presentation,
        columns: structured?.columns,
        chart: structured?.chart,
        rows: structured?.rows,
        rowCount: structured?.rowCount,
        truncated: structured?.truncated,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "Something went wrong while reaching the assistant. Please try again.",
        createdAt: Date.now(),
        isError: true,
      }
      setMessages((prev) => [...prev, assistantMessage])
      toast.error("Failed to get a response from the chatbot")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCopy = async (message: ChatMessage) => {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId((id) => (id === message.id ? null : id)), 1500)
  }

  const clearChat = () => {
    setMessages([])
    setInput("")
    textareaRef.current?.focus()
  }

  const fetchHistory = async (limit: number) => {
    if (!state.user?.id) return
    setHistoryLoading(true)
    try {
      const res = await getRequest<unknown>(`/superadmin/chatbotHistory/${state.user.id}?limit=${limit}`)
      setHistoryItems(extractHistoryList(res))
    } catch {
      toast.error("Failed to load chat history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const openHistory = () => {
    setHistoryOpen(true)
    setHistoryLimit(HISTORY_PAGE_SIZE)
    fetchHistory(HISTORY_PAGE_SIZE)
  }

  const loadMoreHistory = () => {
    const next = historyLimit + HISTORY_PAGE_SIZE
    setHistoryLimit(next)
    fetchHistory(next)
  }

  const restoreHistoryItem = (item: ChatHistoryItem) => {
    const structured = historyStructured(item)
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: historyQuestion(item),
      createdAt: Date.now(),
    }
    const assistantMsg: ChatMessage = {
      id: makeId(),
      role: "assistant",
      content: historyAnswer(item),
      createdAt: Date.now(),
      presentation: structured?.presentation,
      columns: structured?.columns,
      chart: structured?.chart,
      rows: structured?.rows,
      rowCount: structured?.rowCount,
      truncated: structured?.truncated,
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setHistoryOpen(false)
  }

  return (
    <>
      <SiteHeader title="Ask Chatbot" />
      <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex flex-1 flex-col mx-auto w-full max-w-4xl overflow-hidden px-3 sm:px-4 lg:px-6 py-4 md:py-6">
          {/* Card container */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                  <IconRobot className="size-5" />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
                      loading ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Davaam Assistant</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    {loading && <IconLoader2 className="size-3 animate-spin" />}
                    {loading ? "Thinking…" : "Online · ready to help"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openHistory}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconHistory className="size-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  disabled={messages.length === 0 && !input}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconTrash className="size-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className={cn("flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4", THIN_SCROLLBAR)}
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                    <IconSparkles className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Hi {firstName}, how can I help?</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Ask about machines, locations, cash collections, or anything else on your dashboard.
                    </p>
                  </div>
                  <div className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="group flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left text-xs text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                      >
                        <IconSparkles className="size-3.5 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-2">
                    <div
                      className={cn(
                        "flex items-end gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <Avatar className="size-7 mb-1 shrink-0 ring-2 ring-background">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                            <IconRobot className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "group relative max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm",
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                            : msg.isError
                              ? "bg-destructive/10 text-destructive rounded-bl-sm ring-1 ring-destructive/20"
                              : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {msg.content}

                        {msg.role === "assistant" && !msg.isError && (
                          <button
                            onClick={() => handleCopy(msg)}
                            className="absolute -bottom-5 left-0 flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <IconCheck className="size-3" /> Copied
                              </>
                            ) : (
                              <>
                                <IconCopy className="size-3" /> Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <Avatar className="size-7 mb-1 shrink-0 ring-2 ring-background">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-[11px] font-medium">
                            {firstName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    {msg.role === "assistant" && !msg.isError && (msg.rows?.length ?? 0) > 0 && (
                      <div className="ml-9">
                        <ChatDataBlock
                          message={msg}
                          expanded={expandedTableIds.has(msg.id)}
                          onToggleTable={() => toggleTable(msg.id)}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <Avatar className="size-7 mb-1 shrink-0 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      <IconRobot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 shadow-sm">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-muted/10 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15"
              >
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the assistant anything…"
                  disabled={loading}
                  rows={1}
                  className="min-h-9 max-h-32 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/85 shadow-sm transition-transform enabled:hover:scale-105"
                >
                  {loading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSend2 className="size-4" />
                  )}
                </Button>
              </form>
              <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
                Press Enter to send · Shift + Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Chat history</SheetTitle>
            <SheetDescription>
              Your recent questions to the assistant. Tap one to bring it back into the conversation.
            </SheetDescription>
          </SheetHeader>

          <div className={cn("flex-1 overflow-y-auto px-4 pb-4", THIN_SCROLLBAR)}>
            {historyLoading && historyItems.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                Loading history…
              </div>
            ) : historyItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <IconHistory className="size-8 opacity-40" />
                <p>No previous questions yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {historyItems.map((item, i) => (
                  <button
                    key={item.id ?? i}
                    onClick={() => restoreHistoryItem(item)}
                    className="rounded-lg border border-border bg-muted/30 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(historyTimestamp(item))}
                      </span>
                      {historyStructured(item)?.presentation === "chart" ? (
                        <IconChartBar className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : historyStructured(item)?.presentation === "table" ? (
                        <IconTable className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {historyQuestion(item)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {historyAnswer(item)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {historyItems.length > 0 && historyItems.length >= historyLimit && (
            <SheetFooter>
              <Button variant="outline" size="sm" onClick={loadMoreHistory} disabled={historyLoading}>
                {historyLoading ? <IconLoader2 className="size-4 animate-spin" /> : "Load more"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

export default AskChatbot
