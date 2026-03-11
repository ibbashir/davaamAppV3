import React, { useState } from "react";
import { postRequest } from "@/Apis/Api";

const FinanceReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format as PKR currency
  const formatCurrency = (amount) => {
    if (amount == null) return "0";
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num == null) return "0";
    return new Intl.NumberFormat("en-IN").format(num);
  };

  // Helper to safely parse number from string or number
  const toNumber = (val) => {
    if (val == null) return 0;
    return typeof val === "number" ? val : parseFloat(val) || 0;
  };

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
      const res = await postRequest("/finance/financeReport", {
        startDate,
        endDate,
      });
      // res.data contains the actual report data (based on the provided structure)
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Safely extract data
  const cash = report?.cashTransactions || {};
  const appTransactions = report?.appTransactions || [];
  const neem = report?.neemTopups || {};
  const collection = report?.cashCollection || {};

  // Sum all app transaction amounts and quantities (convert to number)
  const totalAppAmount = appTransactions.reduce(
    (sum, t) => sum + toNumber(t.total_sanitary_amount),
    0
  );
  const totalAppQuantity = appTransactions.reduce(
    (sum, t) => sum + toNumber(t.total_sanitary_quantity),
    0
  );

  // Neem topups total (already provided, but ensure it's a number)
  const neemTotal = toNumber(neem.total_topup);

  // Neem transactions list (if available)
  const neemTransactions = neem.transactions || [];

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Finance Report
      </h2>

      {/* Filter Section */}
      <div className="flex flex-wrap gap-4 items-end mb-8 bg-gray-50 p-5 rounded-xl shadow-sm">
        <div className="flex flex-wrap gap-5 flex-1">
          <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-56 max-w-full focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-56 max-w-full focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 h-11 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Get Report"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 mb-6 bg-red-100 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center gap-3 p-6 justify-center text-gray-600">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p>Loading report...</p>
        </div>
      )}

      {/* Report Cards */}
      {report && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {/* Cash Transactions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
              Cash Transactions
            </h4>
            <p className="text-gray-700 mb-2">
              Amount: <strong>{formatCurrency(toNumber(cash.total_cash_transaction))}</strong>
            </p>
            <p className="text-gray-700">
              Quantity: <strong>{formatNumber(toNumber(cash.total_cash_quantity))}</strong>
            </p>
          </div>

          {/* Sanitary App Transactions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
              Sanitary App Transactions
            </h4>
            {appTransactions.length === 0 ? (
              <p className="text-gray-700">No transactions</p>
            ) : (
              <>
                <p className="text-gray-700 mb-2">
                  Amount: <strong>{formatCurrency(totalAppAmount)}</strong>
                </p>
                <p className="text-gray-700 mb-2">
                  Quantity: <strong>{formatNumber(totalAppQuantity)}</strong>
                </p>
                {appTransactions.length > 1 && (
                  <details className="mt-3 text-sm text-gray-600">
                    <summary className="cursor-pointer font-medium text-blue-600">
                      View details
                    </summary>
                    {appTransactions.map((t, idx) => (
                      <div key={idx} className="pl-2 border-l-2 border-gray-300 mt-2">
                        {t.sanitary_name && <span>{t.sanitary_name}: </span>}
                        {formatCurrency(toNumber(t.total_sanitary_amount))} (Qty:{" "}
                        {formatNumber(toNumber(t.total_sanitary_quantity))})
                      </div>
                    ))}
                  </details>
                )}
              </>
            )}
          </div>

          {/* Neem Topups */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
              Neem Topups
            </h4>
            <p className="text-gray-700 mb-2">
              Total: <strong>{formatCurrency(neemTotal)}</strong>
            </p>
            {neemTransactions.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-1">
                  {neemTransactions.length} transaction(s)
                </p>
                {neemTransactions.length > 1 ? (
                  <details className="mt-2 text-sm text-gray-600">
                    <summary className="cursor-pointer font-medium text-blue-600">
                      View details
                    </summary>
                    {neemTransactions.map((t, idx) => (
                      <div key={idx} className="pl-2 border-l-2 border-gray-300 mt-2 text-xs">
                        <div>{t.full_name || "Unknown"} - {t.mobile_number}</div>
                        <div>Amount: {formatCurrency(toNumber(t.amount))} • {t.status}</div>
                        {t.remaining_balance && (
                          <div className="text-gray-400 truncate">Remaining Balance: {t.remaining_balance}</div>
                        )}
                      </div>
                    ))}
                  </details>
                ) : (
                  // Show single transaction details inline
                  <div className="mt-2 text-sm text-gray-600 pl-2 border-l-2 border-gray-300">
                    <div>{neemTransactions[0].full_name || "Unknown"} - {neemTransactions[0].mobile_number}</div>
                    <div>Amount: {formatCurrency(toNumber(neemTransactions[0].amount))} • {neemTransactions[0].status}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cash Collection */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
              Cash Collection
            </h4>
            <p className="text-gray-700">
              <strong>{formatCurrency(toNumber(collection.cash_received))}</strong>
            </p>
          </div>
        </div>
      )}

      {/* No data message */}
      {!report && !loading && !error && (
        <p className="text-center text-gray-400 py-10 text-lg">
          Select a date range and click "Get Report" to view data.
        </p>
      )}
    </div>
  );
};

export default FinanceReport;