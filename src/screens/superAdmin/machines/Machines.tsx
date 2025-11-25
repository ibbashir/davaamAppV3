import { useState, useEffect } from "react"
import { getRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import type { ApiMachine, MachinesResponse } from "./Types"
import moment from "moment-timezone"

const categories = [
  { id: "Butterfly", label: "🦋 Butterfly" },
  { id: "Cooking Oil", label: "🍳 Cooking Oil" },
  { id: "CleaningProducts", label: "Cleaning Products" },
]

const subCategories = [
  { id: "BodyWash", label: "🛁 Body Wash" },
  { id: "Dishwash", label: "🍽️ Dishwash" },
  { id: "Handwash", label: "🧼 Handwash" },
  { id: "Laundry", label: "👕 Laundry" },
  { id: "Shampoo", label: "🧴 Shampoo" },
  { id: "Surface Cleaner", label: "🧹 Surface Cleaner" },
  { id: "Unknown", label: "❓ Unknown" },
]

type SortField = 'machine_code' | 'machine_name' | 'machine_type' | 'category' | 'lastActive' | 'stockStatus' | 'status';
type SortDirection = 'asc' | 'desc' | 'none';

const Machines = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true);
  const [isShowCleaningProducts, setIsShowCleaningProducts] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({ 
    field: 'machine_code', 
    direction: 'asc' 
  });
  const [columnFilters, setColumnFilters] = useState<{
    machine_code: string;
    machine_name: string;
    machine_type: string;
    category: string;
    lastActive: string;
    stockStatus: string;
    status: string;
  }>({
    machine_code: '',
    machine_name: '',
    machine_type: '',
    category: '',
    lastActive: '',
    stockStatus: '',
    status: ''
  });

  const itemsPerPage = 10

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await getRequest<MachinesResponse>(`/superadmin/getAllMachineStockAndStatus`)
      const { machines, brands } = res.data

      const stockMap: { [code: string]: string } = {}
      const allBrands = [...brands.vending, ...brands.dispensing]
      const grouped: { [machine_code: string]: number[] } = {}

      allBrands.forEach((brand) => {
        const code = brand.machine_code
        if (!grouped[code]) grouped[code] = []
        grouped[code].push(brand.availableQuantity)
      })

      for (const [code, quantities] of Object.entries(grouped)) {
        const total = quantities.reduce((sum, q) => sum + q, 0)
        if (total === 0) stockMap[code] = "Out of Stock"
        else if (total < 2) stockMap[code] = "Low Stock"
        else stockMap[code] = "In Stock"
      }

      setMachinesData(machines)
      setMachineStockMap(stockMap)
    } catch (error) {
      console.error("Error fetching machines:", error)
    } finally {
      setLoading(false)
    }
  }

  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
      machines.map((machine) => ({
        ...machine,
        category: category,
        status: machine.statusCode === "r" ? "Inactive" : machine.statusCode === "g" ? "Active" : "Pending",
        lastActive: timeConverter(machine.lastUpdated),
        stockStatus: machineStockMap[machine.machine_code] || "Unknown",
      }))
    )
    : []

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: 
        current.field === field 
          ? current.direction === 'asc' 
            ? 'desc' 
            : current.direction === 'desc'
            ? 'none'
            : 'asc'
          : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleColumnFilter = (field: keyof typeof columnFilters, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (field: keyof typeof columnFilters) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: ''
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    switch (sortConfig.direction) {
      case 'asc': return <ArrowUp className="h-3 w-3 ml-1" />;
      case 'desc': return <ArrowDown className="h-3 w-3 ml-1" />;
      default: return <ArrowUpDown className="h-3 w-3 ml-1" />;
    }
  };

  const filteredMachines = allMachines.filter((machine) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      machine.machine_name.toLowerCase().includes(searchLower) ||
      machine.machine_code.toLowerCase().includes(searchLower) ||
      machine.machine_type.toLowerCase().includes(searchLower) ||
      machine.category.toLowerCase().includes(searchLower) ||
      machine.lastActive.toLowerCase().includes(searchLower);

    const matchesCategory = machine.category === activeCategory;

    // Apply column filters
    const matchesColumnFilters = 
      (!columnFilters.machine_code || machine.machine_code.toLowerCase().includes(columnFilters.machine_code.toLowerCase())) &&
      (!columnFilters.machine_name || machine.machine_name.toLowerCase().includes(columnFilters.machine_name.toLowerCase())) &&
      (!columnFilters.machine_type || machine.machine_type.toLowerCase().includes(columnFilters.machine_type.toLowerCase())) &&
      (!columnFilters.category || machine.category.toLowerCase().includes(columnFilters.category.toLowerCase())) &&
      (!columnFilters.lastActive || machine.lastActive.toLowerCase().includes(columnFilters.lastActive.toLowerCase())) &&
      (!columnFilters.stockStatus || machine.stockStatus.toLowerCase().includes(columnFilters.stockStatus.toLowerCase())) &&
      (!columnFilters.status || machine.status.toLowerCase().includes(columnFilters.status.toLowerCase()));

    return matchesSearch && matchesCategory && matchesColumnFilters;
  });

  // Apply sorting
  const sortedMachines = [...filteredMachines].sort((a, b) => {
    if (sortConfig.direction === 'none') return 0;

    const { field, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    if (field === 'lastActive') {
      // For date sorting, convert back to timestamp for proper comparison
      return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    const aValue = a[field]?.toString().toLowerCase() || '';
    const bValue = b[field]?.toString().toLowerCase() || '';

    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  });

  const totalPages = Math.ceil(sortedMachines.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMachines = sortedMachines.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
    }
    return <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>
  }

  const getStockStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      "In Stock": "bg-green-100 text-green-800",
      "Low Stock": "bg-yellow-100 text-yellow-800",
      "Out of Stock": "bg-red-100 text-red-800",
      Unknown: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>
  }

  const FilterInput = ({ field, placeholder }: { field: keyof typeof columnFilters; placeholder: string }) => (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={columnFilters[field]}
        onChange={(e) => handleColumnFilter(field, e.target.value)}
        className="h-7 text-xs w-full"
      />
      {columnFilters[field] && (
        <button
          onClick={() => clearColumnFilter(field)}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Search + Filters */}
        <div className="mb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Machine ID, Name, Type, Category, or Last Active"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(category.id)
                  setCurrentPage(1)
                  if (category.id === "CleaningProducts") {
                    setIsShowCleaningProducts(true);
                    setActiveCategory(subCategories[0].id);
                  } else {
                    setIsShowCleaningProducts(false);
                  }
                }}
                className={activeCategory === category.id ? "bg-teal-600 hover:bg-teal-700 cursor-pointer" : "cursor-pointer"}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {isShowCleaningProducts && (
            <div className="flex flex-wrap gap-2 mt-2">
              {subCategories.map((subCategory) => (
                <Button
                  key={subCategory.id}
                  variant={activeCategory === subCategory.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveCategory(subCategory.id)
                    setCurrentPage(1)
                  }}
                  className={activeCategory === subCategory.id ? "bg-teal-600 hover:bg-teal-700 cursor-pointer" : "cursor-pointer"}
                >
                  {subCategory.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {sortedMachines.length} of {allMachines.length} machines
          {searchTerm && (
            <span> for "<strong>{searchTerm}</strong>"</span>
          )}
        </div>

        {/* Table View */}
        <Card className="overflow-hidden rounded-2xl shadow-md border-teal-200">
          <CardHeader>
            <h3 className="font-semibold text-lg text-teal-700">
              {categories.find((c) => c.id === activeCategory)?.label || "Machines"}
            </h3>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-6">Loading machines...</p>
            ) : paginatedMachines.length === 0 ? (
              <p className="text-center py-6">
                {searchTerm || Object.values(columnFilters).some(filter => filter) 
                  ? "No machines match your search criteria." 
                  : "No machines found."}
              </p>
            ) : (
              <table className="min-w-full text-sm overflow-hidden rounded-xl border border-gray-200">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('machine_code')}>
                        Machine ID
                        {getSortIcon('machine_code')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('machine_name')}>
                        Name
                        {getSortIcon('machine_name')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('machine_type')}>
                        Type
                        {getSortIcon('machine_type')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('category')}>
                        Category
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('lastActive')}>
                        Last Active
                        {getSortIcon('lastActive')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('stockStatus')}>
                        Stock
                        {getSortIcon('stockStatus')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => handleSort('status')}>
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">Visit</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedMachines.map((machine) => (
                      <motion.tr
                        key={machine.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="hover:bg-teal-50 border-b border-gray-200 transition-all"
                      >
                        <td className="px-4 py-3 font-medium">{machine.machine_code}</td>
                        <td className="px-4 py-3">{machine.machine_name}</td>
                        <td className="px-4 py-3">{machine.machine_type}</td>
                        <td className="px-4 py-3">{machine.category}</td>
                        <td className="px-4 py-3">{machine.lastActive}</td>
                        <td className="px-4 py-3">{getStockStatusBadge(machine.stockStatus)}</td>
                        <td className="px-4 py-3">{getStatusBadge(machine.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() =>
                              navigate(`/superadmin/machine-details/${machine.machine_code}`, { state: { machine } })
                            }
                          >
                            Visit
                          </Button>
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
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Machines