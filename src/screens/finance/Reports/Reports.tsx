import React, { useState } from "react";
import { postRequest } from "@/Apis/Api";
import ReportFilters from "@/components/finance/reportFilter";
import CashTransactionCard from "@/components/finance/CashTransactionCard";
import AppTransactionCard from "@/components/finance/AppTransactionCard";
import NeemTopupsCard from "@/components/finance/NeemTopupsCard";
import CashCollectionCard from "@/components/finance/CashCollectionCard";

interface FinanceReportData {
  cashTransactions: CashTransaction;
  appTransactions: AppTransaction[];
  neemTopups: NeemTopups;
  cashCollection: CashCollection;
}

const FinanceReport: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [report, setReport]       = useState<FinanceReportData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const fetchReport = async () => {
    setError("");
    setReport(null);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setLoading(true);
      const res = await postRequest("/finance/financeReport", { startDate, endDate });
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Finance Report</h2>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        loading={loading}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={fetchReport}
      />

      {error && (
        <div className="p-3 mb-6 bg-red-100 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-6 justify-center text-gray-600">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p>Loading report...</p>
        </div>
      )}

      {report && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <CashTransactionCard  data={report.cashTransactions} />
          <AppTransactionCard   transactions={report.appTransactions} />
          <NeemTopupsCard       data={report.neemTopups} />
          <CashCollectionCard   data={report.cashCollection} />
        </div>
      )}

      {!report && !loading && !error && (
        <p className="text-center text-gray-400 py-10 text-lg">
          Select a date range and click "Get Report" to view data.
        </p>
      )}
    </div>
  );
};

export default FinanceReport;
