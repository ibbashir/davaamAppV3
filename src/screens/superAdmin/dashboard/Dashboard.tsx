import { SuperAdminMobileUsersDataTable } from "@/components/superAdmin/data-table"
import { SectionCards } from "@/components/superAdmin/section-cards"
import { SiteHeader } from "@/components/superAdmin/site-header"
import RecentTransactions from "./RecentTransactions"
import SuperAdminDashboardSanitary from "@/components/superAdmin/PieMainDashboardSanitary"
import SuperAdminDashboardDispensing from "@/components/superAdmin/PieMainDashboardDispensing"
import SuperAdminSanitaryBarChart from "@/components/superAdmin/superAdminSanitaryBarChart"
import SuperAdminDispensingBarChart from "@/components/superAdmin/superAdminBarChartDispensing"

const   Dashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <SuperAdminDashboardSanitary />
                                <SuperAdminDashboardDispensing />
                            </div>
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <SuperAdminSanitaryBarChart />
                                <SuperAdminDispensingBarChart/>
                            </div>
                        </div>
                        <SuperAdminMobileUsersDataTable />
                        <hr />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
        </>

    )
}

export default Dashboard
