"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconSearch, IconDownload, IconArrowRight } from "@tabler/icons-react"
import moment from "moment-timezone"

interface PointsShareData {
    id: string
    alternate_name: string
    user_name: string
    msisdn: string
    alternate_msisdn: string
    amount: number
    created_at: string
    status: string
}

interface PointsShareTableProps {
    tableData: PointsShareData[]
}

function PointsShareTable({ tableData }: PointsShareTableProps) {
    const [machineNumber, setMachineNumber] = useState("")

    const tableDataFilter = machineNumber
        ? tableData.filter((e: PointsShareData) => e.id.includes(machineNumber))
        : tableData

    const getStatusBadge = (status: string) => {
        const variant =
            status.toLowerCase() === "completed"
                ? "default"
                : status.toLowerCase() === "pending"
                    ? "secondary"
                    : status.toLowerCase() === "failed"
                        ? "destructive"
                        : "outline"
        return <Badge variant={variant}>{status}</Badge>
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">Points Share</CardTitle>
                            <CardDescription className="mt-2 text-sm text-gray-700">
                                A list of all the machines in your account including their machine id, locations, type and brands.
                            </CardDescription>
                        </div>
                        <Button variant="outline" className="hidden sm:flex bg-transparent">
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export as CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by machine number"
                            value={machineNumber}
                            onChange={(e) => setMachineNumber(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-center font-semibold">Transfer Names</TableHead>
                                    <TableHead className="text-center font-semibold">Transfer Phone</TableHead>
                                    <TableHead className="text-center font-semibold">Amount</TableHead>
                                    <TableHead className="text-center font-semibold">Transfer Date</TableHead>
                                    <TableHead className="text-center font-semibold">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableDataFilter.length > 0 ? (
                                    tableDataFilter.map((machine: PointsShareData) => (
                                        <TableRow key={machine.id} className="hover:bg-muted/50">
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-medium">{machine.alternate_name}</span>
                                                    <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span>{machine.user_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-medium">{machine.msisdn}</span>
                                                    <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span>{machine.alternate_msisdn}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-green-600">
                                                ${machine.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {moment(machine.created_at).tz("Etc/GMT-0").format("llll")}
                                            </TableCell>
                                            <TableCell className="text-center">{getStatusBadge(machine.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            {machineNumber ? "No results found for your search." : "No data available."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {tableDataFilter.length > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Showing {tableDataFilter.length} of {tableData.length} entries
                                {machineNumber && ` (filtered by "${machineNumber}")`}
                            </span>
                            <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                                <IconDownload className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default PointsShareTable
