import { useState, useRef, useEffect, useCallback } from "react"
import { SiteHeader } from "@/components/admin/site-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
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

const SUGGESTED_PROMPTS = [
  "How many machines are currently offline?",
  "Summarize today's cash collections",
  "Which locations need a refill soon?",
  "Show me pending topup requests",
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

const extractReply = (data: AskChatbotResponse | string): string => {
  if (typeof data === "string") return data
  return (
    data?.answer ??
    data?.reply ??
    data?.message ??
    data?.response ??
    data?.data ??
    "I couldn't generate a response for that. Please try rephrasing your question."
  )
}

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

// Custom tick: translate to the tick's own anchor first, then rotate the text
// around that point — the reliable way to keep rotated axis labels aligned
// under their bars (Recharts' declarative `angle` prop on <XAxis> alone tends
// to mis-anchor the text, which is what caused the crooked/overlapping labels).
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

  return (
    <div className="max-h-72 overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-[11px] font-semibold tracking-wide text-muted-foreground",
                  numericKeys.has(col.key) && "text-right"
                )}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="even:bg-muted/20">
              {columns.map((col) => {
                const isNumeric = numericKeys.has(col.key)
                const showBar = col.key === resolvedBarKey
                const pct = showBar ? Math.max(2, (toNumber(row[col.key]) / maxBarValue) * 100) : 0
                return (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "relative",
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
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    <div className="w-full max-w-full rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {chart ? <IconChartBar className="size-3.5" /> : <IconTable className="size-3.5" />}
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
            className="h-7 text-xs text-muted-foreground"
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
      const res = await postRequest<AskChatbotResponse | string>("/admin/askChatbot", {
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

  return (
    <>
      <SiteHeader title="Ask Chatbot" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col mx-auto w-full max-w-4xl overflow-hidden px-3 sm:px-4 lg:px-6 py-4 md:py-6">
          {/* Card container */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconRobot className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Davaam Assistant</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {loading ? "Thinking…" : "Online · ready to help"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0 && !input}
                className="text-muted-foreground"
              >
                <IconTrash className="size-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
                        className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        {prompt}
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
                        <Avatar className="size-7 mb-1 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <IconRobot className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "group relative max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : msg.isError
                              ? "bg-destructive/10 text-destructive rounded-bl-sm"
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
                        <Avatar className="size-7 mb-1 shrink-0">
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
                  <Avatar className="size-7 mb-1 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <IconRobot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 p-2 focus-within:ring-1 focus-within:ring-ring"
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
                  className="shrink-0"
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
    </>
  )
}

export default AskChatbot
