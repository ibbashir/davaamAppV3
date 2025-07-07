import { createContext, useContext, useReducer, useEffect } from "react"
import axios from "axios"
import { BASE_URL_TWO } from "@/constants/Constant"

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
  login: (email: string, password: string) => Promise<string>
  logout: () => Promise<void>
}>({
  state: initialState,
  login: async () => "",
  logout: async () => {},
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
    dispatch({ type: "LOADED" })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        `${BASE_URL_TWO}api/dashboard/auth/login`,
        { email, password },
        { withCredentials: true } // ⬅️ important for cookies
      )

      const data = res.data

      if (data.statusCode !== "200") {
        throw new Error(data.message || "Login failed")
      }

      const user = data.user
      const accessToken = data.accessToken

      dispatch({ type: "LOGIN", payload: { user, token: accessToken } })

      return user.user_role.toLowerCase().replace(/\s/g, "")
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.response?.data?.message || "Login failed")
    }
  }

  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL_TWO}api/dashboard/auth/logout`,
        {},
        { withCredentials: true }
      )
    } catch (err) {
      console.error("Logout failed:", err)
    }

    dispatch({ type: "LOGOUT" })
  }

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
