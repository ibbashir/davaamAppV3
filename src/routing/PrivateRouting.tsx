import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'
import loader from "../assets/time-loader.gif"

type Props = {
    allowedRoles: string[]
}

const PrivateRouting = ({ allowedRoles }: Props) => {
    const { state } = useAuth();
    const { user, loading } = state;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <img src={loader} className="w-16" alt="" />
            </div>
        );
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