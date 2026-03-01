// Reusable express-validator chains.
// express-validator lets you declaratively describe what valid input looks like.
// These chains are imported and dropped into route definitions.
// The controller then calls validationResult(req) to collect any errors.

import { body } from "express-validator";

// ─── USERNAME ─────────────────────────────────────────────────────────────────
export const validateUsername = () =>
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 20 }).withMessage("Username must be 3–20 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores");

// ─── EMAIL ────────────────────────────────────────────────────────────────────
export const validateEmail = () =>
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address")
        .normalizeEmail();

// ─── PASSWORD ─────────────────────────────────────────────────────────────────
// FR-AUTH-001: min 8 chars, 1 uppercase, 1 number
export const validatePassword = () =>
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number");

// ─── PASSWORD CONFIRM ─────────────────────────────────────────────────────────
export const validatePasswordConfirm = () =>
    body("confirmPassword")
        .notEmpty().withMessage("Please confirm your password")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }
            return true;
        });

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const validateOtp = () =>
    body("otp")
        .notEmpty().withMessage("OTP is required")
        .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
        .isNumeric().withMessage("OTP must contain only numbers");
