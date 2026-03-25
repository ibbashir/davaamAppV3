import React from "react";
import StatCard from "./StatCard";
import { formatCurrency, toNumber } from "./utils";

interface CashCollection {
  cash_received: number | string | null;
}

interface Props {
  data: CashCollection;
}

const CashCollectionCard: React.FC<Props> = ({ data }) => (
  <StatCard title="Cash Collection">
    <p className="text-gray-700">
      <strong>{formatCurrency(toNumber(data.cash_received))}</strong>
    </p>
  </StatCard>
);

export default CashCollectionCard;