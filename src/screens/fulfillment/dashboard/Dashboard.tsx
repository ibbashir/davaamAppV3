import { SectionCards } from "@/components/fulfillment/section-cards"
import { SiteHeader } from "@/components/fulfillment/site-header"
import RecentTransactions from "./RecentTransactions"
import FulfillmentDashboardSanitary from "@/components/fulfillment/PieMainDashboardSanitary"
import { FulfillmentMobileUsersDataTable } from "@/components/fulfillment/data-table"
import FulfillmentDashboardDispensing from "@/components/fulfillment/PieMainDashboardDispensing"

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
                                <FulfillmentDashboardSanitary />
                                <FulfillmentDashboardDispensing />
                            </div>
                        </div>
                        <FulfillmentMobileUsersDataTable />
                        <hr className="my-2" />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
        </>
    )
}

export default CorporateDashboard
