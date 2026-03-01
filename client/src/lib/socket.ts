// Socket.io client singleton.
//
// Why a singleton? Socket.io connections are expensive — you only want ONE
// connection per browser tab, shared across all components. If every component
// called `io()` separately, you'd get multiple connections.
//
// Usage:
//   const socket = getSocket(accessToken);  // On login / when token available
//   disconnectSocket();                     // On logout

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

let socket: Socket | null = null;

/**
 * Returns the existing socket connection, or creates a new one with the
 * provided access token. The token is sent at handshake time for server-side
 * JWT validation (see server/src/socket.ts).
 *
 * If a socket already exists but is NOT connected (e.g. after a failed auth
 * or a transient disconnect), we update its auth token and re-connect —
 * this handles the "stale token on reconnect" race condition.
 */
export function getSocket(accessToken: string): Socket {
    // ── Case 1: active connection with same token → reuse ──────────────────
    if (socket?.connected) {
        return socket;
    }

    // ── Case 2: socket exists but disconnected → update token & reconnect ──
    if (socket) {
        // Patch the auth token so the next connect handshake uses the fresh one
        socket.auth = { token: accessToken };
        socket.connect();
        return socket;
    }

    // ── Case 3: no socket yet → create one ─────────────────────────────────
    socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,      // Try to reconnect 5 times before giving up
        reconnectionDelay: 1000,      // Wait 1s between reconnect attempts
        timeout: 10000,               // 10s to establish connection
        autoConnect: true,
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
        // "Invalid or expired token" means the access token has expired.
        // Silently attempt to reconnect after a short delay — the Axios
        // interceptor will refresh the token automatically on the next
        // API request, so the next socket emit will carry a fresh token.
        if (err.message?.includes("expired") || err.message?.includes("Invalid")) {
            console.warn("[Socket] Auth error — token may have expired. Will retry on next interaction.");
        } else {
            console.error("[Socket] Connection error:", err.message);
        }
    });

    return socket;
}

/** Returns the existing socket instance without creating a new one. */
export function getExistingSocket(): Socket | null {
    return socket;
}

/**
 * Updates the auth token on an existing socket without disconnecting.
 * Call this whenever a new access token is obtained (e.g. after silent refresh).
 */
export function updateSocketToken(accessToken: string): void {
    if (socket) {
        socket.auth = { token: accessToken };
        // If disconnected, reconnect with the new token
        if (!socket.connected) {
            socket.connect();
        }
    }
}

/** Disconnect and clear the singleton — call on logout. */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("[Socket] Disconnected and cleared.");
    }
}
