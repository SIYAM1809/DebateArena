// Auth Middleware — protects routes that require a logged-in user.
//
// HOW IT WORKS:
// 1. Read the "Authorization: Bearer <token>" header
// 2. Verify the JWT signature and expiry using JWT_ACCESS_SECRET
// 3. Attach the decoded user payload to req.user
// 4. Call next() to pass control to the route handler
//
// If anything fails, respond with 401 immediately — the route handler never runs.
//
// Usage in routes:
//   router.get('/me', authenticate, userController.getMe);

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import { UnauthorizedError, ForbiddenError } from "../../utils/errors";

// Extend Express's Request type to include the decoded user payload
// This lets TypeScript know req.user exists in authenticated routes
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                username: string;
                role: "user" | "admin";
            };
        }
    }
}

export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    // Read from Authorization header: "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("Authentication token required"));
    }

    const token = authHeader.split(" ")[1]; // Extract just the token part

    try {
        // jwt.verify does two things:
        // 1. Checks the signature (was this token signed by our server?)
        // 2. Checks expiry (is the token still valid?)
        const decoded = jwt.verify(token, config.jwt.accessSecret) as {
            userId: string;
            username: string;
            role: "user" | "admin";
        };

        // Attach to request — all downstream handlers can access req.user
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(new UnauthorizedError("Token expired"));
        }
        return next(new UnauthorizedError("Invalid token"));
    }
}

// ─── ADMIN MIDDLEWARE ─────────────────────────────────────────────────────────
// Must be used AFTER authenticate — needs req.user to be set.
// Usage: router.post('/topics', authenticate, requireAdmin, topicController.create)

export function requireAdmin(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        return next(new UnauthorizedError("Authentication required"));
    }
    if (req.user.role !== "admin") {
        return next(new ForbiddenError("Admin access required"));
    }
    next();
}
