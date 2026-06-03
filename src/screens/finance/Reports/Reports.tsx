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
  total_topup: number;
  total_remaining_balance: number;
}

interface CashCollection {
  cash_received: number;
}

interface CashTransactionToBeCollect {
  total_cash_transaction: number;
  total_cash_quantity: string;
}

interface RemainingStock {
  total_inserted_quantity: number;
  total_dispensed_quantity: number;
  current_stock: number;
}

interface FinanceReportData {
  sanitaryCashTransactions: SanitaryCashTransactions;
  refillCashTransactions: RefillCashTransactions;
  sanitaryAppTransactions: SanitaryAppTransaction;
  refillAppTransactions: RefillAppTransaction;
  neemTopups: NeemTopups;
  cashCollection: CashCollection;
  cashTransactionToBeCollect: CashTransactionToBeCollect[];
  cashToBeCollected: number;
  remainingStock: RemainingStock;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
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

  const formatCurrency = (value: number | undefined | null) => {
    return `Rs. ${(value || 0).toLocaleString()}`;
  };

  const formatNumber = (value: number | string | undefined | null) => {
    if (typeof value === 'string') {
      return parseFloat(value).toLocaleString();
    }
    return (value || 0).toLocaleString();
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
              <StatRow 
                label="Total Amount"   
                value={formatCurrency(report.sanitaryCashTransactions?.total_cash_transaction)} 
              />
              <StatRow 
                label="Total Quantity" 
                value={formatNumber(report.sanitaryCashTransactions?.total_cash_quantity)} 
              />
            </Card>

            <Card title="Refill Cash Transactions" color="bg-indigo-500">
              <StatRow 
                label="Total Amount"   
                value={formatCurrency(report.refillCashTransactions?.total_cash_transaction)} 
              />
              <StatRow 
                label="Total Quantity" 
                value={formatNumber(report.refillCashTransactions?.total_cash_quantity)} 
              />
            </Card>
          </div>

          {/* ── Row 2: App Transactions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Sanitary App Transactions" color="bg-emerald-500">
              {report.sanitaryAppTransactions ? (
                <>
                  <StatRow 
                    label="Total Amount"   
                    value={formatCurrency(report.sanitaryAppTransactions.total_sanitary_amount)} 
                  />
                  <StatRow 
                    label="Total Quantity" 
                    value={formatNumber(report.sanitaryAppTransactions.total_sanitary_quantity)} 
                  />
                </>
              ) : (
                <p className="text-sm text-gray-400">No transactions found.</p>
              )}
            </Card>

            <Card title="Refill App Transactions" color="bg-teal-500">
              {report.refillAppTransactions ? (
                <>
                  <StatRow 
                    label="Total Amount"   
                    value={formatCurrency(report.refillAppTransactions.total_dispensing_amount)} 
                  />
                  <StatRow 
                    label="Total Quantity" 
                    value={formatNumber(report.refillAppTransactions.total_dispensing_quantity)} 
                  />
                </>
              ) : (
                <p className="text-sm text-gray-400">No transactions found.</p>
              )}
            </Card>
          </div>

          {/* ── Row 3: Neem Topups & Cash Collection ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Neem Topups" color="bg-violet-500">
              <StatRow 
                label="Total Topup"            
                value={formatCurrency(report.neemTopups?.total_topup)} 
              />
              <StatRow 
                label="Remaining Balance"      
                value={formatCurrency(report.neemTopups?.total_remaining_balance)} 
              />
            </Card>

            <Card title="Cash Collection" color="bg-rose-500">
              <StatRow 
                label="Cash Received" 
                value={formatCurrency(report.cashCollection?.cash_received)} 
              />
            </Card>
          </div>

          {/* ── Row 4: Cash To Be Collected ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Cash To Be Collected" color="bg-amber-500">
              <StatRow 
                label="Total Amount" 
                value={formatCurrency(report.cashToBeCollected)} 
              />
            </Card>

            <Card title="Cash Transactions To Be Collected (Details)" color="bg-orange-500">
              {report.cashTransactionToBeCollect && report.cashTransactionToBeCollect.length > 0 ? (
                <div className="space-y-2">
                  {report.cashTransactionToBeCollect.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2">
                      <StatRow 
                        label="Amount" 
                        value={formatCurrency(item.total_cash_transaction)} 
                      />
                      <StatRow 
                        label="Quantity" 
                        value={formatNumber(item.total_cash_quantity)} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No pending collections.</p>
              )}
            </Card>
          </div>

          {/* ── Row 5: Remaining Stock ── */}
          <div className="grid grid-cols-1 gap-6">
            <Card title="Remaining Stock" color="bg-cyan-500">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <StatRow 
                    label="Total Inserted" 
                    value={formatNumber(report.remainingStock?.total_inserted_quantity)} 
                  />
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <StatRow 
                    label="Total Dispensed" 
                    value={formatNumber(report.remainingStock?.total_dispensed_quantity)} 
                  />
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <StatRow 
                    label="Current Stock" 
                    value={formatNumber(report.remainingStock?.current_stock)} 
                  />
                </div>
              </div>
            </Card>
          </div>

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