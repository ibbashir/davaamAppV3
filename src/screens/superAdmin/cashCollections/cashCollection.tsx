import React, { useState, useEffect } from "react";
import CashCollectionTable from "./components/cashCollectionTable";
import { getRequest, postRequest } from "@/Apis/Api";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  DollarSign,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Users,
  MapPin,
  Filter,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { date } from "zod";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface MachineReport {
  machine_code: string;
  location: string;
  total_cash_received: string;
  transaction_count: number;
  transactions: {
    id: number;
    user_id: number;
    created_at: string;
    cash_received?: string;
    username?: string; // Add username to transactions
  }[];
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
  grouped_by_machine?: MachineReport[]; // Add this to store the original data
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
  grouped_by_machine: MachineReport[];
  totalCashTransactions: number;
  totalCashQuantity: number;
  cashDifference: number;
  summary: {
    total_machines: number;
    overall_total_cash: string;
  };
}

const SuperAdminCashCollectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("table");
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
    useState<MonthlyReportResponse | null>(null); // Store raw response
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [machineCode, setMachineCode] = useState<string | null>(null);
  const [selectedMachineReport, setSelectedMachineReport] =
    useState<MachineReport | null>(null);

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

      const result = await getRequest(`/superadmin/getAllCashCollection`);

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
      const result = await getRequest("/superadmin/getMachinesWithMachineCode");

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

      console.log("Fetching report for:", {
        month: selectedMonth,
        year: selectedYear,
        machine_code: machineCode,
      });

      const result = await postRequest<MonthlyReportResponse>(
        "/superadmin/monthlyCashCollectionReport",
        {
          month: selectedMonth,
          year: selectedYear,
          machine_code: machineCode,
        },
      );

      console.log("API Response:", result);

      if (!result) {
        setReportError("No response from server");
        return;
      }

      // Store the raw response for later use
      const apiResponse = result as MonthlyReportResponse;
      setRawApiResponse(apiResponse);

      if (
        !apiResponse.grouped_by_machine ||
        !Array.isArray(apiResponse.grouped_by_machine)
      ) {
        setReportError("Invalid report data format");
        return;
      }

      // If machine code is provided, find that machine
      if (machineCode) {
        const foundMachine = apiResponse.grouped_by_machine.find(
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

      if (apiResponse.grouped_by_machine.length === 0) {
        setReportError("No data found for selected period");
        return;
      }

      let totalAmount = 0;
      let totalTransactions = 0;

      const dailyMap: Record<string, { amount: number; transactions: number }> =
        {};
      const locationMap: Record<string, number> = {};

      apiResponse.grouped_by_machine.forEach((machine) => {
        const machineAmount = parseFloat(machine.total_cash_received || "0");
        totalAmount += machineAmount;
        totalTransactions += machine.transaction_count || 0;

        // Aggregate by location
        if (machine.location) {
          locationMap[machine.location] =
            (locationMap[machine.location] || 0) + machineAmount;
        }

        // Aggregate daily data from transactions
        if (machine.transactions && Array.isArray(machine.transactions)) {
          machine.transactions.forEach((tx) => {
            if (!tx.created_at) return;

            try {
              const date = tx.created_at.split("T")[0]; // Handle ISO format
              const dayDate = date.split(" ")[0]; // Handle datetime format

              if (!dailyMap[dayDate]) {
                dailyMap[dayDate] = { amount: 0, transactions: 0 };
              }

              const txAmount = parseFloat(tx.cash_received || "0");
              dailyMap[dayDate].amount += txAmount;
              dailyMap[dayDate].transactions += 1;
            } catch (e) {
              console.warn("Failed to process transaction:", tx);
            }
          });
        }
      });

      // Convert daily map to array and sort by date
      const daily_data = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          transactions: data.transactions,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      // Convert location map to array and sort by amount
      const top_locations = Object.entries(locationMap)
        .map(([location, amount]) => ({
          location: location || "Unknown Location",
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Prepare the monthly report data - include grouped_by_machine
      const reportData: MonthlyReportData = {
        total_amount: totalAmount,
        total_transactions: totalTransactions,
        average_transaction:
          totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        top_locations,
        top_users: [],
        daily_data,
        total_cash_transactions: apiResponse.totalCashTransactions,
        total_cash_quantity: apiResponse.totalCashQuantity,
        cash_difference: apiResponse.cashDifference,
        overall_total_cash: parseFloat(apiResponse.summary.overall_total_cash),
        total_machines: apiResponse.summary.total_machines,
        grouped_by_machine: apiResponse.grouped_by_machine, // Store the original data
      };

      console.log("Generated Report Data:", reportData);
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
      a.download = `cash-collections-${
        new Date().toISOString().split("T")[0]
      }.csv`;
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
          `Period: ${
            months.find((m) => m.value === selectedMonth)?.label
          } ${selectedYear}`,
        ],
        [""],
        ["Summary"],
        [`Total Machines: ${monthlyReport.total_machines}`],
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
          "Machine Code",
          "Machine Name",
          "Location",
          "Transactions",
          "Total Collection",
          "Average Transaction",
        ],
        ...(rawApiResponse.grouped_by_machine || []).map((machine) => [
          machine.machine_code,
          getMachineName(machine.machine_code),
          machine.location || "N/A",
          machine.transaction_count,
          parseFloat(machine.total_cash_received || "0").toFixed(2),
          machine.transaction_count > 0
            ? (
                parseFloat(machine.total_cash_received || "0") /
                machine.transaction_count
              ).toFixed(2)
            : "0.00",
        ]),
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
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      outline-none bg-white w-full"
                    />

                    <datalist id="machineList">
                      {machines.map((m) => (
                        <option key={m.machine_code} value={m.machine_code}>
                          {m.machine_name} ({m.machine_code})
                        </option>
                      ))}
                    </datalist>

                    {/* Machine name preview */}
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
                      className={`h-4 w-4 ${
                        reportLoading ? "animate-spin" : ""
                      }`}
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

            {/* Summary Stats */}
            {monthlyReport && !reportLoading && !reportError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">
                          Total Collection
                        </p>
                        <p className="text-2xl font-bold text-blue-800 mt-1">
                          Rs{" "}
                          {monthlyReport.overall_total_cash.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Across all machines
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">
                          Total Cash Transactions
                        </p>
                        <p className="text-2xl font-bold text-green-800 mt-1">
                          Rs{" "}
                          {monthlyReport.total_cash_transactions.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          Cash transactions count
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">
                          Quantity Dispensed
                        </p>
                        <p className="text-2xl font-bold text-purple-800 mt-1">
                          {monthlyReport.total_cash_quantity.toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 mt-2">
                          Total qunatity units
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">
                          Cash Difference
                        </p>
                        <p className="text-2xl font-bold text-orange-800 mt-1">
                          Rs{" "}
                          {monthlyReport.cash_difference.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </p>
                        <p className="text-xs text-orange-600 mt-2">
                          Variance amount
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Detailed Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Detailed Breakdown
                      </h3>
                      <p className="text-sm text-gray-600">
                        Transaction insights and analysis
                      </p>
                    </div>

                    <div className="space-y-6">
                      {monthlyReport.top_locations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Locations
                          </h4>
                          <div className="space-y-3">
                            {monthlyReport.top_locations.map(
                              (location, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <span className="text-blue-600 font-medium">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <span className="font-medium text-gray-800">
                                      {location.location}
                                    </span>
                                  </div>
                                  <span className="font-bold text-gray-900">
                                    Rs{" "}
                                    {location.amount.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {selectedMachineReport && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Cash Collection Report 
                          </h4>

                          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
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
                                {selectedMachineReport.transactions.length ===
                                0 ? (
                                  <tr>
                                    <td
                                      colSpan={4}
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
                                        <td className="px-4 py-2 border-b text-gray-800">
                                          {tx.location ||
                                            selectedMachineReport.location ||
                                            "N/A"}
                                        </td>

                                        <td className="px-4 py-2 border-b font-semibold text-gray-900">
                                          Rs{" "}
                                          {Number(
                                            tx.cash_received || 0,
                                          ).toLocaleString("en-IN")}
                                        </td>

                                        <td className="px-4 py-2 border-b text-gray-800">
                                          {new Date(
                                            tx.created_at,
                                          ).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-2 border-b text-gray-800">
                                          {tx.username || "—"}
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
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!monthlyReport && !reportLoading && !reportError && (
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

export default SuperAdminCashCollectionPage;
