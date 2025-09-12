"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { SiteHeader } from '@/components/superAdmin/site-header'
import moment from "moment-timezone"
import {
  IconMapPin,
  IconSearch,
  IconBuilding,
  IconEdit,
  IconTrash,
  IconMap,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { getRequest } from "@/Apis/Api"

interface LocationApiResponse {
  totalLocations: number
  totalMachines: number
  overallRevenue: number
  totalPages: number
  totalCount: number
  data: LocationsDetail[]
}

interface LocationsDetail {
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
  totalMachines: string | null
  machines?: number
  totalRevenue?: number
  status?: string
}

const ITEMS_PER_PAGE = 10

const Locations = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [machineLocation, setMachineLocation] = useState<LocationApiResponse | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  const getTypeBadge = (type: string) => {
    const colors = {
      "Office Building": "bg-blue-100 text-blue-800",
      Educational: "bg-green-100 text-green-800",
      Retail: "bg-purple-100 text-purple-800",
      Healthcare: "bg-red-100 text-red-800",
    }
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || ""}>
        {type}
      </Badge>
    )
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US").format(numAmount)
  }

  useEffect(() => {
    const locationApi = async () => {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", ITEMS_PER_PAGE.toString())

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const queryString = params.toString()
      const url = `/superadmin/MachineLocations${queryString ? `?${queryString}` : ""}`

      try {
        const res = await getRequest<LocationApiResponse>(url)
        setMachineLocation(res)
        setTotalPages(res.totalPages)
        setTotalCount(res.totalPages)
      } catch (error) {
        console.error("Failed to fetch machine locations:", error)
        setMachineLocation(null)
        setTotalPages(1)
        setTotalCount(0)
      }
    }
    locationApi()
  }, [currentPage, searchTerm])

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE

  return (
    <div>
      <SiteHeader title="Machine Locations" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Manage vending machine locations and sites</p>
          <div className="flex gap-2">
            <Button variant="outline">
              <IconMap className="mr-2 h-4 w-4" />
              View Map
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machineLocation?.totalLocations || 0}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machineLocation?.totalMachines || 0}</div>
              <p className="text-xs text-muted-foreground">Across all locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IconUsers className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(machineLocation?.overallRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Combined revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Location Directory</CardTitle>
            <CardDescription>Manage all vending machine locations</CardDescription>
            <div className="flex gap-4 pt-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead style={{ textAlign: "center" }}>Gross Sales</TableHead>
                  <TableHead>On-boarding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machineLocation?.data?.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{data.machine_name}</div>
                          <div className="text-xs text-muted-foreground">{data.machine_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{data.machine_location}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(data.machine_type)}</TableCell>
                    <TableCell className="font-medium text-green-600 text-center">
                      {formatCurrency(data.totalRevenue || 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {moment.unix(data.created_at).format("YYYY-MM-DD HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {/* ✅ Pagination */}
          {totalCount > 0 && (
            <div className="flex justify-between items-center mt-4 px-4 pb-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  variant="outline"
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 ${currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                    variant={currentPage === page ? "default" : "outline"}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  variant="outline"
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Locations
