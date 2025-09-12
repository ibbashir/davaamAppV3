import { IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getRequest } from "@/Apis/Api"

interface DashboardStatistics {
  activeLocations: number;
  activeMachines: number;
  bottleDispensed: number;
  handwashWithDishwash: number;
  napkins: number;
  oil: number;
  plasticSaved: number;
  grossSales:number;
}

export function SectionCards() {
  const [cardsData, setCardsData] = useState<DashboardStatistics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRequest("/superadmin/dashboardStatistics") as { data: DashboardStatistics };
        setCardsData(res.data);
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        setCardsData(null);
      }
    };
    fetchData();
  }, []);

const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US").format(amount)
    }
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(cardsData?.grossSales || 0)}
          </CardTitle>
          <CardAction>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Locations</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {cardsData?.activeLocations}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Expansion continues this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Locations over the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Plastic Saved</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {Math.round(cardsData?.plasticSaved ?? 0).toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sustainability improving <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Waste reduction progress</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Napkins Dispenseds</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {cardsData?.napkins}
          </CardTitle>  
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}
