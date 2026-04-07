import React, { useState } from "react";
import { postRequest } from "@/Apis/Api";
import ReportFilters from "@/components/finance/reportFilter";

// ─── Types matching the actual API response ───────────────────────────────────

interface SanitaryCashTransactions {
  total_cash_transaction: number;
  total_cash_quantity: string;
}

interface RefillCashTransactions {
  total_cash_transaction: number;
  total_cash_quantity: string;
}

interface SanitaryAppTransaction {
  total_sanitary_amount: number;
  total_sanitary_quantity: string;
}

interface RefillAppTransaction {
  total_dispensing_amount: number;
  total_dispensing_quantity: string;
}

interface NeemTopups {
  total_topup: string;
  total_remaining_balance: string;
}

interface CashCollection {
  cash_received: number;
}

interface CashTransactionToBeCollect {
  machine_code: string;
  total_cash_transaction: number;
  total_cash_quantity: string;
}

interface FinanceReportData {
  sanitaryCashTransactions: SanitaryCashTransactions;
  refillCashTransactions: RefillCashTransactions;
  sanitaryAppTransactions: SanitaryAppTransaction[];
  RefillAppTransactions: RefillAppTransaction[];
  neemTopups: NeemTopups;
  cashCollection: CashCollection;
  cashTransactionToBeCollect: CashTransactionToBeCollect[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value}</span>
  </div>
);

const Card = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className={`${color} px-4 py-3`}>
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
    </div>
    <div className="px-4 py-3 space-y-1">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

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
        <div className="space-y-6 mt-4">

          {/* ── Row 1: Cash Transactions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Sanitary Cash Transactions" color="bg-blue-500">
              <StatRow label="Total Amount"   value={`Rs. ${report.sanitaryCashTransactions.total_cash_transaction}`} />
              <StatRow label="Total Quantity" value={report.sanitaryCashTransactions.total_cash_quantity} />
            </Card>

            <Card title="Refill Cash Transactions" color="bg-indigo-500">
              <StatRow label="Total Amount"   value={`Rs. ${report.refillCashTransactions.total_cash_transaction}`} />
              <StatRow label="Total Quantity" value={report.refillCashTransactions.total_cash_quantity} />
            </Card>
          </div>

          {/* ── Row 2: App Transactions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Sanitary App Transactions" color="bg-emerald-500">
              {report.sanitaryAppTransactions.length > 0 ? (
                report.sanitaryAppTransactions.map((t, i) => (
                  <div key={i}>
                    <StatRow label="Total Amount"   value={`Rs. ${t.total_sanitary_amount}`} />
                    <StatRow label="Total Quantity" value={t.total_sanitary_quantity} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No transactions found.</p>
              )}
            </Card>

            <Card title="Refill App Transactions" color="bg-teal-500">
              {report.RefillAppTransactions.length > 0 ? (
                report.RefillAppTransactions.map((t, i) => (
                  <div key={i}>
                    <StatRow label="Total Amount"   value={`Rs. ${t.total_dispensing_amount}`} />
                    <StatRow label="Total Quantity" value={t.total_dispensing_quantity} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No transactions found.</p>
              )}
            </Card>
          </div>

          {/* ── Row 3: Neem Topups & Cash Collection ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Neem Topups" color="bg-violet-500">
              <StatRow label="Total Topup"            value={`Rs. ${report.neemTopups.total_topup}`} />
              <StatRow label="Remaining Balance"      value={`Rs. ${report.neemTopups.total_remaining_balance}`} />
            </Card>

            <Card title="Cash Collection" color="bg-rose-500">
              <StatRow label="Cash Received" value={`Rs. ${report.cashCollection.cash_received}`} />
            </Card>
          </div>

          {/* ── Row 4: Cash Transactions To Be Collected (per machine) ── */}
          <Card title="Cash Transactions To Be Collected" color="bg-amber-500">
            {report.cashTransactionToBeCollect.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th></th>
                      <th className="pb-2 font-medium">Amount (Rs.)</th>
                      <th className="pb-2 font-medium">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cashTransactionToBeCollect.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="pt-3">Total</td>
                        <td className="py-2 text-gray-600">{item.total_cash_transaction}</td>
                        <td className="py-2 text-gray-600">{item.total_cash_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No pending collections.</p>
            )}
          </Card>

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