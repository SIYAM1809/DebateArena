// User Service — handles profile and leaderboard queries.
//
// Business logic is separate from the HTTP layer (controller).
// This service can be unit-tested without spinning up Express.

import User, { IUser } from "../../models/User";
import { Debate } from "../../models/Debate";
import { NotFoundError } from "../../utils/errors";

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select(
        "username email avatar role stats createdAt"
    );

    if (!user) throw new NotFoundError("User not found");
    return user;
}

// ─── GET USER DEBATE HISTORY ──────────────────────────────────────────────────

export async function getUserDebates(
    userId: string,
    page: number,
    limit: number
): Promise<{ debates: unknown[]; total: number; page: number; totalPages: number }> {
    const filter = {
        $or: [
            { "participants.FOR": userId },
            { "participants.AGAINST": userId },
        ],
    };

    const skip = (page - 1) * limit;
    const [debates, total] = await Promise.all([
        Debate.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("topicId", "title category")
            .populate("participants.FOR", "username")
            .populate("participants.AGAINST", "username")
            .select("-messages"),
        Debate.countDocuments(filter),
    ]);

    return {
        debates,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

// ─── GET LEADERBOARD ──────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 100): Promise<Partial<IUser>[]> {
    // Sort by wins descending, then avgScore descending as a tiebreaker
    const users = await User.find({ isActive: true })
        .sort({ "stats.wins": -1, "stats.avgScore": -1 })
        .limit(limit)
        .select("username avatar stats createdAt");

    return users;
}
