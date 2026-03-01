// Socket.io server setup.
// This file initializes Socket.io on top of the HTTP server.
// Socket.io uses JWT authentication at the "handshake" level —
// meaning a client must provide a valid token just to establish
// the WebSocket connection. Unauthenticated clients are rejected
// before any events are processed.

import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { registerMatchmakingHandlers } from "./features/matchmaking/matchmaking.socket";
import { registerDebateHandlers } from "./features/debate/debate.socket";

export interface AuthenticatedSocket extends Socket {
    userId?: string;
    username?: string;
}

export let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
        // CORS must match the Express CORS config
        cors: {
            origin: config.nodeEnv === "production" ? config.clientUrl : "*",
            credentials: true,
        },
        // Prefer WebSocket connection, fall back to long-polling
        transports: ["websocket", "polling"],
    });

    // ─── AUTH MIDDLEWARE ON HANDSHAKE ─────────────────────────────────────────
    // This runs before any connection is established.
    // The client must send their JWT access token in the 'auth' object:
    //   socket = io(URL, { auth: { token: accessToken } })
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;

        if (!token) {
            return next(new Error("Authentication token required"));
        }

        try {
            // Verify the token signature and expiry
            const decoded = jwt.verify(token, config.jwt.accessSecret) as {
                userId: string;
                username: string;
            };
            // Attach user info to socket object for use in event handlers
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next(); // Allow the connection
        } catch {
            return next(new Error("Invalid or expired token"));
        }
    });

    // ─── CONNECTION HANDLER ───────────────────────────────────────────────────
    io.on("connection", (socket: AuthenticatedSocket) => {
        logger.info("Socket connected", {
            socketId: socket.id,
            userId: socket.userId,
            username: socket.username,
        });

        // Each user automatically joins a "room" named after their userId.
        // This lets us send events to a specific user without knowing their socket ID.
        // (A user could have multiple tabs open — same userId, different socket IDs)
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Register feature-specific socket event handlers
        registerMatchmakingHandlers(io, socket);
        registerDebateHandlers(io, socket);

        socket.on("disconnect", (reason) => {
            logger.info("Socket disconnected", {
                socketId: socket.id,
                userId: socket.userId,
                reason,
            });
        });
    });

    logger.info("Socket.io: initialized ✓");
    return io;
}
