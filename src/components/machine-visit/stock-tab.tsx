import { AlertTriangle, ArrowRight, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  expiresWithinDays,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatNumber,
  formatQuantity,
  formatRelative,
  isExpired,
} from "./format";
import { EmptyState, UnavailableNote } from "./parts";
import type { ProductStock, Refill, StockUnit } from "./types";

const LOW_STOCK_SHARE = 0.2;
const MIN_DAYS_FOR_PACE = 0.5;

function ExpiryBadge({ expiry }: { expiry: string | null }) {
  if (!expiry) return <span className="text-slate-400">—</span>;
  if (isExpired(expiry))
    return (
      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
        <AlertTriangle /> Expired {expiry}
      </Badge>
    );
  if (expiresWithinDays(expiry, 30))
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
        Expires {expiry}
      </Badge>
    );
  return <span>{expiry}</span>;
}

function ProductCard({ product, unit }: { product: ProductStock; unit: StockUnit }) {
  const { loaded, remaining, sold_since_refill: sold, last_refill_at } = product;
  const oversold = remaining !== null && remaining < 0;
  const left = remaining === null ? null : Math.max(0, remaining);
  const share = loaded && left !== null ? left / loaded : null;
  const low = share !== null && share <= LOW_STOCK_SHARE;
  const half = share !== null && share <= 0.5;

  const daysSince = last_refill_at
    ? Math.max(MIN_DAYS_FOR_PACE, (Date.now() / 1000 - last_refill_at) / 86400)
    : null;
  const perDay = daysSince && sold > 0 ? sold / daysSince : null;
  const daysLeft = perDay && left !== null ? Math.floor(left / perDay) : null;

  return (
    <Card className={cn("rounded-2xl shadow-sm", low && "border-red-300")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug text-slate-900">
            {product.name}
          </CardTitle>
          {low && (
            <Badge variant="outline" className="shrink-0 border-red-300 bg-red-50 text-red-700">
              <AlertTriangle /> {left === 0 ? "Empty" : "Low"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loaded === null ? (
          <p className="text-slate-500">No refill recorded for this product yet.</p>
        ) : (
          <>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-slate-900">
                  {formatQuantity(left, unit)}
                </span>
                <span className="text-xs text-slate-500">
                  left of {formatQuantity(loaded, unit)}
                </span>
              </div>
              <div
                className="mt-2 h-2 rounded-full bg-slate-100"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={loaded}
                aria-valuenow={left ?? 0}
                aria-label={`${product.name} stock`}
              >
                <div
                  className={cn(
                    "h-2 rounded-full",
                    low ? "bg-red-500" : half ? "bg-amber-500" : "bg-teal-600",
                  )}
                  style={{ width: `${Math.round((share ?? 0) * 100)}%` }}
                />
              </div>
            </div>

            {oversold && (
              <p className="flex gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formatQuantity(sold, unit)} sold since the last refill, more than
                the {formatQuantity(loaded, unit)} recorded — a refill may be missing.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-slate-500">Sold since refill</dt>
              <dd className="text-right font-medium text-slate-900">
                {formatQuantity(sold, unit)}
              </dd>
              <dt className="text-slate-500">Selling pace</dt>
              <dd className="text-right text-slate-900">
                {perDay
                  ? `${formatNumber(Math.round(perDay * 10) / 10)} ${unit}/day`
                  : "No sales yet"}
              </dd>
              <dt className="text-slate-500">Runs out in</dt>
              <dd className="text-right text-slate-900">
                {left === 0
                  ? "Now"
                  : daysLeft === null
                    ? "—"
                    : daysLeft < 1
                      ? "< 1 day"
                      : `~${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
              </dd>
              <dt className="text-slate-500">Refilled</dt>
              <dd className="text-right text-slate-900" title={formatDateTime(last_refill_at)}>
                {formatRelative(last_refill_at)}
                {product.stocked_by ? ` · ${product.stocked_by}` : ""}
              </dd>
              <dt className="text-slate-500">Batch</dt>
              <dd className="text-right text-slate-900">
                {product.batch_number ? `#${product.batch_number}` : "—"}
              </dd>
              <dt className="text-slate-500">Expiry</dt>
              <dd className="text-right">
                <ExpiryBadge expiry={product.expiry_date} />
              </dd>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StockTab({
  products,
  refills,
  totalRefills,
  unit,
  onViewRefillSales,
}: {
  products: ProductStock[];
  refills: Refill[] | null;
  totalRefills: number;
  unit: StockUnit;
  onViewRefillSales: (refill: Refill) => void;
}) {
  const latest = refills?.[0];

  return (
    <div className="space-y-6">
      {latest && (
        <Card className="rounded-2xl border-teal-200 bg-white shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex gap-3">
              <PackageCheck className="mt-1 h-5 w-5 text-teal-600" />
              <div>
                <div className="font-medium text-slate-900">
                  Last refilled {formatRelative(latest.refilled_at)}
                  {latest.stocked_by && <> by {latest.stocked_by}</>}
                </div>
                <div className="text-sm text-slate-600">
                  {formatDateTime(latest.refilled_at)}
                  {latest.batch_number && <> · Batch #{latest.batch_number}</>} ·{" "}
                  {formatQuantity(latest.total_loaded, unit)} in machine after refill ·{" "}
                  <span className="font-medium text-slate-900">
                    {formatNumber(latest.sold.transactions)} sale
                    {latest.sold.transactions === 1 ? "" : "s"} since
                  </span>{" "}
                  ({formatQuantity(latest.sold.units, unit)},{" "}
                  {formatMoney(latest.sold.revenue)})
                </div>
              </div>
            </div>
            <Button
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={() => onViewRefillSales(latest)}
            >
              View sales since this refill <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <EmptyState>No products are set up on this machine.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.brand_id} product={p} unit={unit} />
          ))}
        </div>
      )}

      {refills === null ? (
        <UnavailableNote what="Refill history" />
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Refill history</CardTitle>
            <CardDescription>
              Each refill visit and what sold before the next one.{" "}
              {totalRefills > refills.length &&
                `Showing the latest ${refills.length} of ${totalRefills} refills.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {refills.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No refills recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Refill</TableHead>
                    <TableHead>Stocked by</TableHead>
                    <TableHead className="text-right">In machine after</TableHead>
                    <TableHead>Lasted</TableHead>
                    <TableHead className="text-right">Sales in this period</TableHead>
                    <TableHead className="pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refills.map((r) => (
                    <TableRow key={r.refilled_at}>
                      <TableCell className="pl-6 align-top">
                        <div className="font-medium text-slate-900">
                          {r.batch_number ? `#${r.batch_number}` : "—"} ·{" "}
                          {formatDateTime(r.refilled_at)}
                        </div>
                        <div className="max-w-md whitespace-normal text-xs text-slate-500">
                          {r.items
                            .map((it) => `${it.name}: ${formatNumber(it.quantity)}`)
                            .join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">{r.stocked_by || "—"}</TableCell>
                      <TableCell className="text-right align-top tabular-nums">
                        {formatQuantity(r.total_loaded, unit)}
                      </TableCell>
                      <TableCell className="align-top">
                        {r.ends_at ? (
                          formatDuration(r.refilled_at, r.ends_at)
                        ) : (
                          <Badge variant="outline" className="border-teal-300 text-teal-700">
                            Current
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums">
                        <div className="font-medium text-slate-900">
                          {formatNumber(r.sold.transactions)} sales
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatQuantity(r.sold.units, unit)} · {formatMoney(r.sold.revenue)}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewRefillSales(r)}
                        >
                          View sales
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
