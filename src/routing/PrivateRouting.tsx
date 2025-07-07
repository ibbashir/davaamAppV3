import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

type Props = {
    allowedRoles: string[]
}

const PrivateRouting = ({ allowedRoles }: Props) => {
    const { state } = useAuth();

    const userRole = state.user?.user_role.toLowerCase().replace(/\s/g, "") || ""

    if (!state.user) {
        return <Navigate to="/login" />
    }

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}

export default PrivateRouting

