import React, { useState, useMemo } from "react";

interface CashCollection {
  id: number;
  user_id: number;
  username: string;
  machine_code: string;
  location: string;
  cash_received: string;
  created_at: string;
  epoch_time: number;
}

interface Filters {
  user_id?: number;
  machine_code?: string;
  location?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}
import {
  Search,
  Filter,
  Download,
  X,
  Calendar,
  DollarSign,
  MapPin,
  User,
  QrCode,
  ChevronUp,
  ChevronDown,
  Eye,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import moment from "moment-timezone";

interface CashCollectionTableProps {
  data: CashCollection[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onExport?: (data: CashCollection[]) => void;
}

const CashCollectionTable: React.FC<CashCollectionTableProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onExport,
}) => {
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof CashCollection>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CashCollection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = data.reduce(
      (sum, item) => sum + parseFloat(item.cash_received || "0"),
      0,
    );
    const totalCollections = data.length;
    const uniqueMachines = new Set(data.map((item) => item.machine_code)).size;
    const uniqueUsers = new Set(data.map((item) => item.username)).size;

    return {
      totalAmount,
      totalCollections,
      uniqueMachines,
      uniqueUsers,
    };
  }, [data]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.machine_code.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower) ||
          item.cash_received.includes(searchTerm)
        );
      }

      // Additional filters
      if (filters.user_id && item.user_id !== filters.user_id) return false;
      if (filters.machine_code && item.machine_code !== filters.machine_code)
        return false;
      if (filters.location && !item.location.includes(filters.location))
        return false;

      // Date filters
      if (filters.date_from || filters.date_to) {
        const itemDate = new Date(item.created_at);
        if (filters.date_from && itemDate < new Date(filters.date_from))
          return false;
        if (filters.date_to && itemDate > new Date(filters.date_to))
          return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [data, searchTerm, filters, sortBy, sortOrder]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  // Handlers
  const handleSort = (property: keyof CashCollection) => {
    const isAsc = sortBy === property && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortBy(property);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(0);
  };

  const handleRowClick = (row: CashCollection) => {
    setSelectedRow(row);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredAndSortedData);
    }
  };

  // Format date
 const formatDate = (dateString: string) => {
     try {
       return moment.utc(dateString).format("DD-MM-YYYY - HH:mm:ss");
     } catch {
       return dateString;
     }
   };

  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Get unique values for filters
  const uniqueMachines = useMemo(
    () => [...new Set(data.map((item) => item.machine_code))],
    [data],
  );

  const uniqueUsers = useMemo(
    () => [
      ...new Set(
        data.map((item) => ({ id: item.user_id, name: item.username })),
      ),
    ],
    [data],
  );

  const uniqueLocations = useMemo(
    () => [...new Set(data.map((item) => item.location))],
    [data],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        {/* <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Collections</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalCollections}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div> */}

        {/* <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.totalAmount.toString())}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Machines Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.uniqueMachines}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.uniqueUsers}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by machine OR location"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                Object.keys(filters).length > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>

            {onExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            )}

            {Object.keys(filters).length > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {Object.keys(filters).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.machine_code && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Machine: {filters.machine_code}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        machine_code: undefined,
                      }))
                    }
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  Location: {filters.location}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, location: undefined }))
                    }
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.user_id && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                  User:{" "}
                  {uniqueUsers.find((u) => u.id === filters.user_id)?.name}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, user_id: undefined }))
                    }
                    className="hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.min_amount && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                  Min: {formatCurrency(filters.min_amount.toString())}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, min_amount: undefined }))
                    }
                    className="hover:text-yellow-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.max_amount && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                  Max: {formatCurrency(filters.max_amount.toString())}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, max_amount: undefined }))
                    }
                    className="hover:text-red-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Code
                </label>
                <select
                  value={filters.machine_code || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      machine_code: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Machines</option>
                  {uniqueMachines.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={filters.user_id || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      user_id: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={filters.location || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date_from: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date_to: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort("machine_code")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Machine Code
                    {sortBy === "machine_code" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("location")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Location
                    {sortBy === "location" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("cash_received")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortBy === "cash_received" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("username")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    User
                    {sortBy === "username" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("created_at")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Date & Time
                    {sortBy === "created_at" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-1">
                    STOCKED (1 | 2 | 3 | 4) <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No cash collections found</p>
                      {Object.keys(filters).length > 0 && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-gray-400" />
                        {row.machine_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">
                          {row.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(row.cash_received) > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatCurrency(row.cash_received)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {row.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {row.row1} | {row.row2} | {row.row3} | {row.row4}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRowClick(row)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{page * rowsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(
                  (page + 1) * rowsPerPage,
                  filteredAndSortedData.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {filteredAndSortedData.length}
              </span>{" "}
              results
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page {page + 1} of{" "}
                {Math.ceil(filteredAndSortedData.length / rowsPerPage)}
              </span>

              <button
                onClick={() =>
                  setPage(
                    Math.min(
                      Math.ceil(filteredAndSortedData.length / rowsPerPage) - 1,
                      page + 1,
                    ),
                  )
                }
                disabled={
                  page >=
                  Math.ceil(filteredAndSortedData.length / rowsPerPage) - 1
                }
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Collection Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Machine Code
                    </label>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-gray-400" />
                      <p className="text-lg font-semibold">
                        {selectedRow.machine_code}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Amount
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedRow.cash_received)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Collected By
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <p className="text-lg">{selectedRow.username}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Location
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <p className="text-lg">{selectedRow.location}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      User ID
                    </label>
                    <p className="text-lg font-semibold">
                      {selectedRow.user_id}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Date & Time
                    </label>
                    <p className="text-lg">
                      {formatDate(selectedRow.created_at)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Epoch Time
                    </label>
                    <p className="text-lg font-mono">
                      {selectedRow.epoch_time}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CashCollectionTable;
