"use client"

import { BASE_URL_TWO } from "@/constants/Constant"
import { createContext, useContext, useReducer, useEffect } from "react"

type User = {
    id: number
    email: string
    user_role: string
    first_name: string
    last_name: string
}

type AuthState = {
    user: User | null
    token: string | null
    loading: boolean
}

type AuthAction =
    | { type: "LOGIN"; payload: { user: User; token: string } }
    | { type: "LOGOUT" }
    | { type: "LOADED" }

const initialState: AuthState = {
    user: null,
    token: null,
    loading: true,
}

const AuthContext = createContext<{
    state: AuthState
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}>({
    state: initialState,
    login: async () => { },
    logout: () => { },
})

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "LOGIN":
            return { user: action.payload.user, token: action.payload.token, loading: false }
        case "LOGOUT":
            return { user: null, token: null, loading: false }
        case "LOADED":
            return { ...state, loading: false }
        default:
            return state
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, initialState)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const storedToken = localStorage.getItem("accesstoken")
        if (storedUser && storedToken) {
            dispatch({
                type: "LOGIN",
                payload: {
                    user: JSON.parse(storedUser),
                    token: storedToken,
                },
            })
        } else {
            dispatch({ type: "LOADED" })
        }
    }, [])

    const login = async (email: string, password: string) => {
        const res = await fetch(`${BASE_URL_TWO}api/dashboard/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok || data.statusCode !== "200") {
            throw new Error(data.message || "Login failed")
        }

        const user = data.user
        const accessToken = data.accessToken
        const refreshToken = data.refreshToken

        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("accesstoken", accessToken)
        localStorage.setItem("refreshtoken", refreshToken)

        dispatch({ type: "LOGIN", payload: { user, token: accessToken } })

        return data.user.user_role.toLowerCase().replace(/\s/g, "")

    }

    const logout = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("accesstoken")
        dispatch({ type: "LOGOUT" })
    }

    return (
        <AuthContext.Provider value={{ state, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
