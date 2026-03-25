export interface CashTransaction {
  total_cash_transaction: number | string | null;
  total_cash_quantity: number | string | null;
}

export interface AppTransaction {
  total_sanitary_amount: number | string | null;
  total_sanitary_quantity: number | string | null;
  sanitary_name?: string;
}

export interface NeemTransaction {
  full_name?: string;
  mobile_number: string;
  amount: number | string | null;
  status: string;
  remaining_balance?: number | string | null;
}

export interface NeemTopups {
  total_topup: number | string | null;
  transactions: NeemTransaction[];
}

export interface CashCollection {
  cash_received: number | string | null;
}

export interface FinanceReportData {
  cashTransactions: CashTransaction;
  appTransactions: AppTransaction[];
  neemTopups: NeemTopups;
  cashCollection: CashCollection;
}