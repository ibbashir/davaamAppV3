"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ApiMachine, MachinesResponse } from "./Types"
import { getRequest, postRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
]

const Machines = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [detailsMachine, setDetailsMachine] = useState<any | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await getRequest<MachinesResponse>(`/ops/getAllMachineStockAndStatus`)
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
          category,
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
    const className =
      status === "Active"
        ? "bg-green-100 text-green-800"
        : status === "Inactive"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    return <Badge className={className}>{status}</Badge>
  }

  const getStockStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "In Stock": "bg-green-100 text-green-800 border-green-300",
      "Low Stock": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out of Stock": "bg-red-100 text-red-800 border-red-300",
      "Unknown": "bg-gray-100 text-gray-800 border-gray-300",
    }
    return <Badge variant="outline" className={colorMap[status] || colorMap["Unknown"]}>{status}</Badge>
  }

  return (
    <div>
      <SiteHeader title="Deployed Machines ⚙️" />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="🔍 Search by Machine Id or Location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveCategory(cat.id)
                    setCurrentPage(1)
                  }}
                  className={activeCategory === cat.id ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Machine Cards */}
          <AnimatePresence>
            {loading ? (
              <p className="text-center py-8">Loading machines...</p>
            ) : paginatedMachines.length === 0 ? (
              <p className="text-center py-8">No machines found 🛑</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedMachines.map((machine) => (
                  <motion.div
                    key={machine.machine_code}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex justify-between">
                          🆔 {machine.machine_code}
                          {getStatusBadge(machine.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p>📍 {machine.machine_name}</p>
                        <p>⚙️ {machine.machine_type}</p>
                        <p>⏱️ {machine.lastActive}</p>
                        <div>{getStockStatusBadge(machine.stockStatus)}</div>

                        <div className="flex justify-between mt-4">
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() =>
                              navigate(`/ops/machine-details/${machine.machine_code}`, { state: { machine } })
                            }
                          >
                            Visit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailsMachine(machine)}
                          >
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={!!detailsMachine} onOpenChange={() => setDetailsMachine(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Machine Details 📝</DialogTitle>
          </DialogHeader>
          {detailsMachine && (
            <div className="space-y-2">
              <p>🆔 <strong>ID:</strong> {detailsMachine.machine_code}</p>
              <p>📍 <strong>Location:</strong> {detailsMachine.machine_name}</p>
              <p>⚙️ <strong>Type:</strong> {detailsMachine.machine_type}</p>
              <p>⚡ <strong>Status:</strong> {detailsMachine.status}</p>
              <p>📦 <strong>Stock Status:</strong> {detailsMachine.stockStatus}</p>
              <p>⏱️ <strong>Last Active:</strong> {detailsMachine.lastActive}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Machines
