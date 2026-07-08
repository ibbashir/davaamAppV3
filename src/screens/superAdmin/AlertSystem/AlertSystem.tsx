import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/superAdmin/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequest } from "@/Apis/Api";
import {
  IconActivity,
  IconAlertTriangle,
  IconBellRinging,
  IconClockPause,
  IconMail,
  IconMailX,
  IconServer,
  IconServerOff,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { AlertOverview, OverviewResponse } from "./Types";
import { formatDuration } from "./Types";
import { useAlertBase } from "./useAlertBase";
import { AnalyticsTab } from "./AnalyticsTab";
import { AlertsTab } from "./AlertsTab";
import { InactiveMachinesTab } from "./InactiveMachinesTab";
import { EmailLogsTab } from "./EmailLogsTab";

type StatCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
};

const buildCards = (o: AlertOverview): StatCard[] => [
  {
    label: "Total Machines",
    value: String(o.totalMachines),
    icon: <IconServer className="size-5" />,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Active Machines",
    value: String(o.activeMachines),
    icon: <IconActivity className="size-5" />,
    accent: "bg-green-50 text-green-600",
  },
  {
    label: "Inactive Machines",
    value: String(o.inactiveMachines),
    icon: <IconServerOff className="size-5" />,
    accent: "bg-red-50 text-red-600",
  },
  {
    label: "Machine Inactive Today",
    value: String(o.alertsToday),
    icon: <IconBellRinging className="size-5" />,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "Emails Sent Today",
    value: String(o.emailsSentToday),
    icon: <IconMail className="size-5" />,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Emails Failed Today",
    value: String(o.emailsFailedToday),
    icon: <IconMailX className="size-5" />,
    accent: "bg-rose-50 text-rose-600",
  },
  {
    label: "Downtime Today",
    value: formatDuration(o.downtimeTodaySeconds),
    icon: <IconClockPause className="size-5" />,
    accent: "bg-violet-50 text-violet-600",
  },
  {
    label: "Ongoing Sessions",
    value: String(o.ongoingSessions),
    icon: <IconAlertTriangle className="size-5" />,
    accent: "bg-orange-50 text-orange-600",
  },
];

export const AlertSystem = () => {
  const { apiBase } = useAlertBase();
  const [overview, setOverview] = useState<AlertOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequest<OverviewResponse>(
        `${apiBase}/overview`,
      );
      setOverview(res.data);
    } catch (err) {
      console.error("Failed to load alert overview", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchOverview();
    // Keep the cards fresh — same cadence as the backend cron
    const timer = setInterval(fetchOverview, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  return (
    <>
      <SiteHeader title="Machine Alert System" />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Machine Alert System</h1>
            <p className="text-sm text-muted-foreground">
              Inactivity monitoring, email alerts and downtime analytics
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loading}
          >
            <IconRefresh
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {(overview ? buildCards(overview) : Array.from({ length: 8 })).map(
            (card, i) => (
              <Card key={i} className="py-4">
                <CardContent className="flex flex-col gap-2 px-4">
                  {overview ? (
                    <>
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${(card as StatCard).accent}`}
                      >
                        {(card as StatCard).icon}
                      </div>
                      <div className="text-2xl font-semibold">
                        {(card as StatCard).value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(card as StatCard).label}
                      </div>
                    </>
                  ) : (
                    <div className="h-[86px] animate-pulse rounded-md bg-muted" />
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Machines</TabsTrigger>
            <TabsTrigger value="emails">Email Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab />
          </TabsContent>
          <TabsContent value="alerts" className="mt-4">
            <AlertsTab />
          </TabsContent>
          <TabsContent value="inactive" className="mt-4">
            <InactiveMachinesTab />
          </TabsContent>
          <TabsContent value="emails" className="mt-4">
            <EmailLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
