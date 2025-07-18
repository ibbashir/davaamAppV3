"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"

type CorporateUser = {
    id: number
    card_number: string | null
    pin: string
    name: string
    mobile_number: string
    balance: number
    is_active: number
    created_at: string
    machine_code: string
}

const AllCorporatesUsers = () => {
    const [users, setUsers] = useState<CorporateUser[]>([])
    const [loading, setLoading] = useState(false)

    const fetchCorporateUsers = async () => {
        setLoading(true)
        try {
            const storedCodes = localStorage.getItem("machines")
            const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

            const res = await postRequest<{ data: CorporateUser[] }>("/corporates/getAllCorporatesUsers", { machine_code: machineCodes }
            )
            setUsers(res.data)
        } catch (err) {
            console.error("Error fetching corporate users:", err)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCorporateUsers()
    }, [])

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">All Corporate Users</h2>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Machine Code</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">No users found</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => (
                                <TableRow key={user.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.mobile_number}</TableCell>
                                    <TableCell>Rs. {user.balance}</TableCell>
                                    <TableCell>
                                        {user.is_active ? (
                                            <span className="text-green-600 font-medium">Active</span>
                                        ) : (
                                            <span className="text-red-600 font-medium">Inactive</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.machine_code}</TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default AllCorporatesUsers
