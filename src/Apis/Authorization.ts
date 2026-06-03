// Authorization.ts
// Tokens live exclusively in httpOnly cookies set by the backend.
// The browser sends them automatically on every request (withCredentials: true).
// We never read, store, or inject tokens from JavaScript.
import axios, { type AxiosError } from "axios";
import { BASE_URL } from "@/constants/Constant";
import { logoutUser } from "@/utils/session";

/** Shape of every API error response from the Davaam backend. */
export interface ApiErrorResponse {
  message: string;
  statusCode?: string;
}

/** Typed helper: extract the error message from an AxiosError. */
export function getApiErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<ApiErrorResponse>).response?.data;
    return data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/logout");

    // 401 — try a silent token refresh, then retry the original request once.
    // 403 means authenticated but unauthorised; refreshing won't help.
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        // Refresh token is also expired — force a full logout.
        await logoutUser();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
