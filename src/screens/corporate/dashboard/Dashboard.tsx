import { SiteHeader } from "@/components/corporate/site-header"
import SanitaryTransactionTable from "./CorporateSanitaryTrasactions"
import AllCorporatesUsers from "./AllCorporatesUsers"
import PieCorporateDashboardSanitary from "@/components/corporate/PieCorporateDashboardSanitary"
import BarCorporateDashboardSanitary from "@/components/corporate/BarCorporateDashboardSanitary"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

const Dashboard = () => {
  const { state } = useAuth()
  const { user } = state

  // ✅ Extract machine_code values as array of strings/numbers
  const machineCodes = Array.isArray(user?.machines)
    ? user.machines.map((m: { machine_code: number }) => m.machine_code)
    : []

  // UI: initially show only buttons & cards (no graphs)
  const [activeGraph, setActiveGraph] = useState<"none" | "dispensing" | "brands" | "both">("none")

  const toggleGraph = (g: "dispensing" | "brands") => {
    // clicking will toggle that graph; if both shown and clicking same, hide -> follow requested behavior
    if (activeGraph === "none") {
      setActiveGraph(g)
    } else if (activeGraph === g) {
      setActiveGraph("none")
    } else if (activeGraph === "both") {
      setActiveGraph(g)
    } else {
      // currently showing the other one -> show both
      setActiveGraph("both")
    }
  }

  return (
    <>
      <SiteHeader title=" Coperate Dashboard" />
      <div
        className="flex flex-1 flex-col"
        
      >
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex flex-col gap-2">
              {/* Buttons area (initially visible) */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-3">
                <button
                  onClick={() => toggleGraph("dispensing")}
                  className={`px-4 py-2 rounded-full font-medium transition-shadow flex items-center gap-2 ${
                    activeGraph === "dispensing" || activeGraph === "both"
                      ? "bg-green-600 text-white shadow-xl"
                      : "bg-white text-green-700 border border-green-100"
                  }`}
                >
                  💰 Dispensing Revenue & Transactions Breakdown
                </button>

                <button
                  onClick={() => toggleGraph("brands")}
                  className={`px-4 py-2 rounded-full font-medium transition-shadow flex items-center gap-2 ${
                    activeGraph === "brands" || activeGraph === "both"
                      ? "bg-emerald-600 text-white shadow-xl"
                      : "bg-white text-emerald-700 border border-emerald-100"
                  }`}
                >
                  🏷️ Sanitary Brands Revenue
                </button>

                <div className="ml-auto text-sm text-muted-foreground">
                  <span className="inline-block mr-2">♻️</span>
                  <span>DavaamLife</span>
                </div>
              </div>
              
              {/* Graph placeholders: only shown when toggled */}
              <div className="px-0 lg:px-6">
                {activeGraph !== "none" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {(activeGraph === "dispensing" || activeGraph === "both") && (
                      <div className="p-4 rounded-2xl bg-white/90 shadow-sm">
                        <BarCorporateDashboardSanitary machineCodes={machineCodes} />
                      </div>
                    )}

                    {(activeGraph === "brands" || activeGraph === "both") && (
                      <div className="p-4 rounded-2xl bg-white/90 shadow-sm">
                        <PieCorporateDashboardSanitary machineCodes={machineCodes} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <hr />

            <div className="p-4 flex flex-col gap-4">
              {/* Cards sections (always visible) */}
              <SanitaryTransactionTable />
              <AllCorporatesUsers />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
