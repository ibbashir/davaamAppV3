import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getRequest } from "@/Apis/Api"
import { cn } from "@/lib/utils"
import {
  IconCash,
  IconMapPin,
  IconCpu,
  IconRecycle,
  IconStack2,
  IconDroplets,
} from "@tabler/icons-react"

interface DashboardStatistics {
  activeLocations: number
  activeMachines: number
  bottleDispensed: number
  handwashWithDishwash: number
  napkins: number
  oil: number
  plasticSaved: number
  grossSales: number
}

const STAT_CARDS = [
  {
    key: "grossSales" as const,
    label: "Total Revenue",
    icon: IconCash,
    iconBg: "bg-teal-50",
    iconFg: "text-teal-600",
    format: (v: number) => `₨ ${v.toLocaleString()}`,
  },
  {
    key: "activeLocations" as const,
    label: "Active Locations",
    icon: IconMapPin,
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "activeMachines" as const,
    label: "Active Machines",
    icon: IconCpu,
    iconBg: "bg-violet-50",
    iconFg: "text-violet-600",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "plasticSaved" as const,
    label: "Plastic Saved",
    icon: IconRecycle,
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-600",
    format: (v: number) => `${Math.round(v).toLocaleString()} g`,
  },
  {
    key: "napkins" as const,
    label: "Napkins Dispensed",
    icon: IconStack2,
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "bottleDispensed" as const,
    label: "Bottles Dispensed",
    icon: IconDroplets,
    iconBg: "bg-cyan-50",
    iconFg: "text-cyan-600",
    format: (v: number) => v.toLocaleString(),
  },
]

export function SectionCards() {
  const [data, setData] = useState<DashboardStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRequest("/superadmin/dashboardStatistics") as { data: DashboardStatistics }
        setData(res.data)
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3 px-3 sm:px-4 md:gap-4 md:px-6 lg:grid-cols-3 xl:grid-cols-3">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon
        const value = data ? card.format(data[card.key] ?? 0) : null

        return (
          <Card key={card.key} className="border shadow-sm">
            <CardContent className="p-4 sm:p-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-7 w-4/5" />
                  <Skeleton className="h-3.5 w-3/5" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.iconBg)}>
                    <Icon className={cn("size-5", card.iconFg)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl leading-none">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
