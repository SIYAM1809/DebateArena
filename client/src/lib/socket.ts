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
 */
export function getSocket(accessToken: string): Socket {
    if (socket?.connected) {
        return socket; // Already connected — reuse it
    }

    // Create a new connection with JWT auth
    socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,      // Try to reconnect 5 times before giving up
        reconnectionDelay: 1000,      // Wait 1s between reconnect attempts
        timeout: 10000,               // 10s to establish connection
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err.message);
    });

    return socket;
}

/** Returns the existing socket instance without creating a new one. */
export function getExistingSocket(): Socket | null {
    return socket;
}

/** Disconnect and clear the singleton — call on logout. */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("[Socket] Disconnected and cleared.");
    }
}
