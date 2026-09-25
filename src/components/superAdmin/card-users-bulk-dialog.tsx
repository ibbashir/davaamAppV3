import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { IconLoader2, IconDownload, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "sonner"
import { getRequest, postRequest } from "@/Apis/Api"
import { BASE_URL } from "@/constants/Constant"
import { cn } from "@/lib/utils"

const API = `${BASE_URL}/superadmin/cardUsers`

/** Server limit per request (BULK_MAX in the cardUsers controller). */
const CHUNK = 500
/** Rows drawn in the preview; a paste can run to thousands. */
const PREVIEW_LIMIT = 300

/*
 * Row rules — keep in step with bulkRowProblem() in
 * backend/src/controllers/DavaamDashboard/CardUsers/cardUsers.js.
 * mobile_number also carries 4–6 digit ID codes, so it is "digits only",
 * not a phone format.
 */
const PIN_RE = /^\d{4}$/
const CARD_RE = /^[A-Za-z0-9._-]{1,64}$/
const MOBILE_RE = /^\+?\d{2,20}$/
const MACHINE_RE = /^[A-Za-z0-9._-]{1,32}$/
const SCIENTIFIC_RE = /^\d+(\.\d+)?e[+-]?\d+$/i
const NAME_MAX = 255

type PinMode = "auto" | "paste" | "none"
type Column = "name" | "card_number" | "mobile_number" | "pin" | "machine_code"

const COLUMN_LABEL: Record<Column, string> = {
  name: "Name",
  card_number: "Card number",
  mobile_number: "Mobile number",
  pin: "PIN",
  machine_code: "Machine code",
}

interface Settings {
  hasName: boolean
  hasCard: boolean
  hasMobile: boolean
  hasMachine: boolean
  pinMode: PinMode
  defaultName: string
  defaultMachine: string
  /** Opening wallet value for every card, as typed. */
  balance: string
  fixMobileZero: boolean
}

interface Draft {
  /** 1-based line in the pasted text, so problems can be found in Excel. */
  line: number
  name: string
  card_number: string
  mobile_number: string
  /** Pasted PIN; auto-generated ones are held separately until import. */
  pin: string
  machine_code: string
  /** Automatic fixes the admin should see before importing. */
  notes: string[]
  error: string | null
}

interface RowResult {
  index: number
  status: "ok" | "error" | "created"
  reason: string | null
  id: number | null
}

interface BulkResponse {
  message: string
  data: { dry_run: boolean; created: number; skipped: number; results: RowResult[] }
}

interface CreatedCard {
  id: number | null
  name: string
  card_number: string
  mobile_number: string
  pin: string
  machine_code: string
  balance: number
}

const money = (v: number) => v.toLocaleString("en-PK")

const errText = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

/** Paste columns, left to right, for the current settings. Name leads, as it does in most sheets. */
const columnsOf = (s: Settings): Column[] => [
  ...(s.hasName ? (["name"] as const) : []),
  ...(s.hasCard ? (["card_number"] as const) : []),
  ...(s.hasMobile ? (["mobile_number"] as const) : []),
  ...(s.pinMode === "paste" ? (["pin"] as const) : []),
  ...(s.hasMachine ? (["machine_code"] as const) : []),
]

/**
 * Excel copies as tab-separated; fall back to commas, then spaces. With spaces
 * a name ("Ali Khan") would split in two, so when the name column is first
 * the trailing tokens fill the other columns and everything before them is
 * the name.
 */
const splitLine = (line: string, cols: Column[]) => {
  let cells: string[]
  if (line.includes("\t")) cells = line.split("\t")
  else if (line.includes(",")) cells = line.split(",")
  else {
    const tokens = line.trim().split(/\s+/)
    const rest = cols.length - 1
    cells = cols[0] === "name" && tokens.length > cols.length
      ? [tokens.slice(0, tokens.length - rest).join(" "), ...tokens.slice(tokens.length - rest)]
      : tokens
  }
  return cells.map((c) => c.trim().replace(/^"(.*)"$/, "$1").trim())
}

function problemOf(d: Omit<Draft, "error" | "notes" | "line">, pinMode: PinMode): string | null {
  if (!d.card_number && !d.mobile_number) return "Needs a card number or a mobile number."
  if (d.name.length > NAME_MAX) return `Name is too long (${NAME_MAX} characters max).`
  if ([d.card_number, d.mobile_number].some((v) => v && SCIENTIFIC_RE.test(v))) {
    return "Excel turned this into scientific notation — format the column as Text and copy again."
  }
  if (d.card_number && !CARD_RE.test(d.card_number)) {
    return "Card number may only contain letters, digits, '.', '_' or '-'."
  }
  if (d.mobile_number && !MOBILE_RE.test(d.mobile_number)) return "Mobile number must be digits only."
  if (pinMode === "paste" && !d.pin) return "PIN is empty — fill it in or switch PIN to auto-generate."
  if (d.pin && !PIN_RE.test(d.pin)) return "PIN must be exactly 4 digits."
  if (d.machine_code && !MACHINE_RE.test(d.machine_code)) return "Machine code looks wrong."
  return null
}

function parsePaste(text: string, s: Settings): { drafts: Draft[]; headerSkipped: boolean } {
  const cols = columnsOf(s)
  const lines = text.split(/\r?\n/).map((raw, i) => ({ raw, line: i + 1 })).filter((l) => l.raw.trim())

  // A first line with no digit anywhere is a header row copied along with the data.
  const headerSkipped = lines.length > 0 && !/\d/.test(lines[0].raw)
  const body = headerSkipped ? lines.slice(1) : lines

  const drafts = body.map(({ raw, line }): Draft => {
    const cells = splitLine(raw, cols)
    // Excel pads rows with trailing tabs; only real extra values are a problem.
    while (cells.length > cols.length && !cells[cells.length - 1]) cells.pop()

    const value = (c: Column) => {
      const at = cols.indexOf(c)
      return at === -1 ? "" : cells[at] ?? ""
    }
    const notes: string[] = []

    let mobile = value("mobile_number")
    if (s.fixMobileZero && /^3\d{9}$/.test(mobile)) {
      mobile = `0${mobile}`
      notes.push("Leading 0 restored on the mobile number")
    }

    let pin = value("pin")
    if (/^\d{1,3}$/.test(pin)) {
      pin = pin.padStart(4, "0")
      notes.push("PIN padded to 4 digits")
    }

    const draft = {
      // Collapse the double spaces pasted names often carry.
      name: (value("name") || s.defaultName).trim().replace(/\s+/g, " "),
      card_number: value("card_number"),
      mobile_number: mobile,
      pin,
      machine_code: value("machine_code") || s.defaultMachine.trim(),
    }

    const error = cells.length > cols.length
      ? `${cells.length} values on this line but ${cols.length} column(s) selected.`
      : problemOf(draft, s.pinMode)

    return { line, ...draft, notes, error }
  })

  // Duplicates within the paste, on either column (the machines treat them as one namespace).
  const firstLine = new Map<string, number>()
  drafts.forEach((d) => {
    if (d.error) return
    const keys = [...new Set([d.card_number, d.mobile_number].filter(Boolean).map((v) => v.toLowerCase()))]
    const repeat = keys.find((k) => firstLine.has(k))
    if (repeat) {
      d.error = `"${repeat}" is already on line ${firstLine.get(repeat)}.`
      return
    }
    keys.forEach((k) => firstLine.set(k, d.line))
  })

  return { drafts, headerSkipped }
}

/** Random 4-digit PIN, skipping ones anyone would guess (0000, 1234, 9876…). */
function randomPin(): string {
  for (;;) {
    const pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0")
    const d = pin.split("").map(Number)
    const repeated = d.every((n) => n === d[0])
    const run = d.every((n, i) => i === 0 || n - d[i - 1] === 1) || d.every((n, i) => i === 0 || d[i - 1] - n === 1)
    if (!repeated && !run) return pin
  }
}

const chunks = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

/**
 * Identifiers and PINs are written as ="…" so Excel keeps their leading zeros
 * when the file is opened, instead of turning 0300… back into 300….
 */
function downloadCsv(cards: CreatedCard[]) {
  const text = (v: string) => (v ? `="${v.replace(/"/g, '""')}"` : "")
  // Names are free text: quote commas/quotes, and defuse a leading = + - @
  // so Excel does not run the cell as a formula.
  const plain = (v: string) => {
    const safe = /^[=+\-@]/.test(v) ? `'${v}` : v
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [
    "id,name,card_number,mobile_number,pin,machine_code,balance",
    ...cards.map((c) =>
      [
        c.id ?? "", plain(c.name), text(c.card_number), text(c.mobile_number), text(c.pin),
        c.machine_code, c.balance,
      ].join(","),
    ),
  ]
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `card-users-import-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const initialSettings: Settings = {
  hasName: false,
  hasCard: true,
  hasMobile: true,
  hasMachine: false,
  pinMode: "auto",
  defaultName: "",
  defaultMachine: "",
  balance: "0",
  fixMobileZero: true,
}

export function CardUsersBulkDialog({ open, onOpenChange, onImported }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: () => void
}) {
  const [text, setText] = React.useState("")
  const [settings, setSettings] = React.useState<Settings>(initialSettings)
  const [machineCodes, setMachineCodes] = React.useState<{ machine_code: string; cards: number }[]>([])
  // Filled by "Check": generated PINs and the server's verdict, both aligned to drafts.
  const [pins, setPins] = React.useState<string[] | null>(null)
  const [server, setServer] = React.useState<(RowResult | null)[] | null>(null)
  const [busy, setBusy] = React.useState<"check" | "import" | null>(null)
  const [done, setDone] = React.useState<{ created: CreatedCard[]; skipped: number; stoppedAt?: string } | null>(null)
  const [problemsOnly, setProblemsOnly] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setText("")
    setSettings(initialSettings)
    setPins(null)
    setServer(null)
    setDone(null)
    setProblemsOnly(false)
    getRequest<{ data: { machine_code: string; cards: number }[] }>(`${API}/machineCodes`)
      .then((res) => setMachineCodes(res.data ?? []))
      .catch(() => { /* suggestions only — the field still takes any code */ })
  }, [open])

  const { drafts, headerSkipped } = React.useMemo(() => parsePaste(text, settings), [text, settings])
  const columns = columnsOf(settings)

  // Whole numbers only (BIGINT column); the server applies the same rule.
  const balanceText = settings.balance.trim()
  const balanceValid = /^\d+$/.test(balanceText || "0") && Number.isSafeInteger(Number(balanceText || 0))
  const balance = balanceValid ? Number(balanceText || 0) : 0

  // Any edit invalidates a previous check: the rows it judged no longer exist.
  const edit = (fn: () => void) => { fn(); setPins(null); setServer(null) }
  const setOption = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    edit(() => setSettings((s) => ({ ...s, [k]: v })))

  const finalPin = (d: Draft, i: number) =>
    settings.pinMode === "auto" ? pins?.[i] ?? "" : settings.pinMode === "paste" ? d.pin : ""

  const statusOf = (d: Draft, i: number): { kind: "error" | "ready" | "pending"; reason?: string } => {
    if (d.error) return { kind: "error", reason: d.error }
    const r = server?.[i]
    if (r?.status === "error") return { kind: "error", reason: r.reason ?? "Rejected" }
    if (r?.status === "ok") return { kind: "ready" }
    return { kind: "pending" }
  }

  const statuses = drafts.map(statusOf)
  const problemCount = statuses.filter((s) => s.kind === "error").length
  const readyCount = statuses.filter((s) => s.kind === "ready").length
  const checkable = drafts.filter((d) => !d.error).length
  const checked = server !== null

  const send = (items: { d: Draft; i: number }[], dryRun: boolean, pinList: string[] | null) =>
    postRequest<BulkResponse>(`${API}/bulk`, {
      dry_run: dryRun,
      rows: items.map(({ d, i }) => ({
        name: d.name,
        card_number: d.card_number,
        mobile_number: d.mobile_number,
        pin: settings.pinMode === "auto" ? pinList?.[i] ?? "" : settings.pinMode === "paste" ? d.pin : "",
        machine_code: d.machine_code,
        balance,
      })),
    })

  const check = async () => {
    if (!checkable || !balanceValid) return
    const pinList = settings.pinMode === "auto" ? drafts.map(() => randomPin()) : null
    const items = drafts.map((d, i) => ({ d, i })).filter(({ d }) => !d.error)
    const verdict: (RowResult | null)[] = drafts.map(() => null)
    setBusy("check")
    try {
      for (const batch of chunks(items, CHUNK)) {
        const res = await send(batch, true, pinList)
        res.data.results.forEach((r) => { verdict[batch[r.index].i] = r })
      }
      setPins(pinList)
      setServer(verdict)
      const bad = verdict.filter((r) => r?.status === "error").length
      if (bad) setProblemsOnly(true)
    } catch (err) {
      toast.error(errText(err, "Could not check the list"))
    } finally {
      setBusy(null)
    }
  }

  const runImport = async () => {
    const items = drafts.map((d, i) => ({ d, i })).filter(({ i }) => server?.[i]?.status === "ok")
    if (!items.length) return
    const created: CreatedCard[] = []
    let skipped = 0
    let stoppedAt: string | undefined
    setBusy("import")
    try {
      for (const batch of chunks(items, CHUNK)) {
        const res = await send(batch, false, pins)
        res.data.results.forEach((r) => {
          const { d, i } = batch[r.index]
          if (r.status === "created") {
            created.push({
              id: r.id, name: d.name, card_number: d.card_number, mobile_number: d.mobile_number,
              pin: finalPin(d, i), machine_code: d.machine_code, balance,
            })
          } else skipped += 1
        })
      }
    } catch (err) {
      // Earlier batches are already saved; say so rather than pretend nothing happened.
      stoppedAt = errText(err, "The import stopped part-way")
    } finally {
      setBusy(null)
    }
    skipped += drafts.length - items.length
    setDone({ created, skipped, stoppedAt })
    if (created.length) {
      toast.success(`${created.length} card user(s) created`)
      onImported()
    }
    if (stoppedAt) toast.error(stoppedAt)
  }

  const visible = drafts
    .map((d, i) => ({ d, i, s: statuses[i] }))
    .filter(({ s }) => !problemsOnly || s.kind === "error")

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Bulk add card users</DialogTitle>
          <DialogDescription>
            Copy the rows from Excel and paste them below. Nothing is saved until you press Import.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <div className={cn(
              "flex items-start gap-3 rounded-lg border p-4",
              done.stoppedAt ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50",
            )}>
              {done.stoppedAt
                ? <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                : <IconCircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
              <div className="text-sm">
                <p className="font-medium">
                  {done.created.length} card user(s) created
                  {done.skipped > 0 && `, ${done.skipped} skipped`}.
                </p>
                {done.created.length > 0 && done.created[0].balance > 0 && (
                  <p className="mt-1 text-muted-foreground">
                    Opening balance {money(done.created[0].balance)} each —{" "}
                    {money(done.created.reduce((sum, c) => sum + c.balance, 0))} in total.
                  </p>
                )}
                {done.stoppedAt && (
                  <p className="mt-1 text-muted-foreground">
                    The import stopped part-way ({done.stoppedAt}). The cards listed below were saved; check
                    the rest again to import them.
                  </p>
                )}
                {settings.pinMode === "auto" && done.created.length > 0 && (
                  <p className="mt-1 text-muted-foreground">
                    PINs were generated — download the list now to hand them out. It contains PINs, so keep it private.
                  </p>
                )}
              </div>
            </div>

            {done.created.length > 0 && (
              <div className="max-h-80 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Card No.</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>PIN</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {done.created.slice(0, PREVIEW_LIMIT).map((c, k) => (
                      <TableRow key={c.id ?? `n${k}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{c.id ?? "—"}</TableCell>
                        <TableCell className="text-xs">{c.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.card_number || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.mobile_number || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.pin || "—"}</TableCell>
                        <TableCell>{c.machine_code || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(c.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              {done.created.length > 0 && (
                <Button variant="outline" onClick={() => downloadCsv(done.created)}>
                  <IconDownload className="mr-1.5 h-4 w-4" /> Download list (CSV)
                </Button>
              )}
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Columns in your paste</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {([
                    ["hasName", "Name"],
                    ["hasCard", "Card number"],
                    ["hasMobile", "Mobile number"],
                    ["hasMachine", "Machine code"],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={settings[k]} onCheckedChange={(v) => setOption(k, Boolean(v))} />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Left to right:{" "}
                  {columns.length
                    ? columns.map((c, i) => (
                      <span key={c} className="font-medium text-foreground">
                        {i > 0 && " → "}{COLUMN_LABEL[c]}
                      </span>
                    ))
                    : <span className="text-red-600">pick at least one column</span>}
                </p>
              </div>

              <div className="space-y-2">
                <Label>PIN (4 digits)</Label>
                <Select value={settings.pinMode} onValueChange={(v) => setOption("pinMode", v as PinMode)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Generate automatically</SelectItem>
                    <SelectItem value="paste">Take from the paste (PIN column)</SelectItem>
                    <SelectItem value="none">No PIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-name">Name for every row</Label>
                <Input
                  id="bulk-name"
                  value={settings.defaultName}
                  onChange={(e) => setOption("defaultName", e.target.value)}
                  placeholder="Optional, e.g. company or site name"
                  maxLength={NAME_MAX}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.hasName
                    ? "A name in the paste wins over this one; rows with a blank name get this."
                    : "Different names per card? Tick Name above and paste them as the first column."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-machine">Machine code for every row</Label>
                <Input
                  id="bulk-machine"
                  list="bulk-machine-codes"
                  value={settings.defaultMachine}
                  onChange={(e) => setOption("defaultMachine", e.target.value)}
                  placeholder="Optional, e.g. 3110"
                />
                <datalist id="bulk-machine-codes">
                  {machineCodes.map((m) => (
                    <option key={m.machine_code} value={m.machine_code}>{m.cards} cards</option>
                  ))}
                </datalist>
                {settings.hasMachine && (
                  <p className="text-xs text-muted-foreground">
                    A machine code in the paste wins over this one.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-balance">Balance for every card</Label>
                <Input
                  id="bulk-balance"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={settings.balance}
                  onChange={(e) => setOption("balance", e.target.value)}
                  placeholder="0"
                  aria-invalid={!balanceValid}
                />
                {!balanceValid ? (
                  <p className="text-xs font-medium text-red-600">Enter a whole number of 0 or more.</p>
                ) : balance > 0 ? (
                  <p className="text-xs font-medium text-amber-600">
                    Real wallet value: {money(balance)} on each card
                    {checkable > 0 && ` — ${money(balance * checkable)} across ${checkable} card(s)`}.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Cards start empty. Top up here to preload them.</p>
                )}
              </div>

              <label className="flex items-start gap-2 self-end text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={settings.fixMobileZero}
                  onCheckedChange={(v) => setOption("fixMobileZero", Boolean(v))}
                />
                <span>
                  Restore the leading 0 Excel drops from mobile numbers
                  <span className="block text-xs text-muted-foreground">3001234567 → 03001234567</span>
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-paste">Paste from Excel</Label>
              <Textarea
                id="bulk-paste"
                value={text}
                onChange={(e) => edit(() => setText(e.target.value))}
                placeholder={columns.length
                  ? `One card per line, columns in this order:\n${columns.map((c) => COLUMN_LABEL[c]).join("\t")}`
                  : "Pick the columns first"}
                className="max-h-56 min-h-32 font-mono text-xs"
                spellCheck={false}
              />
              {headerSkipped && (
                <p className="text-xs text-muted-foreground">The first line looks like a header — it is skipped.</p>
              )}
            </div>

            {drafts.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{drafts.length} row(s)</span>
                  {balanceValid && balance > 0 && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Balance {money(balance)} each · {money(balance * (checked ? readyCount : checkable))} total
                    </Badge>
                  )}
                  {checked && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{readyCount} ready</Badge>}
                  {problemCount > 0 && (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{problemCount} with problems</Badge>
                  )}
                  {!checked && checkable > 0 && (
                    <span className="text-muted-foreground">— press Check to compare with existing cards</span>
                  )}
                  {problemCount > 0 && (
                    <label className="ml-auto flex items-center gap-2">
                      <Checkbox checked={problemsOnly} onCheckedChange={(v) => setProblemsOnly(Boolean(v))} />
                      Problems only
                    </label>
                  )}
                </div>

                <div className="max-h-80 overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Line</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Card No.</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Machine</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="min-w-56">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.slice(0, PREVIEW_LIMIT).map(({ d, i, s }) => (
                        <TableRow key={d.line} className={cn(s.kind === "error" && "bg-red-50/60")}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{d.line}</TableCell>
                          <TableCell className="max-w-48 truncate text-xs" title={d.name}>{d.name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{d.card_number || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{d.mobile_number || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {settings.pinMode === "auto"
                              ? pins?.[i] ?? <span className="text-muted-foreground">auto</span>
                              : settings.pinMode === "paste" ? d.pin || "—" : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{d.machine_code || "—"}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {balanceValid ? money(balance) : <span className="text-red-600">invalid</span>}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.kind === "error" && <span className="text-red-700">{s.reason}</span>}
                            {s.kind === "ready" && <span className="font-medium text-emerald-700">Ready</span>}
                            {s.kind === "pending" && <span className="text-muted-foreground">Not checked yet</span>}
                            {d.notes.length > 0 && (
                              <span className="block text-amber-700">{d.notes.join(" · ")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {visible.length > PREVIEW_LIMIT && (
                    <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                      …and {visible.length - PREVIEW_LIMIT} more row(s) not shown.
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={Boolean(busy)}>
                Cancel
              </Button>
              {checked && (
                <Button variant="outline" onClick={check} disabled={Boolean(busy) || !checkable}>
                  {busy === "check" && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Check again
                </Button>
              )}
              {checked ? (
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={runImport}
                  disabled={Boolean(busy) || readyCount === 0}
                >
                  {busy === "import" && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Import {readyCount} card user(s)
                  {balance > 0 && ` · ${money(balance * readyCount)} balance`}
                  {problemCount > 0 && ` · skip ${problemCount}`}
                </Button>
              ) : (
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={check}
                  disabled={Boolean(busy) || !checkable || !columns.length || !balanceValid}
                >
                  {busy === "check" && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Check {checkable} row(s)
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
