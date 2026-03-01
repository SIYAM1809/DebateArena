"use client";

// useAuth hook — the single interface for all auth operations in the UI.
//
// Components call: const { login, register, logout, user, isLoading } = useAuth();
// They never touch the API or Zustand directly — all abstracted here.
//
// On every page load: silently calls /auth/refresh to restore session from
// the httpOnly cookie. If the cookie is valid, the user appears logged in
// without needing to re-enter credentials.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { disconnectSocket, getSocket, updateSocketToken } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/user";

interface AuthHookResult {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;         // True while an async auth operation is in flight
    isInitializing: boolean;    // True while checking session on page load
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export function useAuth(): AuthHookResult {
    const { user, accessToken, setAuth, clearAuth } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // ─── SILENT REFRESH on mount ──────────────────────────────────────────────
    // When the user opens/refreshes the page, their access token is gone
    // (it was in memory). We silently call /auth/refresh using the httpOnly cookie
    // to restore the session. This makes the app feel like it "remembers" the user.
    useEffect(() => {
        async function initializeSession() {
            // If we already have a user in the Zustand store, no need to refresh
            if (user) {
                setIsInitializing(false);
                return;
            }

            try {
                const { data } = await api.post<{
                    accessToken: string;
                }>("/auth/refresh", {});

                // Now fetch the user profile with the fresh token
                // (We need to set the token first so the interceptor picks it up)
                useAuthStore.getState().setAccessToken(data.accessToken);

                const { data: userData } = await api.get<{ user: User }>("/auth/me");
                setAuth(userData.user, data.accessToken);
                // Update the socket's auth token so it reconnects with a fresh one
                updateSocketToken(data.accessToken);
            } catch {
                // No valid session — user is logged out. This is normal (first visit).
                clearAuth();
            } finally {
                setIsInitializing(false);
            }
        }

        initializeSession();
        // Run only once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── LOGIN ────────────────────────────────────────────────────────────────
    async function login(email: string, password: string): Promise<void> {
        setIsLoading(true);
        try {
            const { data } = await api.post<{ user: User; accessToken: string }>(
                "/auth/login",
                { email, password }
            );
            setAuth(data.user, data.accessToken);
            updateSocketToken(data.accessToken); // Keep socket in sync with fresh token
            router.push("/topics"); // Redirect after login
        } finally {
            setIsLoading(false);
        }
        // Note: errors propagate up to the form — the form catches them and shows
        // field-level error messages
    }

    // ─── REGISTER ─────────────────────────────────────────────────────────────
    async function register(
        username: string,
        email: string,
        password: string
    ): Promise<void> {
        setIsLoading(true);
        try {
            const { data } = await api.post<{ user: User; accessToken: string }>(
                "/auth/register",
                { username, email, password, confirmPassword: password }
            );
            setAuth(data.user, data.accessToken);
            updateSocketToken(data.accessToken); // Keep socket in sync with fresh token
            router.push("/topics"); // Same redirect as login
        } finally {
            setIsLoading(false);
        }
    }

    // ─── LOGOUT ───────────────────────────────────────────────────────────────
    async function logout(): Promise<void> {
        setIsLoading(true);
        try {
            await api.post("/auth/logout", {}); // Blacklists token in Redis, clears cookie
        } catch {
            // Even if server call fails, clear client state
        } finally {
            disconnectSocket(); // Close WebSocket connection
            clearAuth();        // Wipe Zustand store
            setIsLoading(false);
            router.push("/login");
        }
    }

    return { user, accessToken, isLoading, isInitializing, login, register, logout };
}

export { getSocket };
