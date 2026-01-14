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
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6">
                            <FulfillmentDashboardSanitary />
                            <FulfillmentDashboardDispensing />
                        </div>
                        <FulfillmentMobileUsersDataTable />
                        <hr />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
        </>

    )
}

export default CorporateDashboard
