"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { useNavigate } from "react-router-dom"
import { getRequest, postRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/superAdmin/site-header"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const navigate = useNavigate();

  const [newMachine, setNewMachine] = useState({
    machine_code: "",
    machine_name: "",
    machine_location: "",
    machine_type: "",
    created_at: new Date().toISOString(),
    is_active: true,
    lat: "",
    lng: ""
  })

  const itemsPerPage = 5

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await getRequest<MachinesResponse>(`/superadmin/getAllMachineStockAndStatus`)
      const { machines, brands } = res.data

      // Build stock status map per machine_code
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

  const visitMachineDetails = (machine_type: string, machineCode: string) => {
    navigate(`/superadmin/machine-details/${machine_type}/${machineCode}`);
  };

  return (
    <div>
      <SiteHeader title="Deployed Machines" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                A list of all the machines in your account including their machine id, locations, type and brands.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                setShowAddModal(true);
              }} className="bg-teal-600 hover:bg-teal-700">Add Machine</Button>

            </div>
          </div>

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex shadow-2xl items-center justify-center pointer-events-none">
              <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-xl pointer-events-auto">
                <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
                  <h2 className="text-xl font-semibold">Add New Machine</h2>
                  <div className="space-y-2">
                    <Input placeholder="Machine Code" required value={newMachine.machine_code} onChange={e => setNewMachine({ ...newMachine, machine_code: e.target.value })} />
                    <Input placeholder="Machine Name" required value={newMachine.machine_name} onChange={e => setNewMachine({ ...newMachine, machine_name: e.target.value })} />
                    <Input placeholder="Machine Location" required value={newMachine.machine_location} onChange={e => setNewMachine({ ...newMachine, machine_location: e.target.value })} />
                    <Input placeholder="Machine Type" required value={newMachine.machine_type} onChange={e => setNewMachine({ ...newMachine, machine_type: e.target.value })} />
                    <Input placeholder="Latitude" required value={newMachine.lat} onChange={e => setNewMachine({ ...newMachine, lat: e.target.value })} />
                    <Input placeholder="Longitude" required value={newMachine.lng} onChange={e => setNewMachine({ ...newMachine, lng: e.target.value })} />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      try {
                        const res = await postRequest("/superadmin/addNewMachine", newMachine)
                        console.log("Added:", res)
                        fetchMachines()
                        setShowAddModal(false)
                      } catch (err) {
                        console.error("Error adding machine:", err)
                      }
                    }} className="bg-teal-600 hover:bg-teal-700">
                      Add Machine
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by machine number"
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
            </CardHeader>
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
                          <Button onClick={() => visitMachineDetails(machine.machine_type, machine.machine_code)} size="sm" className="bg-teal-600 hover:bg-teal-700">
                            Visit
                          </Button>
                        </TableCell>
                        <TableCell>{getStockStatusBadge(machine.stockStatus)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMachines.length)} of{" "}
                  {filteredMachines.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
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
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Machines
