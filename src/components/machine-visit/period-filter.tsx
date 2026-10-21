import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDateTime,
  formatDuration,
  formatQuantity,
  monthOptions,
  refillLabel,
} from "./format";
import type { PeriodFilter, Refill, StockUnit } from "./types";

const ALL_PRODUCTS = "all";

export function PeriodFilterBar({
  filter,
  onChange,
  refills,
  products,
  unit,
}: {
  filter: PeriodFilter;
  onChange: (next: PeriodFilter) => void;
  /** null while the refill endpoint is unavailable */
  refills: Refill[] | null;
  products: { id: number; name: string }[];
  unit: StockUnit;
}) {
  const { period } = filter;
  const months = monthOptions();
  const refillOptions =
    refills && period.kind === "refill" &&
    !refills.some((r) => r.refilled_at === period.refill.refilled_at)
      ? [period.refill, ...refills]
      : (refills ?? []);
  const setPeriod = (next: PeriodFilter["period"]) =>
    onChange({ ...filter, period: next });

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-slate-500">Show sales</Label>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <Button
              size="sm"
              variant={period.kind === "all" ? "default" : "ghost"}
              onClick={() => setPeriod({ kind: "all" })}
            >
              All time
            </Button>
            {refills && refills.length > 0 && (
              <Button
                size="sm"
                variant={period.kind === "refill" ? "default" : "ghost"}
                onClick={() => setPeriod({ kind: "refill", refill: refills[0] })}
              >
                Since a refill
              </Button>
            )}
            <Button
              size="sm"
              variant={period.kind === "month" ? "default" : "ghost"}
              onClick={() => setPeriod({ kind: "month", month: months[0].value })}
            >
              By month
            </Button>
          </div>
        </div>

        {period.kind === "refill" && refills && (
          <div className="grid gap-1.5">
            <Label htmlFor="refill-select" className="text-xs text-slate-500">
              Refill
            </Label>
            <Select
              value={String(period.refill.refilled_at)}
              onValueChange={(v) => {
                const refill = refillOptions.find((r) => String(r.refilled_at) === v);
                if (refill) setPeriod({ kind: "refill", refill });
              }}
            >
              <SelectTrigger id="refill-select" className="w-80 max-w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {refillOptions.map((r) => (
                  <SelectItem key={r.refilled_at} value={String(r.refilled_at)}>
                    {refillLabel(r.batch_number, r.refilled_at)}
                    {r.ends_at === null ? " (latest)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {period.kind === "month" && (
          <div className="grid gap-1.5">
            <Label htmlFor="month-select" className="text-xs text-slate-500">
              Month
            </Label>
            <Select
              value={period.month}
              onValueChange={(month) => setPeriod({ kind: "month", month })}
            >
              <SelectTrigger id="month-select" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="product-select" className="text-xs text-slate-500">
            Product
          </Label>
          <Select
            value={filter.brandId || ALL_PRODUCTS}
            onValueChange={(v) =>
              onChange({ ...filter, brandId: v === ALL_PRODUCTS ? "" : v })
            }
          >
            <SelectTrigger id="product-select" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PRODUCTS}>All products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {period.kind === "refill" && (
        <div className="flex gap-3 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div>
              <span className="font-medium">
                {period.refill.batch_number
                  ? `Refill #${period.refill.batch_number}`
                  : "Refill"}
              </span>{" "}
              on {formatDateTime(period.refill.refilled_at)}
              {period.refill.stocked_by && <> by {period.refill.stocked_by}</>}
              {" — "}
              {formatQuantity(period.refill.total_loaded, unit)} in the machine
              after refilling.
            </div>
            <div className="text-teal-800/80">
              Showing sales from this refill{" "}
              {period.refill.ends_at ? (
                <>
                  until the next one on {formatDateTime(period.refill.ends_at)} (
                  {formatDuration(period.refill.refilled_at, period.refill.ends_at)}
                  ).
                </>
              ) : (
                <>
                  until now (
                  {formatDuration(
                    period.refill.refilled_at,
                    Math.floor(Date.now() / 1000),
                  )}
                  ).
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
