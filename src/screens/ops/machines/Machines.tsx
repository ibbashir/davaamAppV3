"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import type { ApiMachine, MachinesResponse } from "./Types";
import { getRequest } from "@/Apis/Api";
import { timeConverter } from "@/constants/Constant";
import { SiteHeader } from "@/components/ops/site-header";
import { useNavigate } from "react-router-dom";
import AddMachine from "./components/addMachines";
import DeleteMachine from "./components/deleteMachine";
import UpdateMachine from "./components/updateMachine";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

const categories = [
  { id: "Butterfly", label: "🦋 Butterfly" },
  { id: "BodyWash", label: "🛁 Body Wash" },
  { id: "Cooking Oil", label: "🍳 Cooking Oil" },
  { id: "Dishwash", label: "🍽️ Dishwash" },
  { id: "Handwash", label: "🧼 Handwash" },
  { id: "Laundry", label: "👕 Laundry" },
  { id: "Shampoo", label: "🧴 Shampoo" },
  { id: "Surface Cleaner", label: "🧹 Surface Cleaner" },
  { id: "Unknown", label: "❓ Unknown" },
];

type SortField = 'machine_code' | 'machine_name' | 'machine_type' | 'category' | 'lastActive' | 'stockStatus' | 'status';
type SortDirection = 'asc' | 'desc' | 'none';

const Machines = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Butterfly");
  const [currentPage, setCurrentPage] = useState(1);
  const [machinesData, setMachinesData] = useState<{
    [category: string]: ApiMachine[];
  } | null>(null);
  const [machineStockMap, setMachineStockMap] = useState<{
    [code: string]: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<ApiMachine | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<ApiMachine | null>(null);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'machine_code',
    direction: 'asc'
  });
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [serverTotalPages, setServerTotalPages] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    fetchMachines(1, activeCategory, debouncedSearch, itemsPerPage)
  }, [activeCategory, debouncedSearch, itemsPerPage])

  const fetchMachines = async (page: number, category: string, search: string, limit: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit), category, ...(search ? { search } : {}) })
      const res = await getRequest<MachinesResponse>(
        `/ops/getAllMachineStockAndStatus?${params}`,
      );
      const { machines, brands, pagination } = res.data;

      const stockMap: { [code: string]: string } = {};
      const allBrands = [...brands.vending, ...brands.dispensing];
      const grouped: { [machine_code: string]: number[] } = {};

      allBrands.forEach((brand) => {
        const code = brand.machine_code;
        if (!grouped[code]) grouped[code] = [];
        grouped[code].push(brand.availableQuantity);
      });

      for (const [code, quantities] of Object.entries(grouped)) {
        const total = quantities.reduce((sum, q) => sum + q, 0);
        if (total === 0) stockMap[code] = "Out of Stock";
        else if (total < 2) stockMap[code] = "Low Stock";
        else stockMap[code] = "In Stock";
      }

      setCurrentPage(page)
      setMachinesData(machines);
      setMachineStockMap(stockMap);
      setServerTotalPages(pagination?.totalPages ?? 1)
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setLoading(false);
    }
  };

  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
        machines.map((machine) => ({
          ...machine,
          category: category,
          status:
            machine.statusCode === "r"
              ? "Inactive"
              : machine.statusCode === "g"
                ? "Active"
                : "Pending",
          lastActive: timeConverter(machine.lastUpdated),
          stockStatus: machineStockMap[machine.machine_code] || "Unknown",
        })),
      )
    : [];

  const handleSort = (field: SortField) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field
          ? current.direction === "asc"
            ? "desc"
            : current.direction === "desc"
              ? "none"
              : "asc"
          : "asc",
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1" />;
    switch (sortConfig.direction) {
      case "asc":
        return <ArrowUp className="h-3 w-3 ml-1" />;
      case "desc":
        return <ArrowDown className="h-3 w-3 ml-1" />;
      default:
        return <ArrowUpDown className="h-3 w-3 ml-1" />;
    }
  };

  const sortedMachines = [...allMachines].sort((a, b) => {
    if (sortConfig.direction === 'none') return 0;

    const { field, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    if (field === 'lastActive') {
      return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    const aValue = a[field]?.toString().toLowerCase() || '';
    const bValue = b[field]?.toString().toLowerCase() || '';

    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getStockStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      "In Stock": "bg-green-100 text-green-800",
      "Low Stock": "bg-yellow-100 text-yellow-800",
      "Out of Stock": "bg-red-100 text-red-800",
      Unknown: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Search + Filters */}
        <div className="mb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Machine ID or Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={
                  activeCategory === category.id
                    ? "bg-teal-600 hover:bg-teal-700 cursor-pointer"
                    : "cursor-pointer"
                }
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Page {currentPage} of {serverTotalPages}
          {searchTerm && <span> — searching "<strong>{searchTerm}</strong>"</span>}
        </div>

        <div className="flex justify-end p-2">
          <Button onClick={() => setOpen(true)}>Add Machines</Button>
        </div>
        {/* Table View */}
        <Card className="overflow-hidden rounded-2xl shadow-md border-teal-200">
          <CardHeader>
            <h3 className="font-semibold text-lg text-teal-700">
              {categories.find((c) => c.id === activeCategory)?.label ||
                "Machines"}
            </h3>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-6">Loading machines...</p>
            ) : sortedMachines.length === 0 ? (
              <p className="text-center py-6">
                {searchTerm ? "No machines match your search criteria." : "No machines found."}
              </p>
            ) : (
              <table className="min-w-full text-sm overflow-hidden rounded-xl border border-gray-200">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("machine_code")}
                      >
                        Machine ID
                        {getSortIcon("machine_code")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("machine_name")}
                      >
                        Name
                        {getSortIcon("machine_name")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("machine_type")}
                      >
                        Type
                        {getSortIcon("machine_type")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("category")}
                      >
                        Category
                        {getSortIcon("category")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("lastActive")}
                      >
                        Last Active
                        {getSortIcon("lastActive")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("stockStatus")}
                      >
                        Stock
                        {getSortIcon("stockStatus")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">Visit</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {sortedMachines.map((machine) => (
                      <motion.tr
                        key={machine.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="hover:bg-teal-50 border-b border-gray-200 transition-all"
                      >
                        <td className="px-4 py-3 font-medium">
                          {machine.machine_code}
                        </td>
                        <td className="px-4 py-3">{machine.machine_name}</td>
                        <td className="px-4 py-3">{machine.machine_type}</td>
                        <td className="px-4 py-3">{machine.category}</td>
                        <td className="px-4 py-3">{machine.lastActive}</td>
                        <td className="px-4 py-3">
                          {getStockStatusBadge(machine.stockStatus)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(machine.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() =>
                              navigate(
                                `/ops/machine-details/${machine.machine_code}`,
                                { state: { machine } },
                              )
                            }
                          >
                            Visit
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-teal-600 text-teal-600 hover:bg-teal-50"
                              onClick={() => {
                                setSelectedMachine(machine);
                                setOpenUpdate(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => {
                                setSelectedMachine(machine);
                                setOpenDelete(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {sortedMachines.length > 0 && (
          <div className="flex items-center justify-between px-4 mt-6">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              Page {currentPage} of {serverTotalPages}
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${itemsPerPage}`}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 15, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {currentPage} of {serverTotalPages}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                  onClick={() => fetchMachines(1, activeCategory, debouncedSearch, itemsPerPage)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 bg-transparent"
                  size="icon"
                  onClick={() => fetchMachines(currentPage - 1, activeCategory, debouncedSearch, itemsPerPage)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 bg-transparent"
                  size="icon"
                  onClick={() => fetchMachines(currentPage + 1, activeCategory, debouncedSearch, itemsPerPage)}
                  disabled={currentPage === serverTotalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex bg-transparent"
                  size="icon"
                  onClick={() => fetchMachines(serverTotalPages, activeCategory, debouncedSearch, itemsPerPage)}
                  disabled={currentPage === serverTotalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h2 className="text-xl font-semibold mb-4">Machine Details</h2>
                <p>🆔 {showDetails.machine_code}</p>
                <p>📍 {showDetails.machine_name}</p>
                <p>⚡ {showDetails.machine_type}</p>
                <p>
                  📦 {machineStockMap[showDetails.machine_code] || "Unknown"}
                </p>
                <p>⏱ {timeConverter(showDetails.created_at)}</p>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(null)}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AddMachine open={open} setOpen={setOpen} />
      <DeleteMachine
        open={openDelete}
        setOpen={setOpenDelete}
        machine={selectedMachine}
        onSuccess={() => fetchMachines(currentPage, activeCategory, debouncedSearch, itemsPerPage)}
      />
      <UpdateMachine
        open={openUpdate}
        setOpen={setOpenUpdate}
        machine={selectedMachine}
        onSuccess={() => fetchMachines(currentPage, activeCategory, debouncedSearch, itemsPerPage)}
      />
    </div>
  );
};

export default Machines;
