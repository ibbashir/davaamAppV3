"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { SiteHeader } from "@/components/corporate/site-header"

// Dummy data (keep until API is ready)
const stockData = [
  { item: "Sanitary Pad A", batch: "B001", expiry: "2024-12", quantity: 50 },
  { item: "Sanitary Pad B", batch: "B002", expiry: "2025-01", quantity: 30 },
]

const priceData = [
  { item: "Sanitary Pad A", price: "50 PKR" },
  { item: "Sanitary Pad B", price: "60 PKR" },
]

const transactionData = [
  { date: "2025-09-01", item: "Sanitary Pad A", quantity: 2, amount: "100 PKR" },
  { date: "2025-09-02", item: "Sanitary Pad B", quantity: 1, amount: "60 PKR" },
]

export default function CorporateMachineVisit() {
  const { id } = useParams<{ id: string }>()   // ✅ get machine id from URL
  const [stockView, setStockView] = useState("batch")
  const [activeTab, setActiveTab] = useState("stock-levels")

  useEffect(() => {
    console.log("Corporate visiting machine:", id)
    // Later replace console.log with API call using `id`
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* ✅ Use Corporate Header instead of Admin */}
        <SiteHeader title={`Corporate Machine Visit – ${id}`} /> 

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Stock Levels */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stock-levels">Stock Levels</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Stock Levels Tab */}
          <TabsContent value="stock-levels">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Stock Levels</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setStockView("batch")} variant={stockView === "batch" ? "default" : "outline"}>
                    By Batch
                  </Button>
                  <Button onClick={() => setStockView("expiry")} variant={stockView === "expiry" ? "default" : "outline"}>
                    By Expiry
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>{stockView === "batch" ? "Batch" : "Expiry"}</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.item}</TableCell>
                        <TableCell>{stockView === "batch" ? s.batch : s.expiry}</TableCell>
                        <TableCell>{s.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pricing</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Price
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceData.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.item}</TableCell>
                        <TableCell>{p.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transactions</CardTitle>
                <Button>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionData.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.item}</TableCell>
                        <TableCell>{t.quantity}</TableCell>
                        <TableCell>{t.amount}</TableCell>
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
  )
}
