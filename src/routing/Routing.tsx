import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/layouts/layout'
import PrivateRouting from './PrivateRouting'

import Login from '@/screens/login/Login'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'
import CompanyInfo from '@/screens/company-info/Company-info'
import PrivacyPolicy from '@/screens/privacypolicy/PrivacyPolicy'

//superAdmin Screens
import Dashboard from '@/screens/superAdmin/dashboard/Dashboard'
import { PointShare } from '@/screens/superAdmin/pointsshare/PointShare'
import Roles from '@/screens/superAdmin/roles/Roles'
import Machines from '@/screens/superAdmin/machines/Machines'
import Locations from '@/screens/superAdmin/locations/Locations'
import { Topup } from '@/screens/superAdmin/topup/Topup'
import { UsersManagement } from '@/screens/superAdmin/users/User-management'
import Notifications from '@/screens/superAdmin/notification/Notifications'
import Feedback from '@/screens/superAdmin/feedback/Feedback'
import Corporate from '@/screens/superAdmin/corporate/Corporate'

//admin screens
import AdminDashboard from '@/screens/admin/dashboard/Dashboard'
import { AdminPointShare } from '@/screens/admin/pointsshare/PointShare'
import AdminMachines from '@/screens/admin/machines/Machines'
import AdminLocations from '@/screens/admin/locations/Locations'
import { AdminTopup } from '@/screens/admin/topup/Topup'
import { AdminUsersManagement } from '@/screens/admin/users/User-management'
import AdminNotifications from '@/screens/admin/notification/Notifications'
import AdminFeedback from '@/screens/admin/feedback/Feedback'
import AdminCorporate from '@/screens/admin/corporate/Corporate'

//ops screens
import OpsDashboard from '@/screens/ops/dashboard/Dashboard'
import { OpsPointShare } from '@/screens/ops/pointsshare/PointShare'
import OpsMachines from '@/screens/ops/machines/Machines'
import OpsLocations from '@/screens/ops/locations/Locations'
import { OpsTopup } from '@/screens/ops/topup/Topup'
import { OpsUsersManagement } from '@/screens/ops/users/User-management'
import OpsFeedback from '@/screens/ops/feedback/Feedback'
import OpsCorporate from '@/screens/ops/corporate/Corporate'

//corporate screens
import CorporateDashboard from '@/screens/corporate/dashboard/Dashboard'
import CorporateMachines from '@/screens/corporate/machines/Machines'

import { ADMIN_CORPORATE, ADMIN_DASHBOARD, ADMIN_FEEDBACK, ADMIN_LOCATIONS, ADMIN_MACHINES, ADMIN_NOTIFICATIONS, ADMIN_POINTS, ADMIN_TOPUP, ADMIN_USERS, MACHINE_DASHBOARD, MACHINE_MACHINES, OPS_CORPORATE, OPS_DASHBOARD, OPS_FEEDBACK, OPS_LOCATIONS, OPS_MACHINES, OPS_POINTS, OPS_TOPUP, OPS_USERS, SUPERADMIN_CORPORATE, SUPERADMIN_DASHBOARD, SUPERADMIN_FEEDBACK, SUPERADMIN_LOCATIONS, SUPERADMIN_MACHINES, SUPERADMIN_NOTIFICATIONS, SUPERADMIN_POINTS, SUPERADMIN_ROLES, SUPERADMIN_TOPUP, SUPERADMIN_USERS } from '@/constants/Constant'

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-4xl font-bold text-red-600">404</h1>
            <p className="text-xl mt-2">Page Not Found</p>
            <p className="text-sm text-gray-500 mt-1">
                The page you are looking for does not exist.
            </p>
        </div>
    )
}

const Routing = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path='/' element={<Navigate to="/login" replace />} />
            <Route path='/login' element={<Login />} />
            <Route path='/forgetPassword' element={<ForgetPassword />} />
            <Route path='/company-info' element={<CompanyInfo />} />
            <Route path='/privacypolicy' element={<PrivacyPolicy />} />

            {/* Protected routes wrapped with Layout */}
            <Route element={<PrivateRouting allowedRoles={["superadmin"]} />}>
                <Route element={<Layout />}>
                    <Route path={SUPERADMIN_DASHBOARD} element={<Dashboard />} />
                    <Route path={SUPERADMIN_MACHINES} element={<Machines />} />
                    <Route path={SUPERADMIN_ROLES} element={<Roles />} />
                    <Route path={SUPERADMIN_POINTS} element={<PointShare />} />
                    <Route path={SUPERADMIN_LOCATIONS} element={<Locations />} />
                    <Route path={SUPERADMIN_TOPUP} element={<Topup />} />
                    <Route path={SUPERADMIN_USERS} element={<UsersManagement />} />
                    <Route path={SUPERADMIN_NOTIFICATIONS} element={<Notifications />} />
                    <Route path={SUPERADMIN_FEEDBACK} element={<Feedback />} />
                    <Route path={SUPERADMIN_CORPORATE} element={<Corporate />} />
                </Route>
            </Route>

            <Route element={<PrivateRouting allowedRoles={["admin"]} />}>
                <Route element={<Layout />}>
                    <Route path={ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    <Route path={ADMIN_MACHINES} element={<AdminMachines />} />
                    <Route path={ADMIN_POINTS} element={<AdminPointShare />} />
                    <Route path={ADMIN_LOCATIONS} element={<AdminLocations />} />
                    <Route path={ADMIN_TOPUP} element={<AdminTopup />} />
                    <Route path={ADMIN_USERS} element={<AdminUsersManagement />} />
                    <Route path={ADMIN_NOTIFICATIONS} element={<AdminNotifications />} />
                    <Route path={ADMIN_FEEDBACK} element={<AdminFeedback />} />
                    <Route path={ADMIN_CORPORATE} element={<AdminCorporate />} />
                </Route>
            </Route>

            <Route element={<PrivateRouting allowedRoles={["ops"]} />}>
                <Route element={<Layout />}>
                    <Route path={OPS_DASHBOARD} element={<OpsDashboard />} />
                    <Route path={OPS_MACHINES} element={<OpsMachines />} />
                    <Route path={OPS_POINTS} element={<OpsPointShare />} />
                    <Route path={OPS_LOCATIONS} element={<OpsLocations />} />
                    <Route path={OPS_TOPUP} element={<OpsTopup />} />
                    <Route path={OPS_USERS} element={<OpsUsersManagement />} />
                    <Route path={OPS_FEEDBACK} element={<OpsFeedback />} />
                    <Route path={OPS_CORPORATE} element={<OpsCorporate />} />
                </Route>
            </Route>

            <Route element={<PrivateRouting allowedRoles={["company"]} />}>
                <Route element={<Layout />}>
                    <Route path={MACHINE_DASHBOARD} element={<CorporateDashboard />} />
                    <Route path={MACHINE_MACHINES} element={<CorporateMachines />} />
                </Route>
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}

export default Routing
