"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { getRequest } from "@/Apis/Api"

type ApiMachine = {
  id: number
  machine_code: string
  machine_name: string
  machine_location: string
  machine_type: string
  created_at: number
  is_active: string
  lat: number | null
  lng: number | null
  access: string | null
}

type MachinesResponse = {
  status: number
  data: {
    [category: string]: ApiMachine[]
  }
}

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

const Machines = ({ }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Butterfly")
  const [currentPage, setCurrentPage] = useState(1)
  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 5

  useEffect(() => {
    fetchMachines()
  }, [])

  // Transform API data into a flat array for filtering
  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([category, machines]) =>
      machines.map((machine) => ({
        ...machine,
        category: category,
        status: machine.is_active === "1" ? "Active" : "Inactive",
        lastActive: new Date(machine.created_at * 1000).toLocaleString(),
        stockStatus: "In Stock", // Default value since not in API
      })),
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
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        {status}
      </Badge>
    )
  }

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await getRequest<MachinesResponse>(`/superadmin/getAllMachinesDashboards`)
      console.log(res.data)
      setMachinesData(res.data)
    } catch (error) {
      console.error("Error fetching machines:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SiteHeader title="Machines" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deployed Machines</h1>
            <p className="text-muted-foreground">
              A list of all the machines in your account including their machine id, locations, type and brands.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-teal-600 hover:bg-teal-700">Add Machine</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                          Visit
                        </Button>
                      </TableCell>
                      <TableCell>{getStockStatusBadge(machine.stockStatus)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
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
                  <IconChevronLeft className="h-4 w-4" />
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
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Machines
