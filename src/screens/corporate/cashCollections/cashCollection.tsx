import React, { useState, useEffect } from "react";
import CashCollectionTable from "./components/cashCollectionTable";
import { getRequest, postRequest } from "@/Apis/Api";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  MinusCircle,
  Eye,
  X,
  PieChart as PieChartIcon,
  DollarSign,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  ChevronDown,
  Ban,
  Wallet,
  ArrowUpDown,
  Boxes,
  BadgeCheck,
  CircleSlash,
  Server,
  LayoutGrid,
} from "lucide-react";

interface MachineReport {
  machine_code: string;
  location: string;
  machine_name:string;
  total_cash_received: string;
  transaction_count: number;
  transactions: {
    id: number;
    user_id: number;
    created_at: string;
    cash_received?: string;
    username?: string;
    location?: string;
  }[];
  cash_collections?: {
    total: string;
    transaction_count: number;
  };
  cash_transactions?: {
    total: string;
    quantity: string;
    transaction_count: number;
  };
  difference?: {
    amount: string;
    type: string;
    percentage: string;
  };
  CashToBeReceived?: {
    CashToBeCollected: string;
  };
}

interface DailyData {
  date: string;
  amount: number;
  transactions: number;
}

interface LocationData {
  location: string;
  amount: number;
}

interface UserData {
  username: string;
  amount: number;
  transactions: number;
}

interface MonthlyReportData {
  total_amount: number;
  total_transactions: number;
  average_transaction: number;
  top_locations: LocationData[];
  top_users: UserData[];
  daily_data: DailyData[];
  total_cash_transactions: number;
  total_cash_quantity: number;
  cash_difference: number;
  overall_total_cash: number;
  total_machines: number;
  total_cash_machines: number;
  machines_with_no_collection: number;
  grouped_by_machine?: MachineReport[];
}

interface CashCollection {
  id: number;
  user_id: number;
  username: string;
  machine_code: string;
  location: string;
  cash_received: string;
  created_at: string;
}

interface MachineInfo {
  machine_code: string;
  machine_name: string;
}

interface MonthlyReportResponse {
  message: string;
  summary: {
    total_machines: number;
    overall_cash_collected: string;
    overall_cash_transactions: string;
    overall_cash_difference: string;
    total_cash_machines: number;
    machines_with_no_collection: number; // ✅ NEW
    breakdown: {
      machines_with_positive_difference: number;
      machines_with_negative_difference: number;
      machines_with_exact_match: number;
      machines_with_collections_no_transactions: number;
      total_positive_difference: string;
      total_negative_difference: string;
    };
  };
  detailed_breakdown: {
    all_machines: MachineReport[];
    positive_difference: MachineReport[];
    negative_difference: MachineReport[];
    exact_match: MachineReport[];
    collections_without_transactions: MachineReport[];
    no_collection: MachineReport[]; // ✅ NEW
  };
  raw_data: {
    grouped_by_machine: MachineReport[];
    total_cash_transactions: {
      amount: number;
      quantity: number;
    };
  };
}

const CorporateCashCollectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [data, setData] = useState<CashCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Report states
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(
    null,
  );
  const [rawApiResponse, setRawApiResponse] =
    useState<MonthlyReportResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [machineCode, setMachineCode] = useState<string | null>(null);
  const [selectedMachineReport, setSelectedMachineReport] =
    useState<MachineReport | null>(null);
  const [activeMachineTab, setActiveMachineTab] = useState("all");

  const [machines, setMachines] = useState<MachineInfo[]>([]);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString(),
  );

  // Fetch cash collection data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getRequest<{
        success?: boolean;
        data?: CashCollection[];
      }>(`/corporates/getAllCashCollection`);

      if (result && result.success && result.data) {
        setData(result.data);
      } else if (result && result.data) {
        setData(result.data);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching data");
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const result = await getRequest<{ data?: MachineInfo[] }>(
        "/corporates/getMachinesWithMachineCode",
      );

      if (result?.data && Array.isArray(result.data)) {
        setMachines(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch machines", err);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setReportLoading(true);
      setReportError(null);
      setMonthlyReport(null);
      setSelectedMachineReport(null);
      setRawApiResponse(null);

      const result = await postRequest<MonthlyReportResponse>(
        "/corporates/monthlyCashCollectionReport",
        {
          month: selectedMonth,
          year: selectedYear,
          machine_code: machineCode,
        },
      );

      if (!result) {
        setReportError("No response from server");
        return;
      }

      const apiResponse = result as MonthlyReportResponse;
      setRawApiResponse(apiResponse);

      if (!apiResponse.summary) {
        setReportError("Invalid report data format - missing summary");
        return;
      }

      if (!apiResponse.summary.breakdown) {
        apiResponse.summary.breakdown = {
          machines_with_positive_difference: 0,
          machines_with_negative_difference: 0,
          machines_with_exact_match: 0,
          machines_with_collections_no_transactions: 0,
          total_positive_difference: "0",
          total_negative_difference: "0",
        };
      }

      if (!apiResponse.detailed_breakdown) {
        apiResponse.detailed_breakdown = {
          all_machines: [],
          positive_difference: [],
          negative_difference: [],
          exact_match: [],
          collections_without_transactions: [],
          no_collection: [], // ✅ NEW
        };
      }

      // Ensure all arrays exist (including the new no_collection field)
      apiResponse.detailed_breakdown.all_machines =
        apiResponse.detailed_breakdown.all_machines || [];
      apiResponse.detailed_breakdown.positive_difference =
        apiResponse.detailed_breakdown.positive_difference || [];
      apiResponse.detailed_breakdown.negative_difference =
        apiResponse.detailed_breakdown.negative_difference || [];
      apiResponse.detailed_breakdown.exact_match =
        apiResponse.detailed_breakdown.exact_match || [];
      apiResponse.detailed_breakdown.collections_without_transactions =
        apiResponse.detailed_breakdown.collections_without_transactions || [];
      apiResponse.detailed_breakdown.no_collection =
        apiResponse.detailed_breakdown.no_collection || []; // ✅ NEW
      apiResponse.raw_data.grouped_by_machine =
        apiResponse.raw_data.grouped_by_machine || [];

      if (machineCode) {
        const foundMachine = apiResponse.raw_data.grouped_by_machine.find(
          (m) => m.machine_code === machineCode,
        );
        if (!foundMachine) {
          setReportError("No data found for this machine code");
          return;
        }
        setSelectedMachineReport(foundMachine);
      } else {
        setSelectedMachineReport(null);
      }

      if (apiResponse.raw_data.grouped_by_machine.length === 0) {
        setReportError("No data found for selected period");
        return;
      }

      let totalAmount = 0;
      let totalTransactions = 0;

      const dailyMap: Record<string, { amount: number; transactions: number }> =
        {};
      const locationMap: Record<string, number> = {};

      apiResponse.raw_data.grouped_by_machine.forEach((machine) => {
        const machineAmount = parseFloat(machine?.total_cash_received || "0");
        totalAmount += machineAmount;
        totalTransactions += machine?.transaction_count || 0;

        if (machine?.location) {
          locationMap[machine.location] =
            (locationMap[machine.location] || 0) + machineAmount;
        }

        if (machine?.transactions && Array.isArray(machine.transactions)) {
          machine.transactions.forEach((tx) => {
            if (!tx?.created_at) return;
            try {
              const date = tx.created_at.split("T")[0];
              const dayDate = date.split(" ")[0];
              if (!dailyMap[dayDate]) {
                dailyMap[dayDate] = { amount: 0, transactions: 0 };
              }
              const txAmount = parseFloat(tx?.cash_received || "0");
              dailyMap[dayDate].amount += txAmount;
              dailyMap[dayDate].transactions += 1;
            } catch (e) {
              console.warn("Failed to process transaction:", tx);
            }
          });
        }
      });

      const daily_data = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          transactions: data.transactions,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      const top_locations = Object.entries(locationMap)
        .map(([location, amount]) => ({
          location: location || "Unknown Location",
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      const reportData: MonthlyReportData = {
        total_amount: totalAmount,
        total_transactions: totalTransactions,
        average_transaction:
          totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        top_locations,
        top_users: [],
        daily_data,
        total_cash_transactions:
          apiResponse.raw_data.total_cash_transactions?.amount || 0,
        total_cash_quantity:
          apiResponse.raw_data.total_cash_transactions?.quantity || 0,
        cash_difference: parseFloat(
          apiResponse.summary.overall_cash_difference || "0",
        ),
        overall_total_cash: parseFloat(
          apiResponse.summary.overall_cash_collected || "0",
        ),
        total_machines: apiResponse.summary.total_machines || 0,
        total_cash_machines: apiResponse.summary.total_cash_machines || 0, // ✅ NEW
        machines_with_no_collection:
          apiResponse.summary.machines_with_no_collection || 0, // ✅ NEW
        grouped_by_machine: apiResponse.raw_data.grouped_by_machine,
      };

      setMonthlyReport(reportData);
    } catch (err: any) {
      console.error("Report generation error:", err);
      setReportError(err.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateReport = () => {
    fetchMonthlyReport();
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchMonthlyReport();
      fetchMachines();
    }
  }, [activeTab]);

  const handleExport = (exportData: CashCollection[]) => {
    if (!exportData || exportData.length === 0) {
      alert("No data to export");
      return;
    }
    try {
      const csvContent = [
        [
          "ID",
          "User ID",
          "Username",
          "Machine Code",
          "Location",
          "Amount",
          "Date",
        ],
        ...exportData.map((item) => [
          item.id,
          item.user_id,
          item.username,
          item.machine_code,
          item.location,
          item.cash_received,
          new Date(item.created_at).toLocaleString(),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cash-collections-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data");
    }
  };

  const handleExportReport = () => {
    if (!monthlyReport || !rawApiResponse) {
      alert("No report data to export");
      return;
    }
    try {
      const csvContent = [
        ["Monthly Cash Collection Report"],
        [
          `Period: ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
        ],
        [""],
        ["Summary"],
        [`Total Machines: ${monthlyReport.total_machines}`],
        [`Cash Machines: ${monthlyReport.total_cash_machines}`],
        [
          `Machines with No Collection: ${monthlyReport.machines_with_no_collection}`,
        ], // ✅ NEW
        [`Overall Total Cash: ${monthlyReport.overall_total_cash.toFixed(2)}`],
        [`Cash Transactions: ${monthlyReport.total_cash_transactions}`],
        [`Dispensed Quantity: ${monthlyReport.total_cash_quantity}`],
        [`Cash Difference: ${monthlyReport.cash_difference.toFixed(2)}`],
        [`Reported Collection: ${monthlyReport.total_amount.toFixed(2)}`],
        [`Total Transactions: ${monthlyReport.total_transactions}`],
        [
          `Average Transaction: ${monthlyReport.average_transaction.toFixed(2)}`,
        ],
        [""],
        ["Top Locations"],
        ["Location", "Amount"],
        ...monthlyReport.top_locations.map((item) => [
          item.location,
          item.amount.toFixed(2),
        ]),
        [""],
        ["Daily Data"],
        ["Date", "Amount", "Transactions"],
        ...monthlyReport.daily_data.map((item) => [
          item.date,
          item.amount.toFixed(2),
          item.transactions,
        ]),
        [""],
        ["Machine Performance"],
        [
          "Serial No",
          "Machine Code",
          "Location",
          "Collections",
          "Transactions",
          "Difference",
          "Cash In Machine",
          "Status",
        ],
        ...(rawApiResponse.raw_data.grouped_by_machine || []).map(
          (machine, index) => [
            index + 1,
            machine.machine_code,
            machine.location || "N/A",
            parseFloat(machine.cash_collections?.total || "0").toFixed(2),
            parseFloat(machine.cash_transactions?.total || "0").toFixed(2),
            parseFloat(machine.difference?.amount || "0").toFixed(2),
            machine.CashToBeReceived?.CashToBeCollected || "0.00",
            machine.difference?.type || "N/A",
          ],
        ),
        [""],
        ["Machines with No Collection"], // ✅ NEW section in export
        ["Serial No", "Machine Code", "Location"],
        ...(rawApiResponse.detailed_breakdown.no_collection || []).map(
          (machine, index) => [
            index + 1,
            machine.machine_code,
            machine.machine_name || "N/A",
          ],
        ),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cash-report-${selectedYear}-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report export error:", err);
      alert("Failed to export report");
    }
  };

  const getMachineName = (code?: string | null) => {
    if (!code) return "Unknown Machine";
    return (
      machines.find((m) => m.machine_code === code)?.machine_name ||
      "Unknown Machine"
    );
  };

  const getCurrentMachines = (): MachineReport[] => {
    if (!rawApiResponse || !rawApiResponse.detailed_breakdown) return [];
    switch (activeMachineTab) {
      case "positive":
        return rawApiResponse.detailed_breakdown.positive_difference || [];
      case "negative":
        return rawApiResponse.detailed_breakdown.negative_difference || [];
      case "exact":
        return rawApiResponse.detailed_breakdown.exact_match || [];
      case "no-transactions":
        return (
          rawApiResponse.detailed_breakdown.collections_without_transactions ||
          []
        );
      case "no-collection": // ✅ NEW
        return rawApiResponse.detailed_breakdown.no_collection || [];
      default:
        return rawApiResponse.detailed_breakdown.all_machines || [];
    }
  };

  const getCurrentMachinesCount = () => {
    const machines = getCurrentMachines();
    return Array.isArray(machines) ? machines.length : 0;
  };

  // ✅ NEW: "No Collection" tab renders a simpler table (no financial columns)
  const isNoCollectionTab = activeMachineTab === "no-collection";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="text-green-600" size={32} />
                Cash Collections
              </h1>
              <p className="mt-1 text-gray-600">
                View and manage all cash collection records
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={() => handleExport(data)}
                disabled={loading || data.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                  activeTab === "reports"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <PieChartIcon className="h-4 w-4" />
                Reports & Analytics
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                  activeTab === "table"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText className="h-4 w-4" />
                Table View
              </button>
            </nav>
          </div>
        </div>

        {/* Table View */}
        {activeTab === "table" && (
          <CashCollectionTable
            data={data}
            loading={loading}
            error={error}
            onRefresh={fetchData}
            onExport={handleExport}
          />
        )}

        {/* Reports View */}
        {activeTab === "reports" && (
          <div className="space-y-8">
            {/* Date Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Monthly Report
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select month and year to generate report
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={reportLoading}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={12}
                    />
                  </div>

                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={reportLoading}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>

                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      list="machineList"
                      type="text"
                      placeholder="Type Machine Code or Name"
                      value={machineCode ?? ""}
                      onChange={(e) =>
                        setMachineCode(e.target.value.trim() || null)
                      }
                      disabled={reportLoading}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white w-full"
                    />
                    <datalist id="machineList">
                      {machines.map((m) => (
                        <option key={m.machine_code} value={m.machine_code}>
                          {m.machine_name} ({m.machine_code})
                        </option>
                      ))}
                    </datalist>
                    {machineCode && (
                      <p className="mt-1 text-xs text-gray-600">
                        {getMachineName(machineCode) || "Unknown Machine"}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${reportLoading ? "animate-spin" : ""}`}
                    />
                    {reportLoading ? "Generating..." : "Generate Report"}
                  </button>

                  <button
                    onClick={handleExportReport}
                    disabled={!monthlyReport || reportLoading}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {reportLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">
                  Generating report...
                </p>
              </div>
            )}

            {/* Error State */}
            {reportError && !reportLoading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-700 font-medium">
                      Error Loading Report
                    </p>
                    <p className="text-red-600 text-sm mt-1">{reportError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Report Content */}
            {rawApiResponse &&
              rawApiResponse.summary &&
              !reportLoading &&
              !reportError && (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Collection — Deep Blue */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-blue-100 font-medium">
                          Total Collection
                        </p>
                        <div className="bg-blue-500/40 p-2 rounded-lg">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        Rs{" "}
                        {parseFloat(
                          rawApiResponse.summary.overall_cash_collected || "0",
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-200 mt-2">
                        Across all machines
                      </p>
                    </div>

                    {/* Cash Transactions — Deep Emerald */}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-emerald-100 font-medium">
                          Total Cash Transactions
                        </p>
                        <div className="bg-emerald-400/40 p-2 rounded-lg">
                          <ArrowUpDown className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        Rs{" "}
                        {(
                          rawApiResponse.raw_data?.total_cash_transactions
                            ?.amount || 0
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-emerald-200 mt-2">
                        Cash transactions count
                      </p>
                    </div>

                    {/* Quantity Dispensed — Deep Violet */}
                    <div className="bg-gradient-to-br from-violet-500 to-violet-800 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-violet-100 font-medium">
                          Quantity Dispensed
                        </p>
                        <div className="bg-violet-400/40 p-2 rounded-lg">
                          <Boxes className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {(
                          rawApiResponse.raw_data?.total_cash_transactions
                            ?.quantity || 0
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-violet-200 mt-2">
                        Total quantity units
                      </p>
                    </div>

                    {/* Cash Difference — Deep Amber */}
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-amber-100 font-medium">
                          Cash Difference
                        </p>
                        <div className="bg-amber-400/40 p-2 rounded-lg">
                          <PieChartIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        Rs{" "}
                        {parseFloat(
                          rawApiResponse.summary.overall_cash_difference || "0",
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-amber-200 mt-2">
                        Variance amount
                      </p>
                    </div>
                  </div>

                  {/* Breakdown Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Positive Difference — Green */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          Positive Difference
                        </h3>
                        <TrendingUp className="h-5 w-5 text-green-200" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.summary.breakdown
                          ?.machines_with_positive_difference || 0}
                      </p>
                      <p className="text-xs text-green-200 mt-2">
                        Rs{" "}
                        {parseFloat(
                          rawApiResponse.summary.breakdown
                            ?.total_positive_difference || "0",
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Negative Difference — Red */}
                    <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          Negative Difference
                        </h3>
                        <TrendingDown className="h-5 w-5 text-red-200" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.summary.breakdown
                          ?.machines_with_negative_difference || 0}
                      </p>
                      <p className="text-xs text-red-200 mt-2">
                        Rs{" "}
                        {parseFloat(
                          rawApiResponse.summary.breakdown
                            ?.total_negative_difference || "0",
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Exact Match — Cyan */}
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          Exact Match
                        </h3>
                        <BadgeCheck className="h-5 w-5 text-cyan-200" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.summary.breakdown
                          ?.machines_with_exact_match || 0}
                      </p>
                      <p className="text-xs text-cyan-200 mt-2">
                        Balanced machines
                      </p>
                    </div>

                    {/* Total Cash Machines — Indigo */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          Total Cash Machines
                        </h3>
                        <Server className="h-5 w-5 text-indigo-200" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.summary.total_cash_machines || 0}
                      </p>
                      <p className="text-xs text-indigo-200 mt-2">
                        Active cash machines
                      </p>
                    </div>

                    {/* Collection Machines — Teal */}
                    <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          Collection Machines
                        </h3>
                        <LayoutGrid className="h-5 w-5 text-teal-200" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.detailed_breakdown?.all_machines
                          ?.length || 0}
                      </p>
                      <p className="text-xs text-teal-200 mt-2">
                        Machines with collections
                      </p>
                    </div>

                    {/* No Collection — Slate */}
                    <div className="bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl p-4 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">
                          No Collection
                        </h3>
                        <CircleSlash className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {rawApiResponse.summary.machines_with_no_collection ||
                          0}
                      </p>
                      <p className="text-xs text-slate-300 mt-2">
                        Cash machines uncollected
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Detailed Machine Breakdown
                      </h3>
                      <p className="text-sm text-gray-600">
                        Comparison between cash collections and transactions by
                        machine
                      </p>
                    </div>

                    {/* Machine Filter Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="flex -mb-px overflow-x-auto">
                        {[
                          {
                            id: "all",
                            label: "All Machines",
                            count: (
                              rawApiResponse.detailed_breakdown?.all_machines ||
                              []
                            ).length,
                          },
                          {
                            id: "positive",
                            label: "Positive",
                            count: (
                              rawApiResponse.detailed_breakdown
                                ?.positive_difference || []
                            ).length,
                          },
                          {
                            id: "negative",
                            label: "Negative",
                            count: (
                              rawApiResponse.detailed_breakdown
                                ?.negative_difference || []
                            ).length,
                          },
                          {
                            id: "exact",
                            label: "Exact Match",
                            count: (
                              rawApiResponse.detailed_breakdown?.exact_match ||
                              []
                            ).length,
                          },
                          {
                            id: "no-transactions",
                            label: "No Transactions",
                            count: (
                              rawApiResponse.detailed_breakdown
                                ?.collections_without_transactions || []
                            ).length,
                          },
                          // ✅ NEW tab
                          {
                            id: "no-collection",
                            label: "No Collection",
                            count: (
                              rawApiResponse.detailed_breakdown
                                ?.no_collection || []
                            ).length,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveMachineTab(tab.id)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                              activeMachineTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {tab.label}
                            <span
                              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                activeMachineTab === tab.id
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Machines Table */}
                    <div className="overflow-x-auto">
                      {/* ✅ NEW: Simplified table for "No Collection" tab */}
                      {isNoCollectionTab ? (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Serial No
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Machine Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cash In Machine
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getCurrentMachinesCount() === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-12 text-center"
                                >
                                  <p className="text-gray-500">
                                    No machines found
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              getCurrentMachines().map((machine, index) => (
                                <tr
                                  key={machine.machine_code || index}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {machine.machine_code || "N/A"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {machine.location ||
                                      machine.machine_name ||
                                      "N/A"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    Rs{" "}
                                    {machine?.CashToBeReceived
                                      ?.CashToBeCollected || "0.00"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                      <Ban className="h-3 w-3" />
                                      No Collection
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      ) : (
                        /* Original full table for all other tabs */
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Serial No
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Machine Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Collections
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Transactions
                              </th>
                              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Difference
                              </th> */}
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cash In Machine
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="bg-white divide-y divide-gray-200">
                            {getCurrentMachinesCount() === 0 ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="px-6 py-12 text-center"
                                >
                                  <p className="text-gray-500">
                                    No machines found
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              getCurrentMachines().map((machine, index) => {
                                const diffAmount = parseFloat(
                                  machine?.difference?.amount || "0",
                                );

                                let diffColor = "text-gray-600";
                                let diffBgColor = "bg-gray-50";
                                let DiffIcon = MinusCircle;

                                if (diffAmount > 0) {
                                  diffColor = "text-green-600";
                                  diffBgColor = "bg-green-50";
                                  DiffIcon = TrendingUp;
                                } else if (diffAmount < 0) {
                                  diffColor = "text-red-600";
                                  diffBgColor = "bg-red-50";
                                  DiffIcon = TrendingDown;
                                } else {
                                  diffColor = "text-blue-600";
                                  diffBgColor = "bg-blue-50";
                                  DiffIcon = CheckCircle;
                                }

                                return (
                                  <tr
                                    key={machine.machine_code || index}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                      const foundMachine =
                                        rawApiResponse.detailed_breakdown.all_machines.find(
                                          (m) =>
                                            m.machine_code ===
                                            machine.machine_code,
                                        );
                                      if (foundMachine) {
                                        setSelectedMachineReport(foundMachine);
                                      }
                                    }}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                      {index + 1}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {machine.machine_code || "N/A"}
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                      {machine.location || "N/A"}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          Rs{" "}
                                          {parseFloat(
                                            machine?.cash_collections?.total ||
                                              "0",
                                          ).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                          })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {machine?.cash_collections
                                            ?.transaction_count || 0}{" "}
                                          collections
                                        </p>
                                      </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          Rs{" "}
                                          {parseFloat(
                                            machine?.cash_transactions?.total ||
                                              "0",
                                          ).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                          })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {machine?.cash_transactions
                                            ?.transaction_count || 0}{" "}
                                          txns
                                        </p>
                                      </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                        Rs:{" "}
                                        {machine?.CashToBeReceived
                                          ?.CashToBeCollected || "0.00"}
                                      </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${diffBgColor} ${diffColor}`}
                                      >
                                        <DiffIcon className="h-3 w-3" />
                                        {machine?.difference?.type || "N/A"}
                                      </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const foundMachine =
                                            rawApiResponse.detailed_breakdown.all_machines.find(
                                              (m) =>
                                                m.machine_code ===
                                                machine.machine_code,
                                            );
                                          if (foundMachine) {
                                            setSelectedMachineReport(
                                              foundMachine,
                                            );
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      >
                                        <Eye className="h-4 w-4" />
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Selected Machine Details Table */}
                  {selectedMachineReport && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                          Transaction Details —{" "}
                          {selectedMachineReport.machine_code}
                        </h4>
                        <button
                          onClick={() => setSelectedMachineReport(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                                #
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                                Location
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                                Amount (Rs)
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                                Date
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">
                                Collected By
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {!selectedMachineReport.transactions ||
                            selectedMachineReport.transactions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="text-center py-4 text-gray-500"
                                >
                                  No transactions found
                                </td>
                              </tr>
                            ) : (
                              selectedMachineReport.transactions.map(
                                (tx, index) => (
                                  <tr
                                    key={index}
                                    className="hover:bg-gray-50 transition"
                                  >
                                    <td className="px-4 py-2 border-b text-gray-400 text-xs">
                                      {index + 1}
                                    </td>
                                    <td className="px-4 py-2 border-b text-gray-800">
                                      {tx?.location ||
                                        selectedMachineReport.location ||
                                        "N/A"}
                                    </td>
                                    <td className="px-4 py-2 border-b font-semibold text-gray-900">
                                      Rs{" "}
                                      {Number(
                                        tx?.cash_received || 0,
                                      ).toLocaleString("en-IN")}
                                    </td>
                                    <td className="px-4 py-2 border-b text-gray-800">
                                      {tx?.created_at
                                        ? new Date(
                                            tx.created_at,
                                          ).toLocaleString()
                                        : "N/A"}
                                    </td>
                                    <td className="px-4 py-2 border-b text-gray-800">
                                      {tx?.username || "—"}
                                    </td>
                                  </tr>
                                ),
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

            {/* Empty State */}
            {!rawApiResponse && !reportLoading && !reportError && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <PieChartIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">
                  No Report Generated
                </h3>
                <p className="text-gray-500 mt-1">
                  Select a month and year, then click "Generate Report"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateCashCollectionPage;
