// Authorization.ts
import axios from "axios";
import { BASE_URL } from "@/constants/Constant";
import { showSessionExpiredModal } from "@/utils/session"; // modal dispatcher

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// // Request Interceptor
// api.interceptors.request.use(
//   (config) => {

//     if (accessToken) {
//       config.headers["Authorization"] = `${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

api.interceptors.request.use(
  (config) => {
    // Read access token cookie
    const cookieToken = getCookie("access_token");
    console.log("one", cookieToken);

    if (cookieToken) {
      config.headers["Authorization"] = cookieToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (res) => res,
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

        const cookieToken = getCookie("access_token");
        console.log("two", cookieToken);

        const { accessToken: newAccessToken } = response.data;
        setAccessToken(newAccessToken);
        originalRequest.headers["Authorization"] = `${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
