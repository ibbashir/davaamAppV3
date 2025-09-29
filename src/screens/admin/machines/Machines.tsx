"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { getRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useNavigate } from "react-router-dom"

const categories = [
  { id: "Butterfly", label: "🦋 Butterfly" },
  { id: "BodyWash", label: "🧴 Body Wash" },
  { id: "Cooking Oil", label: "🛢️ Cooking Oil" },
  { id: "Dishwash", label: "🍽️ Dishwash" },
  { id: "Handwash", label: "👐 Handwash" },
  { id: "Laundry", label: "👕 Laundry" },
  { id: "Shampoo", label: "🧼 Shampoo" },
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
  const [selectedMachine, setSelectedMachine] = useState<any>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await getRequest<MachinesResponse>(`/admin/getAllMachineStockAndStatus`)
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
      <SiteHeader title="Deployed Machines 🚀" />
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Search bar on top */}
        <div className="mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="🔍 Search by Machine Id or Location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Categories below search */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveCategory(category.id)
                setCurrentPage(1)
              }}
              className={activeCategory === category.id ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Machine Cards */}
        {loading ? (
          <p className="text-center py-10">Loading machines...</p>
        ) : paginatedMachines.length === 0 ? (
          <p className="text-center py-10">No machines found for this category ❌</p>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {paginatedMachines.map((machine) => (
                <motion.div
                  key={machine.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-2 border-teal-200 shadow-md hover:shadow-lg transition-all rounded-2xl">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-teal-700">🆔 {machine.machine_code}</h3>
                        {getStatusBadge(machine.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>📍 {machine.machine_name}</p>
                      <p>⚡ {machine.machine_type}</p>
                      <p>⏱️ {machine.lastActive}</p>
                      <div className="mt-2">{getStockStatusBadge(machine.stockStatus)}</div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() =>
                            navigate(`/admin/machine-details/${machine.machine_code}`, { state: { machine } })
                          }
                        >
                          Visit 🚀
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedMachine(machine)}>
                          Details 📦
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center space-x-2 py-6">
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
              className={currentPage === page ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
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
          {selectedMachine && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h2 className="text-xl font-bold mb-4 text-teal-700">📦 Machine Details</h2>
                <p>🆔 ID: {selectedMachine.machine_code}</p>
                <p>📍 Location: {selectedMachine.machine_name}</p>
                <p>⚡ Type: {selectedMachine.machine_type}</p>
                <p>⏱️ Last Active: {selectedMachine.lastActive}</p>
                <p>📦 Stock: {selectedMachine.stockStatus}</p>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setSelectedMachine(null)}>
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
