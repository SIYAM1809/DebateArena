// Auth Routes — maps HTTP endpoints to controller handlers.
//
// Route definitions are kept minimal:
//   METHOD path → [validation middleware] → controller handler
//
// express-validator chains run first and accumulate errors into the request.
// The controller then reads those errors via validationResult(req).

import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "./auth.middleware";
import {
    validateUsername,
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateOtp,
} from "../../utils/validate";
import { body } from "express-validator";

const router = Router();

// POST /api/v1/auth/register
// Validates username + email + password + confirm, then registers user
router.post(
    "/register",
    [
        validateUsername(),
        validateEmail(),
        validatePassword(),
        validatePasswordConfirm(),
    ],
    authController.register
);

// POST /api/v1/auth/login
router.post(
    "/login",
    [
        validateEmail(),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    authController.login
);

// POST /api/v1/auth/refresh
// Reads httpOnly cookie — no body needed
router.post("/refresh", authController.refresh);

// POST /api/v1/auth/logout
// Reads httpOnly cookie too
router.post("/logout", authController.logout);

// POST /api/v1/auth/forgot-password
router.post(
    "/forgot-password",
    [validateEmail()],
    authController.forgotPassword
);

// POST /api/v1/auth/reset-password
router.post(
    "/reset-password",
    [
        validateEmail(),
        validateOtp(),
        body("newPassword")
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
            .matches(/[A-Z]/).withMessage("New password must contain at least one uppercase letter")
            .matches(/[0-9]/).withMessage("New password must contain at least one number"),
    ],
    authController.resetPassword
);

// GET /api/v1/auth/me — returns current user profile (requires auth)
router.get("/me", authenticate, authController.getMe);

export default router;
