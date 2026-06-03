import axios from "axios";
import { BASE_URL } from "@/constants/Constant";

/**
 * Hard logout: clears local storage, calls the backend logout endpoint,
 * then redirects to /login. Call this from the 401 interceptor or when
 * a session-expired state is detected.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // Best-effort — clear local state regardless of network result.
  }
  localStorage.clear();
  window.location.replace("/login");
};
