import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Signup from '@/screens/signup/Signup'
import Login from '@/screens/login/Login'

const Routing = () => {
    return (
        <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
        </Routes>
    )
}

export default Routing
