"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { getRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/corporate/site-header"

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

// ✅ Dummy fallback data
const dummyMachines: ApiMachine[] = [
  {
    id: 1,
    machine_code: "MCH-1001",
    machine_name: "Demo Machine 1 - Lahore",
    machine_location: "IBA Girls Hostel",
    machine_type: "Vending",
    created_at: Date.now(),
    is_active: "true",
    lat: null,
    lng: null,
    access: null,
    status: "Active",
    statusCode: "g",
    lastUpdated: Date.now(),
  },
  {
    id: 2,
    machine_code: "MCH-1002",
    machine_name: "Demo Machine 2 - Karachi",
    machine_location: "Tapal Pvt",
    machine_type: "Dispensing",
    created_at: Date.now(),
    is_active: "false",
    lat: null,
    lng: null,
    access: null,
    status: "Inactive",
    statusCode: "r",
    lastUpdated: Date.now(),
  },
  {
    id: 3,
    machine_code: "MCH-1003",
    machine_name: "Demo Machine 3 - Karachi",
    machine_location: "IBA Aman CED",
    machine_type: "Vending",
    created_at: Date.now(),
    is_active: "true",
    lat: null,
    lng: null,
    access: null,
    status: "Active",
    statusCode: "g",
    lastUpdated: Date.now(),
  },
]

const CorporateMachines = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)

  const itemsPerPage = 5

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      setLoading(true)

      // ⚡️ Force dummy data for now
      setMachinesData({ Butterfly: dummyMachines })

      // When ready to use API again, uncomment this block:
      /*
      const res = await getRequest<MachinesResponse>(``)
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
          stockMap[code] = "Out of Stock"
        } else if (quantities.some((q) => q < 10)) {
          stockMap[code] = "Low Stock"
        } else {
          stockMap[code] = "In Stock"
        }
      }

      setMachinesData(machines)
      setMachineStockMap(stockMap)
      */
    } catch (error) {
      console.error("Error fetching machines:", error)
      setMachinesData({ Butterfly: dummyMachines })
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
          stockStatus: machineStockMap[machine.machine_code] || "In Stock", // default In Stock for dummy
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
      "In Stock": "bg-green-100 text-green-800 border-green-300",
      "Low Stock": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out of Stock": "bg-red-100 text-red-800 border-red-300",
      "Unknown": "bg-gray-100 text-gray-800 border-gray-300",
    }

    return (
      <Badge variant="outline" className={colorMap[status] || colorMap["Unknown"]}>
        {status}
      </Badge>
    )
  }

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SNO</TableHead>
                    <TableHead>Machine Id</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Stock Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading machines...
                      </TableCell>
                    </TableRow>
                  ) : paginatedMachines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No machines found for the selected category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMachines.map((machine, index) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium text-blue-600">{machine.machine_code}</TableCell>
                        <TableCell className="max-w-xs">{machine.machine_name}</TableCell>
                        <TableCell className="text-blue-600">{machine.machine_type}</TableCell>
                        <TableCell>{getStatusBadge(machine.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{machine.lastActive}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() => navigate(`/corporate/machine-visit/${machine.id}`)}
                          >
                            Visit
                          </Button>
                        </TableCell>
                        <TableCell>{getStockStatusBadge(machine.stockStatus)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CorporateMachines
