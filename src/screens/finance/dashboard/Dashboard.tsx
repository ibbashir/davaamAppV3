import { SectionCards } from "@/components/admin/section-cards"
import { SiteHeader } from "@/components/admin/site-header"
import RecentTransactions from "./RecentTransactions"
import FinanceDashboardDispensing from "@/components/finance/PieMainDashboardDispensing copy"
import FinanceDashboardSanitary from "@/components/finance/PieMainDashboardSanitary"
import FinanceDispensingBarChart from "@/components/finance/financeBarChartDispensing"
import FinanceSanitaryBarChart from "@/components/finance/financeSanitaryBarChart"
import FinanceMobileUsersDataTable from "@/components/finance/data-table"


const FinanceDashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2 h-full overflow-hidden">
                    <div className="flex flex-col gap-3 py-4 sm:gap-4 md:gap-6 md:py-6 overflow-y-auto flex-1">
                        <SectionCards />
                        <div className="px-3 sm:px-4 lg:px-6 flex flex-col gap-3 sm:gap-4">
                            {/* Charts Grid - Responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                                <FinanceDashboardSanitary />
                                <FinanceDashboardDispensing />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                                <FinanceSanitaryBarChart />
                                <FinanceDispensingBarChart />
                            </div>
                        </div>
                        <FinanceMobileUsersDataTable />
                        <hr className="my-2" />
                        <RecentTransactions />
                    </div>
                </div>
            </div>  
        </>

    )
}

export default FinanceDashboard
