import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MapPin,
  ArrowUpRight,
} from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { SiteHeader } from "@/components/corporate/site-header"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { formatUnixTimestamp } from "@/utils/formatters"

const CorporateMachines = () => {
  const navigate = useNavigate()
  const { state } = useAuth()
  const { user } = state

  const machineCodes = useMemo(
    () =>
      Array.isArray(user?.machines)
        ? user.machines.map((m: { machine_code: number }) => m.machine_code)
        : [],
    [user?.machines]
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  useEffect(() => {
    if (machineCodes.length > 0) {
      fetchMachines()
    }
  }, [machineCodes])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await postRequest<MachinesResponse>(
        "/corporates/getAllMachineStockAndStatusByMachineCode",
        { machine_code: machineCodes }
      )

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
        if (quantities.every((q) => q === 0)) {
          stockMap[code] = "Out of Stock ❌"
        } else if (quantities.some((q) => q < 2)) {
          stockMap[code] = "Low Stock ⚠️"
        } else {
          stockMap[code] = "In Stock ✅"
        }
      }

      setMachinesData(machines)
      setMachineStockMap(stockMap)

      const categoryKeys = Object.keys(machines)
      if (categoryKeys.length > 0 && !machines[activeCategory]) {
        setActiveCategory(categoryKeys[0])
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = machinesData ? Object.keys(machinesData) : []

  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
        machines.map((machine) => ({
          ...machine,
          category,
          status:
            machine.statusCode === "r"
              ? "Inactive"
              : machine.statusCode === "g"
              ? "Active"
              : "Pending",
          lastActive: formatUnixTimestamp(machine.lastUpdated),
          stockStatus: machineStockMap[machine.machine_code] || "Unknown",
        }))
      )
    : []

  const filteredMachines = allMachines.filter((machine) => {
    const matchesSearch =
      machine.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.machine_code.toString().toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = machine.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMachines = filteredMachines.slice(startIndex, startIndex + itemsPerPage)

  const showStatusColumn = user?.first_name !== "Butterfly"

  const getStatusBadge = (status: string) => {
    const className =
      status === "Active"
        ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
        : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  const goToMachine = (machine: (typeof allMachines)[number]) =>
    navigate(`/company/machine-details/${machine.machine_code}`, {
      state: { machine },
    })

  return (
    <div>
      <SiteHeader title="🌱 Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-6 space-y-5">
        {/* Search + Category filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search machines by name or code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 bg-white"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setCurrentPage(1)
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      activeCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {machinesData?.[cat]?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Machine
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </TableHead>
                {showStatusColumn && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </TableHead>
                )}
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Last Active
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={showStatusColumn ? 4 : 3}
                    className="py-12 text-center text-gray-500"
                  >
                    Loading machines...
                  </TableCell>
                </TableRow>
              ) : paginatedMachines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showStatusColumn ? 4 : 3}
                    className="py-12 text-center text-gray-500"
                  >
                    No machines found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMachines.map((machine, index) => (
                  <motion.tr
                    key={machine.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-teal-50/60"
                    onClick={() => goToMachine(machine)}
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        🏷️ {machine.machine_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Code: {machine.machine_code}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {machine.machine_location || "N/A"}
                      </span>
                    </TableCell>
                    {showStatusColumn && (
                      <TableCell>{getStatusBadge(machine.status)}</TableCell>
                    )}
                    <TableCell className="text-gray-600">{machine.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          goToMachine(machine)
                        }}
                      >
                        Visit <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {paginatedMachines.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              Showing {paginatedMachines.length} of {filteredMachines.length} machines
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${itemsPerPage}`}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 bg-transparent"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 bg-transparent"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex bg-transparent"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CorporateMachines
