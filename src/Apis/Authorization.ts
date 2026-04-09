// Authorization.ts
// Tokens live exclusively in httpOnly cookies set by the backend.
// The browser sends them automatically when withCredentials is true –
// we never read, store, or inject them from JavaScript.
import axios from "axios";
import { BASE_URL } from "@/constants/Constant";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly auth cookies on every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: on 401 try a silent token refresh, then retry once.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/logout");

    // Only refresh on 401 (unauthenticated / expired token).
    // 403 means the user is authenticated but lacks the required role — refreshing won't help.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Backend rotates the refresh token and sets new httpOnly cookies.
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry the original request — cookies are now updated.
        return api(originalRequest);
      } catch {
        // Refresh failed (e.g. refresh token expired) – let the caller handle it.
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
