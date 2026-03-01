// Axios instance — pre-configured HTTP client for all API calls.
//
// Why a custom instance instead of plain fetch?
// 1. Base URL set once — we don't repeat the server URL everywhere
// 2. Request interceptor — automatically adds the Bearer token to every request
// 3. Response interceptor — when we get a 401, silently refreshes the token
//    and retries the original request. The UI never has to handle token expiry.

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create the configured Axios instance
export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true, // Send cookies (needed for httpOnly refresh token cookie)
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Runs before every request. Reads the access token from the Zustand store
// (in memory — never localStorage) and adds it as a Bearer header.
//
// We import the store getter lazily (inside the interceptor) to avoid circular
// imports since authStore might import api.

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Lazy import to avoid circular dependency
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require("../store/authStore");
        const token = useAuthStore.getState().accessToken;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Runs after every response. If we get a 401 (token expired), we:
// 1. Call /auth/refresh to get a new access token (uses httpOnly cookie)
// 2. Update the Zustand store with the new token
// 3. Retry the original request with the new token
// 4. If refresh also fails → clear auth state (user logged out)

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

// If multiple requests fail simultaneously, queue them until refresh completes
const processQueue = (error: AxiosError | null, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response, // Pass successful responses straight through
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // If it's a 401 and we haven't already tried refreshing for this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Another request is already refreshing — queue this one
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { useAuthStore } = require("../store/authStore");
                // Call refresh endpoint — sends httpOnly cookie automatically
                const { data } = await axios.post(
                    `${API_URL}/api/v1/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = data.accessToken;
                useAuthStore.getState().setAccessToken(newToken);
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                // Refresh failed — user session is truly expired, clear auth
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { useAuthStore } = require("../store/authStore");
                useAuthStore.getState().clearAuth();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
