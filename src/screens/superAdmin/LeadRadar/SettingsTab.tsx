import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2, IconSend, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchSettings, saveSettings, sendTestEmail, CATEGORY_STYLE, type LeadCategory, type LeadSettings } from "./api"

/** Chips with an input: Enter adds, × removes. */
function ChipList({ value, onChange, placeholder, validate }: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder: string
  validate?: (s: string) => string | null
}) {
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const add = () => {
    const v = draft.trim()
    if (!v) return
    const problem = validate?.(v) ?? null
    if (problem) { setError(problem); return }
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v])
    setDraft(""); setError(null)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}>
              <IconX className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => { setDraft(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
        />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SettingsTab({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = React.useState<LeadSettings | null>(null)
  const [saved, setSaved] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)

  React.useEffect(() => {
    fetchSettings()
      .then((r) => { setForm(r.data); setSaved(JSON.stringify(r.data)) })
      .catch((err) => toast.error(errorMessage(err, "Could not load settings")))
  }, [])

  if (!form) {
    return <div className="flex h-48 items-center justify-center"><IconLoader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  }

  const dirty = JSON.stringify(form) !== saved
  const set = <K extends keyof LeadSettings>(k: K, v: LeadSettings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const toggleCategory = (c: LeadCategory) =>
    set("categories", form.categories.includes(c) ? form.categories.filter((x) => x !== c) : [...form.categories, c])

  const save = async () => {
    setSaving(true)
    try {
      const r = await saveSettings(form)
      setForm(r.data); setSaved(JSON.stringify(r.data))
      toast.success("Settings saved — the agent uses them from its next run")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save settings"))
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const r = await sendTestEmail()
      toast.success(r.message || "Test email sent")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Test email failed"))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Who gets the digest, and which leads are worth an email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.email_enabled} onCheckedChange={(v) => set("email_enabled", Boolean(v))} />
            Send email digests
            <span className="text-xs text-muted-foreground">(off = leads are still saved here)</span>
          </label>

          <div className="grid gap-1.5">
            <Label>Recipients</Label>
            <ChipList
              value={form.recipients}
              onChange={(v) => set("recipients", v)}
              placeholder="name@davaam.pk"
              validate={(s) => (EMAIL_RE.test(s) ? null : "Enter a valid email address")}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Minimum fit score to email</Label>
            <Select value={String(form.min_relevance)} onValueChange={(v) => set("min_relevance", Number(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / 10{n === 6 ? " (default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Lower-scoring leads are saved but not emailed.</p>
          </div>

          <Button variant="outline" onClick={test} disabled={testing || dirty} title={dirty ? "Save first" : undefined}>
            {testing ? <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <IconSend className="mr-1.5 h-4 w-4" />}
            Send a test email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What the agent looks for</CardTitle>
          <CardDescription>Read by the agent at the start of every daily run.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-4">
              {(Object.keys(CATEGORY_STYLE) as LeadCategory[]).map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.categories.includes(c)} onCheckedChange={() => toggleCategory(c)} />
                  {CATEGORY_STYLE[c].label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Keywords</Label>
            <ChipList value={form.keywords} onChange={(v) => set("keywords", v)} placeholder="e.g. kiosk software" />
          </div>

          <div className="grid gap-1.5">
            <Label>Priority regions</Label>
            <ChipList value={form.priority_regions} onChange={(v) => set("priority_regions", v)} placeholder="e.g. Saudi Arabia" />
          </div>

          <div className="grid gap-1.5">
            <Label>Excluded countries</Label>
            <ChipList value={form.excluded_countries} onChange={(v) => set("excluded_countries", v)} placeholder="e.g. India" />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.include_linkedin} onCheckedChange={(v) => set("include_linkedin", Boolean(v))} />
              LinkedIn public posts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.include_freelance} onCheckedChange={(v) => set("include_freelance", Boolean(v))} />
              Freelance boards
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label>Only posts from the last</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={60} className="w-24"
                value={form.max_age_days}
                onChange={(e) => set("max_age_days", Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Extra instructions for the agent</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={form.agent_notes}
              onChange={(e) => set("agent_notes", e.target.value)}
              placeholder="e.g. Skip hardware-only supply tenders. Prefer projects over $5,000."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 lg:col-span-2">
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
        <Button variant="outline" disabled={!dirty || saving} onClick={() => setForm(JSON.parse(saved))}>Discard</Button>
        <Button className="bg-teal-600 hover:bg-teal-700" disabled={!dirty || saving} onClick={save}>
          {saving && <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  )
}
