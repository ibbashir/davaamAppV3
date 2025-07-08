"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    IconCpu,
    IconWifi,
    IconWifiOff,
    IconSettings,
    IconMapPin,
    IconSearch,
    IconFilter,
    IconDownload,
} from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SiteHeader } from "@/components/ops/site-header"

const machines = [
    {
        id: "MCH001",
        name: "Vending Machine Alpha",
        location: "Building A - Floor 1",
        status: "Online",
        lastSeen: "2 mins ago",
        revenue: "$1,234.50",
        transactions: 156,
        uptime: "99.2%",
    },
    {
        id: "MCH002",
        name: "Vending Machine Beta",
        location: "Building B - Floor 2",
        status: "Offline",
        lastSeen: "1 hour ago",
        revenue: "$892.30",
        transactions: 98,
        uptime: "87.5%",
    },
    {
        id: "MCH003",
        name: "Vending Machine Gamma",
        location: "Building C - Lobby",
        status: "Online",
        lastSeen: "5 mins ago",
        revenue: "$2,156.80",
        transactions: 234,
        uptime: "98.7%",
    },
    {
        id: "MCH004",
        name: "Vending Machine Delta",
        location: "Building A - Floor 3",
        status: "Maintenance",
        lastSeen: "30 mins ago",
        revenue: "$567.20",
        transactions: 67,
        uptime: "92.1%",
    },
]

const Machines = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const filteredMachines = machines.filter((machine) => {
        const matchesSearch =
            machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || machine.status.toLowerCase() === statusFilter.toLowerCase()
        return matchesSearch && matchesStatus
    })

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "online":
                return <IconWifi className="h-4 w-4 text-green-500" />
            case "offline":
                return <IconWifiOff className="h-4 w-4 text-red-500" />
            case "maintenance":
                return <IconSettings className="h-4 w-4 text-yellow-500" />
            default:
                return <IconCpu className="h-4 w-4" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variant = status === "Online" ? "default" : status === "Offline" ? "destructive" : "secondary"
        return <Badge variant={variant}>{status}</Badge>
    }

    return (
        <div>
            <SiteHeader title="Machines" />

            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-2xl font-bold tracking-tight">Machine Management</h1> */}
                        <p className="text-muted-foreground">Monitor and manage all vending machines</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <IconSettings className="mr-2 h-4 w-4" />
                            Machine Settings
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
                            <IconCpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{machines.length}</div>
                            <p className="text-xs text-muted-foreground">Registered machines</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Online</CardTitle>
                            <IconWifi className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {machines.filter((m) => m.status === "Online").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Currently active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offline</CardTitle>
                            <IconWifiOff className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {machines.filter((m) => m.status === "Offline").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Need attention</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                            <IconSettings className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {machines.filter((m) => m.status === "Maintenance").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Under maintenance</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Machine Overview</CardTitle>
                        <CardDescription>Real-time status and performance of all machines</CardDescription>
                        <div className="flex gap-4 pt-4">
                            <div className="relative flex-1">
                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search machines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <IconFilter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Machine ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Transactions</TableHead>
                                    <TableHead>Uptime</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMachines.map((machine) => (
                                    <TableRow key={machine.id}>
                                        <TableCell className="font-medium">{machine.id}</TableCell>
                                        <TableCell>{machine.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                                {machine.location}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(machine.status)}
                                                {getStatusBadge(machine.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{machine.lastSeen}</TableCell>
                                        <TableCell className="font-medium text-green-600">{machine.revenue}</TableCell>
                                        <TableCell>{machine.transactions}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {machine.uptime}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <IconSettings className="h-4 w-4" />
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

export default Machines
