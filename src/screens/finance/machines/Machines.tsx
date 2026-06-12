import { useState, useEffect } from "react";
import { getRequest } from "@/Apis/Api";
import { SiteHeader } from "@/components/finance/site-header";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  Hash,
  Server,
  Cpu,
  Tag,
  Clock,
  Package,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiMachine, MachinesResponse } from "./Types";
import {
  buildForecastMap,
  enrichForecastMap,
  type StockForecast,
} from "@/utils/stockForecast";
import { StockForecastBadge } from "@/components/ui/stock-forecast-badge";
import { formatUnixTimestamp } from "@/utils/formatters";

// ── Enriched machine type ─────────────────────────────────────────────────────
type EnrichedMachine = ApiMachine & {
  category: string;
  status: string;
  lastActive: string;
  stockStatus: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function getPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

const categories = [
  { id: "Butterfly", label: "🦋 Butterfly" },
  { id: "Cooking Oil", label: "🍳 Cooking Oil" },
  { id: "CleaningProducts", label: "🧴 Cleaning" },
];

const subCategories = [
  { id: "BodyWash", label: "🛁 Body Wash" },
  { id: "Dishwash", label: "🍽️ Dishwash" },
  { id: "Handwash", label: "🧼 Handwash" },
  { id: "Laundry", label: "👕 Laundry" },
  { id: "Shampoo", label: "🧴 Shampoo" },
  { id: "Surface Cleaner", label: "🧹 Surface Cleaner" },
  { id: "Unknown", label: "❓ Unknown" },
];

type StatusFilter = "online" | "offline" | "idle" | null;
type StockFilter = "low" | "full" | null;
type SortField =
  | "machine_code"
  | "machine_name"
  | "machine_type"
  | "category"
  | "lastActive"
  | "stockStatus"
  | "forecast"
  | "status";
type SortDirection = "asc" | "desc" | "none";

type TableColumn =
  | { field: SortField; label: string; sortable: true }
  | { field?: undefined; label: string; sortable?: false };

const TABLE_COLUMNS: TableColumn[] = [
  { field: "machine_code", label: "Machine ID", sortable: true },
  { label: "Name" },
  { label: "Current Stock" },
  { label: "Variant" },
  { label: "Stock" },
  { label: "Forecast" },
  { label: "Status" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: "online", label: "Online", dot: "bg-green-500" },
  { value: "offline", label: "Offline", dot: "bg-red-500" },
  { value: "idle", label: "Idle", dot: "bg-yellow-500" },
];

const STOCK_FILTERS: { value: StockFilter; label: string; icon: string }[] = [
  { value: "full", label: "Full", icon: "✅" },
  { value: "low", label: "Low Stock", icon: "⚠️" },
];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

const STOCK_COLORS: Record<string, string> = {
  "In Stock": "bg-green-100 text-green-800",
  "Low Stock": "bg-yellow-100 text-yellow-800",
  "Out of Stock": "bg-red-100 text-red-800",
  Unknown: "bg-gray-100 text-gray-800",
};

// ── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill<T>({
  value,
  active,
  onClick,
  children,
}: {
  value: T;
  active: boolean;
  onClick: (v: T) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(active ? (null as T) : value)}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 cursor-pointer select-none",
        active
          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700",
      ].join(" ")}
    >
      {children}
      {active && <X className="h-3 w-3 opacity-70" />}
    </button>
  );
}

// ── Mobile machine card ───────────────────────────────────────────────────────
function MobileMachineCard({
  machine,
  forecastEnriching,
  machineForecastMap,
  onVisit,
}: {
  machine: EnrichedMachine;
  forecastEnriching: Set<string>;
  machineForecastMap: { [code: string]: StockForecast };
  onVisit: (machine: EnrichedMachine) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm flex items-center gap-1.5">
          <Hash className="size-3.5 text-teal-600 shrink-0" />
          {machine.machine_code}
        </p>
        <Badge className={STATUS_COLORS[machine.status] ?? "bg-gray-100 text-gray-800"}>
          {machine.status}
        </Badge>
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5 text-gray-700">
          <Server className="size-3 text-teal-600 shrink-0" />
          <span className="font-medium truncate">{machine.machine_name}</span>
        </p>
        <p className="flex items-center gap-1.5 text-gray-500">
          <Cpu className="size-3 text-teal-600 shrink-0" />
          {machine.machine_type}
        </p>
        <p className="flex items-center gap-1.5 text-gray-500">
          <Tag className="size-3 text-teal-600 shrink-0" />
          {machine.category}
        </p>
        <p className="flex items-center gap-1.5 text-gray-500">
          <Clock className="size-3 text-teal-600 shrink-0" />
          {machine.lastActive}
        </p>
        <div className="flex items-center gap-1.5">
          <Package className="size-3 text-teal-600 shrink-0" />
          <Badge className={STOCK_COLORS[machine.stockStatus] ?? "bg-gray-100 text-gray-800"}>
            {machine.stockStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="size-3 text-teal-600 shrink-0" />
          {forecastEnriching.has(machine.machine_code) ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          ) : (
            <StockForecastBadge forecast={machineForecastMap[machine.machine_code]} />
          )}
        </div>
      </div>

      {/* Visit button */}
      <div className="pt-2 border-t">
        <Button
          size="sm"
          className="w-full bg-teal-600 hover:bg-teal-700"
          onClick={() => onVisit(machine)}
        >
          Visit Machine
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const Machines = () => {
  const navigate = useNavigate();

  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Butterfly");
  const [isShowCleaningProducts, setIsShowCleaningProducts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotalItems, setServerTotalItems] = useState(0);

  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null);
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({});
  const [machineRowsMap, setMachineRowsMap] = useState<{ [code: string]: { row_num: number; availableQuantity: number; name: string }[] }>({});
  const [machineForecastMap, setMachineForecastMap] = useState<{ [code: string]: StockForecast }>({});
  const [brandQuantities, setBrandQuantities] = useState<{ [brandId: string]: number }>({});
  const [forecastEnriching, setForecastEnriching] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: "machine_code",
    direction: "asc",
  });

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchMachines = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        category: activeCategory,
        ...(sortConfig.field === "machine_code" && sortConfig.direction !== "none"
          ? { sortOrder: sortConfig.direction }
          : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(stockFilter ? { availableQuantity: stockFilter } : {}),
      });

      const res = await getRequest<MachinesResponse>(
        `/finance/getAllMachineStockAndStatus?${params}`,
      );
      const { machines, brands, pagination } = res.data;

      const stockMap: { [code: string]: string } = {};
      const allBrands = [...brands.vending, ...brands.dispensing];
      const grouped: { [machine_code: string]: number[] } = {};
      const rowsMap: { [code: string]: { row_num: number; availableQuantity: number; name: string }[] } = {};

      allBrands.forEach((brand) => {
        if (!grouped[brand.machine_code]) grouped[brand.machine_code] = [];
        grouped[brand.machine_code].push(brand.availableQuantity);

        if (!rowsMap[brand.machine_code]) rowsMap[brand.machine_code] = [];
        rowsMap[brand.machine_code].push({
          row_num: brand.row_num,
          availableQuantity: brand.availableQuantity,
          name: brand.name,
        });
      });

      for (const code of Object.keys(rowsMap)) {
        rowsMap[code].sort((a, b) => a.row_num - b.row_num);
      }

      for (const [code, quantities] of Object.entries(grouped)) {
        const total = quantities.reduce((sum, q) => sum + q, 0);
        if (total === 0) stockMap[code] = "Out of Stock";
        else if (total < 2) stockMap[code] = "Low Stock";
        else stockMap[code] = "In Stock";
      }

      const { forecasts: forecastMap, brandQuantities: bq } = buildForecastMap(allBrands, stockMap);

      setCurrentPage(page);
      setMachinesData(machines);
      setMachineStockMap(stockMap);
      setMachineRowsMap(rowsMap);
      setMachineForecastMap(forecastMap);
      setBrandQuantities(bq);
      setServerTotalPages(pagination?.totalPages ?? 1);
      setServerTotalItems(pagination?.total ?? 0);
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch on filter / page-size change ──────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMachines(1); }, [activeCategory, debouncedSearch, statusFilter, stockFilter, pageSize]);

  const allMachines: EnrichedMachine[] = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
        machines.map((machine) => ({
          ...machine,
          category,
          status:
            machine.statusCode === "r" ? "Inactive"
            : machine.statusCode === "g" ? "Active"
            : "Pending",
          lastActive: formatUnixTimestamp(machine.lastUpdated),
          stockStatus: machineStockMap[machine.machine_code] ?? "Unknown",
        })),
      )
    : [];

  const handleSort = (field: SortField) => {
    const direction: SortDirection =
      sortConfig.field === field
        ? sortConfig.direction === "asc" ? "desc"
          : sortConfig.direction === "desc" ? "none"
          : "asc"
        : "asc";
    setSortConfig({ field, direction });
    if (field === "machine_code") fetchMachines(currentPage);
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="h-3 w-3 ml-1" />;
    if (sortConfig.direction === "desc") return <ArrowDown className="h-3 w-3 ml-1" />;
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  };

  const sortedMachines = [...allMachines].sort((a, b) => {
    if (sortConfig.direction === "none" || sortConfig.field === "machine_code") return 0;
    const { field, direction } = sortConfig;
    const mult = direction === "asc" ? 1 : -1;
    if (field === "lastActive") {
      return mult * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    if (field === "forecast") {
      const aF = machineForecastMap[a.machine_code]?.daysRemaining ?? Infinity;
      const bF = machineForecastMap[b.machine_code]?.daysRemaining ?? Infinity;
      return mult * (aF - bF);
    }
    const aVal = String((a as Record<string, unknown>)[field] ?? "").toLowerCase();
    const bVal = String((b as Record<string, unknown>)[field] ?? "").toLowerCase();
    return mult * aVal.localeCompare(bVal);
  });

  // ── Forecast enrichment ──────────────────────────────────────────────────
  const visibleCodesKey = sortedMachines.map((m) => m.machine_code).join(",");
  useEffect(() => {
    const visibleCodes = sortedMachines.map((m) => m.machine_code);
    if (visibleCodes.length === 0 || Object.keys(machineForecastMap).length === 0) return;
    const needsEnrichment = visibleCodes.some(
      (code) => machineForecastMap[code] && !machineForecastMap[code].enriched,
    );
    if (!needsEnrichment) return;
    const codesToEnrich = visibleCodes.filter(
      (code) => machineForecastMap[code] && !machineForecastMap[code].enriched,
    );
    let cancelled = false;
    setForecastEnriching(new Set(codesToEnrich));
    enrichForecastMap(
      visibleCodes,
      machineForecastMap,
      machineStockMap,
      brandQuantities,
      (updates) => {
        if (!cancelled) {
          setMachineForecastMap((prev) => ({ ...prev, ...updates }));
          setForecastEnriching((prev) => {
            const next = new Set(prev);
            for (const code of Object.keys(updates)) next.delete(code);
            return next;
          });
        }
      },
      "finance",
    ).finally(() => {
      if (!cancelled) setForecastEnriching(new Set());
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCodesKey]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const activeFilterCount = [statusFilter, stockFilter, debouncedSearch].filter(Boolean).length;

  const handleClearAll = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setStockFilter(null);
  };

  const handleVisit = (machine: EnrichedMachine) =>
    navigate(`/finance/machine-details/${machine.machine_code}`, { state: { machine } });

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4">

        {/* ── Search + Filters ── */}
        <div className="mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Machine ID or Name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 rounded-xl border-gray-200 bg-white shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <SlidersHorizontal className="h-4 w-4 text-teal-600" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-600 text-white text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex flex-wrap gap-y-3 gap-x-6">
              {/* Category */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                  Category
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (cat.id === "CleaningProducts") {
                          setIsShowCleaningProducts(true);
                          setActiveCategory(subCategories[0].id);
                        } else {
                          setIsShowCleaningProducts(false);
                          setActiveCategory(cat.id);
                        }
                      }}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 cursor-pointer",
                        activeCategory === cat.id || (cat.id === "CleaningProducts" && isShowCleaningProducts)
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700",
                      ].join(" ")}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {isShowCleaningProducts && (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                    Type
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveCategory(sub.id)}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 cursor-pointer",
                          activeCategory === sub.id
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700",
                        ].join(" ")}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 w-full" />

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                  Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((f) => (
                    <FilterPill
                      key={String(f.value)}
                      value={f.value}
                      active={statusFilter === f.value}
                      onClick={(v) => setStatusFilter(v)}
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${f.dot}`} />
                      {f.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                  Stock
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STOCK_FILTERS.map((f) => (
                    <FilterPill
                      key={String(f.value)}
                      value={f.value}
                      active={stockFilter === f.value}
                      onClick={(v) => setStockFilter(v)}
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </FilterPill>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2">
              <span className="text-xs text-teal-700 font-medium shrink-0">Active:</span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  🔍 "{debouncedSearch}"
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.dot}`} />
                  {statusFilter}
                  <button onClick={() => setStatusFilter(null)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {stockFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  {STOCK_FILTERS.find((f) => f.value === stockFilter)?.icon} {stockFilter}
                  <button onClick={() => setStockFilter(null)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <span className="ml-auto text-xs text-teal-600">
                Page {currentPage} of {serverTotalPages}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 px-1">
              Page {currentPage} of {serverTotalPages}
            </p>
          )}
        </div>

        {/* ── Table / Cards ── */}
        <Card className="overflow-hidden rounded-2xl shadow-md border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <h3 className="font-semibold text-lg text-teal-700">
              {categories.find((c) => c.id === activeCategory)?.label ||
                subCategories.find((s) => s.id === activeCategory)?.label ||
                "Machines"}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <p className="text-center py-6 text-gray-400">Loading machines…</p>
            ) : sortedMachines.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-gray-500 font-medium">No machines match the selected filters.</p>
                <button onClick={handleClearAll} className="text-sm text-teal-600 hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {/* Mobile: card view */}
                <div className="sm:hidden space-y-3">
                  {sortedMachines.map((machine) => (
                    <MobileMachineCard
                      key={machine.id}
                      machine={machine}
                      forecastEnriching={forecastEnriching}
                      machineForecastMap={machineForecastMap}
                      onVisit={handleVisit}
                    />
                  ))}
                </div>

                {/* Tablet / Desktop: table view */}
                <div className="hidden sm:block overflow-x-auto rounded-t-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-teal-600 text-white">
                      <tr>
                        {TABLE_COLUMNS.map((col) => (
                          <th key={col.label} className="px-4 py-2 text-center whitespace-nowrap">
                            <div
                              className={`flex items-center justify-center ${col.sortable ? "cursor-pointer select-none" : ""}`}
                              onClick={() => col.sortable && col.field && handleSort(col.field)}
                            >
                              {col.label}
                              {col.sortable && col.field && getSortIcon(col.field)}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-2 text-center">Visit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {sortedMachines.map((machine) => (
                          <motion.tr
                            key={machine.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="hover:bg-teal-50 border-b border-gray-200 transition-all"
                          >
                            <td className="px-4 py-3 font-medium whitespace-nowrap">{machine.machine_code}</td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">{machine.machine_name}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                                {machineRowsMap[machine.machine_code]?.length
                                  ? machineRowsMap[machine.machine_code].map((row) => (
                                      <span key={row.row_num} className="inline-flex gap-1 text-xs text-center">
                                        <span className="text-gray-400">R{row.row_num}:</span>
                                        <span className="font-semibold text-gray-800">{row.availableQuantity}</span>
                                      </span>
                                    ))
                                  : <span className="text-gray-400 text-xs">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{machine.machine_type}</td>
                            <td className="px-4 py-3">
                              <Badge className={STOCK_COLORS[machine.stockStatus] ?? "bg-gray-100 text-gray-800"}>
                                {machine.stockStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {forecastEnriching.has(machine.machine_code) ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                              ) : (
                                <StockForecastBadge forecast={machineForecastMap[machine.machine_code]} />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={STATUS_COLORS[machine.status] ?? "bg-gray-100 text-gray-800"}>
                                {machine.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => handleVisit(machine)}
                              >
                                Visit
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {sortedMachines.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
            {/* Row info */}
            <p className="text-xs text-gray-500 tabular-nums">
              {serverTotalItems > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, serverTotalItems)}
                  </span>{" "}
                  of <span className="font-medium text-gray-700">{serverTotalItems}</span> machines
                </>
              ) : (
                `Page ${currentPage} of ${serverTotalPages}`
              )}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* First */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => fetchMachines(1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              {/* Prev */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => fetchMachines(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {/* Windowed page buttons */}
              {getPageWindow(currentPage, serverTotalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="icon"
                    className={`size-8 text-xs ${currentPage === p ? "bg-teal-600 hover:bg-teal-700 border-teal-600" : ""}`}
                    onClick={() => fetchMachines(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                )
              )}

              {/* Next */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => fetchMachines(currentPage + 1)}
                disabled={currentPage === serverTotalPages || loading}
              >
                <ChevronRight className="size-4" />
              </Button>
              {/* Last */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => fetchMachines(serverTotalPages)}
                disabled={currentPage === serverTotalPages || loading}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Machines;
