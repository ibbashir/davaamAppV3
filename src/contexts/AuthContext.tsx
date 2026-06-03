import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import axios from "axios";
import { BASE_URL } from "@/constants/Constant";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Machine = { machine_code: string };

export type User = {
  id: number;
  email: string;
  user_role: string;
  first_name: string;
  last_name: string;
  machines?: Machine[];
  role_code?: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  /** Normalised role slug — lowercase, no spaces. E.g. "superadmin", "ops". */
  role: string | null;
};

type AuthAction =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "LOADED" };

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  loading: true,
  role: null,
};

function normaliseRole(userRole: string): string {
  return userRole.toLowerCase().replace(/\s/g, "");
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return {
        user: action.payload,
        loading: false,
        role: normaliseRole(action.payload.user_role),
      };
    case "LOGOUT":
      return { user: null, loading: false, role: null };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  state: initialState,
  login: async () => "",
  logout: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: validate the httpOnly session cookie by hitting /auth/user.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/user`,
          {},
          { withCredentials: true },
        );
        dispatch({ type: "LOGIN", payload: res.data.user });
      } catch {
        dispatch({ type: "LOADED" });
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const res = await axios.post(
      `${BASE_URL}/auth/login`,
      { email, password },
      { withCredentials: true },
    );

    const data = res.data;
    if (data.statusCode !== "200") {
      throw new Error(data.message || "Login failed");
    }

    const user = data.user as User;

    // Store ops-role machine list locally (non-sensitive, display-only).
    if (user.role_code === "3" && Array.isArray(user.machines)) {
      const codes = user.machines.map((m) => m.machine_code);
      localStorage.setItem("machines", JSON.stringify(codes));
    }

    dispatch({ type: "LOGIN", payload: user });
    return normaliseRole(user.user_role);
  };

  const logout = async () => {
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Best-effort — clear state regardless of network result.
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
