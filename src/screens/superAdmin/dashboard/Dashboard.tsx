import { ChartAreaInteractive } from "@/components/superAdmin/chart-area-interactive"
import { SuperAdminMobileUsersDataTable } from "@/components/superAdmin/data-table"
import { SectionCards } from "@/components/superAdmin/section-cards"
import { SiteHeader } from "@/components/superAdmin/site-header"
import RecentTransactions from "./RecentTransactions"
import SuperAdminDashboardSanitary from "@/components/superAdmin/PieMainDashboardSanitary"
import SuperAdminDashboardDispensing from "@/components/superAdmin/PieMainDashboardDispensing"

const Dashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6 flex flex-col gap-2">
                            <ChartAreaInteractive />
                            <SuperAdminDashboardSanitary />
                            <SuperAdminDashboardDispensing />
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
