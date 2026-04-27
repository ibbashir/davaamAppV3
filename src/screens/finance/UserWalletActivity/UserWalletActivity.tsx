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
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
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
  user_txn_amount: string;
  user_txn_count: number;
  total_transaction_amount: string;
  remaining_balance: string;
  transaction_status: 'Active' | 'No Transactions';
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
}

interface ApiResponse {
  data: AppUserRow[];
  pagination: Pagination;
  summary: Summary;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (value: string | number) =>
  Number(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

// ─── Component ───────────────────────────────────────────────────────────────

const UserWalletActivity: React.FC = () => {
  const [data, setData]           = useState<AppUserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 15 });
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(thirtyDaysAgo());
  const [endDate, setEndDate]     = useState(today());
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);
  const [pageSize]                = useState(15);

  const [exporting, setExporting]  = useState(false);

  // Sort
  const [sortKey, setSortKey]     = useState<keyof AppUserRow>('total_topup_amount');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page:   String(page),
        limit:  String(pageSize),
        ...(search ? { search } : {}),
      });
      const res = await getRequest<ApiResponse>(`/finance/getAppUserCollection?${params}`);
      setData(res.data ?? []);
      setPagination(res.pagination);
      setSummary(res.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Sorting (client-side within current page) ──
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

  // ── Search ──
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ── Export CSV (fetches all records, not just current page) ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const total = pagination.totalUsers || 1;
      const params = new URLSearchParams({
        startDate,
        endDate,
        page:  '1',
        limit: String(total),
        ...(search ? { search } : {}),
      });
      const res = await getRequest<ApiResponse>(`/finance/getAppUserCollection?${params}`);
      const allRows = res.data ?? [];

      const headers = [
        'Mobile Number', 'User ID', 'Full Name',
        'Total Top-up (Rs)', 'Top-up Count',
        'Butterfly Txns (Rs)', 'Butterfly Count',
        'Oil Txns (Rs)', 'User Txn Count',
        'Total Transaction (Rs)', 'Remaining Balance (Rs)',
        'Status',
      ];
      const rows = allRows.map((r) => [
        r.mobile_number, r.user_id, `"${r.full_name}"`,
        r.total_topup_amount, r.topup_count,
        r.butterfly_amount, r.butterfly_txn_count,
        r.user_txn_amount, r.user_txn_count,
        r.total_transaction_amount, r.remaining_balance,
        r.transaction_status,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-user-collection-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — user can retry
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-teal-600" size={28} />
              User Wallet Activity
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Top-up vs transaction analysis by mobile app users
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!data.length || exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 shadow-sm disabled:opacity-50 transition-all"
            >
              {exporting
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {exporting ? `Exporting ${pagination.totalUsers}…` : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users size={20} className="text-teal-600" />}
              label="Total Users"
              value={summary.totalUsers.toLocaleString()}
              bg="from-teal-50 to-teal-100"
              border="border-teal-200"
              text="text-teal-800"
              sub="text-teal-600"
            />
            <SummaryCard
              icon={<DollarSign size={20} className="text-blue-600" />}
              label="Total Top-ups"
              value={`Rs ${fmt(summary.totalTopupAmount)}`}
              bg="from-blue-50 to-blue-100"
              border="border-blue-200"
              text="text-blue-800"
              sub="text-blue-600"
            />
            <SummaryCard
              icon={<CheckCircle size={20} className="text-green-600" />}
              label="Active Users"
              value={summary.activeUsers.toLocaleString()}
              sub="text-green-600"
              bg="from-green-50 to-green-100"
              border="border-green-200"
              text="text-green-800"
            />
            <SummaryCard
              icon={<XCircle size={20} className="text-red-500" />}
              label="No Transactions"
              value={summary.inactiveUsers.toLocaleString()}
              sub="text-red-500"
              bg="from-red-50 to-red-100"
              border="border-red-200"
              text="text-red-800"
            />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-wrap items-end gap-4">
            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={12} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={12} /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today()}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Search size={12} /> Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Mobile number or name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-red-700 font-medium text-sm">Error loading data</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table header info */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-teal-600" />
              <span className="font-semibold text-gray-800 text-sm">User Collection Report</span>
              {!loading && (
                <span className="text-xs text-gray-500">
                  ({pagination.totalUsers.toLocaleString()} users found)
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" /> No Transactions
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    #
                  </th>
                  <Th label="Mobile Number"         col="mobile_number"           sortKey={sortKey} onSort={toggleSort} />
                  <Th label="User Name"             col="full_name"               sortKey={sortKey} onSort={toggleSort} />
                  <Th label="Top-up (Rs)"           col="total_topup_amount"      sortKey={sortKey} onSort={toggleSort} right />
                  <Th label="Butterfly Txns (Rs)"   col="butterfly_amount"        sortKey={sortKey} onSort={toggleSort} right />
                  <Th label="Oil Txns (Rs)"        col="user_txn_amount"         sortKey={sortKey} onSort={toggleSort} right />
                  <Th label="Total Txn (Rs)"        col="total_transaction_amount" sortKey={sortKey} onSort={toggleSort} right />
                  <Th label="Balance (Rs)"          col="remaining_balance"       sortKey={sortKey} onSort={toggleSort} right />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Users size={40} className="opacity-40" />
                        <p className="font-medium">No users found</p>
                        <p className="text-sm">Try adjusting the date range or search term</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((row, idx) => {
                    const isInactive = row.transaction_status === 'No Transactions';
                    const balance = Number(row.remaining_balance);
                    const balanceColor = balance < 0
                      ? 'text-red-600 font-semibold'
                      : balance === 0
                        ? 'text-gray-500'
                        : 'text-green-600 font-semibold';

                    return (
                      <tr
                        key={`${row.mobile_number}-${idx}`}
                        className={`hover:bg-gray-50 transition-colors ${isInactive ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {(pagination.currentPage - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 text-xs whitespace-nowrap">
                          {row.mobile_number}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={row.full_name}>
                          {row.full_name || <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {fmt(row.total_topup_amount)}
                          </span>
                          <span className="block text-xs text-gray-400">{row.topup_count} top-ups</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                          {fmt(row.butterfly_amount)}
                          <span className="block text-xs text-gray-400">{row.butterfly_txn_count} txns</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                          {fmt(row.user_txn_amount)}
                          <span className="block text-xs text-gray-400">{row.user_txn_count} txns</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                          {fmt(row.total_transaction_amount)}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${balanceColor}`}>
                          {fmt(row.remaining_balance)}
                        </td>
                        <td className="px-4 py-3">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={11} />
                              No Transactions
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={11} />
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
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
                Page {pagination.currentPage} of {pagination.totalPages} ·{' '}
                {pagination.totalUsers.toLocaleString()} total users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.currentPage === 1 || loading}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  let p: number;
                  const total = pagination.totalPages;
                  const cur = pagination.currentPage;
                  if (total <= 7) {
                    p = i + 1;
                  } else if (cur <= 4) {
                    p = i < 6 ? i + 1 : total;
                  } else if (cur >= total - 3) {
                    p = i === 0 ? 1 : total - 6 + i;
                  } else {
                    const map = [1, cur - 2, cur - 1, cur, cur + 1, cur + 2, total];
                    p = map[i];
                  }
                  const isEllipsis =
                    total > 7 &&
                    ((i === 1 && p !== 2) || (i === 5 && p !== total - 1));

                  return isEllipsis ? (
                    <span key={i} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(p)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.currentPage
                          ? 'bg-teal-600 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
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

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  border: string;
  text: string;
  sub: string;
}> = ({ icon, label, value, bg, border, text, sub }) => (
  <div className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-5`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className={`text-xs font-medium ${sub}`}>{label}</p>
    </div>
    <p className={`text-xl font-bold ${text}`}>{value}</p>
  </div>
);

const Th: React.FC<{
  label: string;
  col: keyof AppUserRow;
  sortKey: keyof AppUserRow;
  onSort: (col: keyof AppUserRow) => void;
  right?: boolean;
}> = ({ label, col, sortKey, onSort, right }) => (
  <th
    onClick={() => onSort(col)}
    className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors ${right ? 'text-right' : 'text-left'}`}
  >
    {label}
    <span className="ml-1 opacity-50">{sortKey === col ? '▼' : '⇅'}</span>
  </th>
);

export default UserWalletActivity;
