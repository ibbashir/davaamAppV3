import { useState, useEffect } from "react";
import { getRequest, postRequest } from "@/Apis/Api";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import moment from "moment";
import { toast } from "react-toastify";
import {
  IconChevronLeft,
  IconChevronsLeft,
  IconChevronRight,
  IconChevronsRight,
} from "@tabler/icons-react";
import { FaPlus } from "react-icons/fa";

interface CorporateTopupsData {
  corporate_name: string;
  created_at: string;
  epoch_time: number;
  id: number;
  location: string;
  topuplimit: number;
  updated_at: string | null;
  machine_codes: string[] | string;
  name?: string;
}

interface ApiResponse {
  data: CorporateTopupsData[];
  total: number;
  message: string;
  success?: boolean;
  status?: number;
  totalRecords?:number
}

interface PostTopupBody {
  machineCodes: string[];
  purposeOfPayment: string;
}

interface RegisteredCorporatesListProps {
  setShowModal: (show: boolean) => void;
  fetchCorporatesAll: (page: number, limit: number) => Promise<void>;

}



const RegisteredCorporatesList = ({ setShowModal, fetchCorporatesAll }: RegisteredCorporatesListProps) => {

  const [corporates, setCorporates] = useState<CorporateTopupsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCorporate, setSelectedCorporate] = useState<CorporateTopupsData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

 useEffect(() => {
  const fetchCorporates = async () => {
    try {
      setLoading(true);
      const response = await getRequest(
        `/superadmin/getAllCorporateClients?page=${currentPage}&limit=${itemsPerPage}`
      ) as ApiResponse;

      setCorporates(response.data);
      setTotalRecords(response.totalRecords);
    } catch {
      setError("Failed to load corporate data");
    } finally {
      setLoading(false);
    }
  };

  fetchCorporates();
}, [currentPage, itemsPerPage]);


  // Pagination logic
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  console.log(totalRecords)
  // Parse machine codes from various formats
  const parseMachineCodes = (machineCodes: CorporateTopupsData['machine_codes']): string[] => {
    if (!machineCodes) return [];

    if (Array.isArray(machineCodes)) {
      return machineCodes.filter((code): code is string => typeof code === 'string');
    }

    if (typeof machineCodes === 'string') {
      try {
        const parsed = JSON.parse(machineCodes);
        if (Array.isArray(parsed)) {
          return parsed.filter((code): code is string => typeof code === 'string');
        } else if (typeof parsed === 'string') {
          return parsed.split(',').map((c) => c.trim()).filter(Boolean);
        }
      } catch {
        return machineCodes.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }

    return [];
  };

  // Render machine codes properly
  const renderMachineCodes = (machineCodes: CorporateTopupsData['machine_codes']) => {
    const codesArray = parseMachineCodes(machineCodes);

    if (codesArray.length === 0) {
      return <span className="text-gray-400 italic">No machines</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 justify-start">
        {codesArray.map((code, i) => (
          <Badge
            key={`${code}-${i}`}
            variant="outline"
            className="bg-teal-50 text-teal-700 border border-teal-200"
          >
            {code}
          </Badge>
        ))}
      </div>
    );
  };

  const handleTopupConfirm = async () => {
    if (!selectedCorporate) return;

    setIsSubmitting(true);
    try {
      const body: PostTopupBody = {
        machineCodes: parseMachineCodes(selectedCorporate.machine_codes),
        purposeOfPayment: `Monthly Topup for ${selectedCorporate.corporate_name || "Unknown Company"} amount of ${selectedCorporate.topuplimit || 0}`,
      };

      const res = await postRequest(
        "/superadmin/addCorporateRegisterationwithMachines",
        body
      ) as ApiResponse;

        //here we need to call
        toast.success(res.message);
        console.log("done.................")
        fetchCorporatesAll(1, 10);

      
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong during topup!");
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
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
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6 mb-5">
      <div className="">
        <Card>
          {/* Fixed: Removed w-full to prevent full width */}
          <div className="flex justify-between items-center">
            <div className=" w-3xl">
              <CardHeader>
                <CardTitle className="text-black">
                  Corporates Dashboard
                </CardTitle>
                <CardDescription>
                  List of all registered corporate clients
                </CardDescription>
              </CardHeader>
            </div>

            <div className="pr-6">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 cursor-pointer bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
              >
                <FaPlus /> Add Corporate
              </button>
            </div>
          </div>

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
                    <TableHead className="font-semibold text-white bg-teal-600 border-none rounded-tl-2xl">
                      Company Name
                    </TableHead>
                    <TableHead className="font-semibold text-white bg-teal-600 border-none">
                      Location
                    </TableHead>
                    <TableHead className="font-semibold text-white bg-teal-600 border-none">
                      Machine Codes
                    </TableHead>
                    <TableHead className="font-semibold text-white bg-teal-600 border-none">
                      Topup Limit
                    </TableHead>
                    <TableHead className="font-semibold text-white bg-teal-600 border-none">
                      Created At
                    </TableHead>
                    <TableHead className="font-semibold text-white bg-teal-600 border-none rounded-tr-2xl">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {corporates.length > 0 ? (
                    corporates.map((corporate) => (
                      <TableRow key={corporate.id}>
                        <TableCell className="font-medium">
                          {corporate.corporate_name || corporate.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {corporate.location || "N/A"}
                        </TableCell>
                        <TableCell className="text-left">
                          {renderMachineCodes(corporate.machine_codes)}
                        </TableCell>
                        <TableCell className="font-semibold text-teal-700">
                          {corporate.topuplimit || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {corporate.created_at
                            ? moment
                              .utc(corporate.created_at)
                              .format("DD-MM-YYYY")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCorporate(corporate);
                              setConfirmOpen(true);
                            }}
                            className="cursor-pointer"
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
            {corporates.length > 0 && (
              <div className="flex items-center justify-between px-4 mt-4">
                <div className="hidden text-sm text-muted-foreground lg:flex">
                  Showing {corporates.length} of {totalRecords} corporates
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
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
              onClick={handleTopupConfirm}
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