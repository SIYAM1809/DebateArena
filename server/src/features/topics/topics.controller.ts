// Topics Controller — thin HTTP layer, delegates to topics.service.ts

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import * as topicsService from "./topics.service";
import { ValidationError } from "../../utils/errors";
import { TopicCategory } from "../../models/Topic";

function checkValidation(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map((e) => e.msg).join(". ");
        throw new ValidationError(message);
    }
}

// GET /api/v1/topics
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const {
            category,
            search,
            page = "1",
            limit = "20",
            all = "false", // Admins pass ?all=true to see inactive topics
        } = req.query as Record<string, string>;

        const result = await topicsService.listTopics({
            category: category as TopicCategory,
            search,
            activeOnly: all !== "true",
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50), // Cap at 50
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// GET /api/v1/topics/:id
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const topic = await topicsService.getTopicById(String(req.params.id));
        res.status(200).json({ topic });
    } catch (err) {
        next(err);
    }
}

// POST /api/v1/topics  [admin]
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        checkValidation(req);
        const { title, description, category } = req.body;

        const topic = await topicsService.createTopic({
            title,
            description,
            category,
            createdBy: req.user!.userId,
        });

        res.status(201).json({ topic });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/v1/topics/:id  [admin]
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        checkValidation(req);
        const { title, description, category } = req.body;

        const topic = await topicsService.updateTopic(String(req.params.id), {
            title,
            description,
            category,
        });

        res.status(200).json({ topic });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/v1/topics/:id/toggle  [admin]
// Toggles isActive — no body needed
export async function toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const topic = await topicsService.toggleTopicStatus(String(req.params.id));
        res.status(200).json({ topic });
    } catch (err) {
        next(err);
    }
}
