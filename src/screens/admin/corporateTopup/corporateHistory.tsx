"use client";

import React, { useState, useEffect } from "react";
import { getRequest } from "@/Apis/Api";
import moment from "moment";
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

const CorporateHistory = ({ onBack }) => {
  const [corporates, setCorporates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0,
  });

  // Fetch data with pagination
  const fetchCorporates = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await getRequest(
        `/admin/getCorporateTopupHistory?page=${page}&limit=${limit}`
      );

      if (response && response.data) {
        setCorporates(response.data);
        setPagination(
          response.pagination || {
            current_page: page,
            limit: limit,
            total_records: response.total_topups || 0,
            total_pages: Math.ceil((response.total_topups || 0) / limit),
          }
        );
      }
    } catch (err) {
      console.error("Error fetching corporates:", err);
      setError("Failed to load corporate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorporates(1, 10);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-normal text-gray-800">
          Corporate Topup History
        </h2>
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {pagination.total_records}
            </div>
            <p className="text-xs text-muted-foreground">
              All topup transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Current Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {pagination.current_page} / {pagination.total_pages || 1}
            </div>
            <p className="text-xs text-muted-foreground">Pagination view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Records Displayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-800">
              {corporates.length}
            </div>
            <p className="text-xs text-muted-foreground">On current page</p>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 text-white hover:bg-teal-600">
                  <TableHead className="text-center font-semibold text-white bg-teal-600 border-none rounded-tl-2xl">
                    Company Name
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                    Amount
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                    Purpose
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white bg-teal-600 border-none rounded-tr-2xl">
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {corporates.length > 0 ? (
                  corporates.map((corporate) => (
                    <TableRow key={corporate.id}>
                      <TableCell className="text-center font-medium">
                        {corporate.corporate_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-center text-teal-700 font-semibold">
                        Rs: {corporate.amount || "0.00"}
                      </TableCell>
                      <TableCell className="text-center">
                        {corporate.purpose_of_payment || "N/A"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {corporate.created_at
                          ? moment
                              .utc(corporate.created_at)
                              .format("YYYY-MM-DD HH:mm:ss")
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
                Showing {corporates.length} of {pagination.total_records} records
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
