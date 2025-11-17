import { createContext, useContext, useReducer, useEffect } from "react"
import axios from "axios"
import { BASE_URL } from "@/constants/Constant"
import api, { setAccessToken } from "../Apis/Authorization";

type User = {
  id: number
  email: string
  user_role: string
  first_name: string
  last_name: string
  machines: Array<machine_code>
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
  logout: async () => { },
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
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkSession = async () => {
    try {
      const res = await api.get("/auth/user");

      const { user, accessToken } = res.data;

      if (accessToken) {
        setAccessToken(accessToken);
      }

      dispatch({ type: "LOGIN", payload: { user, token: accessToken } });

    } catch (err) {
      console.warn("User session expired.");
      dispatch({ type: "LOADED" });
    }
  };

  // Load user on refresh using cookies
  useEffect(() => {
    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      )

      console.log("Login response:", res);

      const data = res.data
      const role_code = data.user.role_code;


      if (data.statusCode !== "200") {
        throw new Error(data.message || "Login failed")
      }

      if (role_code === "3") {
        const machines: { machine_code: string }[] = data.user.machines;
        const allMachineCodes = machines.map(machine => machine.machine_code)
        localStorage.setItem("machines", JSON.stringify(allMachineCodes))
      }

      const user = data.user
      const accessToken = data.accessToken


      if (accessToken) {
        setAccessToken(accessToken); // <── ADD THIS
      }

      dispatch({ type: "LOGIN", payload: { user, token: accessToken } })

      return user.user_role.toLowerCase().replace(/\s/g, "")
    } catch (error) {
      console.error("Login error:", error)
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed")
      }
      throw new Error("Login failed")
    }
  }

  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      )
      localStorage.clear()
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