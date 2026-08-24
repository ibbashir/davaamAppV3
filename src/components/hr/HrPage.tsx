import * as React from "react"
import { SiteHeader } from "@/components/admin/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Standard page shell for an HR module: header + scrollable padded body. */
export function HrPage({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader title={title} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6 md:py-6 overflow-y-auto flex-1">
          {description && (
            <p className="text-sm text-muted-foreground -mb-1">{description}</p>
          )}
          {children}
        </div>
      </div>
    </>
  )
}

export interface TabDef {
  value: string
  label: string
  content: React.ReactNode
}

/** A module page split into tabs — used where one module owns several tables. */
export function HrTabbedPage({
  title,
  description,
  tabs,
  defaultTab,
}: {
  title: string
  description?: string
  tabs: TabDef[]
  defaultTab?: string
}) {
  return (
    <HrPage title={title} description={description}>
      <Tabs defaultValue={defaultTab ?? tabs[0]?.value} className="w-full">
        {/* A one-item tab bar reads as a broken control, so it is left out —
            this happens when a role is scoped to a single tab of a module. */}
        {tabs.length > 1 && (
          <TabsList className="w-full justify-start overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </HrPage>
  )
}

/** Compact metric tile used across the HR dashboards. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "teal" | "amber" | "red" | "emerald"
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    teal: "text-teal-600",
    amber: "text-amber-600",
    red: "text-red-600",
    emerald: "text-emerald-600",
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-teal-600 shrink-0" />}
        </div>
        <p className={cn("mt-1 text-2xl font-bold tabular-nums", tones[tone])}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default HrPage
