import React from "react";
import StatCard from "./StatCard";
import { formatCurrency, toNumber } from "./utils";
import type { NeemTransaction } from "./types";

interface NeemTopups {
  total_topup: number | string | null;
  transactions: NeemTransaction[];
}

interface Props {
  data: NeemTopups;
}

const NeemTopupsCard: React.FC<Props> = ({ data }) => {
  const neemTotal = toNumber(data.total_topup);
  const transactions = data.transactions || [];

  return (
    <StatCard title="Neem Topups">
      <p className="text-gray-700 mb-2">
        Total: <strong>{formatCurrency(neemTotal)}</strong>
      </p>
      {transactions.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-1">
            {transactions.length} transaction(s)
          </p>
          {transactions.length > 1 ? (
            <details className="mt-2 text-sm text-gray-600">
              <summary className="cursor-pointer font-medium text-blue-600">
                View details
              </summary>
              {transactions.map((t, idx) => (
                <div key={idx} className="pl-2 border-l-2 border-gray-300 mt-2 text-xs">
                  <div>{t.full_name || "Unknown"} — {t.mobile_number}</div>
                  <div>Amount: {formatCurrency(toNumber(t.amount))} • {t.status}</div>
                  {t.remaining_balance && (
                    <div className="text-gray-400 truncate">
                      Remaining: {formatCurrency(toNumber(t.remaining_balance))}
                    </div>
                  )}
                </div>
              ))}
            </details>
          ) : (
            <div className="mt-2 text-sm text-gray-600 pl-2 border-l-2 border-gray-300">
              <div>{transactions[0].full_name || "Unknown"} — {transactions[0].mobile_number}</div>
              <div>Amount: {formatCurrency(toNumber(transactions[0].amount))} • {transactions[0].status}</div>
            </div>
          )}
        </>
      )}
    </StatCard>
  );
};

export default NeemTopupsCard;