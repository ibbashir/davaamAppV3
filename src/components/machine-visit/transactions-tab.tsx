import { useEffect, useState } from "react";
import {
  Banknote,
  Download,
  Receipt,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { postRequest } from "@/Apis/Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  formatMoney,
  formatNumber,
  formatQuantity,
  isAnonymousCustomer,
  paymentLabel,
  periodLabel,
  periodParams,
  transactionQuantity,
  transactionTime,
} from "./format";
import { PeriodFilterBar } from "./period-filter";
import { Pager, StatTile } from "./parts";
import type {
  PeriodFilter,
  Refill,
  StockUnit,
  Transaction,
  TransactionPage,
  TransactionSummary,
} from "./types";

const PAGE_SIZES = [10, 20, 50, 100];

const PAYMENT_STYLES: Record<string, string> = {
  App: "border-teal-200 bg-teal-50 text-teal-800",
  Cash: "border-slate-200 bg-slate-50 text-slate-700",
};

export function TransactionsTab({
  apiBase,
  machineCode,
  filter,
  onFilterChange,
  refills,
  products,
  unit,
  summary,
  summaryLoading,
}: {
  apiBase: string;
  machineCode: string;
  filter: PeriodFilter;
  onFilterChange: (next: PeriodFilter) => void;
  refills: Refill[] | null;
  products: { id: number; name: string }[];
  unit: StockUnit;
  summary: TransactionSummary | null;
  summaryLoading: boolean;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [data, setData] = useState<TransactionPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const productName = (id: number) =>
    products.find((p) => p.id === id)?.name ?? `Product ${id}`;

  // A new filter starts from the first page
  const changeFilter = (next: PeriodFilter) => {
    setPage(1);
    onFilterChange(next);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postRequest<TransactionPage>(`${apiBase}/machineTransactionWithMachineCode`, {
      machine_code: machineCode,
      page,
      perPage,
      ...periodParams(filter),
    })
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setData({ transactions: [], total: 0, totalPages: 1 }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode, page, perPage, filter]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = await postRequest<string>(`${apiBase}/machine-transaction-csv`, {
        machine_code: machineCode,
        ...periodParams(filter),
      });
      if (!csv || typeof csv !== "string") throw new Error("Invalid CSV data received");
      const suffix =
        filter.period.kind === "month"
          ? filter.period.month
          : filter.period.kind === "refill"
            ? `refill-${filter.period.refill.batch_number ?? filter.period.refill.refilled_at}`
            : "all";
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions_${machineCode}_${suffix}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("No transactions to export for this selection, or the export failed.");
    } finally {
      setExporting(false);
    }
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const rows = data?.transactions ?? [];
  const c = summary?.customers;

  return (
    <div className="space-y-4">
      <PeriodFilterBar
        filter={filter}
        onChange={changeFilter}
        refills={refills}
        products={products}
        unit={unit}
      />

      {summary && (
        <div className={cn("grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-5", summaryLoading && "opacity-60")}>
          <StatTile
            icon={<Receipt className="h-4 w-4" />}
            label="Sales"
            value={formatNumber(summary.totals.transactions)}
            hint={periodLabel(filter.period)}
          />
          <StatTile
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Sold"
            value={formatQuantity(summary.totals.units, unit)}
          />
          <StatTile
            icon={<Banknote className="h-4 w-4" />}
            label="Revenue"
            value={formatMoney(summary.totals.revenue)}
          />
          <StatTile
            icon={<Wallet className="h-4 w-4" />}
            label="Paid via"
            value={
              <span className="text-base">
                {summary.payments.length === 0
                  ? "—"
                  : summary.payments
                      .slice(0, 2)
                      .map((p) => `${p.method} ${formatNumber(p.transactions)}`)
                      .join(" · ")}
              </span>
            }
            hint={
              summary.payments.length > 2
                ? summary.payments
                    .slice(2)
                    .map((p) => `${p.method} ${formatNumber(p.transactions)}`)
                    .join(" · ")
                : undefined
            }
          />
          <StatTile
            icon={<Users className="h-4 w-4" />}
            label="Customers"
            value={formatNumber(c?.unique ?? 0)}
            hint={
              c && c.anonymousTransactions > 0
                ? `${formatNumber(c.anonymousTransactions)} sales had no customer number (e.g. cash)`
                : `${formatNumber(c?.returning ?? 0)} came back more than once`
            }
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {loading && !data
            ? "Loading…"
            : `${formatNumber(total)} transaction${total === 1 ? "" : "s"} · ${periodLabel(filter.period)}${
                filter.brandId ? ` · ${productName(Number(filter.brandId))}` : ""
              }`}
        </p>
        <Button
          className="bg-teal-600 text-white hover:bg-teal-700"
          onClick={exportCsv}
          disabled={exporting || total === 0}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <Card className={cn("rounded-2xl shadow-sm transition-opacity", loading && data && "opacity-60")}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">#</TableHead>
                <TableHead>Date & time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid via</TableHead>
                <TableHead className="pr-6">Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((tx: Transaction, i) => {
                  const method = paymentLabel(tx);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="pl-6 text-slate-500 tabular-nums">
                        {(page - 1) * perPage + i + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{transactionTime(tx)}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {productName(tx.brand_id)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {transactionQuantity(tx, unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PAYMENT_STYLES[method] ?? "border-violet-200 bg-violet-50 text-violet-800"}
                        >
                          {method}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        {isAnonymousCustomer(tx) ? (
                          <span className="text-slate-400">Walk-in (cash)</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="tabular-nums text-slate-900">{tx.msisdn || "—"}</span>
                            {tx.is_staff && (
                              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                                Staff
                              </Badge>
                            )}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    {loading ? "Loading transactions…" : "No transactions for this selection."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 0 && (
        <Pager
          id="transactions-per-page"
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          pageSizes={PAGE_SIZES}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
