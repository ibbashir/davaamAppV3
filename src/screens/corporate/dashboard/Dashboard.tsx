import { SiteHeader } from "@/components/corporate/site-header"
import SanitaryTransactionTable from "./CorporateSanitaryTrasactions"
import AllCorporatesUsers from "./AllCorporatesUsers"
import PieCorporateDashboardSanitary from "@/components/corporate/PieCorporateDashboardSanitary"
import BarCorporateDashboardSanitary from "@/components/corporate/BarCorporateDashboardSanitary"
import { useAuth } from "@/contexts/AuthContext"

const Dashboard = () => {
  const { state } = useAuth()
  const { user } = state

  // ✅ Extract machine_code values as array of strings/numbers
  const machineCodes = Array.isArray(user?.machines)
    ? user.machines.map((m: { machine_code: number }) => m.machine_code)
    : []

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex flex-col gap-2">
                <div className="px-4 lg:px-6">
                    <BarCorporateDashboardSanitary machineCodes={machineCodes} />
                    <PieCorporateDashboardSanitary machineCodes={machineCodes}/>
                </div>
            </div>
            <hr />
            <div className="p-4 flex flex-col gap-4">
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
