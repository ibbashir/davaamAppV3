import { Routes, Route } from 'react-router-dom'
import Login from '@/screens/login/Login'
import Dashboard from '@/screens/dashboard/Dashboard'
import Profile from '@/screens/profile/Profile'
import Layout from '@/layouts/layout'
import ForgetPassword from '@/screens/forgetPassword/ForgetPassword'

const Routing = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path='/' element={<Login />} />
            <Route path='/forgetPassword' element={<ForgetPassword />} />

            {/* Protected routes using layout */}
            <Route
                path='/dashboard'
                element={<Dashboard />}
            />
            <Route path='/profile' element={
                <Profile />
            }
            />
        </Routes>
    )
}

export default Routing
