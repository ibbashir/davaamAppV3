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
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import { getRequest } from "@/Apis/Api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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

const Locations = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [machineLocation, setMachineLocation] = useState<LocationApiResponse | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      params.append("limit", itemsPerPage.toString()) // Use itemsPerPage instead of constant

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const queryString = params.toString()
      const url = `/superadmin/MachineLocations${queryString ? `?${queryString}` : ""}`

      try {
        const res = await getRequest<LocationApiResponse>(url)
        setMachineLocation(res)
        setTotalPages(res.totalPages)
        setTotalCount(res.totalMachines) // Fixed: should be totalCount, not totalPages
      } catch (error) {
        console.error("Failed to fetch machine locations:", error)
        setMachineLocation(null)
        setTotalPages(1)
        setTotalCount(0)
      }
    }
    locationApi()
  }, [currentPage, searchTerm, itemsPerPage]) // Added itemsPerPage to dependencies

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
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 text-white rounded-t-2xl">
                  <TableHead className="text-center font-semibold text-white rounded-tl-2xl">
                    Location Name
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white">
                    Address
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white">
                    Type
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white">
                    Gross Sales
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white">
                    On-boarding
                  </TableHead>
                  <TableHead className="text-center font-semibold text-white rounded-tr-2xl">
                    Actions
                  </TableHead>
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
          </div>


            {/* ✅ Fixed Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-4 mt-4">
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                  Showing {machineLocation?.data?.length || 0} of {totalCount} locations
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
                        {[5, 10, 20, 50, 100].map((pageSize) => (
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
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8 bg-transparent"
                      size="icon"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8 bg-transparent"
                      size="icon"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Go to next page</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden size-8 lg:flex bg-transparent"
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Go to last page</span>
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Locations