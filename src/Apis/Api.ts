import { BASE_URL_TWO, BASE_URL } from "@/constants/Constant";
import axios from "axios";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accesstoken");
        if (token) {
            config.headers.Authorization = `${token}`;
        }
        return config
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is expired or invalid
            alert("Token expired. Logging out...");
            localStorage.removeItem("accesstoken");
            localStorage.removeItem("refreshtoken");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error); // Reject the promise for other errors
    }
);

export const getRequest = async (endpoint: string) => {
    try {
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        console.error("GET request failed", error);
        throw error;
    }
};

export const postRequest = async (endpoint: string, data: Record<string, any>) => {
    try {
        const response = await api.post(endpoint, data);
        return response.data;
    } catch (error) {
        console.error("POST request failed", error);
        throw error;
    }
};

export const putRequest = async (endpoint: string, data: Record<string, any>) => {
    try {
        const response = await api.put(endpoint, data);
        return response.data;
    } catch (error) {
        console.error("PUT request failed", error);
        throw error;
    }
};

// DELETE request function
export const deleteRequest = async (endpoint: string) => {
    try {
        const response = await api.delete(endpoint);
        return response.data;
    } catch (error) {
        console.error("DELETE request failed", error);
        throw error;
    }
};