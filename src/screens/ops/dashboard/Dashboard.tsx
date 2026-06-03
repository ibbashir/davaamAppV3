import { OpsMobileUsersDataTable } from "@/components/ops/data-table"
import { SectionCards } from "@/components/ops/section-cards"
import { SiteHeader } from "@/components/ops/site-header"
import RecentTransactions from "./RecentTransactions"
import OpsDashboardDispensing from "@/components/ops/PieMainDashboardDispensing"
import OpsDashboardSanitary from "@/components/ops/PieMainDashboardSanitary"

const CorporateDashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2 h-full overflow-hidden">
                    <div className="flex flex-col gap-3 py-4 sm:gap-4 md:gap-6 md:py-6 overflow-y-auto flex-1">
                        <SectionCards />
                        <div className="px-3 sm:px-4 lg:px-6 flex flex-col gap-3 sm:gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <OpsDashboardSanitary />
                                <OpsDashboardDispensing />
                            </div>
                        </div>
                        <OpsMobileUsersDataTable />
                        <hr className="my-2" />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
        </>

    )
}

export default CorporateDashboard
