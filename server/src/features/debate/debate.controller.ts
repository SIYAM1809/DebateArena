import { Request, Response, NextFunction } from "express";
import * as debateService from "./debate.service";
import * as soloService from "./solo.service";
import { AppError } from "../../utils/errors";

export async function getDebate(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) throw new AppError("Debate ID is required", 400);

        const debate = await debateService.getDebateById(id as string);
        res.status(200).json(debate);
    } catch (error) {
        next(error);
    }
}

export async function listDebates(req: Request, res: Response, next: NextFunction) {
    try {
        const status = req.query.status as string | undefined;
        const topicId = req.query.topicId as string | undefined;
        const userId = req.query.userId as string | undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

        const result = await debateService.listDebates({ status, topicId, userId, page, limit });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getDebateStats(req: Request, res: Response, next: NextFunction) {
    try {
        const stats = await debateService.getDebateStats();
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
}

export async function flagMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const { id, messageId } = req.params;
        const result = await debateService.flagMessage(id as string, messageId as string);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function startSoloDebate(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new AppError("Unauthorized", 401);

        const { topicId } = req.body as { topicId?: string };
        if (!topicId) throw new AppError("topicId is required", 400);

        const debate = await soloService.startSoloSession(userId, topicId);
        res.status(201).json({ debateId: debate._id, isSolo: true });
    } catch (error) {
        next(error);
    }
}
