import { SuperAdminMobileUsersDataTable } from "@/components/superAdmin/data-table"
import { SectionCards } from "@/components/superAdmin/section-cards"
import { SiteHeader } from "@/components/superAdmin/site-header"
import RecentTransactions from "./RecentTransactions"
import SuperAdminDashboardSanitary from "@/components/superAdmin/PieMainDashboardSanitary"
import SuperAdminDashboardDispensing from "@/components/superAdmin/PieMainDashboardDispensing"
import SuperAdminSanitaryBarChart from "@/components/superAdmin/superAdminSanitaryBarChart"
import SuperAdminDispensingBarChart from "@/components/superAdmin/superAdminBarChartDispensing"
import { Separator } from "@/components/ui/separator"

const Dashboard = () => {
    return (
        <>
            <SiteHeader title="Dashboard" />
            <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-col gap-8 py-6">

                    {/* KPI cards */}
                    <section aria-label="Overview">
                        <div className="mb-4 flex items-center gap-3 px-3 sm:px-4 md:px-6">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Overview
                            </h2>
                            <Separator className="flex-1" />
                        </div>
                        <SectionCards />
                    </section>

                    {/* Charts */}
                    <section aria-label="Analytics" className="px-3 sm:px-4 md:px-6">
                        <div className="mb-4 flex items-center gap-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Analytics
                            </h2>
                            <Separator className="flex-1" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <SuperAdminDashboardSanitary />
                            <SuperAdminDashboardDispensing />
                            <SuperAdminSanitaryBarChart />
                            <SuperAdminDispensingBarChart />
                        </div>
                    </section>

                    {/* Mobile users table */}
                    <section aria-label="Mobile Users">
                        <div className="mb-4 flex items-center gap-3 px-3 sm:px-4 md:px-6">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Mobile Users
                            </h2>
                            <Separator className="flex-1" />
                        </div>
                        <SuperAdminMobileUsersDataTable />
                    </section>

                    {/* Recent transactions */}
                    <section aria-label="Recent Transactions">
                        <div className="mb-4 flex items-center gap-3 px-3 sm:px-4 md:px-6">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Transactions
                            </h2>
                            <Separator className="flex-1" />
                        </div>
                        <RecentTransactions />
                    </section>

                </div>
            </div>
        </>
    )
}

export default Dashboard
