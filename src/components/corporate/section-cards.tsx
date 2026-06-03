import { IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
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
}

export function SectionCards() {
  const [cardsData, setCardsData] = useState<DashboardStatistics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRequest("") as { data: DashboardStatistics };
        setCardsData(res.data);
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        setCardsData(null);
      }
    };
    fetchData();
  }, []);


  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 px-3 sm:gap-4 sm:px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:gap-4 md:px-6 lg:px-6 @sm/main:grid-cols-2 @lg/main:grid-cols-3 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs sm:text-sm">Total Revenue</CardDescription>
          <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-2xl sm:@[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs sm:text-sm">
              <IconTrendingUp className="size-3 sm:size-4" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up <IconTrendingUp className="size-3 sm:size-4" />
          </div>
          <div className="text-muted-foreground">
            Last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs sm:text-sm">Active Locations</CardDescription>
          <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-2xl sm:@[250px]/card:text-3xl">
            {cardsData?.activeLocations}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs sm:text-sm">
              <IconTrendingUp className="size-3 sm:size-4" />
              +5.6%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Expansion continues <IconTrendingUp className="size-3 sm:size-4" />
          </div>
          <div className="text-muted-foreground">
            Last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs sm:text-sm">Plastic Saved</CardDescription>
          <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-2xl sm:@[250px]/card:text-3xl">
            {Math.round(cardsData?.plasticSaved ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs sm:text-sm">
              <IconTrendingUp className="size-3 sm:size-4" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sustainability improving <IconTrendingUp className="size-3 sm:size-4" />
          </div>
          <div className="text-muted-foreground">Waste reduction progress</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs sm:text-sm">Napkins Dispensed</CardDescription>
          <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums @[250px]/card:text-2xl sm:@[250px]/card:text-3xl">
            {cardsData?.napkins}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs sm:text-sm">
              <IconTrendingUp className="size-3 sm:size-4" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-3 sm:size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}
