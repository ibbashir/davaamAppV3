import { BASE_URL, BASE_URL_TWO } from '@/constants/Constant';
import axios from 'axios';

const instance = axios.create({
    baseURL: BASE_URL
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accesstoken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshtoken');
                const response = await axios.post('/auth/refresh', { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem('accesstoken', accessToken);
                localStorage.setItem('refreshtoken', newRefreshToken);

                instance.defaults.headers.common['Authorization'] = `${accessToken}`;

                return instance(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Handle token refresh failure (e.g., log out user)
            }
        }
        return Promise.reject(error);
    }
);

export default instance;