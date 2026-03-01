import { Request, Response, NextFunction } from "express";
import * as userService from "./user.service";

// GET /api/v1/users/leaderboard
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = Math.min(100, parseInt(req.query.limit as string) || 100);
        const leaderboard = await userService.getLeaderboard(limit);
        res.status(200).json({ users: leaderboard });
    } catch (error) {
        next(error);
    }
}

// GET /api/v1/users/:id
export async function getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await userService.getUserProfile(req.params.id as string);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}

// GET /api/v1/users/:id/debates
export async function getUserDebates(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
        const result = await userService.getUserDebates(req.params.id as string, page, limit);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}
