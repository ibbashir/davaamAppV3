"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { SiteHeader } from '@/components/site-header'
import {
    IconMapPin,
    IconPlus,
    IconSearch,
    IconBuilding,
    IconEdit,
    IconTrash,
    IconMap,
    IconUsers,
} from "@tabler/icons-react"

const locations = [
    {
        id: 1,
        name: "Downtown Office Complex",
        address: "123 Business Ave, Downtown, NY 10001",
        type: "Office Building",
        machines: 5,
        status: "Active",
        revenue: "$4,567.80",
        lastUpdate: "2 hours ago",
        coordinates: "40.7128, -74.0060",
    },
    {
        id: 2,
        name: "University Campus - Main Hall",
        address: "456 University Dr, Campus, NY 10002",
        type: "Educational",
        machines: 8,
        status: "Active",
        revenue: "$6,234.50",
        lastUpdate: "1 hour ago",
        coordinates: "40.7589, -73.9851",
    },
    {
        id: 3,
        name: "Shopping Mall - Food Court",
        address: "789 Mall Blvd, Shopping District, NY 10003",
        type: "Retail",
        machines: 12,
        status: "Active",
        revenue: "$8,901.20",
        lastUpdate: "30 mins ago",
        coordinates: "40.7505, -73.9934",
    },
    {
        id: 4,
        name: "Hospital - Main Lobby",
        address: "321 Health St, Medical District, NY 10004",
        type: "Healthcare",
        machines: 3,
        status: "Maintenance",
        revenue: "$1,456.30",
        lastUpdate: "1 day ago",
        coordinates: "40.7282, -73.9942",
    },
]

const Locations = () => {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredLocations = locations.filter(
        (location) =>
            location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.type.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const getStatusBadge = (status: string) => {
        const variant = status === "Active" ? "default" : status === "Maintenance" ? "secondary" : "destructive"
        return <Badge variant={variant}>{status}</Badge>
    }

    const getTypeBadge = (type: string) => {
        const colors = {
            "Office Building": "bg-blue-100 text-blue-800",
            Educational: "bg-green-100 text-green-800",
            Retail: "bg-purple-100 text-purple-800",
            Healthcare: "bg-red-100 text-red-800",
        }
        return (
            <Badge variant="outline" className={colors[type as keyof typeof colors]}>
                {type}
            </Badge>
        )
    }
    return (
        <div>
            <SiteHeader title="Machine Locations" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Location Management</h1> */}
                        <p className="text-muted-foreground">Manage vending machine locations and sites</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <IconMap className="mr-2 h-4 w-4" />
                            View Map
                        </Button>
                        {/* <Button className="bg-teal-600 hover:bg-teal-700">
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Location
                        </Button> */}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                            <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{locations.length}</div>
                            <p className="text-xs text-muted-foreground">Active locations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
                            <IconBuilding className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{locations.reduce((sum, loc) => sum + loc.machines, 0)}</div>
                            <p className="text-xs text-muted-foreground">Across all locations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <IconUsers className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">$21,159.80</div>
                            <p className="text-xs text-muted-foreground">Combined revenue</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg per Location</CardTitle>
                            <IconMapPin className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">$5,289.95</div>
                            <p className="text-xs text-muted-foreground">Average revenue</p>
                        </CardContent>
                    </Card>
                </div>

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
                                    <TableHead>Machines</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Update</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLocations.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{location.name}</div>
                                                    <div className="text-xs text-muted-foreground">{location.coordinates}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <div className="truncate">{location.address}</div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(location.type)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{location.machines} machines</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-green-600">{location.revenue}</TableCell>
                                        <TableCell>{getStatusBadge(location.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">{location.lastUpdate}</TableCell>
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
                </Card>
            </div>
        </div>
    )
}

export default Locations
