import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { IconExternalLink, IconLoader2, IconMailForward, IconSearch, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { cn } from "@/lib/utils"
import {
  fetchLeads, updateLead, resendLeads, CATEGORY_STYLE, STATUS_OPTIONS, EMAIL_STYLE, fmtTime,
  type Lead, type LeadStatus,
} from "./api"

const ALL = "all"
const PAGE_SIZE = 25

export function Pill({ className, children, title }: { className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  )
}

/** Add / remove free-form tags. Enter or comma adds; lower-cased like the API stores them. */
function TagEditor({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = React.useState("")
  const add = (t: string) => {
    const tag = t.trim().toLowerCase().slice(0, 30)
    if (tag && !value.includes(tag) && value.length < 12) onChange([...value, tag])
    setDraft("")
  }
  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 8)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
              <IconX className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        placeholder="Add a tag and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft) }
        }}
      />
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LeadSheet({ lead, onOpenChange, allTags, onSaved }: {
  lead: Lead | null
  onOpenChange: (v: boolean) => void
  allTags: string[]
  onSaved: (l: Lead) => void
}) {
  const [status, setStatus] = React.useState<LeadStatus>("new")
  const [tags, setTags] = React.useState<string[]>([])
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [sending, setSending] = React.useState(false)

  React.useEffect(() => {
    if (!lead) return
    setStatus(lead.status)
    setTags(lead.tags ?? [])
    setNotes(lead.notes ?? "")
  }, [lead])

  if (!lead) return null
  const cat = lead.category ? CATEGORY_STYLE[lead.category] : null
  const email = EMAIL_STYLE[lead.email_status]

  const save = async () => {
    setSaving(true)
    try {
      const r = await updateLead(lead.id, { status, tags, notes })
      toast.success("Lead updated")
      onSaved(r.data)
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the lead"))
    } finally {
      setSaving(false)
    }
  }

  const resend = async () => {
    setSending(true)
    try {
      const r = await resendLeads([lead.id])
      toast.success(r.message || "Emailed")
      onSaved({ ...lead, email_status: "sent", email_error: null, emailed_at: Math.floor(Date.now() / 1000) })
    } catch (err) {
      toast.error(errorMessage(err, "Could not email this lead"))
    } finally {
      setSending(false)
    }
  }

  const facts: Array<[string, React.ReactNode]> = [
    ["Source", lead.source ?? "—"],
    ["Country", lead.country ?? "—"],
    ["Fit score", lead.relevance ? `${lead.relevance}/10` : "—"],
    ["Budget", lead.budget ?? "—"],
    ["Deadline", lead.deadline ?? "—"],
    ["Posted", lead.posted ?? "—"],
    ["Found", fmtTime(lead.created_at)],
    ["Emailed", lead.emailed_at ? fmtTime(lead.emailed_at) : "—"],
  ]

  return (
    <Sheet open={Boolean(lead)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            {cat && <Pill className={cat.className}>{cat.label}</Pill>}
            {email && <Pill className={email.className}>{email.label}</Pill>}
          </div>
          <SheetTitle className="text-left leading-snug">{lead.title}</SheetTitle>
          <SheetDescription className="text-left">
            <a href={lead.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline">
              Open the original post <IconExternalLink className="h-3.5 w-3.5" />
            </a>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          {lead.summary && <p className="text-sm leading-relaxed">{lead.summary}</p>}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-3 text-sm">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
                <dd className="truncate">{v}</dd>
              </div>
            ))}
          </dl>

          {lead.email_error && (
            <p className={cn("rounded-md px-3 py-2 text-xs", lead.email_status === "failed" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600")}>
              {lead.email_status === "failed" ? "Email error: " : "Not emailed: "}{lead.email_error}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Tags</Label>
            <TagEditor value={tags} onChange={setTags} suggestions={allTags} />
          </div>

          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Who is following up, what was sent…" />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" onClick={resend} disabled={sending} className="flex-1">
            {sending ? <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <IconMailForward className="mr-1.5 h-4 w-4" />}
            {lead.email_status === "sent" ? "Email again" : "Email now"}
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700">
            {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function LeadsTab({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [rows, setRows] = React.useState<Lead[]>([])
  const [total, setTotal] = React.useState(0)
  const [allTags, setAllTags] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState(ALL)
  const [status, setStatus] = React.useState(ALL)
  const [email, setEmail] = React.useState(ALL)
  const [tag, setTag] = React.useState(ALL)
  const [open, setOpen] = React.useState<Lead | null>(null)
  const [resending, setResending] = React.useState(false)

  // Search waits for a pause in typing so every keystroke is not a request
  React.useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = React.useCallback(() => {
    setLoading(true)
    const pick = (v: string) => (v === ALL ? undefined : v)
    fetchLeads({
      page, limit: PAGE_SIZE, search: query || undefined,
      category: pick(category), status: pick(status), email_status: pick(email), tag: pick(tag),
    })
      .then((r) => { setRows(r.data.rows); setTotal(r.data.total); setAllTags(r.data.tags) })
      .catch((err) => toast.error(errorMessage(err, "Could not load leads")))
      .finally(() => setLoading(false))
  }, [page, query, category, status, email, tag])

  React.useEffect(() => { load() }, [load, refreshKey])

  const setFilter = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1) }

  const changeStatus = async (lead: Lead, value: LeadStatus) => {
    setRows((cur) => cur.map((r) => (r.id === lead.id ? { ...r, status: value } : r)))
    try {
      await updateLead(lead.id, { status: value })
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Could not change the status"))
      load()
    }
  }

  const resendFailed = async () => {
    setResending(true)
    try {
      const r = await resendLeads()
      toast.success(r.message || "Emailed")
      load(); onChanged()
    } catch (err) {
      toast.error(errorMessage(err, "Nothing was emailed"))
    } finally {
      setResending(false)
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <IconSearch className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search title, country, source" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setFilter(setCategory)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.entries(CATEGORY_STYLE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setFilter(setStatus)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={email} onValueChange={setFilter(setEmail)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any email state</SelectItem>
            {(["sent", "failed", "pending", "skipped"] as const).map((k) => <SelectItem key={k} value={k}>{EMAIL_STYLE[k].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setFilter(setTag)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tags</SelectItem>
            {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={resendFailed} disabled={resending}>
          {resending ? <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <IconMailForward className="mr-1.5 h-4 w-4" />}
          Resend failed / unsent
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Lead</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Where</TableHead>
                <TableHead className="text-center">Fit</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-36">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} className="py-12 text-center"><IconLoader2 className="mx-auto h-5 w-5 animate-spin text-teal-600" /></TableCell></TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No leads match these filters yet.</TableCell></TableRow>
              )}
              {!loading && rows.map((l) => {
                const cat = l.category ? CATEGORY_STYLE[l.category] : null
                const em = EMAIL_STYLE[l.email_status]
                return (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => setOpen(l)}>
                    <TableCell className="max-w-[380px] whitespace-normal">
                      <p className="line-clamp-2 font-medium">{l.title}</p>
                      {l.summary && <p className="line-clamp-1 text-xs text-muted-foreground">{l.summary}</p>}
                      {(l.tags?.length ?? 0) > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {l.tags!.map((t) => <span key={t} className="rounded-full bg-teal-50 px-1.5 text-[10px] text-teal-800">{t}</span>)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{cat ? <Pill className={cat.className}>{cat.label}</Pill> : "—"}</TableCell>
                    <TableCell className="text-xs">
                      <p>{l.country ?? "—"}</p>
                      <p className="text-muted-foreground">{l.source ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{l.relevance ?? "—"}</TableCell>
                    <TableCell className="text-xs tabular-nums">{l.deadline ?? "—"}</TableCell>
                    <TableCell>{em && <Pill className={em.className} title={l.email_error ?? undefined}>{em.label}</Pill>}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={l.status} onValueChange={(v) => changeStatus(l, v as LeadStatus)}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} lead{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <LeadSheet
        lead={open}
        onOpenChange={(v) => { if (!v) setOpen(null) }}
        allTags={allTags}
        onSaved={(l) => { setRows((cur) => cur.map((r) => (r.id === l.id ? l : r))); onChanged() }}
      />
    </div>
  )
}
