import { Routes, Route } from 'react-router-dom'
import Login from '@/screens/login/Login'
import Dashboard from '@/screens/dashboard/Dashboard'
import { PointShare } from '@/screens/pointsshare/PointShare'
import Layout from '@/layouts/layout'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'
import Roles from '@/screens/roles/Roles'
import Machines from '@/screens/machines/Machines'
import Locations from '@/screens/locations/locations'

const Routing = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path='/' element={<Login />} />
            <Route path='/forgetPassword' element={<ForgetPassword />} />

            {/* Protected routes wrapped with Layout */}
            <Route element={<Layout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/machines' element={<Machines />} />
                <Route path='/roles' element={<Roles />} />
                <Route path='/pointshare' element={<PointShare />} />
                <Route path='/locations' element={<Locations />} />
            </Route>
        </Routes>
    )
}

export default Routing
