import {
  IconChevronLeft,
  IconChevronsLeft,
  IconChevronRight,
  IconChevronsRight,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import moment from "moment";

interface TopupHistoryData {
  amount: string;
  corporate_name: string;
  created_at: string;
  epoch_time: number;
  id: number;
  purpose_of_payment: string;
  uuid: string;
}

interface PaginationState {
  current_page: number;
  limit: number;
  total_records: number;
  total_pages: number;
}

interface CorporateStats {
  totalEmployees: number;
  total_sum: number;
  total_companies: number;
  total_topups: number;
  overall_topups: number;
  data: TopupHistoryData[];
}

interface CorporateHistoryProps {
  loading: boolean;
  corporates: CorporateStats;
  error: string | null;
  pagination: PaginationState;
  fetchCorporates: (page: number, limit: number) => Promise<void>;
}

const CorporateHistory = ({
  loading, 
  corporates, 
  error, 
  pagination, 
  fetchCorporates
}: CorporateHistoryProps) => {

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchCorporates(newPage, pagination.limit);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-teal-600 font-medium">
          Loading corporate data...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-teal-700">
              {corporates.total_sum.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total topup amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {corporates.totalEmployees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Overall Monthly Topup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {corporates.overall_topups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {corporates.total_companies.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Registered companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Topups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {corporates.total_topups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Transactions count</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Topup History</CardTitle>
          <CardDescription>
            List of all corporate top-up transactions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table className="rounded-2xl overflow-hidden">
              <TableHeader>
                <TableRow className="bg-teal-600 text-white hover:bg-teal-600">
                  <TableHead className="font-semibold text-white bg-teal-600 border-none rounded-tl-2xl">
                    Company Name
                  </TableHead>
                  <TableHead className="font-semibold text-white bg-teal-600 border-none">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold text-white bg-teal-600 border-none">
                    Purpose
                  </TableHead>
                  <TableHead className="font-semibold text-white bg-teal-600 border-none rounded-tr-2xl">
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {corporates.data.length > 0 ? (
                  corporates.data.map((corporate) => (
                    <TableRow key={corporate.id}>
                      <TableCell className="font-medium">
                        {corporate.corporate_name || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold text-teal-700">
                        Rs: {corporate.amount || "0.00"}
                      </TableCell>
                      <TableCell>
                        {corporate.purpose_of_payment || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {corporate.created_at
                          ? moment
                            .utc(corporate.created_at)
                            .format("DD-MM-YYYY")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-gray-500"
                    >
                      No corporate records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 mt-4">
              <div className="hidden text-sm text-muted-foreground lg:flex">
                Showing {corporates.data.length} of {pagination.total_records} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden lg:flex bg-transparent"
                  disabled={pagination.current_page === 1}
                  onClick={() => handlePageChange(1)}
                >
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  disabled={pagination.current_page === 1}
                  onClick={() =>
                    handlePageChange(Math.max(1, pagination.current_page - 1))
                  }
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {pagination.current_page} of{" "}
                  {pagination.total_pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  disabled={pagination.current_page === pagination.total_pages}
                  onClick={() =>
                    handlePageChange(
                      Math.min(
                        pagination.total_pages,
                        pagination.current_page + 1
                      )
                    )
                  }
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden lg:flex bg-transparent"
                  disabled={pagination.current_page === pagination.total_pages}
                  onClick={() => handlePageChange(pagination.total_pages)}
                >
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateHistory;