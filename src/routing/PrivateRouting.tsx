import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'
import loading from "../assets/loader.svg"

type Props = {
    allowedRoles: string[]
}

const PrivateRouting = ({ allowedRoles }: Props) => {
    const { state } = useAuth();

    const userRole = state.user?.user_role.toLowerCase().replace(/\s/g, "") || ""

    if (state.loading) {
        return <img className='flex h-screen m-auto w-20' src={loading} alt="" /> // or show a spinner component
    }

    if (!state.user) {
        return <Navigate to="/login" />
    }

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}

export default PrivateRouting

