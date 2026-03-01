// Auth Service — all authentication business logic lives here.
//
// WHY separate service from controller?
// The SERVICE handles the "what" — hashing passwords, generating tokens,
// checking Redis, sending emails. It has no knowledge of HTTP (no req/res).
// The CONTROLLER handles the "how" — reading req.body, sending res.json.
// This separation makes services testable in isolation (no HTTP needed).

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User, { IUser } from "../../models/User";
import { redis } from "../../config/redis";
import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import {
    ConflictError,
    UnauthorizedError,
    NotFoundError,
    ValidationError,
} from "../../utils/errors";

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────

// Each JWT has a unique ID (jti) so we can blacklist individual tokens on logout
// instead of invalidating ALL tokens for a user.
function generateJti(): string {
    return crypto.randomBytes(16).toString("hex");
}

function generateAccessToken(user: IUser): string {
    return jwt.sign(
        {
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        },
        config.jwt.accessSecret,
        {
            expiresIn: "15m", // Short-lived — if stolen, expires quickly
        }
    );
}

function generateRefreshToken(user: IUser): { token: string; jti: string } {
    const jti = generateJti();
    const token = jwt.sign(
        {
            userId: user._id.toString(),
            jti, // Unique ID for this specific token (for blacklisting)
        },
        config.jwt.refreshSecret,
        {
            expiresIn: "7d", // Long-lived — stored in httpOnly cookie
        }
    );
    return { token, jti };
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function registerUser(
    username: string,
    email: string,
    password: string
): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    // Check for existing email — MongoDB unique index would also catch this,
    // but we check manually for a friendlier error message
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
        throw new ConflictError("An account with this email already exists");
    }

    const existingUsername = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") }, // Case-insensitive check
    });
    if (existingUsername) {
        throw new ConflictError("This username is already taken");
    }

    // Hash the password — saltRounds=12 means 2^12 = 4096 bcrypt iterations.
    // Higher = slower (harder to brute-force) but CPU-heavier.
    // 12 is the industry standard sweet spot.
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the user document in MongoDB
    const user = await User.create({
        username,
        email: email.toLowerCase(),
        passwordHash,
    });

    const accessToken = generateAccessToken(user as IUser);
    const { token: refreshToken } = generateRefreshToken(user as IUser);

    logger.info("User registered", { userId: user._id, username });

    // Return safe user object (no passwordHash!)
    return {
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            stats: user.stats,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
    };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginUser(
    email: string,
    password: string
): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    // FR-AUTH-002: Always return 401 — NEVER distinguish between "wrong email"
    // and "wrong password". Security: prevents email enumeration attacks.
    const GENERIC_ERROR = "Invalid email or password";

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new UnauthorizedError(GENERIC_ERROR);
    }

    // Check if account is banned
    if (!user.isActive) {
        throw new UnauthorizedError("Your account has been suspended");
    }

    // bcrypt.compare hashes the provided password and compares to stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new UnauthorizedError(GENERIC_ERROR);
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = generateRefreshToken(user);

    logger.info("User logged in", { userId: user._id, username: user.username });

    return {
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            stats: user.stats,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
    };
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

export async function refreshAccessToken(
    refreshToken: string
): Promise<{ accessToken: string }> {
    if (!refreshToken) {
        throw new UnauthorizedError("No refresh token provided");
    }

    let decoded: { userId: string; jti: string };
    try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
            userId: string;
            jti: string;
        };
    } catch {
        throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Check blacklist — if this token was explicitly logged out, reject it
    // even if it's not expired yet
    const isBlacklisted = await redis.get(`token:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
        throw new UnauthorizedError("Token has been revoked");
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
        throw new UnauthorizedError("User not found or account suspended");
    }

    const accessToken = generateAccessToken(user);
    return { accessToken };
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export async function logoutUser(refreshToken: string): Promise<void> {
    if (!refreshToken) return; // Already logged out

    try {
        const decoded = jwt.decode(refreshToken) as { jti?: string; exp?: number };

        if (decoded?.jti) {
            // Calculate how long until the refresh token expires
            // We store the blacklist entry with that same TTL so Redis auto-cleans it
            const now = Math.floor(Date.now() / 1000);
            const ttl = decoded.exp ? decoded.exp - now : 60 * 60 * 24 * 7; // 7 days max

            if (ttl > 0) {
                // Add to blacklist — any future refresh attempt with this jti gets rejected
                await redis.set(`token:blacklist:${decoded.jti}`, "1", { ex: ttl });
                logger.info("Refresh token blacklisted", { jti: decoded.jti });
            }
        }
    } catch (error) {
        // Don't throw on logout errors — user experience > security edge cases
        logger.warn("Failed to blacklist token on logout", {
            error: (error as Error).message,
        });
    }
}

// ─── FORGOT PASSWORD (OTP generation) ────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
    // Don't reveal if the email exists or not (prevents email enumeration)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        // Silent return — same response whether email exists or not
        logger.info("Password reset requested for non-existent email", { email });
        return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 10-minute TTL (FR-AUTH-005)
    await redis.set(`otp:${email.toLowerCase()}`, otp, { ex: 600 });

    // Send via Nodemailer (Gmail SMTP)
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.email.user,
                pass: config.email.appPassword, // Gmail App Password (not account password)
            },
        });

        await transporter.sendMail({
            from: `"DebateArena" <${config.email.user}>`,
            to: email,
            subject: "Your DebateArena Password Reset Code",
            html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <h2>Password Reset</h2>
          <p>Your one-time code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                      padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
            ${otp}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
        });

        logger.info("Password reset OTP sent", { email });
    } catch (error) {
        logger.error("Failed to send OTP email", {
            error: (error as Error).message,
        });
        // Don't expose email failure to client
    }
}

// ─── RESET PASSWORD (OTP verify + new password) ───────────────────────────────

export async function resetPassword(
    email: string,
    otp: string,
    newPassword: string
): Promise<void> {
    const storedOtp = await redis.get(`otp:${email.toLowerCase()}`);

    if (!storedOtp || storedOtp !== otp) {
        throw new ValidationError("Invalid or expired OTP");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new NotFoundError("User not found");
    }

    // Hash the new password and save
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Delete OTP from Redis immediately after use (FR-AUTH-005)
    await redis.del(`otp:${email.toLowerCase()}`);

    logger.info("Password reset successful", { userId: user._id });
}
