import { Request, Response, NextFunction } from "express";
import * as adminService from "./admin.service";

// GET /api/v1/admin/stats
export async function getStats(req: Request, res: Response, next: NextFunction) {
    try {
        const stats = await adminService.getStats();
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
}

// GET /api/v1/admin/flagged
export async function getFlagged(req: Request, res: Response, next: NextFunction) {
    try {
        const debates = await adminService.getFlaggedDebates();
        res.status(200).json({ debates });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/v1/admin/topics/:id/toggle
export async function toggleTopic(req: Request, res: Response, next: NextFunction) {
    try {
        const { isActive } = req.body as { isActive: boolean };
        const topic = await adminService.setTopicActive(req.params.id as string, isActive);
        res.status(200).json({ topic });
    } catch (error) {
        next(error);
    }
}

// GET /api/v1/admin/topics
export async function getAllTopics(req: Request, res: Response, next: NextFunction) {
    try {
        const topics = await adminService.getAllTopicsAdmin();
        res.status(200).json({ topics });
    } catch (error) {
        next(error);
    }
}
