import { AdminMobileUsersDataTable } from "@/components/admin/data-table"
import { SectionCards } from "@/components/admin/section-cards"
import { SiteHeader } from "@/components/admin/site-header"
import RecentTransactions from "./RecentTransactions"
import AdminDashboardSanitary from "@/components/admin/PieMainDashboardSanitary"
import AdminDashboardDispensing from "@/components/admin/PieMainDashboardDispensing"
import AdminSanitaryBarChart from "@/components/admin/adminSanitaryBarChart"
import AdminDispensingBarChart from "@/components/admin/adminBarChartDispensing"


const Dashboard = () => {
    return (
        <>
            <SiteHeader title='Dashboard' />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <AdminDashboardSanitary />
                                <AdminDashboardDispensing />
                            </div>
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto mt-2">
                                <AdminSanitaryBarChart/>
                                <AdminDispensingBarChart/>
                            </div>
                        </div>
                        <AdminMobileUsersDataTable />
                        <hr />
                        <RecentTransactions />
                    </div>
                </div>
            </div>  
        </>

    )
}

export default Dashboard
