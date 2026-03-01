// Topics Routes

import { Router } from "express";
import { body, param } from "express-validator";
import * as topicsController from "./topics.controller";
import { authenticate, requireAdmin } from "../auth/auth.middleware";

const router = Router();

const CATEGORIES = ["Politics", "Science", "Philosophy", "Technology", "Society", "Ethics"];

const validateTopicBody = [
    body("title").trim().notEmpty().withMessage("Title is required")
        .isLength({ min: 10, max: 150 }).withMessage("Title must be 10–150 characters"),
    body("description").trim().notEmpty().withMessage("Description is required")
        .isLength({ max: 600 }).withMessage("Description cannot exceed 600 characters"),
    body("category").isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
];

const validateId = [
    param("id").isMongoId().withMessage("Invalid topic ID"),
];

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
// Anyone (even unauthenticated) can browse topics
router.get("/", topicsController.list);
router.get("/:id", validateId, topicsController.getOne);

// ─── ADMIN-ONLY ROUTES ────────────────────────────────────────────────────────
router.post("/", authenticate, requireAdmin, validateTopicBody, topicsController.create);
router.patch("/:id", authenticate, requireAdmin, validateId, validateTopicBody, topicsController.update);
router.patch("/:id/toggle", authenticate, requireAdmin, validateId, topicsController.toggle);

export default router;
