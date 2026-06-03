import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, User, Phone, Cpu, Banknote, Package, Tag, Calendar, Link } from "lucide-react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getRequest } from "@/Apis/Api";
import type {
  ApiTransaction,
  ButterflyApiResponse,
  OtherApiResponse,
  Transactions,
} from "@/Types/SuperAdmin/RecentTransactions";
import { categories, paymentTypes } from "@/constants/Constant";
import { formatDateTime } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

function MobileTransactionCard({ transaction, onMachineCodeClick }: { transaction: ApiTransaction; onMachineCodeClick: (code: string) => void }) {
  const t = transaction as Transactions;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm truncate flex items-center gap-1.5">
          <User className="size-3.5 shrink-0 text-teal-600" />
          {transaction.user_name || transaction.merchant || "N/A"}
        </p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0 flex items-center gap-1">
          <Banknote className="size-3.5 shrink-0" />
          Rs. {transaction.amount}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-teal-600 flex items-center gap-1">
            <Phone className="size-3 shrink-0" />
            Phone / RFID
          </p>
          <p className="font-mono text-xs truncate">{transaction.msisdn}</p>
        </div>
        <div>
          <p className="text-xs text-teal-600 flex items-center gap-1">
            <Cpu className="size-3 shrink-0" />
            Machine Code
          </p>
          <p className="font-medium text-teal-600 text-xs cursor-pointer hover:underline" onClick={() => onMachineCodeClick(transaction.machine_code)}>{transaction.machine_code}</p>
        </div>
        <div>
          <p className="text-xs text-teal-600 flex items-center gap-1">
            <Package className="size-3 shrink-0" />
            Quantity
          </p>
          <p className="text-xs font-medium">{transaction.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-teal-600 flex items-center gap-1">
            <Tag className="size-3 shrink-0" />
            Brand
          </p>
          <p className="text-xs font-medium truncate">{transaction.brand_name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-teal-600 pt-1 border-t">
        <span className="tabular-nums flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          {formatDateTime(transaction.created_at)}
        </span>
        {t.paymentType && (
          <Badge variant="secondary" className="text-xs capitalize">
            {t.paymentType}
          </Badge>
        )}
      </div>
    </div>
  );
}

function MobileTransactionSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex items-center justify-between pt-1 border-t">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

const RecentTransactions = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("butterfly");
  const [activePaymentType, setActivePaymentType] = useState("online");
  const [recentTransactions, setRecentTransactions] = useState<
    ApiTransaction[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pageSize, setPageSize] = useState(isMobile ? 5 : 10);

  useEffect(() => {
    setPageSize(isMobile ? 5 : 10);
    setCurrentPage(1);
  }, [isMobile]);

  const fetchLatestTransactions = async (page = 1, size = pageSize) => {
    try {
      setLoading(true);

      if (activeCategory === "butterfly") {
        const res = await getRequest<ButterflyApiResponse>(
          `/superadmin/getAllButterflyTransactions/${activeCategory}?page=${page}&limit=${size}`,
        );

        // Combine both cash and online transactions with payment type info
        const cashTransactions = res.data.cashTransactions.map((t) => ({
          ...t,
          paymentType: "cash" as const,
        }));
        const onlineTransactions = res.data.onlineTransactions.map((t) => ({
          ...t,
          paymentType: "online" as const,
        }));

        setRecentTransactions([...onlineTransactions, ...cashTransactions]);
        setTotalCount(res.totalCount);
        // For butterfly, we need to calculate total pages based on payment type
        if (activePaymentType === "cash") {
          setTotalPages(res.totalCashPages);
        } else {
          setTotalPages(res.totalOnlinePages);
        }
      } else {
        const res = await getRequest<OtherApiResponse>(
          `/superadmin/getAllButterflyTransactions/${activeCategory}?page=${page}&limit=${size}`,
        );

        // For other categories, add a default payment type
        const transactionsWithPaymentType = res.data.map((t) => ({
          ...t,
          paymentType: "online" as const, // Default for non-butterfly categories
        }));

        setRecentTransactions(transactionsWithPaymentType);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      }
    } catch (error: unknown) {
      console.error("Error fetching transactions:", error);
      setRecentTransactions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const searchTransactions = async (
    searchQuery: string,
    page = 1,
    size = pageSize,
  ) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      fetchLatestTransactions(page, size);
      return;
    }

    try {
      setLoading(true);
      setIsSearching(true);

      if (activeCategory === "butterfly") {
        const res = await getRequest<ButterflyApiResponse>(
          `/superadmin/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}&limit=${size}`,
        );

        // Combine both cash and online transactions with payment type info
        const cashTransactions = res.data.cashTransactions.map((t) => ({
          ...t,
          paymentType: "cash" as const,
        }));
        const onlineTransactions = res.data.onlineTransactions.map((t) => ({
          ...t,
          paymentType: "online" as const,
        }));

        setRecentTransactions([...onlineTransactions, ...cashTransactions]);
        setTotalCount(res.totalCount);
        if (activePaymentType === "cash") {
          setTotalPages(res.totalCashPages);
        } else {
          setTotalPages(res.totalOnlinePages);
        }
      } else {
        const res = await getRequest<OtherApiResponse>(
          `/superadmin/searchRecentTransactions/${activeCategory}/${searchQuery}?page=${page}&limit=${size}`,
        );

        const transactionsWithPaymentType = res.data.map((t) => ({
          ...t,
          paymentType: "online" as const,
        }));

        setRecentTransactions(transactionsWithPaymentType);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      }
    } catch (error: unknown) {
      console.error("Error searching transactions:", error);
      setRecentTransactions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected filters
  const filteredTransactions = recentTransactions.filter((transaction) => {
    if (activeCategory === "butterfly") {
      return (transaction as Transactions).paymentType === activePaymentType;
    }
    return true; // For other categories, show all transactions
  });

  // Get counts for payment types (only for butterfly)
  const getPaymentTypeCount = (paymentType: string) => {
    if (activeCategory !== "butterfly") return 0;
    return recentTransactions.filter(
      (t: Transactions) => t.paymentType === paymentType,
    ).length;
  };

  useEffect(() => {
    const loadData = () => {
      if (searchTerm.trim()) {
        searchTransactions(searchTerm, currentPage, pageSize);
      } else {
        fetchLatestTransactions(currentPage, pageSize);
      }
    };

    loadData();
  }, [activeCategory, currentPage, activePaymentType, pageSize]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
    setSearchTerm(""); // Clear search when changing category
    setIsSearching(false);
    if (categoryId === "butterfly") {
      setActivePaymentType("online"); // Reset to online when switching to butterfly
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (searchTerm.trim()) {
      searchTransactions(searchTerm, 1, pageSize);
    } else {
      setIsSearching(false);
      fetchLatestTransactions(1, pageSize);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If search is cleared, fetch all transactions
    if (!value.trim()) {
      setIsSearching(false);
      setCurrentPage(1);
      fetchLatestTransactions(1, pageSize);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePaymentTypeChange = (paymentType: string) => {
    setActivePaymentType(paymentType);
    setCurrentPage(1); // Reset to first page when changing payment type
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = Number(size);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="space-y-4 px-3 sm:px-4 md:px-6 pb-6">
      {/* <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        {totalCount > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-teal-600 tabular-nums">
            {totalCount.toLocaleString()}
          </span>
        )}
      </div> */}

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal-600" />
              <Input
                placeholder="Search by phone number, user name, or machine code..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="pl-10"
              />
            </form>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleCategoryChange(category.id)}
                  className={
                    activeCategory === category.id
                      ? "bg-teal-600 hover:bg-teal-700"
                      : ""
                  }
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Payment Type Filters - Only show for Butterfly category */}
            {activeCategory === "butterfly" && (
              <div className="flex flex-wrap gap-2">
                {paymentTypes.map((paymentType) => (
                  <Button
                    key={paymentType.id}
                    variant={
                      activePaymentType === paymentType.id
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handlePaymentTypeChange(paymentType.id)}
                    className={
                      activePaymentType === paymentType.id
                        ? "bg-teal-600 hover:bg-teal-700"
                        : ""
                    }
                  >
                    {paymentType.label} ({getPaymentTypeCount(paymentType.id)})
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {loading ? (
              Array.from<null>({ length: 5 }).map((_, i) => (
                <MobileTransactionSkeleton key={i} />
              ))
            ) : filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-teal-600">
                {isSearching
                  ? "No transactions found for your search."
                  : "No transactions found for the selected filters."}
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <MobileTransactionCard key={transaction.id} transaction={transaction} onMachineCodeClick={() => navigate(`/superadmin/machine-details/${transaction.machineNavigate}`, {
                  state: { machine: { machine_code: transaction.machineNavigate } }
                })} />
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-hidden rounded-t-lg border border-gray-200 shadow-sm">
            <Table>
              <TableHeader className="bg-teal-600">
                <TableRow>
                  {[
                    "User Name",
                    "Phone Number / RFID",
                    "Machine Code",
                    "Amount",
                    "Quantity",
                    "Brand Name",
                    "Date",
                  ].map((head) => (
                    <TableHead key={head} className="!text-white font-semibold">
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {isSearching
                        ? "No transactions found for your search."
                        : "No transactions found for the selected filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          <User className="size-3.5 text-teal-600 shrink-0" />
                          {transaction.user_name || transaction.merchant || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-teal-600 shrink-0" />
                          {transaction.msisdn}
                        </span>
                      </TableCell>
                      <TableCell
                        className="font-medium text-teal-600 cursor-pointer hover:underline"
                        onClick={() =>
                          navigate(`/superadmin/machine-details/${transaction.machineNavigate}`, {
                            state: { machine: { machine_code: transaction.machineNavigate } }
                          })
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          <Link className="size-3.5 shrink-0" />
                          <span>{transaction.machine_code}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit"
                        >
                          <Banknote className="size-3.5 shrink-0" />
                          Rs. {transaction.amount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <Package className="size-3.5 text-teal-600 shrink-0" />
                          {transaction.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          <Tag className="size-3.5 text-teal-600 shrink-0" />
                          {transaction.brand_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-teal-600 shrink-0" />
                          {formatDateTime(transaction.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination starts */}
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">

            <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:justify-start sm:gap-6">

              <p className="text-sm text-muted-foreground tabular-nums">
                {totalCount.toLocaleString()} trans..
                {isSearching && (
                  <span className="ml-1 italic">— "{searchTerm}"</span>
                )}
              </p>

              <div className="flex items-center gap-2">
                <Label
                  htmlFor="rows-per-page-txn"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Rows per page
                </Label>
                <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
                  <SelectTrigger size="sm" className="w-16" id="rows-per-page-txn">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 40, 50].map((ps) => (
                      <SelectItem key={ps} value={`${ps}`}>
                        {ps}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>


            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
              >
                <span className="sr-only">First page</span>
                <IconChevronsLeft className="size-4 text-violet-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <span className="sr-only">Previous page</span>
                <IconChevronLeft className="size-4 text-blue-500" />
              </Button>
              <span className="px-2 text-sm font-medium tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                <span className="sr-only">Next page</span>
                <IconChevronRight className="size-4 text-teal-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
              >
                <span className="sr-only">Last page</span>
                <IconChevronsRight className="size-4 text-emerald-500" />
              </Button>
            </div>
          </div>

          {/* Pagination ends */}

        </CardContent>
      </Card>
    </div>
  );
};

export default RecentTransactions;
