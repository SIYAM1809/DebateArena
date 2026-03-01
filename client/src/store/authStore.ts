// Zustand store for authentication state.
//
// Zustand is a tiny state manager — think Redux but without boilerplate.
// We store the access token in Zustand (in memory) instead of localStorage
// because localStorage is vulnerable to XSS attacks.
// The refresh token lives in an httpOnly cookie (set by the server) —
// JavaScript can't even read it, which is the safest approach.
//
// Usage anywhere in the app:
//   const { user, accessToken } = useAuthStore();
//   const { setAuth, clearAuth } = useAuthStore();

import { create } from "zustand";
import type { User } from "../types/user";

interface AuthState {
    user: User | null;
    accessToken: string | null;

    // Actions
    setAuth: (user: User, accessToken: string) => void;
    setAccessToken: (token: string) => void; // Used by the refresh interceptor
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state — not logged in
    user: null,
    accessToken: null,

    // Called on successful login/register
    setAuth: (user, accessToken) => set({ user, accessToken }),

    // Called by the API interceptor after a silent token refresh
    setAccessToken: (token) => set({ accessToken: token }),

    // Called on logout — wipes everything from memory
    clearAuth: () => set({ user: null, accessToken: null }),
}));
