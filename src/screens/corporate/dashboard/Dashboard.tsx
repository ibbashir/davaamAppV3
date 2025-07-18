// import { ChartAreaInteractive } from "@/components/corporate/chart-area-interactive"
// import { CorporateMobileUsersDataTable } from "@/components/corporate/data-table"
import { SectionCards } from "@/components/corporate/section-cards"
import { SiteHeader } from "@/components/corporate/site-header"
import SanitaryTransactionTable from "./CorporateSanitaryTrasactions"
import AllCorporatesUsers from "./AllCorporatesUsers"
// import CorporateDashboardSanitary from "@/components/corporate/PieMainDashboardSanitary"
// import CorporateDashboardDispensing from "@/components/corporate/PieMainDashboardDispensing"

const Dashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {/* <SectionCards /> */}
                        <div className="px-4 lg:px-6 flex flex-col gap-2">
                            {/* <CorporateDashboardDispensing />
                            <CorporateDashboardSanitary /> */}
                        </div>
                        <hr />
                        <SanitaryTransactionTable />
                        <AllCorporatesUsers />
                    </div>
                </div>
            </div>
        </>

    )
}

export default Dashboard
