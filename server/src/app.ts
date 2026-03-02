import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { AppError } from "./utils/errors";
import authRoutes from "./features/auth/auth.routes";
import topicsRoutes from "./features/topics/topics.routes";
import debateRoutes from "./features/debate/debate.routes";
import userRoutes from "./features/users/user.routes";
import adminRoutes from "./features/admin/admin.routes";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: [config.clientUrl, "http://localhost:3000"], // Explicit list to satisfy withCredentials
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(
    morgan("combined", {
        stream: {
            write: (message: string) => logger.http(message.trim()),
        },
        skip: (req) => config.nodeEnv === "production" && req.url === "/health",
    })
);

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.nodeEnv === "production" ? 100 : 500, // Relaxed in development
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests, please try again later.",
    },
});
app.use("/api", globalLimiter);

// Stricter limiter for auth endpoints — prevents brute-force login / registrations
// Only applied in production — in development we skip it to avoid lockouts during testing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests on auth endpoints, please try again later.",
    },
    skip: () => config.nodeEnv !== "production", // ← bypass in development
});

import mongoose from "mongoose";

app.get("/health", (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : "disconnected";

    res.status(dbState === 1 ? 200 : 503).json({
        status: dbState === 1 ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        db: dbStatus,
        uptime: `${Math.floor(process.uptime())}s`,
    });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/topics", topicsRoutes);
app.use("/api/v1/debates", debateRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route not found`, 404));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        logger.warn("Operational error", {
            message: err.message,
            statusCode: err.statusCode,
        });
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }

    logger.error("Unexpected error", { error: err.message, stack: err.stack });
    return res.status(500).json({
        error: "Internal server error",
    });
});

export default app;
