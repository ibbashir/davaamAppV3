import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { postRequest } from "@/Apis/Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatRelative, periodParams } from "./format";
import { InsightsTab } from "./insights-tab";
import { UnavailableNote } from "./parts";
import { ProductsTab } from "./products-tab";
import { SalesTab } from "./sales-tab";
import { StockTab } from "./stock-tab";
import { TransactionsTab } from "./transactions-tab";
import type {
  Brand,
  LegacyFilling,
  PeriodFilter,
  ProductStock,
  Refill,
  RefillsResponse,
  StockUnit,
  TransactionSummary,
  VisitMachine,
} from "./types";

type TabId = "stock" | "sales" | "transactions" | "insights" | "products";

/** How many recent refills the "Since a refill" dropdown lists. */
const REFILL_OPTIONS = 50;

const isNotFound = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 404;

/** Stock per product from the older machineDetailsWithMachineCode response. */
const legacyProducts = (brands: Brand[], fillings: LegacyFilling[]): ProductStock[] =>
  brands.map((b) => {
    const f = fillings.find((x) => x.brand_id === b.id);
    const loaded = f
      ? Number(f.lastBatchRefill ?? f.quantity ?? f.last_Quantity ?? f.litres ?? 0)
      : null;
    const remaining = f ? Number(f.currentStock ?? f.remainingQuantity ?? loaded ?? 0) : null;
    return {
      brand_id: b.id,
      name: b.name,
      price: Number(b.price ?? b.litre_price ?? 0),
      last_refill_at: f?.epoch_time ?? null,
      batch_number: f?.batch_number ?? null,
      expiry_date: f?.expiry_date ?? null,
      stocked_by: f?.stockedby ?? null,
      loaded,
      sold_since_refill: f ? Number(f.stockOut ?? (loaded ?? 0) - (remaining ?? 0)) : 0,
      remaining,
    };
  });

/**
 * Machine visit page shared by superadmin, admin, ops, fulfillment and
 * finance. Each role passes its own API prefix, header and back link.
 */
export function MachineVisitPage({
  apiBase,
  header,
  backTo,
}: {
  apiBase: string;
  header: ReactNode;
  backTo?: string;
}) {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const machine: VisitMachine = state?.machine ?? { machine_code: id ?? "" };
  const machineCode = machine.machine_code;
  const isButterfly = machineCode.startsWith("3");

  const [activeTab, setActiveTab] = useState<TabId>("stock");
  const [refillData, setRefillData] = useState<RefillsResponse | null>(null);
  const [refillsUnavailable, setRefillsUnavailable] = useState(false);
  const [legacy, setLegacy] = useState<ProductStock[] | null>(null);
  const [stockLoading, setStockLoading] = useState(true);

  const [filter, setFilter] = useState<PeriodFilter>({ period: { kind: "all" }, brandId: "" });
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryUnavailable, setSummaryUnavailable] = useState(false);

  useEffect(() => {
    if (!machineCode) return;
    let cancelled = false;
    setStockLoading(true);
    // Stock per product, the latest refill, and recent refills for the period
    // filter. The refill history table pages through the rest on its own.
    postRequest<RefillsResponse>(`${apiBase}/machineRefills`, {
      machine_code: machineCode,
      page: 1,
      perPage: REFILL_OPTIONS,
    })
      .then((res) => !cancelled && setRefillData(res))
      .catch(async (err) => {
        if (cancelled) return;
        if (!isNotFound(err)) {
          console.error("Error fetching refills:", err);
          return;
        }
        // Backend without the refill endpoint: fall back to latest fillings
        setRefillsUnavailable(true);
        try {
          const res = await postRequest<{ brands: Brand[]; fillings: LegacyFilling[] }>(
            `${apiBase}/machineDetailsWithMachineCode`,
            { machine_code: machineCode },
          );
          if (!cancelled) setLegacy(legacyProducts(res.brands ?? [], res.fillings ?? []));
        } catch (e) {
          console.error("Error fetching machine details:", e);
        }
      })
      .finally(() => !cancelled && setStockLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode]);

  // The summary feeds the Transactions tiles and the Insights tab
  const needsSummary = activeTab === "transactions" || activeTab === "insights";
  const summaryParams = JSON.stringify(periodParams(filter));
  useEffect(() => {
    if (!machineCode || !needsSummary || summaryUnavailable) return;
    let cancelled = false;
    setSummaryLoading(true);
    postRequest<TransactionSummary>(`${apiBase}/machineTransactionSummary`, {
      machine_code: machineCode,
      ...JSON.parse(summaryParams),
    })
      .then((res) => !cancelled && setSummary(res))
      .catch((err) => {
        if (cancelled) return;
        if (isNotFound(err)) setSummaryUnavailable(true);
        else console.error("Error fetching transaction summary:", err);
      })
      .finally(() => !cancelled && setSummaryLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiBase, machineCode, needsSummary, summaryParams, summaryUnavailable]);

  const products = useMemo(() => refillData?.products ?? legacy ?? [], [refillData, legacy]);
  const refills: Refill[] | null = refillsUnavailable ? null : (refillData?.refills ?? []);
  const unit: StockUnit = refillData?.unit ?? (isButterfly ? "pcs" : "L");
  const productOptions = useMemo(
    () => products.map((p) => ({ id: p.brand_id, name: p.name })),
    [products],
  );
  const lastRefill = refillData?.latestRefill ?? null;

  const viewRefillSales = (refill: Refill) => {
    setFilter({ period: { kind: "refill", refill }, brandId: "" });
    setActiveTab("transactions");
  };

  if (!machineCode) {
    return (
      <div>
        {header}
        <div className="p-6 text-slate-600">No machine selected.</div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          {backTo && (
            <Button variant="outline" onClick={() => navigate(backTo)} className="gap-2 bg-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Machines
            </Button>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {machine.machine_name || `Machine ${machineCode}`}
                </h1>
                <Badge variant="outline" className="tabular-nums">
                  #{machineCode}
                </Badge>
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">
                  {isButterfly ? "Sanitary" : "Dispensing (litres)"}
                </Badge>
                {machine.status && <Badge variant="outline">{machine.status}</Badge>}
              </div>
              {machine.machine_location && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" /> {machine.machine_location}
                </p>
              )}
            </div>
            {lastRefill && (
              <div className="text-right text-sm">
                <div className="text-slate-500">Last refill</div>
                <div className="font-medium text-slate-900" title={formatDateTime(lastRefill.refilled_at)}>
                  {formatRelative(lastRefill.refilled_at)}
                  {lastRefill.stocked_by && ` · ${lastRefill.stocked_by}`}
                </div>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
            <TabsList className="mb-2 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
              <TabsTrigger value="stock" className="flex-none px-4 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                📦 Stock
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex-none px-4 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                📊 Sales
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex-none px-4 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                🧾 Transactions
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex-none px-4 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                📈 Customers & usage
              </TabsTrigger>
              <TabsTrigger value="products" className="flex-none px-4 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                🏷 Products & prices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock">
              {stockLoading && products.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading stock…</div>
              ) : (
                <StockTab
                  products={products}
                  latestRefill={lastRefill}
                  history={refillsUnavailable ? null : { apiBase, machineCode }}
                  unit={unit}
                  onViewRefillSales={viewRefillSales}
                />
              )}
            </TabsContent>

            <TabsContent value="sales">
              <SalesTab apiBase={apiBase} machineCode={machineCode} unit={unit} />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTab
                apiBase={apiBase}
                machineCode={machineCode}
                filter={filter}
                onFilterChange={setFilter}
                refills={refills}
                products={productOptions}
                unit={unit}
                summary={summaryUnavailable ? null : summary}
                summaryLoading={summaryLoading}
              />
            </TabsContent>

            <TabsContent value="insights">
              {summaryUnavailable ? (
                <UnavailableNote what="Customer and usage insights" />
              ) : (
                <InsightsTab
                  filter={filter}
                  onFilterChange={setFilter}
                  refills={refills}
                  products={productOptions}
                  unit={unit}
                  summary={summary}
                  loading={summaryLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="products">
              <ProductsTab products={products} unit={unit} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
