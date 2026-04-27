import React, { useState, useEffect, useCallback } from 'react';
import { getRequest } from '@/Apis/Api';
import {
  Users,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Wallet,
  TrendingUp,
  Activity,
  Info,
  Package,
  Banknote,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppUserRow {
  mobile_number: string;
  user_id: number;
  full_name: string;
  total_topup_amount: string;
  topup_count: number;
  butterfly_amount: string;
  butterfly_txn_count: number;
  butterfly_quantity: number;
  user_txn_amount: string;
  user_txn_count: number;
  oil_quantity: number;
  total_transaction_amount: string;
  remaining_balance: string;
  transaction_status: 'Active' | 'No Transactions';
  brand_breakdown: BrandBreak[];
}

interface BrandBreak {
  brand_id: number;
  brand_name: string;
  brand_amount: string;
  brand_txn_count: number;
  brand_quantity: number;
}

interface BrandSummaryItem {
  brand_id: number;
  brand_name: string;
  total_amount: string;
  total_quantity: number;
  total_txn_count: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
}

interface Summary {
  totalUsers: number;
  totalTopupAmount: string;
  totalTransactionAmount: string;
  activeUsers: number;
  inactiveUsers: number;
  totalButterflyAmount: string;
  totalOilAmount: string;
  totalButterflyQuantity: number;
  totalOilQuantity: number;
  totalRemainingBalance: string;
}

interface ApiResponse {
  data: AppUserRow[];
  pagination: Pagination;
  summary: Summary;
  brandSummary: BrandSummaryItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (value: string | number) =>
  Number(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (value: number) => value.toLocaleString('en-PK');

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const BRAND_PALETTE = [
  { bg: 'bg-teal-50',    border: 'border-teal-200',    name: 'text-teal-900',    val: 'text-teal-700',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600'    },
  { bg: 'bg-purple-50',  border: 'border-purple-200',  name: 'text-purple-900',  val: 'text-purple-700',  iconBg: 'bg-purple-100',  iconText: 'text-purple-600'  },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   name: 'text-amber-900',   val: 'text-amber-700',   iconBg: 'bg-amber-100',   iconText: 'text-amber-600'   },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    name: 'text-blue-900',    val: 'text-blue-700',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600'    },
  { bg: 'bg-rose-50',    border: 'border-rose-200',    name: 'text-rose-900',    val: 'text-rose-700',    iconBg: 'bg-rose-100',    iconText: 'text-rose-600'    },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', name: 'text-emerald-900', val: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
];

// ─── Component ───────────────────────────────────────────────────────────────

const UserWalletActivity: React.FC = () => {
  const [data, setData]               = useState<AppUserRow[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 15 });
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [exporting, setExporting]     = useState(false);

  const [startDate, setStartDate]     = useState(thirtyDaysAgo());
  const [endDate, setEndDate]         = useState(today());
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(15);

  const [sortKey, setSortKey]   = useState<keyof AppUserRow>('total_topup_amount');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [brandSummary, setBrandSummary] = useState<BrandSummaryItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate, endDate,
        page: String(page), limit: String(pageSize),
        ...(search ? { search } : {}),
      });
      const res = await getRequest<ApiResponse>(`/finance/getAppUserCollection?${params}`);
      setData(res.data ?? []);
      setPagination(res.pagination);
      setSummary(res.summary);
      setBrandSummary(res.brandSummary ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, pageSize, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = [...data].sort((a, b) => {
    const av = Number(a[sortKey]) || String(a[sortKey]);
    const bv = Number(b[sortKey]) || String(b[sortKey]);
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: keyof AppUserRow) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: keyof AppUserRow) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const total = pagination.totalUsers || 1;
      const params = new URLSearchParams({
        startDate, endDate, page: '1', limit: String(total),
        ...(search ? { search } : {}),
      });
      const res = await getRequest<ApiResponse>(`/finance/getAppUserCollection?${params}`);
      const allRows = res.data ?? [];
      const headers = [
        'Mobile Number', 'User ID', 'Full Name',
        'Total Top-up (Rs)', 'Top-up Count',
        'Butterfly Units', 'Butterfly Revenue (Rs)', 'Butterfly Txn Count',
        'Oil Units', 'Oil Revenue (Rs)', 'Oil Txn Count',
        'Total Spent (Rs)', 'Remaining Balance (Rs)', 'Status',
      ];
      const rows = allRows.map((r) => [
        r.mobile_number, r.user_id, `"${r.full_name}"`,
        r.total_topup_amount, r.topup_count,
        r.butterfly_quantity, r.butterfly_amount, r.butterfly_txn_count,
        r.oil_quantity, r.user_txn_amount, r.user_txn_count,
        r.total_transaction_amount, r.remaining_balance, r.transaction_status,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-wallet-activity-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent — user can retry */ }
    finally { setExporting(false); }
  };

  // Product share of total sales
  const totalSales = summary
    ? Number(summary.totalButterflyAmount) + Number(summary.totalOilAmount)
    : 0;
  const butterflyShare = totalSales > 0
    ? (Number(summary?.totalButterflyAmount || 0) / totalSales) * 100
    : 0;
  const oilShare = totalSales > 0
    ? (Number(summary?.totalOilAmount || 0) / totalSales) * 100
    : 0;
  const conversionRate = summary && summary.totalUsers > 0
    ? ((summary.activeUsers / summary.totalUsers) * 100).toFixed(1)
    : '0';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50/20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-xl shadow-md shadow-teal-200">
              <Activity className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Wallet Activity</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Sales Breakdown —{' '}
                <span className="font-semibold text-teal-700">Kia Bika · Kitna Bika · Kitnay Ka Bika</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 transition-all font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!data.length || exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 shadow-sm shadow-teal-200 disabled:opacity-50 transition-all font-medium"
            >
              {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? `Exporting ${pagination.totalUsers}…` : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* ── Summary Section ── */}
        {summary && (
          <div className="space-y-4">
            {/* Row 1: Key metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                icon={<Users size={17} />}
                label="Total Users"
                value={fmtInt(summary.totalUsers)}
                sub={`${startDate} — ${endDate}`}
                accent="teal"
              />
              <MetricCard
                icon={<Wallet size={17} />}
                label="Total Wallet Loaded"
                value={`Rs ${fmt(summary.totalTopupAmount)}`}
                sub="Loaded into wallets"
                accent="blue"
              />
              <MetricCard
                icon={<CheckCircle size={17} />}
                label="Active Users"
                value={fmtInt(summary.activeUsers)}
                sub={`${conversionRate}% conversion rate`}
                accent="green"
              />
              <MetricCard
                icon={<XCircle size={17} />}
                label="No Transactions"
                value={fmtInt(summary.inactiveUsers)}
                sub={`${(100 - parseFloat(conversionRate)).toFixed(1)}% of total users`}
                accent="red"
              />
              <MetricCard
                icon={<Banknote size={17} />}
                label="Total Remaining Balance"
                value={`Rs ${fmt(summary.totalRemainingBalance)}`}
                sub="Unspent wallet funds"
                accent="indigo"
              />
            </div>

            {/* Row 2: Product breakdown (Kia Bika) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProductCard
                emoji="🦋"
                name="Butterfly Products"
                quantity={summary.totalButterflyQuantity}
                amount={summary.totalButterflyAmount}
                share={butterflyShare}
                accent="purple"
              />
              <ProductCard
                emoji="⛽"
                name="Oil / Refill Stations"
                quantity={summary.totalOilQuantity}
                amount={summary.totalOilAmount}
                share={oilShare}
                accent="amber"
              />
            </div>

            {/* Row 3: Per-brand totals */}
            {brandSummary.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Package size={12} /> Product Brand Totals
                </p>
                <div className="flex flex-wrap gap-3">
                  {brandSummary.map((brand, i) => {
                    const c = BRAND_PALETTE[i % BRAND_PALETTE.length];
                    return (
                      <div key={brand.brand_id} className={`flex items-center gap-3 ${c.bg} ${c.border} border rounded-xl px-4 py-3`}>
                        <div className={`p-2 ${c.iconBg} rounded-lg`}>
                          <Package size={14} className={c.iconText} />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${c.name}`}>{brand.brand_name}</p>
                          <p className={`text-xs ${c.val} mt-0.5`}>{fmtInt(brand.total_quantity)} units · Rs {fmt(brand.total_amount)}</p>
                          <p className="text-xs text-gray-400">{fmtInt(brand.total_txn_count)} transactions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar size={11} /> From
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Calendar size={11} /> To
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today()}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Search size={11} /> Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Mobile number or name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm w-full bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >×</button>
                )}
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition-colors shadow-sm font-medium"
            >
              Apply
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-red-700 font-semibold text-sm">Error loading data</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-teal-600" />
              <span className="font-bold text-gray-800">Per-User Sales Breakdown</span>
              {!loading && (
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold">
                  {pagination.totalUsers.toLocaleString()} users
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Info size={11} /> Kia Bika · Kitna Bika · Kitnay Ka Bika
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-300" /> No Transactions
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                {/* Row 1 — main group headers */}
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-10 align-bottom">
                    #
                  </th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px] align-bottom">
                    User
                  </th>
                  <th
                    rowSpan={2}
                    onClick={() => toggleSort('total_topup_amount')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors align-bottom whitespace-nowrap"
                  >
                    Wallet (Top-up){sortIcon('total_topup_amount')}
                  </th>
                  {/* Butterfly group */}
                  <th colSpan={2} className="px-4 py-2.5 text-center text-xs font-bold text-purple-700 bg-purple-50 border-b border-purple-100 whitespace-nowrap">
                    🦋 Butterfly Products
                  </th>
                  {/* Oil group */}
                  <th colSpan={2} className="px-4 py-2.5 text-center text-xs font-bold text-amber-700 bg-amber-50 border-b border-amber-100 whitespace-nowrap">
                    ⛽ Oil / Refill
                  </th>
                  <th
                    rowSpan={2}
                    onClick={() => toggleSort('total_transaction_amount')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors align-bottom whitespace-nowrap"
                  >
                    Total Spent{sortIcon('total_transaction_amount')}
                  </th>
                  <th
                    rowSpan={2}
                    onClick={() => toggleSort('remaining_balance')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors align-bottom whitespace-nowrap"
                  >
                    Balance{sortIcon('remaining_balance')}
                  </th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider align-bottom">
                    Status
                  </th>
                </tr>
                {/* Row 2 — product sub-headers (Kitna Bika / Kitnay Ka Bika) */}
                <tr className="border-b border-gray-200">
                  <th
                    onClick={() => toggleSort('butterfly_quantity')}
                    className="px-4 py-2 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider cursor-pointer select-none bg-purple-50 hover:bg-purple-100 transition-colors whitespace-nowrap"
                  >
                    Units (Kitna){sortIcon('butterfly_quantity')}
                  </th>
                  <th
                    onClick={() => toggleSort('butterfly_amount')}
                    className="px-4 py-2 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider cursor-pointer select-none bg-purple-50 hover:bg-purple-100 transition-colors whitespace-nowrap"
                  >
                    Revenue Rs{sortIcon('butterfly_amount')}
                  </th>
                  <th
                    onClick={() => toggleSort('oil_quantity')}
                    className="px-4 py-2 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider cursor-pointer select-none bg-amber-50 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    Units (Kitna){sortIcon('oil_quantity')}
                  </th>
                  <th
                    onClick={() => toggleSort('user_txn_amount')}
                    className="px-4 py-2 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider cursor-pointer select-none bg-amber-50 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    Revenue Rs{sortIcon('user_txn_amount')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded-lg w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Package size={44} className="opacity-25" />
                        <p className="font-semibold text-gray-500 text-base">No users found</p>
                        <p className="text-sm">Try adjusting the date range or search term</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((row, idx) => {
                    const isInactive = row.transaction_status === 'No Transactions';
                    const balance = Number(row.remaining_balance);
                    const balanceColor =
                      balance < 0 ? 'text-red-600 font-bold' :
                      balance === 0 ? 'text-gray-400' :
                      'text-emerald-600 font-semibold';
                    const isExpanded = expandedRows.has(row.mobile_number);

                    return (
                      <React.Fragment key={`${row.mobile_number}-${idx}`}>
                      <tr
                        className={`hover:bg-gray-50/70 transition-colors ${isInactive ? 'bg-red-50/25' : ''}`}
                      >
                        {/* # */}
                        <td className="px-4 py-3.5 text-gray-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleRow(row.mobile_number)}
                              className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-300 hover:text-teal-600"
                              title="Show brand breakdown"
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                            {(pagination.currentPage - 1) * pagination.limit + idx + 1}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-gray-900 text-xs font-semibold tracking-wide">
                            {row.mobile_number}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[150px]" title={row.full_name}>
                            {row.full_name || <span className="italic text-gray-300">—</span>}
                          </p>
                        </td>

                        {/* Wallet */}
                        <td className="px-4 py-3.5 text-right">
                          <p className="font-bold text-gray-900">Rs {fmt(row.total_topup_amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {row.topup_count} top-up{row.topup_count !== 1 ? 's' : ''}
                          </p>
                        </td>

                        {/* Butterfly — units */}
                        <td className="px-4 py-3.5 text-right bg-purple-50/30">
                          {row.butterfly_quantity > 0 ? (
                            <>
                              <p className="font-bold text-purple-800">{fmtInt(row.butterfly_quantity)}</p>
                              <p className="text-xs text-purple-400">{row.butterfly_txn_count} txns</p>
                            </>
                          ) : (
                            <span className="text-gray-200 font-medium">—</span>
                          )}
                        </td>

                        {/* Butterfly — revenue */}
                        <td className="px-4 py-3.5 text-right bg-purple-50/30">
                          {Number(row.butterfly_amount) > 0 ? (
                            <span className="font-semibold text-purple-700">Rs {fmt(row.butterfly_amount)}</span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>

                        {/* Oil — units */}
                        <td className="px-4 py-3.5 text-right bg-amber-50/30">
                          {row.oil_quantity > 0 ? (
                            <>
                              <p className="font-bold text-amber-800">{fmtInt(row.oil_quantity)}</p>
                              <p className="text-xs text-amber-400">{row.user_txn_count} txns</p>
                            </>
                          ) : (
                            <span className="text-gray-200 font-medium">—</span>
                          )}
                        </td>

                        {/* Oil — revenue */}
                        <td className="px-4 py-3.5 text-right bg-amber-50/30">
                          {Number(row.user_txn_amount) > 0 ? (
                            <span className="font-semibold text-amber-700">Rs {fmt(row.user_txn_amount)}</span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>

                        {/* Total Spent */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-gray-900">Rs {fmt(row.total_transaction_amount)}</span>
                        </td>

                        {/* Balance */}
                        <td className={`px-4 py-3.5 text-right whitespace-nowrap ${balanceColor}`}>
                          Rs {fmt(row.remaining_balance)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 whitespace-nowrap">
                              <XCircle size={10} /> No Txns
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle size={10} /> Active
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-teal-50/30">
                          <td colSpan={10} className="px-4 py-3 border-b border-teal-100">
                            <div className="pl-8">
                              {row.brand_breakdown.length > 0 ? (
                                <>
                                  <p className="text-xs font-semibold text-teal-700 mb-2.5 flex items-center gap-1.5">
                                    <Package size={11} /> Product Brand Breakdown
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {row.brand_breakdown.map((brand, bi) => {
                                      const c = BRAND_PALETTE[bi % BRAND_PALETTE.length];
                                      return (
                                        <div key={brand.brand_id} className={`${c.bg} ${c.border} border rounded-lg px-3 py-2.5 min-w-[130px]`}>
                                          <p className={`text-xs font-bold ${c.name} truncate`}>{brand.brand_name}</p>
                                          <p className={`text-sm font-bold ${c.val} mt-1`}>
                                            {fmtInt(brand.brand_quantity)} <span className="text-xs font-normal">units</span>
                                          </p>
                                          <p className={`text-xs ${c.val} font-semibold`}>Rs {fmt(brand.brand_amount)}</p>
                                          <p className="text-xs text-gray-400 mt-0.5">{brand.brand_txn_count} txn{brand.brand_txn_count !== 1 ? 's' : ''}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No brand data available</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{pagination.currentPage}</span> of {pagination.totalPages} ·{' '}
                <span className="font-semibold text-gray-700">{pagination.totalUsers.toLocaleString()}</span> total users
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.currentPage === 1 || loading}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  let p: number;
                  const total = pagination.totalPages;
                  const cur = pagination.currentPage;
                  if (total <= 7) p = i + 1;
                  else if (cur <= 4) p = i < 6 ? i + 1 : total;
                  else if (cur >= total - 3) p = i === 0 ? 1 : total - 6 + i;
                  else { const map = [1, cur - 2, cur - 1, cur, cur + 1, cur + 2, total]; p = map[i]; }
                  const isEllipsis = total > 7 && ((i === 1 && p !== 2) || (i === 5 && p !== total - 1));
                  return isEllipsis ? (
                    <span key={i} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(p)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        p === pagination.currentPage
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: 'teal' | 'blue' | 'green' | 'red' | 'indigo';
}> = ({ icon, label, value, sub, accent }) => {
  const C = {
    teal:   { wrap: 'from-teal-50 to-teal-100/40 border-teal-100',     iconBg: 'bg-teal-600',    text: 'text-teal-900',    sub: 'text-teal-600'   },
    blue:   { wrap: 'from-blue-50 to-blue-100/40 border-blue-100',     iconBg: 'bg-blue-600',    text: 'text-blue-900',    sub: 'text-blue-500'   },
    green:  { wrap: 'from-emerald-50 to-emerald-100/40 border-emerald-100', iconBg: 'bg-emerald-500', text: 'text-emerald-900', sub: 'text-emerald-600' },
    red:    { wrap: 'from-red-50 to-red-100/40 border-red-100',        iconBg: 'bg-red-500',     text: 'text-red-900',     sub: 'text-red-500'    },
    indigo: { wrap: 'from-indigo-50 to-indigo-100/40 border-indigo-100', iconBg: 'bg-indigo-600', text: 'text-indigo-900',  sub: 'text-indigo-600' },
  }[accent];
  return (
    <div className={`bg-gradient-to-br ${C.wrap} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`p-1.5 ${C.iconBg} rounded-lg text-white`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${C.text} tracking-tight`}>{value}</p>
      <p className={`text-xs mt-1.5 ${C.sub} font-medium`}>{sub}</p>
    </div>
  );
};

const ProductCard: React.FC<{
  emoji: string;
  name: string;
  quantity: number;
  amount: string;
  share: number;
  accent: 'purple' | 'amber';
}> = ({ emoji, name, quantity, amount, share, accent }) => {
  const C = {
    purple: {
      wrap: 'from-purple-50 to-purple-100/30 border-purple-100',
      qtyBg: 'bg-purple-100 border-purple-200',    qtyText: 'text-purple-900',
      amtBg: 'bg-white border-purple-100',          amtText: 'text-purple-900',
      bar: 'bg-purple-100', fill: 'bg-purple-500',
      label: 'text-purple-600', tag: 'bg-purple-100 text-purple-700',
    },
    amber: {
      wrap: 'from-amber-50 to-amber-100/30 border-amber-100',
      qtyBg: 'bg-amber-100 border-amber-200',      qtyText: 'text-amber-900',
      amtBg: 'bg-white border-amber-100',           amtText: 'text-amber-900',
      bar: 'bg-amber-100', fill: 'bg-amber-500',
      label: 'text-amber-600', tag: 'bg-amber-100 text-amber-700',
    },
  }[accent];

  return (
    <div className={`bg-gradient-to-br ${C.wrap} border rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{name}</p>
            <p className={`text-xs ${C.label} font-semibold mt-0.5`}>Kia Bika: {name}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${C.tag}`}>
          {share.toFixed(1)}% share
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`border ${C.qtyBg} rounded-xl p-3.5`}>
          <p className={`text-xs font-semibold ${C.label} mb-1.5`}>Kitna Bika</p>
          <p className={`text-2xl font-bold ${C.qtyText} leading-none`}>
            {quantity.toLocaleString('en-PK')}
          </p>
          <p className={`text-xs ${C.label} mt-1`}>units sold</p>
        </div>
        <div className={`border ${C.amtBg} rounded-xl p-3.5`}>
          <p className={`text-xs font-semibold ${C.label} mb-1.5`}>Kitnay Ka Bika</p>
          <p className={`text-2xl font-bold ${C.amtText} leading-none`}>
            Rs {Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs ${C.label} mt-1`}>revenue earned</p>
        </div>
      </div>

      <div>
        <div className={`h-2 ${C.bar} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${C.fill} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
          />
        </div>
        <p className={`text-xs ${C.label} mt-1.5 text-right`}>
          {share.toFixed(1)}% of total product sales
        </p>
      </div>
    </div>
  );
};

export default UserWalletActivity;
