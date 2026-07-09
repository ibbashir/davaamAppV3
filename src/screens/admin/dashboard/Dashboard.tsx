import { AdminMobileUsersDataTable } from "@/components/admin/data-table"
import { SectionCards } from "@/components/admin/section-cards"
import { SiteHeader } from "@/components/admin/site-header"
import RecentTransactions from "./RecentTransactions"
import AdminDashboardSanitary from "@/components/admin/PieMainDashboardSanitary"
import AdminDashboardDispensing from "@/components/admin/PieMainDashboardDispensing"
import AdminSanitaryBarChart from "@/components/admin/adminSanitaryBarChart"
import AdminDispensingBarChart from "@/components/admin/adminBarChartDispensing"
import { FloatingChatbotButton } from "@/components/floating-chatbot-button"
import { ADMIN_ASK_CHATBOT } from "@/constants/Constant"


const Dashboard = () => {
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
                                <AdminDashboardSanitary />
                                <AdminDashboardDispensing />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                                <AdminSanitaryBarChart />
                                <AdminDispensingBarChart />
                            </div>
                        </div>
                        <AdminMobileUsersDataTable />
                        <hr className="my-2" />
                        <RecentTransactions />
                    </div>
                </div>
            </div>
            <FloatingChatbotButton to={ADMIN_ASK_CHATBOT} />
        </>

    )
}

export default Dashboard
