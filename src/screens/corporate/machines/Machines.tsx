"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ApiMachine, MachinesResponse } from "./Types"
import { timeConverter } from "@/constants/Constant"
import { SiteHeader } from "@/components/corporate/site-header"
import { postRequest } from "@/Apis/Api"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"

const CorporateMachines = () => {
  const navigate = useNavigate()
  const { state } = useAuth()
  const { user } = state

  // Get all machine_codes for logged-in user
  const machineCodes = useMemo(
    () =>
      Array.isArray(user?.machines)
        ? user.machines.map((m: { machine_code: number }) => m.machine_code)
        : [],
    [user?.machines]
  )

  const [machinesData, setMachinesData] = useState<{ [category: string]: ApiMachine[] } | null>(null)
  const [machineStockMap, setMachineStockMap] = useState<{ [code: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [expandedMachine, setExpandedMachine] = useState<number | null>(null)

  useEffect(() => {
    if (machineCodes.length > 0) fetchMachines()
  }, [machineCodes])

  const fetchMachines = async () => {
    try {
      setLoading(true)
      const res = await postRequest<MachinesResponse>(
        "/corporates/getAllMachineStockAndStatusByMachineCode",
        { machine_code: machineCodes }
      )

      const { machines, brands } = res.data
      const stockMap: { [code: string]: string } = {}
      const allBrands = [...brands.vending, ...brands.dispensing]
      const grouped: { [machine_code: number]: number[] } = {}

      allBrands.forEach((brand) => {
        const code = brand.machine_code
        if (!grouped[code]) grouped[code] = []
        grouped[code].push(brand.availableQuantity)
      })

      for (const [code, quantities] of Object.entries(grouped)) {
        if (quantities.every((q) => q === 0)) stockMap[code] = "Out of Stock"
        else if (quantities.some((q) => q < 10)) stockMap[code] = "Low Stock"
        else stockMap[code] = "In Stock"
      }

      setMachinesData(machines)
      setMachineStockMap(stockMap)
    } catch (error) {
      console.error("Error fetching machines:", error)
    } finally {
      setLoading(false)
    }
  }

  const allMachines = machinesData
    ? Object.entries(machinesData).flatMap(([_, machines]) =>
        machines.map((machine) => ({
          ...machine,
          lastActive: timeConverter(machine.created_at),
          stockStatus: machineStockMap[machine.machine_code] || "Unknown",
        }))
      )
    : []

  const getStatusBadge = (statusCode: string) => {
    if (statusCode === "g")
      return <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
    if (statusCode === "r")
      return <Badge className="bg-red-100 text-red-800">❌ Inactive</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>
  }

  const getStockStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "In Stock": "bg-green-100 text-green-800 border-green-300",
      "Low Stock": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Out of Stock": "bg-red-100 text-red-800 border-red-300",
      Unknown: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return (
      <Badge variant="outline" className={colorMap[status] || colorMap.Unknown}>
        {status}
      </Badge>
    )
  }

  return (
    <div>
      <SiteHeader title="Deployed Machines 🚀" />
      <div className="min-h-screen bg-gray-50 p-6">
        {loading ? (
          <p className="text-center text-lg py-10">⏳ Loading your eco-machines...</p>
        ) : allMachines.length === 0 ? (
          <p className="text-center text-lg py-10">🌱 No machines deployed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allMachines.map((machine) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="rounded-2xl shadow-lg border border-teal-200">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-teal-700">
                        🏷️ {machine.machine_code}
                      </h3>
                      {getStatusBadge(machine.statusCode)}
                    </div>
                    <p className="text-sm text-gray-600">⚙️ {machine.machine_type}</p>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-teal-500 text-teal-700 hover:bg-teal-50"
                      onClick={() =>
                        setExpandedMachine(expandedMachine === machine.id ? null : machine.id)
                      }
                    >
                      {expandedMachine === machine.id ? (
                        <>
                          Hide Details <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Show Details <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>

                    {expandedMachine === machine.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3"
                      >
                        <p>
                          <span className="font-semibold text-teal-700">🏷️ Machine Code:</span>{" "}
                          {machine.machine_code}
                        </p>
                        <p>
                          <span className="font-semibold text-teal-700">🔧 Type:</span>{" "}
                          {machine.machine_type}
                        </p>
                        <p>
                          <span className="font-semibold text-teal-700">📍 Location:</span>{" "}
                          {machine.machine_name}
                        </p>
                        <p>
                          <span className="font-semibold text-teal-700">🕒 Last Active:</span>{" "}
                          {machine.lastActive}
                        </p>
                        <p>
                          <span className="font-semibold text-teal-700">📦 Stock Status:</span>{" "}
                          {getStockStatusBadge(machine.stockStatus)}
                        </p>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              navigate(`/company/machine-visit/${machine.machine_code}`)
                            }
                          >
                            Visit
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CorporateMachines
