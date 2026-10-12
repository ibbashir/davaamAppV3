import { getRequest, postRequest, putRequest, patchRequest } from "@/Apis/Api"
import { qs } from "@/components/hr/hr-api"

/** Lead Radar — leads found by the scheduled cloud agent. Superadmin only. */

export type LeadCategory = "software" | "ai" | "vending"
export type LeadStatus = "new" | "interested" | "applied" | "won" | "lost" | "ignored"
export type EmailStatus = "pending" | "sent" | "failed" | "skipped"

export interface Lead {
  id: number
  url: string
  title: string
  source: string | null
  country: string | null
  category: LeadCategory | null
  summary: string | null
  budget: string | null
  deadline: string | null
  posted: string | null
  relevance: number | null
  status: LeadStatus
  tags: string[] | null
  notes: string | null
  email_status: EmailStatus
  email_error: string | null
  emailed_at: number | null
  run_id: number | null
  created_at: number
  updated_at: number | null
}

export interface LeadRun {
  id: number
  kind: "agent" | "resend" | "test"
  received: number
  valid: number
  new_count: number
  duplicates: number
  emailed_count: number
  email_status: "sent" | "failed" | "skipped" | "nothing_new"
  email_error: string | null
  message_id: string | null
  accepted: string[] | null
  rejected: string[] | null
  created_at: number
}

export interface LeadSettings {
  email_enabled: boolean
  recipients: string[]
  min_relevance: number
  categories: LeadCategory[]
  keywords: string[]
  priority_regions: string[]
  excluded_countries: string[]
  include_linkedin: boolean
  include_freelance: boolean
  max_age_days: number
  agent_notes: string
}

export interface Overview {
  total: number
  last24h: number
  sent: number
  failed: number
  pending: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  lastRun: LeadRun | null
  lastAgentRun: LeadRun | null
}

interface Res<T> { statusCode: number; message: string; data: T }
interface Page<T> { rows: T[]; total: number; page: number; limit: number }

const BASE = "/superadmin/lead-radar"

export const fetchOverview = () => getRequest<Res<Overview>>(`${BASE}/overview`)
export const fetchLeads = (p: Record<string, unknown>) =>
  getRequest<Res<Page<Lead> & { tags: string[] }>>(`${BASE}/leads${qs(p)}`)
export const updateLead = (id: number, body: Partial<Pick<Lead, "status" | "tags" | "notes">>) =>
  patchRequest<Res<Lead>>(`${BASE}/leads/${id}`, body)
export const resendLeads = (ids?: number[]) => postRequest<Res<LeadRun>>(`${BASE}/leads/resend`, ids ? { ids } : {})
export const fetchRuns = (p: Record<string, unknown>) => getRequest<Res<Page<LeadRun>>>(`${BASE}/runs${qs(p)}`)
export const fetchSettings = () => getRequest<Res<LeadSettings>>(`${BASE}/settings`)
export const saveSettings = (body: Partial<LeadSettings>) => putRequest<Res<LeadSettings>>(`${BASE}/settings`, body)
export const sendTestEmail = () => postRequest<Res<LeadRun>>(`${BASE}/settings/test-email`, {})

// ─── Display helpers ─────────────────────────────────────────────────────────

export const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  software: { label: "Software", className: "bg-sky-100 text-sky-700 border-sky-200" },
  ai: { label: "AI", className: "bg-violet-100 text-violet-700 border-violet-200" },
  vending: { label: "Vending", className: "bg-teal-100 text-teal-700 border-teal-200" },
}

export const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string; className: string }> = [
  { value: "new", label: "New", className: "bg-slate-100 text-slate-700" },
  { value: "interested", label: "Interested", className: "bg-sky-100 text-sky-700" },
  { value: "applied", label: "Applied", className: "bg-amber-100 text-amber-700" },
  { value: "won", label: "Won", className: "bg-emerald-100 text-emerald-700" },
  { value: "lost", label: "Lost", className: "bg-red-100 text-red-700" },
  { value: "ignored", label: "Ignored", className: "bg-slate-100 text-slate-500" },
]

export const EMAIL_STYLE: Record<string, { label: string; className: string }> = {
  sent: { label: "Emailed", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Email failed", className: "bg-red-100 text-red-700" },
  pending: { label: "Not sent yet", className: "bg-amber-100 text-amber-700" },
  skipped: { label: "Not emailed", className: "bg-slate-100 text-slate-600" },
  nothing_new: { label: "Nothing new", className: "bg-slate-100 text-slate-600" },
}

export const RUN_KIND: Record<string, string> = { agent: "Agent run", resend: "Manual resend", test: "Test email" }

export const fmtTime = (epoch?: number | null) =>
  epoch
    ? new Date(epoch * 1000).toLocaleString("en-GB", {
        timeZone: "Asia/Karachi", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "—"
