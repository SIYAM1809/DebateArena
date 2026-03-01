// Auth Controller — HTTP layer for auth operations.
//
// Controllers are thin — they:
// 1. Read from req (body, cookies, params)
// 2. Call the service with clean data
// 3. Send the response
//
// All real logic lives in auth.service.ts
// All HTTP error handling is done by the global error handler in app.ts

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import * as authService from "./auth.service";
import { ValidationError } from "../../utils/errors";

// Cookie config for the httpOnly refresh token
// httpOnly = JavaScript can't read this cookie (XSS protection)
// secure = only sent over HTTPS (in production)
// sameSite = strict CSRF protection
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/api/v1/auth/refresh", // Cookie only sent to refresh endpoint
};

// ─── HELPER: validate request ─────────────────────────────────────────────────
// Reads express-validator results and throws if any errors
function checkValidation(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors
            .array()
            .map((e) => e.msg)
            .join(". ");
        throw new ValidationError(message);
    }
}

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        checkValidation(req);
        const { username, email, password } = req.body;

        const result = await authService.registerUser(username, email, password);

        // Set refresh token as httpOnly cookie
        res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

        res.status(201).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        checkValidation(req);
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
export async function refresh(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Refresh token comes from the httpOnly cookie (not req.body)
        const refreshToken = req.cookies?.refreshToken;

        const result = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({ accessToken: result.accessToken });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const refreshToken = req.cookies?.refreshToken;

        await authService.logoutUser(refreshToken);

        // Clear the cookie from browser
        res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/v1/auth/forgot-password ───────────────────────────────────────
export async function forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        checkValidation(req);
        const { email } = req.body;

        await authService.forgotPassword(email);

        // Always respond the same whether or not email exists (prevents enumeration)
        res.status(200).json({
            message: "If an account exists with this email, a reset code has been sent",
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
export async function getMe(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // req.user is set by the authenticate middleware
        const User = (await import("../../models/User")).default;
        const user = await User.findById(req.user!.userId).select("-passwordHash");
        if (!user) {
            return next(new (await import("../../utils/errors")).NotFoundError("User not found"));
        }
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}
export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        checkValidation(req);
        const { email, otp, newPassword } = req.body;

        await authService.resetPassword(email, otp, newPassword);

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        next(err);
    }
}
