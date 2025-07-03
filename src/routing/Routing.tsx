import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/screens/login/Login'
import Dashboard from '@/screens/dashboard/Dashboard'
import { PointShare } from '@/screens/pointsshare/PointShare'
import Layout from '@/layouts/layout'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'
import Roles from '@/screens/roles/Roles'
import Machines from '@/screens/machines/Machines'
import Locations from '@/screens/locations/Locations'
import { Topup } from '@/screens/topup/Topup'
import { UsersManagement } from '@/screens/users/User-management'
import Notifications from '@/screens/notification/Notifications'
import Feedback from '@/screens/feedback/Feedback'
import Corporate from '@/screens/corporate/Corporate'
import PrivateRouting from './PrivateRouting'
import CompanyInfo from '@/screens/company-info/Company-info'
import PrivacyPolicy from '@/screens/privacypolicy/PrivacyPolicy'
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
                    <Route path={ADMIN_DASHBOARD} element={<Dashboard />} />
                    <Route path={ADMIN_MACHINES} element={<Machines />} />
                    <Route path={ADMIN_POINTS} element={<PointShare />} />
                    <Route path={ADMIN_LOCATIONS} element={<Locations />} />
                    <Route path={ADMIN_TOPUP} element={<Topup />} />
                    <Route path={ADMIN_USERS} element={<UsersManagement />} />
                    <Route path={ADMIN_NOTIFICATIONS} element={<Notifications />} />
                    <Route path={ADMIN_FEEDBACK} element={<Feedback />} />
                    <Route path={ADMIN_CORPORATE} element={<Corporate />} />
                </Route>
            </Route>

            <Route element={<PrivateRouting allowedRoles={["ops"]} />}>
                <Route element={<Layout />}>
                    <Route path={OPS_DASHBOARD} element={<Dashboard />} />
                    <Route path={OPS_MACHINES} element={<Machines />} />
                    <Route path={OPS_POINTS} element={<PointShare />} />
                    <Route path={OPS_LOCATIONS} element={<Locations />} />
                    <Route path={OPS_TOPUP} element={<Topup />} />
                    <Route path={OPS_USERS} element={<UsersManagement />} />
                    <Route path={OPS_FEEDBACK} element={<Feedback />} />
                    <Route path={OPS_CORPORATE} element={<Corporate />} />
                </Route>
            </Route>

            <Route element={<PrivateRouting allowedRoles={["company"]} />}>
                <Route element={<Layout />}>
                    <Route path={MACHINE_DASHBOARD} element={<Dashboard />} />
                    <Route path={MACHINE_MACHINES} element={<Machines />} />
                </Route>
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}

export default Routing
