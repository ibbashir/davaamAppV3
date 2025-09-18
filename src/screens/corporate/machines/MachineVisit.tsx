"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { postRequest } from "@/Apis/Api"
import { timeConverter } from "@/constants/Constant"
import type { MachineDetails } from "./Types"

const CorporateMachineVisit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [machine, setMachine] = useState<MachineDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchMachineDetails(Number(id))
  }, [id])

  const fetchMachineDetails = async (machineCode: number) => {
    try {
      setLoading(true)
      const res = await postRequest<any>(
        "/corporates/machineDetailsWithMachineCode",
        { machine_code: machineCode }
      )
      console.log("API response:", res)

      if (!res || !res.success) {
        setMachine(null)
        return
      }

      const mappedMachine: MachineDetails = {
        machine_code: res.machine_code,
        machine_name: res.machine_name || "-",
        machine_type: res.machine_type || "-",
        statusCode: res.statusCode || res.status || "p",
        created_at: res.created_at || new Date().toISOString(),
        brands: (res.brands || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          availableQuantity: b.availableQuantity || 0,
          price: Number(b.price || b.litre_price || 0)
        })),
        fillings: (res.fillings || []).map((f: any) => ({
          id: f.id,
          batch_number: f.batch_number,
          quantity: f.quantity,
          litres: f.litres
        })),
        transactions: (res.transactions || []).map((t: any) => ({
          id: t.id,
          user: t.user || t.user_id || "-",
          amount: Number(t.amount || 0),
          date: t.date || t.created_at || "-"
        }))
      }

      setMachine(mappedMachine)
    } catch (err) {
      console.error("Error fetching machine details:", err)
      setMachine(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (status === "g" || status === "1") return <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
    if (status === "r" || status === "0") return <Badge className="bg-red-100 text-red-800">❌ Inactive</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>
  }

  if (loading) return <p className="text-center p-10">⏳ Loading machine details...</p>

  if (!machine)
    return (
      <div className="text-center p-10">
        <p>❌ No details found for this machine.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    )

  return (
    <div className="p-6">
      {/* Header */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <h2 className="text-xl font-bold text-teal-700">
            Machine #{machine.machine_code} — {machine.machine_name}
          </h2>
          <div className="flex gap-3 mt-2 flex-wrap">
            {getStatusBadge(machine.statusCode)}
            <Badge variant="outline">{machine.machine_type}</Badge>
            {machine.created_at && (
              <Badge variant="outline">
                Last Active: {timeConverter(new Date(machine.created_at).getTime())}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="stock">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">📦 Stock Levels</TabsTrigger>
          <TabsTrigger value="fillings">🧴 Fillings</TabsTrigger>
          <TabsTrigger value="transactions">🧾 Transactions</TabsTrigger>
        </TabsList>

        {/* Stock */}
        <TabsContent value="stock">
          <Card>
            <CardContent className="p-4">
              {(!machine.brands || machine.brands.length === 0) ? (
                <p>No stock data available.</p>
              ) : (
                <ul className="space-y-2">
                  {machine.brands.map((b) => (
                    <li key={b.id} className="flex justify-between border-b py-2 text-sm">
                      <span>{b.name}</span>
                      <span>Qty: {b.availableQuantity} | Price: {b.price} PKR</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fillings */}
        <TabsContent value="fillings">
          <Card>
            <CardContent className="p-4">
              {(!machine.fillings || machine.fillings.length === 0) ? (
                <p>No fillings data available.</p>
              ) : (
                <ul className="space-y-2">
                  {machine.fillings.map((f) => (
                    <li key={f.id} className="flex justify-between border-b py-2 text-sm">
                      <span>Batch #{f.batch_number}</span>
                      <span>Qty: {f.quantity || "-"} | Litres: {f.litres || "-"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-4">
              {(!machine.transactions || machine.transactions.length === 0) ? (
                <p>No transactions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {machine.transactions.map((t) => (
                    <li key={t.id} className="flex justify-between border-b py-2 text-sm">
                      <span>{t.user} — {t.date}</span>
                      <span className="font-semibold">{t.amount} PKR</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CorporateMachineVisit
