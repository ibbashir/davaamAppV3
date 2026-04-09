import { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/constants/Constant";

type Machine = { machine_code: string };

type User = {
  id: number;
  email: string;
  user_role: string;
  first_name: string;
  last_name: string;
  machines?: Machine[];
  role_code?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
};

type AuthAction =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "LOADED" };

const initialState: AuthState = {
  user: null,
  loading: true,
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}>({
  state: initialState,
  login: async () => "",
  logout: async () => {},
});

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload, loading: false };
    case "LOGOUT":
      return { user: null, loading: false };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: check if there is an active session via the httpOnly cookie.
  // No tokens are sent in the body – the browser handles cookies automatically.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/user`,
          {},
          { withCredentials: true }
        );
        dispatch({ type: "LOGIN", payload: res.data.user });
      } catch {
        dispatch({ type: "LOADED" });
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    // Credentials are sent; the backend sets httpOnly cookies on success.
    // We never touch the tokens on the frontend.
    const res = await axios.post(
      `${BASE_URL}/auth/login`,
      { email, password },
      { withCredentials: true }
    );

    const data = res.data;

    if (data.statusCode !== "200") {
      throw new Error(data.message || "Login failed");
    }

    const user: User = data.user;

    // Store ops-role machine list locally (non-sensitive, display-only)
    if (user.role_code === "3" && Array.isArray(user.machines)) {
      const codes = user.machines.map((m) => m.machine_code);
      localStorage.setItem("machines", JSON.stringify(codes));
    }

    dispatch({ type: "LOGIN", payload: user });

    return user.user_role.toLowerCase().replace(/\s/g, "");
  };

  const logout = async () => {
    try {
      // Backend clears both httpOnly cookies server-side
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch {
      // Even if the request fails we still clear local state
    }

    localStorage.clear();
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
