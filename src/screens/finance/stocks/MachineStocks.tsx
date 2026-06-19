import { useEffect, useState } from "react";
import { getRequest } from "@/Apis/Api";
import api from "@/Apis/Authorization";
import { SiteHeader } from "@/components/finance/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Boxes,
  X,
  Download,
  Loader2,
  MapPin,
  Clock,
  PackageOpen,
  Layers,
} from "lucide-react";
import { formatUnixTimestamp } from "@/utils/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MachineStock {
  machine_code: string;
  type: string;
  location: string;
  status: string;
  last_refill: number;
  total_dispensed: number;
  row1: number;
  row1_name: string;
  row2: number;
  row2_name: string;
  row3: number;
  row3_name: string;
  row4: number;
  row4_name: string;
}

interface MachineStocksResponse {
  success: boolean;
  data: MachineStock[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    dispensing_machines: number;
    dispensing_total_stock: number;
    dispensing_total_dispensed: number;
    sanitary_machines: number;
    sanitary_total_stock: number;
    sanitary_total_dispensed: number;
    total_machines: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const TYPE_FILTERS = [
  { value: "sanitary",   label: "Sanitary"   },
  { value: "dispensing", label: "Dispensing" },
];

const TYPE_COLORS: Record<string, string> = {
  sanitary:   "bg-blue-100 text-blue-700 border-blue-200",
  dispensing: "bg-teal-100 text-teal-700 border-teal-200",
};

function getPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RowStockChip = ({ qty, name }: { qty: number; name?: string }) => {
  if (!name) return null;
  const isEmpty = qty === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
        isEmpty
          ? "bg-red-50 text-red-600 border-red-200"
          : qty <= 5
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      <span className="truncate max-w-[80px]">{name}</span>
      <span className="font-bold">{qty}</span>
    </span>
  );
};

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  sub,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  sub?: { label: string; value: number }[];
}) => (
  <Card className="overflow-hidden gap-0 py-0">
    <div className={`${bgClass} px-4 py-3 flex items-center justify-between`}>
      <span className="text-sm font-semibold text-white">{title}</span>
      <Icon className="h-5 w-5 text-white/70" />
    </div>
    <CardContent className="px-4 py-3">
      <p className={`text-3xl font-bold ${iconClass}`}>{value.toLocaleString()}</p>
      {sub && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {sub.map((s) => (
            <span key={s.label} className="text-xs text-muted-foreground">
              {s.label}:{" "}
              <span className="font-semibold text-foreground">{s.value.toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MachineStocks = () => {
  const [pageSize, setPageSize]   = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState("");

  const [stocks, setStocks]     = useState<MachineStock[]>([]);
  const [summary, setSummary]   = useState<MachineStocksResponse["summary"] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStocks = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        ...(selectedTypes.length === 1 ? { type: selectedTypes[0] } : {}),
        ...(selectedCodes.length > 0 ? { machine_codes: selectedCodes.join(",") } : {}),
      });
      const res = await getRequest<MachineStocksResponse>(`/finance/getMachineStocks?${params}`);
      setCurrentPage(page);
      setStocks(res.data || []);
      setSummary(res.summary ?? null);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotalItems(res.pagination?.total ?? 0);
    } catch (error) {
      console.error("Error fetching machine stocks:", error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStocks(1); }, [selectedTypes, selectedCodes, pageSize]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        ...(selectedTypes.length === 1 ? { type: selectedTypes[0] } : {}),
        ...(selectedCodes.length > 0 ? { machine_codes: selectedCodes.join(",") } : {}),
      });
      const res = await api.get(`/finance/exportMachineStocks?${params}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `machine-stocks-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedCodes([]);
    setCodeInput("");
  };

  const addCode = (raw: string) => {
    const codes = raw.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
    setSelectedCodes((prev) => [...new Set([...prev, ...codes])]);
    setCodeInput("");
    setCurrentPage(1);
  };

  const removeCode = (code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
    setCurrentPage(1);
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  const totalStock =
    (summary?.sanitary_total_stock ?? 0) + (summary?.dispensing_total_stock ?? 0);
  const totalDispensed =
    (summary?.sanitary_total_dispensed ?? 0) + (summary?.dispensing_total_dispensed ?? 0);

  return (
    <div>
      <SiteHeader title="Machine Stocks" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">

        {/* ── Summary cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Machines"
            value={summary?.total_machines ?? 0}
            icon={Boxes}
            iconClass="text-gray-800"
            bgClass="bg-gray-700"
          />
          <SummaryCard
            title="Sanitary Machines"
            value={summary?.sanitary_machines ?? 0}
            icon={Layers}
            iconClass="text-blue-600"
            bgClass="bg-blue-500"
            sub={[
              { label: "Stock",     value: summary?.sanitary_total_stock ?? 0 },
              { label: "Dispensed", value: summary?.sanitary_total_dispensed ?? 0 },
            ]}
          />
          <SummaryCard
            title="Dispensing Machines"
            value={summary?.dispensing_machines ?? 0}
            icon={PackageOpen}
            iconClass="text-teal-600"
            bgClass="bg-teal-500"
            sub={[
              { label: "Stock",     value: summary?.dispensing_total_stock ?? 0 },
              { label: "Dispensed", value: summary?.dispensing_total_dispensed ?? 0 },
            ]}
          />
          <SummaryCard
            title="Total Remaining Stock"
            value={totalStock}
            icon={Boxes}
            iconClass="text-violet-600"
            bgClass="bg-violet-500"
            sub={[
              { label: "Dispensed", value: totalDispensed },
            ]}
          />
        </div>

        {/* ── Filters ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type pills — multi-select */}
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((f) => {
                  const active = selectedTypes.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => toggleType(f.value)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150 cursor-pointer select-none",
                        active
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700",
                      ].join(" ")}
                    >
                      {f.label}
                      {active && <X className="h-3 w-3 opacity-70" />}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-6 bg-border hidden sm:block" />

              {/* Machine code tag-input */}
              <div className="flex flex-1 flex-col gap-2 min-w-[240px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type code and press Enter…"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && codeInput.trim()) {
                        e.preventDefault();
                        addCode(codeInput);
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (text.includes(",") || text.includes(" ")) {
                        e.preventDefault();
                        addCode(text);
                      }
                    }}
                    className="pl-9 pr-9 h-9"
                  />
                  {codeInput && (
                    <button
                      onClick={() => setCodeInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {selectedCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-0.5 text-xs font-medium"
                      >
                        #{code}
                        <button onClick={() => removeCode(code)} className="hover:text-teal-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(selectedTypes.length > 0 || selectedCodes.length > 0) && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 border-b">
            <div>
              <CardTitle className="text-base">Machine Stock Levels</CardTitle>
              {totalItems > 0 && !loading && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalItems.toLocaleString()} machines found
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleExport}
                disabled={exporting || loading || stocks.length === 0}
                className="bg-teal-600 hover:bg-teal-700 gap-1.5"
                size="sm"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Exporting…" : "Export Excel"}
              </Button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">Rows</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                <span className="text-sm">Loading machine stocks…</span>
              </div>
            ) : stocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Boxes className="h-10 w-10 opacity-30" />
                <p className="font-medium">No machines match the selected filters.</p>
                {(selectedTypes.length > 0 || selectedCodes.length > 0) && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-teal-600 text-white">
                      <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">Machine</th>
                      <th className="px-4 py-2.5 text-center font-medium whitespace-nowrap">Type</th>
                      <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">Location</th>
                      <th className="px-4 py-2.5 text-center font-medium whitespace-nowrap">Last Refill</th>
                      <th className="px-4 py-2.5 text-center font-medium whitespace-nowrap">Dispensed</th>
                      <th className="px-4 py-2.5 text-center font-medium whitespace-nowrap">Row Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stocks.map((m, idx) => (
                      <tr
                        key={m.machine_code}
                        className={`transition-colors hover:bg-teal-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-3 font-semibold text-teal-700 whitespace-nowrap">
                          #{m.machine_code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`capitalize border ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {m.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                            <span className="truncate">{m.location || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {m.last_refill ? formatUnixTimestamp(m.last_refill) : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="font-medium">{m.total_dispensed.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <RowStockChip qty={m.row1} name={m.row1_name} />
                            <RowStockChip qty={m.row2} name={m.row2_name} />
                            <RowStockChip qty={m.row3} name={m.row3_name} />
                            <RowStockChip qty={m.row4} name={m.row4_name} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {stocks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted-foreground tabular-nums">
              {totalItems > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{totalItems}</span> machines
                </>
              ) : (
                `Page ${currentPage} of ${totalPages}`
              )}
            </p>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8"
                onClick={() => fetchStocks(1)} disabled={currentPage === 1 || loading}>
                <ChevronsLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8"
                onClick={() => fetchStocks(currentPage - 1)} disabled={currentPage === 1 || loading}>
                <ChevronLeft className="size-4" />
              </Button>

              {getPageWindow(currentPage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="icon"
                    className={`size-8 text-xs ${currentPage === p ? "bg-teal-600 hover:bg-teal-700 border-teal-600" : ""}`}
                    onClick={() => fetchStocks(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button variant="outline" size="icon" className="size-8"
                onClick={() => fetchStocks(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8"
                onClick={() => fetchStocks(totalPages)} disabled={currentPage === totalPages || loading}>
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MachineStocks;
