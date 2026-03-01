// TypeScript interfaces for user-related data.
// These mirror the MongoDB User schema from 05_DATA_MODELS.md.
// Having them here means the compiler catches mismatches between
// what the API returns and what the UI tries to render.

export interface UserStats {
    debatesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    totalScore: number;
    avgScore: number;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    role: "user" | "admin";
    isActive: boolean;
    stats: UserStats;
    lastUsernameChange?: string; // ISO date string
    createdAt: string;
    updatedAt: string;
}

// What the auth endpoints return
export interface AuthResponse {
    user: Omit<User, "email">; // Email not returned on most responses
    accessToken: string;
}

// Profile as shown on public pages (no private fields)
export interface PublicProfile {
    _id: string;
    username: string;
    avatar?: string;
    stats: UserStats;
    createdAt: string;
}
