import { useState, useMemo } from "react";
import { postRequest } from "@/Apis/Api";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
import { SiteHeader } from "@/components/corporate/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  Smartphone,
  Receipt,
  Download,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  created_at: string;
  brand_id?: number;
  machine_code?: string;
  merchant?: string;
  user_id?: string;
  brand_name?: string;
  transaction_number?: string;
  quantity?: string;
  machine_name?: string;
  // Add other fields as needed
}

type FilterMode = "month" | "range";

export default function Report() {
  const { state } = useAuth();
  const { user } = state;

  const machineCodes = useMemo(
    () =>
      Array.isArray(user?.machines)
        ? user.machines.map((m: { machine_code: number }) => m.machine_code)
        : [],
    [user?.machines]
  );

  const [data, setData] = useState<{
    statusCode?: number;
    overalltotal?: number;
    cashTotal?: number;
    onlineTotal?: number;
    totalCashCollected?:number,
    cashTransactions?: Transaction[];
    onlineTransactions?: Transaction[];
  }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const periodLabel =
    filterMode === "month" ? selectedDate : `${startDate}_to_${endDate}`;

  const getReports = async () => {
    setError("");

    if (machineCodes.length === 0) {
      setError("No machines available");
      return;
    }

    if (filterMode === "month") {
      if (!selectedDate) {
        setError("Please select a month");
        return;
      }
    } else {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates");
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError("End date cannot be before start date");
        return;
      }
    }

    setLoading(true);
    setData({});
    try {
      const payload: Record<string, unknown> = { machineCode: machineCodes };
      if (filterMode === "month") {
        payload.Month = selectedDate;
      } else {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      const response = await postRequest<{
        statusCode?: number;
        overalltotal?: number;
        cashTotal?: number;
        onlineTotal?: number;
        cashTransactions?: Transaction[];
        onlineTransactions?: Transaction[];
      }>("/corporates/reports", payload);
      setData(response);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getReports();
  };

  const exportToExcel = () => {
    if (!data.cashTransactions && !data.onlineTransactions) {
      alert("No data to export");
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add summary sheet
      const summaryData = [
        ["Transaction Summary", ""],
        ["Total Transactions", data.overalltotal || 0],
        ["Cash Transactions", data.cashTotal || 0],
        ["Online Transactions", data.onlineTotal || 0],
        [],
        ["Generated on", new Date().toLocaleString()],
        ["For period", periodLabel],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Add cash transactions sheet if data exists
      if (data.cashTransactions && data.cashTransactions.length > 0) {
        const mapCashTransactions = data.cashTransactions.map((txn) => ({
          ID: txn.id,
          "Employee ID": txn.user_id,
          Amount: txn.amount,
          Date: new Date(txn.created_at).toLocaleString(),
          "Machine Code": txn.machine_code,
          "Machine Name": txn.machine_name ?? "",
          Merchant: txn.merchant,
          "Transaction Number": txn.transaction_number ?? "",
          Quantity: txn.quantity ?? "",
        }));
        const cashWS = XLSX.utils.json_to_sheet(mapCashTransactions);
        XLSX.utils.book_append_sheet(wb, cashWS, "Cash Transactions");
      }

      // Add online transactions sheet if data exists
      if (data.onlineTransactions && data.onlineTransactions.length > 0) {
        const mapOnlineTransactions = data.onlineTransactions.map((txn) => ({
          ID: txn.id,
          "Employee ID": txn.user_id,
          Amount: txn.amount,
          Date: new Date(txn.created_at).toLocaleString(),
          "Machine Code": txn.machine_code,
          "Machine Name": txn.machine_name,
          Merchant: txn.merchant,
          "Brand ID": txn.brand_id ?? "",
          "Brand Name": txn.brand_name ?? "",
          "Transaction Number": txn.transaction_number ?? "",
          "Quantity": txn.quantity ?? "",
        }));

        const onlineWS = XLSX.utils.json_to_sheet(mapOnlineTransactions);
        XLSX.utils.book_append_sheet(wb, onlineWS, "Online Transactions");
      }

      // Generate file name with date
      const fileName = `transactions_report_${periodLabel || "all"}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel");
    }
  };

  return (
    <div>
      <SiteHeader title="📚 Transaction Report" />

      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Generate cash and online transaction reports by month or a custom date range
          </p>
          {data.overalltotal !== undefined && data.overalltotal > 0 && (
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Tabs
                value={filterMode}
                onValueChange={(v) => setFilterMode(v as FilterMode)}
              >
                <TabsList>
                  <TabsTrigger value="month">By Month</TabsTrigger>
                  <TabsTrigger value="range">By Date Range</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-end gap-4">
                {filterMode === "month" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="month">Month</Label>
                    <Input
                      id="month"
                      name="month"
                      type="month"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-44"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-44"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-44"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-700 hover:bg-teal-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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

        {!loading && data.overalltotal !== undefined && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-4 py-3">
                <Receipt className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <p className="text-2xl font-bold">{data.overalltotal}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-4 py-3">
                <Banknote className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-medium">Cash Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <p className="text-2xl font-bold">{data.cashTotal}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-4 py-3">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-medium">Online Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <p className="text-2xl font-bold">{data.onlineTotal}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b px-4 py-3">
                <Banknote className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                <p className="text-2xl font-bold">{data.totalCashCollected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && data.cashTransactions && data.cashTransactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4 text-blue-500" />
                Cash Transactions
              </CardTitle>
              <Badge variant="secondary">Count: {data.cashTotal}</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <TransactionTable transactions={data.cashTransactions} />
            </CardContent>
          </Card>
        )}

        {!loading && data.onlineTransactions && data.onlineTransactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                Online Transactions
              </CardTitle>
              <Badge variant="secondary">Count: {data.onlineTotal}</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <TransactionTable transactions={data.onlineTransactions} />
            </CardContent>
          </Card>
        )}

        {!loading && data.overalltotal === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No transactions found for the selected period.
          </p>
        )}

        {!loading && data.overalltotal === undefined && !error && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Select a month or date range and click "Generate Report" to view data.
          </p>
        )}
      </div>
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No transactions found</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Employee ID</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Machine Code</TableHead>
          <TableHead>Machine Name</TableHead>
          <TableHead>Merchant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="text-muted-foreground">{transaction.id}</TableCell>
            <TableCell className="text-muted-foreground">{transaction.user_id}</TableCell>
            <TableCell className="font-medium">{transaction.amount}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(transaction.created_at).toLocaleString()}
            </TableCell>
            <TableCell className="text-muted-foreground">{transaction.machine_code}</TableCell>
            <TableCell className="text-muted-foreground">
              {transaction.machine_name ?? "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">{transaction.merchant}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
