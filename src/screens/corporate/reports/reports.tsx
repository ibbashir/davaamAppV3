import { useState, useMemo } from "react";
import { postRequest } from "@/Apis/Api";
import { useAuth } from "@/contexts/AuthContext"; 
import * as XLSX from "xlsx";

export default function Report() {
  const { state } = useAuth();
  const { user } = state;
  
  const machineCodes = useMemo(
    () =>
      Array.isArray(user?.machines)
        ? user.machines.map((m: { machine_code: number }) => m.machine_code)
        : [],
    [user?.machines]
  );

  const [data, setData] = useState<{
    statusCode?: number;
    overalltotal?: number;
    cashTotal?: number;
    onlineTotal?: number;
    cashTransactions?: any[];
    onlineTransactions?: any[];
  }>({});
  
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const getReports = async () => {
    if (!selectedDate) {
      alert("Please select a month");
      return;
    }

    if (machineCodes.length === 0) {
      alert("No machines available");
      return;
    }

    setLoading(true);
    try {
      const response = await postRequest("/corporates/reports", {
        machineCode: machineCodes, // Changed from machineCodes to machineCode to match backend
        Month: selectedDate // Use the selected date directly
      });
      setData(response);
    } catch (err) {
      console.error("Error fetching reports:", err);
      alert("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getReports();
  };

  const exportToExcel = () => {
    if (!data.cashTransactions && !data.onlineTransactions) {
      alert("No data to export");
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const summaryData = [
        ["Transaction Summary", ""],
        ["Total Transactions", data.overalltotal || 0],
        ["Cash Transactions", data.cashTotal || 0],
        ["Online Transactions", data.onlineTotal || 0],
        [],
        ["Generated on", new Date().toLocaleString()],
        ["For period", selectedDate]
      ];
      
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Add cash transactions sheet if data exists
      if (data.cashTransactions && data.cashTransactions.length > 0) {
        const cashWS = XLSX.utils.json_to_sheet(data.cashTransactions);
        XLSX.utils.book_append_sheet(wb, cashWS, "Cash Transactions");
      }

      // Add online transactions sheet if data exists
      if (data.onlineTransactions && data.onlineTransactions.length > 0) {
        const onlineWS = XLSX.utils.json_to_sheet(data.onlineTransactions);
        XLSX.utils.book_append_sheet(wb, onlineWS, "Online Transactions");
      }

      // Generate file name with date
      const fileName = `transactions_report_${selectedDate || "all"}.xlsx`;
      
      // Download the file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel");
    }
  };

  return (
    <div className="mt-5 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaction Report</h1>
        {data.overalltotal !== undefined && data.overalltotal > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export to Excel
          </button>
        )}
      </div>

      <form className="mx-auto mt-4 w-full max-w-lg" onSubmit={handleSubmit}>
        <div className="-mx-3 mb-6 flex flex-wrap">
          <div className="mb-6 w-full px-3 md:mb-0 md:w-1/2">
            <label
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700"
              htmlFor="month"
            >
              Month
            </label>
            <input
              className="mb-3 block w-full appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none"
              id="month"
              name="month"
              type="month"
              value={selectedDate}
              onChange={handleDateChange}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          disabled={loading || !selectedDate}
        >
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </form>

      {data.overalltotal !== undefined && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Transaction Summary</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold">{data.overalltotal}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="text-gray-500">Cash Transactions</h3>
              <p className="text-2xl font-bold">{data.cashTotal}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="text-gray-500">Online Transactions</h3>
              <p className="text-2xl font-bold">{data.onlineTotal}</p>
            </div>
          </div>
        </div>
      )}

      {data.cashTransactions && data.cashTransactions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-xl font-semibold">Cash Transactions</h2>
            <span className="text-sm text-gray-500">
              Count: {data.cashTotal}
            </span>
          </div>
          <TransactionTable transactions={data.cashTransactions} />
        </div>
      )}

      {data.onlineTransactions && data.onlineTransactions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-xl font-semibold">Online Transactions</h2>
            <span className="text-sm text-gray-500">
              Count: {data.onlineTotal}
            </span>
          </div>
          <TransactionTable transactions={data.onlineTransactions} />
        </div>
      )}

      {data.overalltotal === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">No transactions found for the selected period.</p>
        </div>
      )}
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return <p className="text-gray-500">No transactions found</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Machine
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Merchant
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {transaction.id}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {transaction.user_id}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {transaction.amount}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(transaction.created_at).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {transaction.machine_code}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {transaction.merchant}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}