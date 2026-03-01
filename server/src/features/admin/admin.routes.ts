import { Router } from "express";
import { authenticate, requireAdmin } from "../auth/auth.middleware";
import * as adminController from "./admin.controller";

const router = Router();

// All admin routes require both authentication AND admin role
router.use(authenticate, requireAdmin);

// Platform statistics
router.get("/stats", adminController.getStats);

// Flagged messages review
router.get("/flagged", adminController.getFlagged);

// Topic management
router.get("/topics", adminController.getAllTopics);
router.patch("/topics/:id/toggle", adminController.toggleTopic);

export default router;
