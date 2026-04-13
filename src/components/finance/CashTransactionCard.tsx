import React from "react";
import StatCard from "./StatCard";
import { formatCurrency, formatNumber, toNumber } from "./utils";
import type { CashTransaction } from "./types";

interface Props {
  data: CashTransaction;
}

const CashTransactionCard: React.FC<Props> = ({ data }) => (
  <StatCard title="Cash Transactions">
    <p className="text-gray-700 mb-2">
      Amount: <strong>{formatCurrency(toNumber(data.total_cash_transaction))}</strong>
    </p>
    <p className="text-gray-700">
      Quantity: <strong>{formatNumber(toNumber(data.total_cash_quantity))}</strong>
    </p>
  </StatCard>
);

export default CashTransactionCard;