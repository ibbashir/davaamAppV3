import { createContext, useContext, useReducer, useEffect } from "react"
import axios from "axios"
import { BASE_URL } from "@/constants/Constant"
import api, { setAccessToken } from "../Apis/Authorization";
import { useCookies } from 'react-cookie';

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
  const [accessTokenTwo, setAccessTokenTwo, removeAccessToken] = useCookies(['access_token']);
  const [refreshToken, setRefreshToken, removeRefreshToken] = useCookies(['refresh_token']);


  const checkSession = async () => {
    try {

      const res = await axios.post(
        `${BASE_URL}/auth/user`,
        {
          accessToken: accessTokenTwo?.access_token,
          refreshToken: refreshToken?.refresh_token,
          message: "asjdhuid",
        },
        { withCredentials: true } // if backend sets httpOnly cookies
      );

      const { user, accessToken: newToken } = res.data;

      console.log("User session restored:", res.data);

      dispatch({
        type: "LOGIN",
        payload: { user, token: newToken },
      });

    } catch (err) {
      console.warn("User session expired.", err?.response?.data);
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

      console.log("Access Token on login:", accessToken, data.refreshToken);
      setAccessTokenTwo('access_token', accessToken, { path: '/' });
      setRefreshToken('refresh_token', data.refreshToken, { path: '/' });


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

  function deleteAllCookies() {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }

  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {
          accessToken: accessTokenTwo?.access_token,
          refreshToken: refreshToken?.refresh_token,
        },
        { withCredentials: true }
      );

      // Clear localStorage
      localStorage.clear();
      deleteAllCookies();

      // Remove cookies
      removeAccessToken('access_token', { path: '/' });
      removeRefreshToken('refresh_token', { path: '/' });
      console.log(accessTokenTwo);
      console.log(refreshToken);

    } catch (err) {
      console.error("Logout failed:", err);
      removeAccessToken('access_token', { path: '/' });
      removeRefreshToken('refresh_token', { path: '/' });
    }

    // Update state
    dispatch({ type: "LOGOUT" });
  }


  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)