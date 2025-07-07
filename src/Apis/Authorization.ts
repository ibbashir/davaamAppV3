// Authorization.ts
import axios from "axios";
import { BASE_URL } from "@/constants/Constant";
import { showSessionExpiredModal } from "@/utils/session"; // modal dispatcher

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = response.data;
        setAccessToken(newAccessToken);
        originalRequest.headers["Authorization"] = `${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        showSessionExpiredModal(); // dispatch modal (see below)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
