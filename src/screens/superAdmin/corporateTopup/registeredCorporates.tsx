"use client";

import React, { useState, useEffect } from "react";
import { getRequest, postRequest } from "@/Apis/Api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/superAdmin/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const RegisteredCorporatesList = ({ onBack }) => {
  const [corporates, setCorporates] = useState([]);
  const [filteredCorporates, setFilteredCorporates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCorporate, setSelectedCorporate] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch corporates
  useEffect(() => {
    const fetchCorporates = async () => {
      try {
        setLoading(true);
        const response = await getRequest("/superadmin/getAllCorporateClients");
        if (response && response.data) {
          setCorporates(response.data);
          setFilteredCorporates(response.data);
        }
      } catch (err) {
        console.error("Error fetching corporates:", err);
        setError("Failed to load corporate data");
      } finally {
        setLoading(false);
      }
    };

    fetchCorporates();
  }, []);

  // Filter corporates based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCorporates(corporates);
    } else {
      const filtered = corporates.filter((c) =>
        (c.corporate_name || c.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredCorporates(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, corporates]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCorporates.length / itemsPerPage);
  const paginatedData = filteredCorporates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Fixed: render machine codes properly (handles array, JSON string, comma-separated)
  const renderMachineCodes = (machineCodes: any) => {
    if (!machineCodes)
      return <span className="text-gray-400 italic">No machines</span>;

    let codesArray: string[] = [];

    if (Array.isArray(machineCodes)) {
      codesArray = machineCodes;
    } else if (typeof machineCodes === "string") {
      try {
        const parsed = JSON.parse(machineCodes);
        if (Array.isArray(parsed)) {
          codesArray = parsed;
        } else if (typeof parsed === "string") {
          codesArray = parsed.split(",").map((c) => c.trim());
        } else {
          codesArray = [machineCodes];
        }
      } catch {
        codesArray = machineCodes.split(",").map((c) => c.trim());
      }
    }

    if (codesArray.length === 0)
      return <span className="text-gray-400 italic">No machines</span>;

    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {codesArray.map((code, i) => (
          <Badge
            key={i}
            variant="outline"
            className="bg-teal-50 text-teal-700 border border-teal-200"
          >
            {code}
          </Badge>
        ))}
      </div>
    );
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
    <div>
      <SiteHeader title="" />
      <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">
              Corporates Dashboard
            </CardTitle>
            <CardDescription>
              List of all registered corporate clients
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden">
              <Table className="rounded-2xl overflow-hidden">
                <TableHeader>
                  <TableRow className="bg-teal-600 text-white hover:bg-teal-600">
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none rounded-tl-2xl">
                      Company Name
                    </TableHead>
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                      Location
                    </TableHead>
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                      Machine Codes
                    </TableHead>
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                      Topup Limit
                    </TableHead>
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none">
                      Created At
                    </TableHead>
                    <TableHead className="text-center font-semibold text-white bg-teal-600 border-none rounded-tr-2xl">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((corporate) => (
                      <TableRow key={corporate.id}>
                        <TableCell className="text-center font-medium">
                          {corporate.corporate_name || corporate.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          {corporate.location || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderMachineCodes(corporate.machine_codes)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-teal-700">
                          {corporate.topuplimit || "N/A"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {corporate.created_at
                            ? moment
                                .utc(corporate.created_at)
                                .format("YYYY-MM-DD HH:mm:ss")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCorporate(corporate);
                              setConfirmOpen(true);
                            }}
                          >
                            Topup
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No corporates found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredCorporates.length > 0 && (
              <div className="flex items-center justify-between px-4 mt-4">
                <div className="hidden text-sm text-muted-foreground lg:flex">
                  Showing {paginatedData.length} of{" "}
                  {filteredCorporates.length} corporates
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex bg-transparent"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    <IconChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex bg-transparent"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    <IconChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-teal-700">
              Confirm Topup
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 mt-2">
            Are you sure you want to proceed with the topup for{" "}
            <span className="font-semibold text-teal-700">
              {selectedCorporate?.corporate_name}
            </span>
            ?
          </p>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={async () => {
                if (!selectedCorporate) return;
                setIsSubmitting(true);
                try {
                  const body = {
                    machineCodes: Array.isArray(
                      selectedCorporate?.machine_codes
                    )
                      ? selectedCorporate.machine_codes
                      : [selectedCorporate?.machine_codes],
                    purposeOfPayment: "Monthly Topup",
                  };

                  const res = await postRequest(
                    "/superadmin/addCorporateRegisterationwithMachines",
                    body
                  );

                  if (res?.success || res?.status >= 200) {
                    toast.success("Topup successful!");
                  } else {
                    toast.error("Topup failed!");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Something went wrong during topup!");
                } finally {
                  setIsSubmitting(false);
                  setConfirmOpen(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Yes, Proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredCorporatesList;
