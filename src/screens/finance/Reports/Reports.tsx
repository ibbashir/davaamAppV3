import React, { useState } from "react";
import { postRequest } from "@/Apis/Api";
import ReportFilters from "@/components/finance/reportFilter";
import { SiteHeader } from "@/components/finance/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Banknote,
  Smartphone,
  Wallet,
  Droplets,
  Boxes,
  AlertCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";

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
  <div className="flex justify-between items-center py-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold">
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  </div>
);

const StatCard = ({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  children: React.ReactNode;
}) => (
  <Card className="gap-0 py-0">
    <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-3 py-2">
      <Icon className={`h-4 w-4 ${iconClassName}`} />
      <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
    </CardHeader>
    <CardContent className="px-3 py-2">{children}</CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FinanceReport: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<FinanceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (typeof value === "string") {
      return parseFloat(value).toLocaleString();
    }
    return (value || 0).toLocaleString();
  };

  return (
    <div>
      <SiteHeader title="Finance Report" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Generate cash, app and stock reports for a date range</p>
        </div>

        <Card>
          <CardContent className="pt-0">
            <ReportFilters
              startDate={startDate}
              endDate={endDate}
              loading={loading}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onFetch={fetchReport}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Loading report...</p>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <StatCard title="Sanitary Cash" icon={Banknote} iconClassName="text-blue-500">
                <StatRow
                  label="Amount"
                  value={formatCurrency(report.sanitaryCashTransactions?.total_cash_transaction)}
                />
                <StatRow
                  label="Quantity"
                  value={formatNumber(report.sanitaryCashTransactions?.total_cash_quantity)}
                />
              </StatCard>

              <StatCard title="Refill Cash" icon={Banknote} iconClassName="text-indigo-500">
                <StatRow
                  label="Amount"
                  value={formatCurrency(report.refillCashTransactions?.total_cash_transaction)}
                />
                <StatRow
                  label="Quantity"
                  value={formatNumber(report.refillCashTransactions?.total_cash_quantity)}
                />
              </StatCard>

              <StatCard title="Sanitary App" icon={Smartphone} iconClassName="text-emerald-500">
                {report.sanitaryAppTransactions ? (
                  <>
                    <StatRow
                      label="Amount"
                      value={formatCurrency(report.sanitaryAppTransactions.total_sanitary_amount)}
                    />
                    <StatRow
                      label="Quantity"
                      value={formatNumber(report.sanitaryAppTransactions.total_sanitary_quantity)}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No data.</p>
                )}
              </StatCard>

              <StatCard title="Refill App" icon={Smartphone} iconClassName="text-teal-500">
                {report.refillAppTransactions ? (
                  <>
                    <StatRow
                      label="Amount"
                      value={formatCurrency(report.refillAppTransactions.total_dispensing_amount)}
                    />
                    <StatRow
                      label="Quantity"
                      value={formatNumber(report.refillAppTransactions.total_dispensing_quantity)}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No data.</p>
                )}
              </StatCard>

              <StatCard title="Neem Topups" icon={Droplets} iconClassName="text-violet-500">
                <StatRow label="Topup" value={formatCurrency(report.neemTopups?.total_topup)} />
                <StatRow
                  label="Balance"
                  value={formatCurrency(report.neemTopups?.total_remaining_balance)}
                />
              </StatCard>

              <StatCard title="Cash Collection" icon={Wallet} iconClassName="text-rose-500">
                <StatRow
                  label="Received"
                  value={formatCurrency(report.cashCollection?.cash_received)}
                />
              </StatCard>

              <StatCard title="To Be Collected" icon={Wallet} iconClassName="text-amber-500">
                <StatRow label="Amount" value={formatCurrency(report.cashToBeCollected)} />
              </StatCard>

              <StatCard title="Remaining Stock" icon={Boxes} iconClassName="text-cyan-500">
                <StatRow
                  label="Inserted"
                  value={formatNumber(report.remainingStock?.total_inserted_quantity)}
                />
                <StatRow
                  label="Dispensed"
                  value={formatNumber(report.remainingStock?.total_dispensed_quantity)}
                />
                <StatRow
                  label="Current"
                  value={formatNumber(report.remainingStock?.current_stock)}
                />
              </StatCard>
            </div>

            {report.cashTransactionToBeCollect && report.cashTransactionToBeCollect.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-orange-500" />
                    Pending Collection Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {report.cashTransactionToBeCollect.map((item, i) => (
                      <div key={i} className="bg-muted/50 rounded-md p-2">
                        <StatRow label="Amount" value={formatCurrency(item.total_cash_transaction)} />
                        <StatRow label="Quantity" value={formatNumber(item.total_cash_quantity)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!report && !loading && !error && (
          <p className="text-center text-muted-foreground py-10 text-sm">
            Select a date range and click "Get Report" to view data.
          </p>
        )}
      </div>
    </div>
  );
};

export default FinanceReport;
