import { Routes, Route } from 'react-router-dom'
import Login from '@/screens/login/Login'
import Dashboard from '@/screens/dashboard/Dashboard'
import Profile from '@/screens/profile/Profile'
import Layout from '@/layouts/layout'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'
import Roles from '@/screens/roles/Roles'

const Routing = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path='/' element={<Login />} />
            <Route path='/forgetPassword' element={<ForgetPassword />} />

            {/* Protected routes wrapped with Layout */}
            <Route element={<Layout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/roles' element={<Roles />} />
            </Route>
        </Routes>
    )
}

export default Routing
