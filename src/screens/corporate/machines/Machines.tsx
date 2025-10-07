"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/corporate/site-header"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext" 

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
  const [expanded, setExpanded] = useState<number | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(5)

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
        } else if (quantities.some((q) => q < 10)) {
          stockMap[code] = "Low Stock ⚠️"
        } else {
          stockMap[code] = "In Stock ✅"
        }
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
          status:
            machine.statusCode === "r"
              ? "Inactive"
              : machine.statusCode === "g"
              ? "Active"
              : "Pending",
          lastActive: timeConverter(machine.created_at),
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

  const getStatusBadge = (status: string) => {
    const variant = status === "Active" ? "default" : "destructive"
    const className =
      status === "Active"
        ? "bg-green-100 text-green-800 hover:bg-green-100"
        : "bg-red-100 text-red-800 hover:bg-red-100"
    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    )
  }

  const getStockStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "In Stock ✅": "bg-green-100 text-green-800 border-green-300",
      "Low Stock ⚠️": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out of Stock ❌": "bg-red-100 text-red-800 border-red-300",
      Unknown: "bg-gray-100 text-gray-800 border-gray-300",
    }

    return (
      <Badge variant="outline" className={colorMap[status] || colorMap["Unknown"]}>
        {status}
      </Badge>
    )
  }

  return (
    <div>
      <SiteHeader title="🌱 Deployed Machines" />
      <div className="min-h-screen bg-gray-50 p-6">
        {loading ? (
          <p className="text-center text-gray-600">Loading machines...</p>
        ) : paginatedMachines.length === 0 ? (
          <p className="text-center text-gray-600">No machines found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedMachines.map((machine, index) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="border border-teal-300 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-teal-700">
                      🏷️ {machine.machine_code}
                      {getStatusBadge(machine.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Stock:</span>
                      {getStockStatusBadge(machine.stockStatus)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() =>
                          navigate(`/company/machine-details/${machine.machine_code}`, {
                            state: { machine },
                          })
                        }
                      >
                        Visit 
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(expanded === machine.id ? null : machine.id)}
                      >
                        {expanded === machine.id ? (
                          <>
                            Hide <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Details <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {expanded === machine.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 space-y-2 text-sm text-gray-600"
                        >
                          <p>📍 Location: {machine.machine_name}</p>
                          <p>⚙️ Type: {machine.machine_type}</p>
                          <p>📅 Last Active: {machine.lastActive}</p>
                          <p>📦 Category: {machine.category}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Fixed Pagination */}
        {paginatedMachines.length > 0 && (
          <div className="flex items-center justify-between px-4 mt-6">
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
                    {[5, 10, 15, 20, 50].map((pageSize) => (
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