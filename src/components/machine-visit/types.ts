export type VisitMachine = {
  machine_code: string;
  machine_name?: string;
  machine_location?: string;
  status?: string;
};

export type Brand = {
  id: number;
  name: string;
  price?: string | number;
  litre_price?: string | number;
};

/** Latest filling per brand, as returned by machineDetailsWithMachineCode. */
export type LegacyFilling = {
  brand_id: number;
  epoch_time?: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  stockedby?: string | null;
  quantity?: number;
  litres?: string;
  lastBatchRefill?: number;
  stockOut?: number;
  currentStock?: number;
  last_Quantity?: string | number;
  remainingQuantity?: number;
};

export type StockUnit = "pcs" | "L";

export type ProductStock = {
  brand_id: number;
  name: string;
  price: number;
  last_refill_at: number | null;
  batch_number: string | null;
  expiry_date: string | null;
  stocked_by: string | null;
  loaded: number | null;
  sold_since_refill: number;
  remaining: number | null;
};

export type Refill = {
  refilled_at: number;
  ends_at: number | null;
  batch_number: string | null;
  stocked_by: string | null;
  expiry_date: string | null;
  items: { brand_id: number; name: string; quantity: number }[];
  total_loaded: number;
  sold: { transactions: number; units: number; revenue: number };
};

/** One page of refill history, newest first. products is omitted with withStock: false. */
export type RefillsResponse = {
  unit: StockUnit;
  products?: ProductStock[];
  latestRefill: Refill | null;
  refills: Refill[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Transaction = {
  id: number;
  msisdn: string | null;
  brand_id: number;
  amount: string | number;
  quantity: number;
  merchant?: string | null;
  payment_method?: string;
  is_staff?: boolean;
  machine_code: string;
  created_at: string;
  epoch_time?: number;
};

export type TransactionPage = {
  transactions: Transaction[];
  total: number;
  totalPages: number;
};

export type SeriesPoint = {
  key: string;
  transactions: number;
  units: number;
  revenue: number;
};

export type TransactionSummary = {
  unit: StockUnit;
  totals: {
    transactions: number;
    units: number;
    revenue: number;
    first_at: number | null;
    last_at: number | null;
    active_days: number;
  };
  payments: { method: string; transactions: number; revenue: number }[];
  products: {
    brand_id: number;
    name: string;
    transactions: number;
    units: number;
    revenue: number;
  }[];
  customers: {
    unique: number;
    returning: number;
    oneTime: number;
    repeatRate: number;
    identifiedTransactions: number;
    anonymousTransactions: number;
    staffTransactions: number;
    frequency: {
      once: number;
      twoToThree: number;
      fourToTen: number;
      moreThanTen: number;
    };
    top: {
      msisdn: string;
      transactions: number;
      revenue: number;
      last_at: number | null;
    }[];
  };
  byHour: number[];
  byWeekday: number[];
  series: SeriesPoint[] | null;
};

/**
 * Which slice of transactions the Transactions and Insights tabs look at.
 * A refill period runs from that refill up to the next one (or now).
 */
export type Period =
  | { kind: "all" }
  | { kind: "month"; month: string }
  | { kind: "refill"; refill: Refill };

export type PeriodFilter = {
  period: Period;
  brandId: string;
};
