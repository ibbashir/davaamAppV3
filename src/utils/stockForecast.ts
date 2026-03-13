/**
 * Stock Forecast Utility
 *
 * Computes predictive stock status from actual transaction history
 * when available, falling back to refill-based estimation.
 *
 * Uses a 1.25x safety buffer so forecasts are conservative,
 * giving field teams extra lead-time.
 *
 * Spike detection flags brands whose daily consumption since
 * last refill exceeds 2x the per-brand average for the machine.
 */

import { postRequest } from "@/Apis/Api"

export type BrandForecast = {
  brandName: string
  availableQuantity: number
  dailyConsumption: number
  daysRemaining: number | null
  /** Number of days of consumption data the average is based on */
  daysOfData: number
  hasSpike: boolean
}

export type StockForecast = {
  staticStatus: string
  daysRemaining: number | null
  spikeDetected: boolean
  brands: BrandForecast[]
  /** True when forecast is based on full transaction history */
  enriched: boolean
}

const SAFETY_BUFFER = 1.25
const SPIKE_THRESHOLD = 2.0
const MIN_DAYS_SINCE_REFILL = 0.5
const MIN_DAYS_FOR_TRANSACTIONS = 1
const MAX_DAYS_OF_DATA = 60

type Brand = {
  id: number
  name: string
  machine_code: string
  availableQuantity: number
  latestFilling: {
    epoch_time: number
    quantity?: number
    litres?: string
    lastBatchRefill?: number | null
    currentStock?: number | null
  } | null
  brandType: "dispensing" | "vending"
}

export type MachineTransaction = {
  brand_id: number | string
  quantity: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Spike detection — shared between both forecast paths
// ---------------------------------------------------------------------------

function applySpikeDetection(brandForecasts: BrandForecast[]): boolean {
  let spikeDetected = false

  if (brandForecasts.length >= 2) {
    const avgRate =
      brandForecasts.reduce((s, b) => s + b.dailyConsumption, 0) /
      brandForecasts.length

    for (const bf of brandForecasts) {
      if (avgRate > 0 && bf.dailyConsumption >= SPIKE_THRESHOLD * avgRate) {
        bf.hasSpike = true
        spikeDetected = true
      }
    }
  } else if (brandForecasts.length === 1) {
    const bf = brandForecasts[0]
    if (bf.daysRemaining !== null && bf.daysRemaining <= 3) {
      bf.hasSpike = true
      spikeDetected = true
    }
  }

  return spikeDetected
}

function buildResult(
  brandForecasts: BrandForecast[],
  staticStatus: string,
  enriched: boolean,
): StockForecast {
  const spikeDetected = applySpikeDetection(brandForecasts)

  const computable = brandForecasts.filter((b) => b.daysRemaining !== null)
  const daysRemaining =
    computable.length > 0
      ? Math.min(...computable.map((b) => b.daysRemaining as number))
      : null

  return { staticStatus, daysRemaining, spikeDetected, brands: brandForecasts, enriched }
}

// ---------------------------------------------------------------------------
// Path 1 — Refill-based forecast (initial fast load)
// ---------------------------------------------------------------------------

function getRefillQuantity(brand: Brand): number | null {
  const f = brand.latestFilling
  if (!f) return null

  if (brand.brandType === "dispensing" && f.litres) {
    const parsed = parseFloat(f.litres)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }

  if (typeof f.lastBatchRefill === "number" && f.lastBatchRefill > 0) {
    return f.lastBatchRefill
  }

  if (typeof f.quantity === "number" && f.quantity > 0) {
    return f.quantity
  }

  return null
}

function computeRefillForecast(
  brands: Brand[],
  staticStatus: string,
): StockForecast {
  const nowEpoch = Date.now() / 1000
  const brandForecasts: BrandForecast[] = []

  for (const brand of brands) {
    const refillQty = getRefillQuantity(brand)
    if (refillQty === null || !brand.latestFilling) continue

    const rawDaysSinceRefill =
      (nowEpoch - brand.latestFilling.epoch_time) / 86400

    if (rawDaysSinceRefill < MIN_DAYS_SINCE_REFILL) continue

    // Cap at MAX_DAYS_OF_DATA so very old refills don't dilute the rate
    const daysSinceRefill = Math.min(rawDaysSinceRefill, MAX_DAYS_OF_DATA)

    // Clamp negative availableQuantity to 0 (backend data issue)
    const available = Math.max(0, brand.availableQuantity)

    const consumed = refillQty - available
    if (consumed <= 0) continue

    const dailyRate = consumed / daysSinceRefill
    if (dailyRate <= 0) continue

    const bufferedRate = dailyRate * SAFETY_BUFFER
    const daysRemaining =
      available > 0
        ? Math.max(0, Math.floor(available / bufferedRate))
        : 0

    brandForecasts.push({
      brandName: brand.name,
      availableQuantity: available,
      dailyConsumption: Math.round(dailyRate * 100) / 100,
      daysRemaining,
      daysOfData: Math.floor(daysSinceRefill),
      hasSpike: false,
    })
  }

  return buildResult(brandForecasts, staticStatus, false)
}

// ---------------------------------------------------------------------------
// Path 2 — Transaction-based forecast (enriched, background)
// ---------------------------------------------------------------------------

/**
 * Compute forecast from full transaction history for a single machine.
 *
 * @param transactions   All transactions for this machine
 * @param brands         Brand list with current availableQuantity
 * @param staticStatus   Original "In Stock" / "Low Stock" / "Out of Stock"
 */
export function computeTransactionForecast(
  transactions: MachineTransaction[],
  brands: Brand[],
  staticStatus: string,
): StockForecast {
  // Build brand lookup: id -> { name, availableQuantity }
  const brandLookup = new Map<string, { name: string; availableQuantity: number }>()
  for (const b of brands) {
    brandLookup.set(String(b.id), { name: b.name, availableQuantity: b.availableQuantity })
  }

  // Group transactions by brand_id
  const byBrand = new Map<string, MachineTransaction[]>()
  for (const t of transactions) {
    const key = String(t.brand_id)
    if (!byBrand.has(key)) byBrand.set(key, [])
    byBrand.get(key)!.push(t)
  }

  const now = Date.now()
  const cutoff = now - MAX_DAYS_OF_DATA * 86400 * 1000
  const brandForecasts: BrandForecast[] = []

  for (const [brandKey, brandTxns] of byBrand) {
    const info = brandLookup.get(brandKey)
    if (!info) continue

    if (brandTxns.length === 0) continue

    // Only use transactions within the last MAX_DAYS_OF_DATA days
    let earliest = Infinity
    let totalConsumed = 0

    for (const t of brandTxns) {
      const ts = new Date(t.created_at).getTime()
      if (ts < cutoff) continue
      if (ts < earliest) earliest = ts
      totalConsumed += t.quantity != null && t.quantity > 0 ? t.quantity : 1
    }

    if (totalConsumed === 0) continue

    const totalDays = (now - earliest) / (1000 * 86400)
    if (totalDays < MIN_DAYS_FOR_TRANSACTIONS) continue

    const dailyRate = totalConsumed / totalDays
    if (dailyRate <= 0) continue

    // Clamp negative availableQuantity to 0 (backend data issue)
    const available = Math.max(0, info.availableQuantity)

    const bufferedRate = dailyRate * SAFETY_BUFFER
    const daysRemaining =
      available > 0
        ? Math.max(0, Math.floor(available / bufferedRate))
        : 0

    brandForecasts.push({
      brandName: info.name,
      availableQuantity: available,
      dailyConsumption: Math.round(dailyRate * 100) / 100,
      daysRemaining,
      daysOfData: Math.floor(totalDays),
      hasSpike: false,
    })
  }

  // If transactions yielded no forecasts, fall through to empty result
  return buildResult(brandForecasts, staticStatus, brandForecasts.length > 0)
}

// ---------------------------------------------------------------------------
// Public API — initial load (refill-based)
// ---------------------------------------------------------------------------

export type ForecastMaps = {
  forecasts: { [machineCode: string]: StockForecast }
  /** Brand ID → availableQuantity, used for enrichment lookup */
  brandQuantities: { [brandId: string]: number }
}

export function buildForecastMap(
  allBrands: Brand[],
  stockMap: { [code: string]: string },
): ForecastMaps {
  const grouped: { [code: string]: Brand[] } = {}
  const brandQuantities: { [brandId: string]: number } = {}

  for (const brand of allBrands) {
    const code = brand.machine_code
    if (!grouped[code]) grouped[code] = []
    grouped[code].push(brand)
    brandQuantities[String(brand.id)] = Math.max(0, brand.availableQuantity)
  }

  const forecasts: { [code: string]: StockForecast } = {}

  for (const [code, brands] of Object.entries(grouped)) {
    forecasts[code] = computeRefillForecast(
      brands,
      stockMap[code] || "Unknown",
    )
  }

  return { forecasts, brandQuantities }
}

// ---------------------------------------------------------------------------
// Public API — background enrichment (transaction-based)
// ---------------------------------------------------------------------------

type DetailResponse = {
  transactions: MachineTransaction[]
  brands: { id: number; name: string }[]
  fillings: unknown[]
}

/**
 * Fetches full transaction history for the given machine codes
 * and recomputes forecasts. Only fetches machines not already enriched.
 * Calls `onBatchReady` once with all updates.
 */
export async function enrichForecastMap(
  machineCodes: string[],
  currentForecasts: { [code: string]: StockForecast },
  stockMap: { [code: string]: string },
  brandQuantities: { [brandId: string]: number },
  onBatchReady: (updates: { [code: string]: StockForecast }) => void,
): Promise<void> {
  // Only fetch machines that haven't been enriched yet
  const toEnrich = machineCodes.filter(
    (code) => currentForecasts[code] && !currentForecasts[code].enriched,
  )

  if (toEnrich.length === 0) return

  // Fetch one at a time to avoid exhausting DB connections
  for (const code of toEnrich) {
    try {
      const res = await postRequest<DetailResponse>(
        `/superadmin/machineDetailsWithMachineCode`,
        { machine_code: code },
      )

      let update: StockForecast | null = null

      if (!res.transactions || res.transactions.length === 0) {
        // No transactions — keep refill-based forecast but mark as enriched
        const existing = currentForecasts[code]
        if (existing) {
          update = { ...existing, enriched: true }
        }
      } else {
        // Build brand list with availableQuantity looked up by brand ID
        const detailBrands: Brand[] = (res.brands || []).map((b) => ({
          id: b.id,
          name: b.name,
          machine_code: code,
          availableQuantity: brandQuantities[String(b.id)] ?? 0,
          latestFilling: null,
          brandType: "vending" as const,
        }))

        const forecast = computeTransactionForecast(
          res.transactions,
          detailBrands,
          stockMap[code] || "Unknown",
        )

        // Use transaction forecast if it produced results, otherwise keep refill-based
        if (forecast.enriched) {
          update = forecast
        } else {
          const existing = currentForecasts[code]
          if (existing) {
            update = { ...existing, enriched: true }
          }
        }
      }

      if (update) {
        onBatchReady({ [code]: update })
      }
    } catch {
      // Skip failed requests silently
    }
  }
}
