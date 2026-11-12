import { useState } from "react";
import {
  CircleCheck,
  CircleDashed,
  OctagonAlert,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
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
import { scopeName, type AlertsSummary, type Episode, type ScopeState } from "./alerts";
import { formatDateTime, formatDuration, formatNumber, formatRelative } from "./format";
import { EmptyState, Pager, UnavailableNote } from "./parts";
import type { DiagAlertsResponse, ProductStock } from "./types";

const STATUS: Record<
  AlertsSummary["status"],
  { icon: typeof CircleCheck; badge: string; card: string }
> = {
  fault: { icon: OctagonAlert, badge: "bg-red-600 text-white", card: "border-red-200 bg-red-50/60" },
  recovered: { icon: RotateCcw, badge: "bg-amber-500 text-white", card: "border-amber-200 bg-amber-50/60" },
  clear: { icon: CircleCheck, badge: "bg-teal-600 text-white", card: "border-teal-200 bg-teal-50/60" },
  none: { icon: CircleDashed, badge: "bg-slate-400 text-white", card: "bg-white" },
};

const STATE_CHIP: Record<ScopeState["state"], { label: string; className: string }> = {
  open: { label: "Needs checking", className: "border-red-300 bg-red-50 text-red-700" },
  cleared: { label: "Working again", className: "border-teal-300 bg-teal-50 text-teal-800" },
  ok: { label: "No alerts", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

const HISTORY_PAGE_SIZES = [10, 20, 50];

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** Headline and explanation for the overall state. */
function statusText(summary: AlertsSummary, days: number) {
  const { status, open, recentAlerts, lastAt } = summary;
  if (status === "fault") {
    return {
      title: `${plural(open.length, open.length === 1 && open[0].row_num === null ? "fault" : "row")} ${open.length === 1 ? "needs" : "need"} checking`,
      text: "The machine reported a fault, and there's been no sale from that row since to show it dispenses again.",
    };
  }
  if (status === "recovered") {
    return {
      title: "Working again",
      text: `${plural(recentAlerts, "fault")} reported in the last 7 days, but every row involved has sold again since.`,
    };
  }
  if (status === "clear") {
    return {
      title: "No open faults",
      text: `The last fault was reported ${formatRelative(lastAt)}, and it has sold again since.`,
    };
  }
  return {
    title: "No faults reported",
    text: `This machine hasn't reported a jam, failed dispense or error in the last ${days} days. Only machines on the newer firmware report these.`,
  };
}

function episodeWhen(e: Episode) {
  return e.count > 1 && e.last_at - e.first_at >= 60
    ? `${formatDateTime(e.first_at)} (over ${formatDuration(e.first_at, e.last_at)})`
    : formatDateTime(e.last_at);
}

function ScopeCard({ scope, product }: { scope: ScopeState; product?: ProductStock }) {
  const chip = STATE_CHIP[scope.state];
  const e = scope.last;
  const rowEmpty = product?.remaining !== null && product?.remaining !== undefined && product.remaining <= 0;
  return (
    <Card className={cn("rounded-2xl shadow-sm", scope.state === "open" && "border-red-300")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug text-slate-900">{scope.name}</CardTitle>
          <Badge variant="outline" className={cn("shrink-0", chip.className)}>
            {chip.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        {!e ? (
          <p className="text-slate-500">No faults reported in this period.</p>
        ) : (
          <>
            <p className="font-medium text-slate-900">
              {e.label}
              {e.detail && <span className="font-normal text-slate-500"> · {e.detail}</span>}
              {e.count > 1 && <span className="font-normal text-slate-500"> · reported {e.count}×</span>}
            </p>
            <p className="text-slate-600" title={formatDateTime(e.last_at)}>
              {formatRelative(e.last_at)}
            </p>
            {scope.state === "open" ? (
              <p className="text-red-700">
                {scope.row_num === null ? "No sale since." : "No sale from this row since."}
                {rowEmpty && <span className="text-slate-600"> The row is empty, so no sale can confirm it yet.</span>}
              </p>
            ) : (
              <p className="text-teal-700" title={formatDateTime(e.cleared_by_sale_at)}>
                Sold again {formatRelative(e.cleared_by_sale_at)}.
              </p>
            )}
            {scope.recentAlerts > 0 && (
              <p className="text-xs text-slate-500">{plural(scope.recentAlerts, "alert")} in the last 7 days</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function History({ episodes }: { episodes: Episode[] }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(HISTORY_PAGE_SIZES[0]);
  const totalPages = Math.max(1, Math.ceil(episodes.length / perPage));
  const shown = episodes.slice((page - 1) * perPage, page * perPage);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Alert history</CardTitle>
        <CardDescription>
          Newest first. Repeats of the same fault within 15 minutes are shown once with a count.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">When</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead>Where</TableHead>
              <TableHead className="text-right">Times</TableHead>
              <TableHead>Since then</TableHead>
              <TableHead className="pr-6">Reported from</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((e) => (
              <TableRow key={e.key}>
                <TableCell className="pl-6 whitespace-nowrap text-slate-900">{episodeWhen(e)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-medium text-slate-900">{e.label}</span>
                  {e.detail && <span className="text-slate-500"> · {e.detail}</span>}
                </TableCell>
                <TableCell className="whitespace-normal">{scopeName(e.row_num, e.product_name)}</TableCell>
                <TableCell className="text-right tabular-nums">{e.count}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {e.cleared_by_sale_at === null ? (
                    <span className="text-red-700">No sale yet</span>
                  ) : (
                    <span className="text-teal-700" title={formatDateTime(e.cleared_by_sale_at)}>
                      Sold again after {formatDuration(e.last_at, e.cleared_by_sale_at)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-6 font-mono text-xs whitespace-nowrap text-slate-500">
                  {e.ip || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {episodes.length > HISTORY_PAGE_SIZES[0] && (
          <div className="border-t py-3">
            <Pager
              id="alerts-per-page"
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              pageSizes={HISTORY_PAGE_SIZES}
              onPageChange={setPage}
              onPerPageChange={(size) => {
                setPerPage(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Faults the machine reported about itself (jam, failed dispense, error) and
 * what state each row is in now.
 */
export function AlertsTab({
  data,
  summary,
  state,
  products,
  onRefresh,
}: {
  data: DiagAlertsResponse | null;
  summary: AlertsSummary | null;
  state: "loading" | "ready" | "unavailable" | "failed";
  products: ProductStock[];
  onRefresh: () => void;
}) {
  if (state === "unavailable") return <UnavailableNote what="Machine alerts" />;
  if (!data || !summary) {
    return state === "failed" ? (
      <EmptyState>
        Couldn't load this machine's alerts.{" "}
        <button type="button" className="text-teal-700 underline" onClick={onRefresh}>
          Try again
        </button>
      </EmptyState>
    ) : (
      <div className="py-12 text-center text-sm text-slate-500">Loading alerts…</div>
    );
  }

  const style = STATUS[summary.status];
  const StatusIcon = style.icon;
  const { title, text } = statusText(summary, data.days);
  const productByBrand = new Map(products.map((p) => [p.brand_id, p]));

  return (
    <div className={cn("space-y-6 transition-opacity", state === "loading" && "opacity-60")}>
      <Card className={cn("rounded-2xl shadow-sm", style.card)}>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", style.badge)}>
              <StatusIcon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-0.5 max-w-2xl text-sm text-slate-700">{text}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <Button variant="outline" size="sm" className="bg-white" onClick={onRefresh} disabled={state === "loading"}>
              <RefreshCw className={cn("h-4 w-4", state === "loading" && "animate-spin")} /> Refresh
            </Button>
            {data.device && (
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-right text-xs">
                <dt className="text-slate-500">MAC</dt>
                <dd className="font-mono text-slate-800">{data.device.mac || "—"}</dd>
                <dt className="text-slate-500">IP</dt>
                <dd className="font-mono text-slate-800">{data.device.ip || "—"}</dd>
                <dt className="text-slate-500">Last report</dt>
                <dd className="text-slate-800" title={formatDateTime(data.device.reported_at)}>
                  {formatRelative(data.device.reported_at)}
                </dd>
              </dl>
            )}
          </div>
        </CardContent>
      </Card>

      {summary.scopes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Each row now</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summary.scopes.map((s) => (
              <ScopeCard
                key={s.key}
                scope={s}
                product={s.brand_id !== null ? productByBrand.get(s.brand_id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {summary.byType.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Last {data.days} days:</span>
          {summary.byType.map((t) => (
            <Badge key={t.type} variant="outline" className="bg-white text-slate-700">
              <TriangleAlert className="text-amber-600" /> {t.label} · {formatNumber(t.count)}
            </Badge>
          ))}
          {data.truncated && <span className="text-xs text-slate-500">(only the latest 1,000 alerts are shown)</span>}
        </div>
      )}

      {summary.episodes.length > 0 && <History episodes={summary.episodes} />}
    </div>
  );
}
