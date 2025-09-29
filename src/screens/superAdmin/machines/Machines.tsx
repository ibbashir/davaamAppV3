"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Info } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { getRequest, postRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useNavigate } from "react-router-dom"

const categories = [
  { id: "Butterfly", label: "Butterfly" },
  { id: "BodyWash", label: "Body Wash" },
  { id: "Cooking Oil", label: "Cooking Oil" },
  { id: "Dishwash", label: "Dishwash" },
  { id: "Handwash", label: "Handwash" },
  { id: "Laundry", label: "Laundry" },
  { id: "Shampoo", label: "Shampoo" },
  { id: "Surface Cleaner", label: "Surface Cleaner" },
  { id: "Unknown", label: "Unknown" },
]

const Machines = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState<ApiMachine | null>(null)

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
          lastActive: timeConverter(machine.created_at),
          stockStatus: machineStockMap[machine.machine_code] || "Unknown",
        }))
      )
    : []

  const filteredMachines = allMachines.filter((machine) => {
    const matchesSearch =
      machine.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.machine_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = machine.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMachines = filteredMachines.slice(startIndex, startIndex + itemsPerPage)

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

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Search + Filters */}
        <div className="mb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Machine Id or Location"
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
                onClick={() => {
                  setActiveCategory(category.id)
                  setCurrentPage(1)
                }}
                className={activeCategory === category.id ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {loading ? (
              <p className="col-span-full text-center py-6">Loading machines...</p>
            ) : paginatedMachines.length === 0 ? (
              <p className="col-span-full text-center py-6">No machines found.</p>
            ) : (
              paginatedMachines.map((machine) => (
                <motion.div
                  key={machine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="rounded-2xl shadow-md border-teal-200">
                    <CardHeader className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">🆔 {machine.machine_code}</h3>
                      {getStatusBadge(machine.status)}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>📍 {machine.machine_name}</p>
                      <p>⚡ {machine.machine_type}</p>
                      <p>⏱ {machine.lastActive}</p>
                      <p>📦 {getStockStatusBadge(machine.stockStatus)}</p>
                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDetails(machine)}
                          className="flex items-center gap-1"
                        >
                          <Info className="h-4 w-4" /> Details
                        </Button>
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() =>
                            navigate(`/superadmin/machine-details/${machine.machine_code}`, { state: { machine } })
                          }
                        >
                          Visit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

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
                <p>📦 {machineStockMap[showDetails.machine_code] || "Unknown"}</p>
                <p>⏱ {timeConverter(showDetails.created_at)}</p>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setShowDetails(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Machines
