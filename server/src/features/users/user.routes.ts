import { Router } from "express";
import * as userController from "./user.controller";

const router = Router();

// GET /api/v1/users/leaderboard — MUST be before /:id to avoid route clash
router.get("/leaderboard", userController.getLeaderboard);

// GET /api/v1/users/:id — public profile
router.get("/:id", userController.getUserProfile);

// GET /api/v1/users/:id/debates — debate history for this user
router.get("/:id/debates", userController.getUserDebates);

export default router;
