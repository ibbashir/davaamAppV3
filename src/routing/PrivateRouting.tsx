import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

type Props = {
    allowedRoles: string[]
}

const PrivateRouting = ({ allowedRoles }: Props) => {
    const { state } = useAuth();
    const { user, loading } = state;

    if (loading) {
        return <div className="text-center mt-10 text-gray-500">Checking session...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.user_role.toLowerCase().replace(/\s/g, "");
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}

export default PrivateRouting;
