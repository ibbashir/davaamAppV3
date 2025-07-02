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

const Routing = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path='/login' element={<Login />} />
            <Route path='/forgetPassword' element={<ForgetPassword />} />

            {/* Protected routes wrapped with Layout */}
            <Route element={<Layout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/machines' element={<Machines />} />
                <Route path='/roles' element={<Roles />} />
                <Route path='/pointshare' element={<PointShare />} />
                <Route path='/locations' element={<Locations />} />
                <Route path='/topup' element={<Topup />} />
                <Route path='/users' element={<UsersManagement />} />
                <Route path='/notifications' element={<Notifications />} />
                <Route path='/feedback' element={<Feedback />} />
                <Route path='/corporate' element={<Corporate />} />

            </Route>
        </Routes>
    )
}

export default Routing
