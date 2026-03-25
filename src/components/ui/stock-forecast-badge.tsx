import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertTriangle } from "lucide-react"
import type { StockForecast } from "@/utils/stockForecast"

function getForecastLabel(forecast: StockForecast): {
  label: string
  className: string
} {
  const { staticStatus, daysRemaining } = forecast

  if (staticStatus === "Out of Stock" && (daysRemaining === null || daysRemaining === 0)) {
    return { label: "Out of Stock", className: "bg-red-100 text-red-800" }
  }

  if (daysRemaining === 0) {
    return { label: "Critical - <1d left", className: "bg-red-100 text-red-800" }
  }

  if (daysRemaining === null) {
    // Not enough data to forecast — fall back to static label
    if (staticStatus === "Low Stock") {
      return { label: "Low Stock", className: "bg-yellow-100 text-yellow-800" }
    }
    return {
      label: "Insufficient Data To Forecast",
      className: "bg-gray-100 text-gray-800",
    }
  }

  if (daysRemaining <= 3) {
    return {
      label: `Critical - ${daysRemaining}d left`,
      className: "bg-red-100 text-red-800",
    }
  }

  if (daysRemaining <= 7) {
    return {
      label: `Low Stock - ${daysRemaining}d left`,
      className: "bg-yellow-100 text-yellow-800",
    }
  }

  if (daysRemaining > 90) {
    return {
      label: "Stock OK - 90d+",
      className: "bg-green-100 text-green-800",
    }
  }

  return {
    label: `Stock OK - ${daysRemaining}d left`,
    className: "bg-green-100 text-green-800",
  }
}

export function StockForecastBadge({
  forecast,
}: {
  forecast: StockForecast | undefined
}) {
  if (!forecast) {
    return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
  }

  const { label, className } = getForecastLabel(forecast)

  const tooltipLines: string[] = []

  if (forecast.brands.length > 0) {
    for (const b of forecast.brands) {
      const days =
        b.daysRemaining !== null
          ? b.daysRemaining > 90 ? "90d+ remaining" : `${b.daysRemaining}d remaining`
          : "N/A"
      const spike = b.hasSpike ? " (high demand)" : ""
      tooltipLines.push(
        `${b.brandName}: ${b.availableQuantity} units, ~${b.dailyConsumption}/day, ${days}${spike}`,
      )
      tooltipLines.push(
        `  Based on ${b.daysOfData}d of consumption data`,
      )
    }
  }

  if (forecast.spikeDetected) {
    tooltipLines.push(
      "",
      "Unusually high demand detected recently - treat estimate with caution",
    )
  }

  if (
    forecast.daysRemaining === null &&
    forecast.staticStatus !== "Out of Stock"
  ) {
    tooltipLines.push(
      forecast.enriched
        ? "Insufficient data to forecast"
        : "Enriching with transaction data...",
    )
  }

  const badge = (
    <span className="inline-flex items-center gap-1">
      <Badge className={className}>{label}</Badge>
      {forecast.spikeDetected && (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      )}
    </span>
  )

  if (tooltipLines.length === 0) return badge

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs text-xs whitespace-pre-line"
        >
          {tooltipLines.join("\n")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
