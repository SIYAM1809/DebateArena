import { Router } from "express";
import * as debateController from "./debate.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

// GET /api/v1/debates — public archive list (paginated)
// Supports ?status=COMPLETED&page=1&limit=20&topicId=...&userId=...
router.get("/", debateController.listDebates);

// GET /api/v1/debates/stats — aggregate counts per status (no auth)
router.get("/stats", debateController.getDebateStats);

// GET /api/v1/debates/:id — full debate with messages (requires auth)
router.get("/:id", authenticate, debateController.getDebate);

// PATCH /api/v1/debates/:id/messages/:messageId/flag — flag a message (requires auth)
router.patch("/:id/messages/:messageId/flag", authenticate, debateController.flagMessage);

export default router;
