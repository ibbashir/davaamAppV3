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

  console.log("Corporate Dashboard user:", user)

  // ✅ Extract machine_code values as array of strings/numbers
  const machineCodes = Array.isArray(user?.machines)
    ? user.machines.map((m: { machine_code: number }) => m.machine_code)
    : []

  // UI: initially show only buttons & cards (no graphs)
  const [activeGraph, setActiveGraph] = useState<"none" | "dispensing" | "brands" | "both">("both")

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
      <SiteHeader title="🌿 Corporate Dashboard" />
      <div
        className="flex flex-1 flex-col"

      >
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">


            <div className="p-4 flex flex-col gap-4">
              {/* Cards sections (always visible) */}
              <SanitaryTransactionTable />
              <AllCorporatesUsers />
            </div>

            <hr />

            <div className="px-4 flex flex-col gap-2">
              {/* Graph placeholders: only shown when toggled */}
              <div className="px-0">
                {activeGraph !== "none" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {(activeGraph === "dispensing" || activeGraph === "both") && (
                      <div className="rounded-2xl bg-white/90">
                        <BarCorporateDashboardSanitary machineCodes={machineCodes} />
                      </div>
                    )}

                    {(activeGraph === "brands" || activeGraph === "both") && (
                      <div className="rounded-2xl bg-white/90">
                        <PieCorporateDashboardSanitary machineCodes={machineCodes} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
