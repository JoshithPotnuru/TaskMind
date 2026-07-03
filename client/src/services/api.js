import axios from 'axios';
import store from '../redux/store.js';
import { setCredentials, logoutUser } from '../redux/slices/authSlice.js';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const cleanBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Auto refresh JWT token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${cleanBaseUrl}/auth/refresh-token`,
            { token: refreshToken }
          );

          // Save new access token
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          // Dispatch update to Redux
          const currentUser = JSON.parse(localStorage.getItem('user'));
          store.dispatch(setCredentials({
            user: currentUser,
            accessToken: data.accessToken,
            refreshToken
          }));

          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed, logging out...', refreshError);
          store.dispatch(logoutUser());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
