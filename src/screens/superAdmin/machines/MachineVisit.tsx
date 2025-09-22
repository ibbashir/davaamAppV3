"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { SiteHeader } from "@/components/superAdmin/site-header"
import { useLocation } from "react-router-dom"
import { postRequest } from "@/Apis/Api"


export default function SuperAdminMachineVisit() {
    const { state } = useLocation()
    const machine = state?.machine

    useEffect(() => {
        fetchData()
      }, [])
    const [stockView, setStockView] = useState("batch")
    const [activeTab, setActiveTab] = useState("stock-levels")
    const [userTransactions,setUserTransactions]=useState([]);
    const [brands,setBrands]=useState([])
    const [brandFillings,setBrandFillings]=useState([])

     const fetchData=async()=>{
        const res=await postRequest(`/superadmin/machineDetailsWithMachineCode`,{machine_code:3110})
        setUserTransactions(res.transactions)
        setBrandFillings(res.fillings)
        setBrands(res.brands)
    }
    
    console.log(brandFillings)
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
                                {brandFillings.map((item) => (
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
                                                <TableHead>Brand name</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Brand id</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {brands.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.price}</TableCell>
                                                    <TableCell>{item.id}</TableCell>
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
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Machine Code</TableHead>
                                                <TableHead>Created at</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userTransactions.map((transaction,index) => (
                                                <TableRow key={transaction.id || index}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.msisdn}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.brand_id}</TableCell>
                                                    <TableCell className="text-blue-600">{transaction.amount}</TableCell>
                                                    <TableCell>{transaction.quantity}</TableCell>
                                                    <TableCell>{transaction.machine_code}</TableCell>
                                                    <TableCell className="text-sm text-slate-500">{transaction.created_at}</TableCell>
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
