"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { postRequest } from "@/Apis/Api"

type Transaction = {
    id: number
    user_id: string
    msisdn: string
    quantity: number
    amount: string
    status: number
    created_at: string
    epoch_time: number
    merchant: string
    transaction_number: string
    brand_id: number
    machine_code: string
}

const SanitaryTransactionTable = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const storedCodes = localStorage.getItem("machines")
            const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

            if (machineCodes.length === 0) {
                console.warn("No machine codes found in localStorage.")
                setTransactions([])
                setLoading(false)
                return
            }

            const res = await postRequest<{ data: Transaction[] }>(
                "corporates/getAllCorporateSanitaryTrasactions",
                { machine_code: machineCodes }
            )

            setTransactions(res.data)
        } catch (err) {
            console.error("Error fetching sanitary transactions:", err)
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">Corporate Sanitary Transactions</h2>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Merchant</TableHead>
                            <TableHead>Amount (Rs)</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Transaction Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">No data found</TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((t, index) => (
                                <TableRow key={t.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{t.msisdn || "N/A"}</TableCell>
                                    <TableCell>{t.merchant}</TableCell>
                                    <TableCell>Rs. {t.amount}</TableCell>
                                    <TableCell>{t.quantity}</TableCell>
                                    <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default SanitaryTransactionTable
