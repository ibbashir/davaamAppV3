import { ChartAreaInteractive } from "@/components/ops/chart-area-interactive"
import { OpsMobileUsersDataTable } from "@/components/ops/data-table"
import { SectionCards } from "@/components/ops/section-cards"
import { SiteHeader } from "@/components/ops/site-header"
import RecentTransactions from "./RecentTransactions"
import OpsDashboardDispensing from "@/components/ops/PieMainDashboardDispensing"
import OpsDashboardSanitary from "@/components/ops/PieMainDashboardSanitary"

const Dashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6">
                            <ChartAreaInteractive />
                            <OpsDashboardSanitary />
                            <OpsDashboardDispensing />
                        </div>
                        <OpsMobileUsersDataTable />
                        <hr />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
        </>

    )
}

export default Dashboard
