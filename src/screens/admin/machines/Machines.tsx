import { useState, useEffect } from "react";
import { getRequest } from "@/Apis/Api";
import { timeConverter } from "@/constants/Constant";
import { SiteHeader } from "@/components/admin/site-header";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ApiMachine, MachinesResponse } from "./Types";
import {
  buildForecastMap,
  enrichForecastMap,
  type StockForecast,
} from "@/utils/stockForecast";
import { StockForecastBadge } from "@/components/ui/stock-forecast-badge";

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

// ── Filter config with colors ─────────────────────────────────────────────────
const STATUS_FILTERS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: "online", label: "Online", dot: "bg-green-500" },
  { value: "offline", label: "Offline", dot: "bg-red-500" },
  { value: "idle", label: "Idle", dot: "bg-yellow-500" },
];

const STOCK_FILTERS: { value: StockFilter; label: string; icon: string }[] = [
  { value: "full", label: "Full", icon: "✅" },
  { value: "low", label: "Low Stock", icon: "⚠️" },
];

// ── Reusable filter pill ──────────────────────────────────────────────────────
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

const Machines = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Butterfly");
  const [isShowCleaningProducts, setIsShowCleaningProducts] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [machinesData, setMachinesData] = useState<{
    [category: string]: ApiMachine[];
  } | null>(null);
  const [machineStockMap, setMachineStockMap] = useState<{
    [code: string]: string;
  }>({});
  const [machineForecastMap, setMachineForecastMap] = useState<{
    [code: string]: StockForecast;
  }>({});
  const [brandQuantities, setBrandQuantities] = useState<{
    [brandId: string]: number;
  }>({});
  const [forecastEnriching, setForecastEnriching] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "machine_code",
    direction: "asc",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchMachines(1);
  }, [activeCategory, debouncedSearch, statusFilter, stockFilter]);

  const fetchMachines = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage),
        category: activeCategory,
        ...(sortConfig.field === "machine_code" &&
        sortConfig.direction !== "none"
          ? { sortOrder: sortConfig.direction }
          : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(stockFilter ? { availableQuantity: stockFilter } : {}),
      });

      const res = await getRequest<MachinesResponse>(
        `/admin/getAllMachineStockAndStatus?${params}`,
      );
      const { machines, brands, pagination } = res.data;

      const stockMap: { [code: string]: string } = {};
      const allBrands = [...brands.vending, ...brands.dispensing];
      const grouped: { [machine_code: string]: number[] } = {};

      allBrands.forEach((brand) => {
        if (!grouped[brand.machine_code]) grouped[brand.machine_code] = [];
        grouped[brand.machine_code].push(brand.availableQuantity);
      });

      for (const [code, quantities] of Object.entries(grouped)) {
        const total = quantities.reduce((sum, q) => sum + q, 0);
        if (total === 0) stockMap[code] = "Out of Stock";
        else if (total < 2) stockMap[code] = "Low Stock";
        else stockMap[code] = "In Stock";
      }

      const { forecasts: forecastMap, brandQuantities: bq } = buildForecastMap(
        allBrands,
        stockMap,
      );

      setCurrentPage(page);
      setMachinesData(machines);
      setMachineStockMap(stockMap);
      setMachineForecastMap(forecastMap);
      setBrandQuantities(bq);
      setServerTotalPages(pagination?.totalPages ?? 1);
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setLoading(false);
    }
  };

  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
        machines.map((machine) => ({
          ...machine,
          category,
          status:
            machine.statusCode === "r"
              ? "Inactive"
              : machine.statusCode === "g"
                ? "Active"
                : "Pending",
          lastActive: timeConverter(machine.lastUpdated),
          stockStatus: machineStockMap[machine.machine_code] || "Unknown",
        })),
      )
    : [];

  const handleSort = (field: SortField) => {
    const newConfig = {
      field,
      direction:
        sortConfig.field === field
          ? sortConfig.direction === "asc"
            ? "desc"
            : sortConfig.direction === "desc"
              ? "none"
              : "asc"
          : "asc",
    } satisfies { field: SortField; direction: SortDirection };
    setSortConfig(newConfig);
    if (field === "machine_code") fetchMachines(currentPage);
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="h-3 w-3 ml-1" />;
    if (sortConfig.direction === "desc")
      return <ArrowDown className="h-3 w-3 ml-1" />;
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  };

  const sortedMachines = [...allMachines].sort((a, b) => {
    if (sortConfig.direction === "none" || sortConfig.field === "machine_code")
      return 0;
    const { field, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;
    if (field === "lastActive") {
      return (
        multiplier *
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      );
    }
    if (field === "forecast") {
      const aF = machineForecastMap[a.machine_code]?.daysRemaining ?? Infinity;
      const bF = machineForecastMap[b.machine_code]?.daysRemaining ?? Infinity;
      return multiplier * (aF - bF);
    }
    const aVal = a[field]?.toString().toLowerCase() || "";
    const bVal = b[field]?.toString().toLowerCase() || "";
    return multiplier * aVal.localeCompare(bVal);
  });

  const visibleCodes = sortedMachines.map((m) => m.machine_code);
  useEffect(() => {
    if (
      visibleCodes.length === 0 ||
      Object.keys(machineForecastMap).length === 0
    )
      return;
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
      
      "admin"
    ).finally(() => {
      if (!cancelled) setForecastEnriching(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [visibleCodes.join(",")]);

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getStockStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      "In Stock": "bg-green-100 text-green-800",
      "Low Stock": "bg-yellow-100 text-yellow-800",
      "Out of Stock": "bg-red-100 text-red-800",
      Unknown: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  // ── Derived: active filter count for badge ────────────────────────────────
  const activeFilterCount = [statusFilter, stockFilter, debouncedSearch].filter(
    Boolean,
  ).length;

  const handleClearAll = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setStockFilter(null);
  };

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-4">
        {/* ── Top bar: Search + Filter Panel ── */}
        <div className="mb-4 space-y-3">
          {/* Row 1: Search */}
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

          {/* Row 2: Filter card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 space-y-3">
            {/* Filter card header */}
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

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Filter rows */}
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
                        activeCategory === cat.id ||
                        (cat.id === "CleaningProducts" &&
                          isShowCleaningProducts)
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700",
                      ].join(" ")}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-category (shown only when Cleaning Products is active) */}
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

              {/* Divider between category and other filters */}
              <div className="border-t border-gray-100 w-full" />

              {/* Machine Status */}
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
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${f.dot}`}
                      />
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

          {/* ── Active filter chips bar ── */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2">
              <span className="text-xs text-teal-700 font-medium shrink-0">
                Active:
              </span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  🔍 "{debouncedSearch}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.dot}`}
                  />
                  {statusFilter}
                  <button
                    onClick={() => setStatusFilter(null)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {stockFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-1 text-xs text-teal-800 font-medium shadow-sm">
                  {STOCK_FILTERS.find((f) => f.value === stockFilter)?.icon}{" "}
                  {stockFilter}
                  <button
                    onClick={() => setStockFilter(null)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <span className="ml-auto text-xs text-teal-600">
                Page {currentPage} of {serverTotalPages}
              </span>
            </div>
          )}

          {/* No filters active — just show page info */}
          {activeFilterCount === 0 && (
            <p className="text-xs text-gray-400 px-1">
              Page {currentPage} of {serverTotalPages}
            </p>
          )}
        </div>

        {/* ── Table ── */}
        <Card className="overflow-hidden rounded-2xl shadow-md border-teal-200">
          <CardHeader>
            <h3 className="font-semibold text-lg text-teal-700">
              {categories.find((c) => c.id === activeCategory)?.label ||
                subCategories.find((s) => s.id === activeCategory)?.label ||
                "Machines"}
            </h3>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-6 text-gray-400">
                Loading machines…
              </p>
            ) : sortedMachines.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-gray-500 font-medium">
                  No machines match the selected filters.
                </p>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-teal-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <table className="min-w-full text-sm overflow-hidden rounded-xl border border-gray-200">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    {(
                      [
                        {
                          field: "machine_code",
                          label: "Machine ID",
                          sortable: true,
                        },
                        { label: "Name" },
                        { label: "Type" },
                        { label: "Category" },
                        { label: "Last Active" },
                        { label: "Stock" },
                        { label: "Forecast" },
                        { label: "Status" },
                      ] as {
                        field: SortField;
                        label: string;
                        sortable: boolean;
                      }[]
                    ).map(({ field, label, sortable }) => (
                      <th key={field} className="px-4 py-2 text-center">
                        <div
                          className={`flex items-center justify-center ${sortable ? "cursor-pointer select-none" : ""}`}
                          onClick={() => sortable && field && handleSort(field)}
                        >
                          {label}
                          {sortable && field && getSortIcon(field)}
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
                        <td className="px-4 py-3 font-medium">
                          {machine.machine_code}
                        </td>
                        <td className="px-4 py-3">{machine.machine_name}</td>
                        <td className="px-4 py-3">{machine.machine_type}</td>
                        <td className="px-4 py-3">{machine.category}</td>
                        <td className="px-4 py-3">{machine.lastActive}</td>
                        <td className="px-4 py-3">
                          {getStockStatusBadge(machine.stockStatus)}
                        </td>
                        <td className="px-4 py-3">
                          {forecastEnriching.has(machine.machine_code) ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                          ) : (
                            <StockForecastBadge
                              forecast={
                                machineForecastMap[machine.machine_code]
                              }
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(machine.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() =>
                              navigate(
                                `/admin/machine-details/${machine.machine_code}`,
                                { state: { machine } },
                              )
                            }
                          >
                            Visit
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {serverTotalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMachines(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: serverTotalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => fetchMachines(page)}
                  className={
                    currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""
                  }
                >
                  {page}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMachines(currentPage + 1)}
              disabled={currentPage === serverTotalPages || loading}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Machines;
