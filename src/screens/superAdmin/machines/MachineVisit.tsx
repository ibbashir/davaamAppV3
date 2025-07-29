"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { SiteHeader } from "@/components/superAdmin/site-header"

// Sample data
const stockData = [
    {
        id: 1,
        name: "Maxi Cottony Soft XL - Row 1",
        quantity: 30,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 1,
        lastBatchRefill: 30,
        stocksOut: 4,
        currentStock: 26,
    },
    {
        id: 2,
        name: "Maxi Cottony Soft XL - Row 2",
        quantity: 34,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 1,
        lastBatchRefill: 34,
        stocksOut: 1,
        currentStock: 33,
    },
    {
        id: 3,
        name: "Maxi Fabric Soft XL - Row 3",
        quantity: 35,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 1,
        lastBatchRefill: 35,
        stocksOut: 4,
        currentStock: 31,
    },
    {
        id: 4,
        name: "Maxi Cottony Soft Long - Row 4",
        quantity: 37,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 1,
        lastBatchRefill: 37,
        stocksOut: 0,
        currentStock: 37,
    },
    {
        id: 5,
        name: "Ultra Thin Cottony XL - Row 5",
        quantity: 42,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 2,
        lastBatchRefill: 42,
        stocksOut: 2,
        currentStock: 40,
    },
    {
        id: 6,
        name: "Ultra Thin Cottony XL - Row 6",
        quantity: 38,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 2,
        lastBatchRefill: 38,
        stocksOut: 3,
        currentStock: 35,
    },
    {
        id: 7,
        name: "Ultra Thin Cottony L - Row 7",
        quantity: 40,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 3,
        lastBatchRefill: 40,
        stocksOut: 1,
        currentStock: 39,
    },
    {
        id: 8,
        name: "Ultra Thin Cottony L - Row 8",
        quantity: 36,
        createdAt: "Mon, Sep 25, 2023 7:00 AM",
        batchNumber: 3,
        lastBatchRefill: 36,
        stocksOut: 2,
        currentStock: 34,
    },
]

const priceData = [
    { id: 1, brandName: "Maxi Cottony Soft XL", price: 330, brandId: 614 },
    { id: 2, brandName: "Maxi Cottony Soft XL", price: 330, brandId: 624 },
    { id: 3, brandName: "Maxi Fabric Soft XL", price: 330, brandId: 634 },
    { id: 4, brandName: "Maxi Cottony Soft Long", price: 330, brandId: 644 },
    { id: 5, brandName: "Ultra Thin Cottony XL", price: 440, brandId: 694 },
    { id: 6, brandName: "Ultra Thin Cottony XL", price: 440, brandId: 704 },
    { id: 7, brandName: "Ultra Thin Cottony L", price: 330, brandId: 714 },
    { id: 8, brandName: "Ultra Thin Cottony L", price: 330, brandId: 724 },
]

const transactionData = [
    {
        sno: 1,
        phone: "21176",
        product: "Maxi Cottony Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Jan 24, 2025 10:47 AM",
    },
    {
        sno: 2,
        phone: "21176",
        product: "Maxi Cottony Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Jan 24, 2025 9:35 AM",
    },
    {
        sno: 3,
        phone: "03028229100",
        product: "Maxi Cottony Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Sep 13, 2024 5:28 PM",
    },
    {
        sno: 4,
        phone: "03028229100",
        product: "Maxi Cottony Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Sep 13, 2024 5:27 PM",
    },
    {
        sno: 5,
        phone: "03028229100",
        product: "Maxi Fabric Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Mon, Sep 9, 2024 12:15 PM",
    },
    {
        sno: 6,
        phone: "03028229100",
        product: "Maxi Cottony Soft Long",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Wed, Sep 4, 2024 11:52 AM",
    },
    {
        sno: 7,
        phone: "4376",
        product: "Ultra Thin Cottony XL",
        amount: 440,
        price: 440,
        quantity: 1,
        createdAt: "Fri, Aug 16, 2024 9:43 AM",
    },
    {
        sno: 8,
        phone: "4376",
        product: "Ultra Thin Cottony XL",
        amount: 440,
        price: 440,
        quantity: 1,
        createdAt: "Tue, Aug 13, 2024 12:36 PM",
    },
    {
        sno: 9,
        phone: "4376",
        product: "Ultra Thin Cottony L",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Mon, Aug 12, 2024 3:04 PM",
    },
    {
        sno: 10,
        phone: "28404",
        product: "Ultra Thin Cottony L",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Oct 20, 2023 7:08 PM",
    },
    {
        sno: 11,
        phone: "28404",
        product: "Ultra Thin Cottony L",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Oct 20, 2023 7:07 PM",
    },
    {
        sno: 12,
        phone: "28404",
        product: "Maxi Fabric Soft XL",
        amount: 330,
        price: 330,
        quantity: 1,
        createdAt: "Fri, Oct 20, 2023 7:06 PM",
    },
]

export default function SuperAdminMachineVisit() {
    const [stockView, setStockView] = useState("batch")
    const [activeTab, setActiveTab] = useState("stock-levels")

    return (
        <div>
            <SiteHeader title="Machine Details"/>
                <div className="min-h-screen bg-gray-50 p-4">
                <div className="mx-auto max-w-7xl">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="stock-levels">Stock Levels</TabsTrigger>
                            <TabsTrigger value="sales-usage">Sales & usage</TabsTrigger>
                            <TabsTrigger value="update-price">Update price</TabsTrigger>
                            <TabsTrigger value="user-transactions">User transactions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="stock-levels" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Button
                                        variant={stockView === "batch" ? "default" : "outline"}
                                        onClick={() => setStockView("batch")}
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        Stocks Refill By Batch Number
                                    </Button>
                                    <Button
                                        variant={stockView === "realtime" ? "default" : "outline"}
                                        onClick={() => setStockView("realtime")}
                                        className={stockView === "realtime" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                                    >
                                        Stocks Real Time
                                    </Button>
                                </div>
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Stock
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {stockData.map((item) => (
                                    <div key={item.id} className="space-y-4">
                                        <h2 className="text-xl font-semibold text-center text-slate-700">{item.name}</h2>

                                        {stockView === "batch" ? (
                                            <Card>
                                                <CardContent className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Quantity</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.quantity}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Created at</Label>
                                                            <div className="mt-1 text-sm text-slate-500">{item.createdAt}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Batch Number</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.batchNumber}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <CardContent className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Last Batch Refill</Label>
                                                            <div className="mt-1 text-lg font-medium">{item.lastBatchRefill}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Stocks Out</Label>
                                                            <div className="mt-1 text-lg font-medium text-red-600">{item.stocksOut}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-slate-600">Current stock</Label>
                                                            <div className="mt-1 text-lg font-medium text-green-600">{item.currentStock}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="sales-usage" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sales & Usage Analytics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-slate-500">Sales and usage analytics will be displayed here</div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="update-price" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-slate-800">Update price</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Brand name</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Brand id</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {priceData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.id}</TableCell>
                                                    <TableCell>{item.brandName}</TableCell>
                                                    <TableCell>{item.price}</TableCell>
                                                    <TableCell>{item.brandId}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="user-transactions" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-slate-800">User transactions</h1>
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export as csv
                                </Button>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SNO</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Created at</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactionData.map((transaction) => (
                                                <TableRow key={transaction.sno}>
                                                    <TableCell className="font-medium">{transaction.sno}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.phone}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.product}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.amount}</TableCell>
                                                    <TableCell>{transaction.price}</TableCell>
                                                    <TableCell>{transaction.quantity}</TableCell>
                                                    <TableCell className="text-sm text-slate-500">{transaction.createdAt}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
        </div>
        </div >
    )
}
