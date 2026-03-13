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
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <FinanceDashboardSanitary />
                                <FinanceDashboardDispensing />
                            </div>
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <FinanceSanitaryBarChart/>
                                <FinanceDispensingBarChart/>
                            </div>
                        </div>
                        <FinanceMobileUsersDataTable />
                        <hr />
                        <RecentTransactions />
                    </div>
                </div>
            </div>  
        </>

    )
}

export default FinanceDashboard
