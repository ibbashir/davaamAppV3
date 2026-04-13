import React from "react";
import StatCard from "./StatCard";
import { formatCurrency, formatNumber, toNumber } from "./utils";
import type { AppTransaction } from "./types";

interface Props {
  transactions: AppTransaction[];
}

const AppTransactionCard: React.FC<Props> = ({ transactions }) => {
  const totalAmount = transactions.reduce(
    (sum, t) => sum + toNumber(t.total_sanitary_amount), 0
  );
  const totalQuantity = transactions.reduce(
    (sum, t) => sum + toNumber(t.total_sanitary_quantity), 0
  );

  return (
    <StatCard title="Sanitary App Transactions">
      {transactions.length === 0 ? (
        <p className="text-gray-700">No transactions</p>
      ) : (
        <>
          <p className="text-gray-700 mb-2">
            Amount: <strong>{formatCurrency(totalAmount)}</strong>
          </p>
          <p className="text-gray-700 mb-2">
            Quantity: <strong>{formatNumber(totalQuantity)}</strong>
          </p>
          {transactions.length > 1 && (
            <details className="mt-3 text-sm text-gray-600">
              <summary className="cursor-pointer font-medium text-blue-600">
                View details
              </summary>
              {transactions.map((t, idx) => (
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
    </StatCard>
  );
};

export default AppTransactionCard;