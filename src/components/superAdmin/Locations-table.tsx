"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconDownload, IconExternalLink, IconMapPin } from "@tabler/icons-react"

interface LocationData {
    _id: string
    machine_name: string
    machine_code: string
    machine_location: string
}

interface LocationsTableProps {
    tableData: LocationData[]
}

const LocationsTable = ({ tableData }: LocationsTableProps) => {
    const handleExportCSV = () => {
        // CSV export logic would go here
        console.log("Exporting CSV...")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold">Locations</CardTitle>
                            <CardDescription className="mt-2">
                                A list of all the locations in your account including their name, company code, location and action.
                            </CardDescription>
                        </div>
                        <Button onClick={handleExportCSV} className="bg-teal-600 hover:bg-teal-700">
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export as CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">#</TableHead>
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Company Code</TableHead>
                                    <TableHead className="font-semibold">Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableData.length > 0 ? (
                                    tableData.map((loc: LocationData, key: number) => (
                                        <TableRow key={loc._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <Badge variant="outline" className="w-8 h-6 justify-center">
                                                    {key + 1}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                                    {loc.machine_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    {loc.machine_code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="link" className="h-auto p-0 text-blue-600 hover:text-blue-800" asChild>
                                                    <a
                                                        href={loc.machine_location}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <span className="underline">{loc.machine_location}</span>
                                                        <IconExternalLink className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No locations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {tableData.length > 0 && (
                        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                            <span>Showing {tableData.length} locations</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default LocationsTable
