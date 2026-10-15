import * as React from "react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StatTile } from "@/components/hr/HrPage"
import {
  IconRadar, IconInbox, IconMailCheck, IconMailX, IconClockHour4, IconRefresh, IconExternalLink,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { errorMessage } from "@/components/hr/hr-api"
import { fetchOverview, fmtTime, EMAIL_STYLE, type Overview } from "./api"
import { LeadsTab, Pill } from "./LeadsTab"
import { RunsTab } from "./RunsTab"
import { SettingsTab } from "./SettingsTab"
import { ScheduleCard } from "./ScheduleCard"

const ROUTINE_URL = "https://claude.ai/code/routines/trig_01N9T4iBvi3fGLF65yARiCSr"

/**
 * Lead Radar — project posts and tenders the daily cloud agent finds, whether
 * each was emailed, and the settings that steer the agent. Superadmin only.
 */
export default function LeadRadar() {
  const [overview, setOverview] = React.useState<Overview | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [tab, setTab] = React.useState("leads")
  const bump = React.useCallback(() => setRefreshKey((k) => k + 1), [])

  React.useEffect(() => {
    fetchOverview()
      .then((r) => setOverview(r.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load Lead Radar")))
  }, [refreshKey])

  const last = overview?.lastAgentRun
  const lastEmail = last ? EMAIL_STYLE[last.email_status] : null

  return (
    <>
      <SiteHeader title="Lead Radar" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-4 md:py-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <IconRadar className="h-5 w-5 text-teal-600" /> Lead Radar
            </h1>
            <p className="text-sm text-muted-foreground">
              Tenders and project posts for software, AI and vending, found by the daily cloud agent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={ROUTINE_URL} target="_blank" rel="noreferrer">
                Agent schedule <IconExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={bump}>
              <IconRefresh className="mr-1 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Total leads" value={overview?.total ?? "—"} icon={IconInbox} tone="teal" />
          <StatTile label="New in 24 hours" value={overview?.last24h ?? "—"} icon={IconRadar} />
          <StatTile label="Emailed" value={overview?.sent ?? "—"} icon={IconMailCheck} tone="emerald" />
          <StatTile
            label="Email failed"
            value={overview?.failed ?? "—"}
            icon={IconMailX}
            tone={overview?.failed ? "red" : "default"}
            hint={overview?.pending ? `${overview.pending} waiting to send` : undefined}
          />
          <StatTile
            label="Last agent run"
            value={last ? fmtTime(last.created_at) : "Never"}
            icon={IconClockHour4}
            hint={last ? `${last.new_count} new · ${lastEmail?.label ?? last.email_status}` : "Runs daily at 1:00 am"}
          />
        </div>

        {overview?.schedule && <ScheduleCard schedule={overview.schedule} todayRuns={overview.todayRuns ?? []} />}

        {last?.email_status === "failed" && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <Pill className="bg-red-100 text-red-700">Email failed</Pill>
            The last digest was not sent: {last.email_error}. Fix it in Settings, then use "Resend failed / unsent".
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="runs">Email log</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="leads" className="mt-4"><LeadsTab refreshKey={refreshKey} onChanged={bump} /></TabsContent>
          <TabsContent value="runs" className="mt-4"><RunsTab refreshKey={refreshKey} /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab onSaved={bump} /></TabsContent>
        </Tabs>
      </div>
    </>
  )
}
