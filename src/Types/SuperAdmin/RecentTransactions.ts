export type ApiTransaction = {
  user_name: string;
  id: number;
  msisdn: string;
  quantity: number;
  amount: string;
  created_at: string;
  merchant: string;
  machine_code: string;
  brand_id: number;
  user_id?: string;
  brand_name: string;
  merchantCheck?: string;
};

export type ButterflyApiResponse = {
  data: {
    cashTransactions: ApiTransaction[];
    onlineTransactions: ApiTransaction[];
  };
  page: number;
  pageLimit: number;
  totalCashPages: number;
  totalOnlinePages: number;
  totalCount: number;
};

export type OtherApiResponse = {
  data: ApiTransaction[];
  page: number;
  pagelimit: number;
  totalPages: number;
  totalCount: number;
};

export type Transactions = {
  user_name: string;
  id: number;
  msisdn: string;
  quantity: number;
  amount: string;
  created_at: string;
  merchant: string;
  machine_code: string;
  brand_id: number;
  user_id?: string;
  brand_name: string;
  merchantCheck?: string;
  paymentType?: string;
};
