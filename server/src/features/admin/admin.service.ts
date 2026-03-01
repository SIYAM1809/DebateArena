// Admin Service — platform-level statistics and moderation helpers.
// All functions are for admin-only endpoints protected by requireAdmin middleware.

import User from "../../models/User";
import { Debate } from "../../models/Debate";
import Topic from "../../models/Topic";
import { NotFoundError } from "../../utils/errors";

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────

export async function getStats() {
    const [
        totalUsers,
        debatesByStatus,
        flaggedCount,
        topicsCount,
    ] = await Promise.all([
        User.countDocuments(),
        Debate.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Debate.countDocuments({ "messages.flagged": true }),
        Topic.countDocuments(),
    ]);

    const debates: Record<string, number> = { WAITING: 0, ONGOING: 0, COMPLETED: 0, FORFEITED: 0 };
    for (const d of debatesByStatus) {
        if (d._id) debates[d._id] = d.count;
    }

    return {
        totalUsers,
        debates,
        totalDebates: Object.values(debates).reduce((a, b) => a + b, 0),
        flaggedDebates: flaggedCount,
        totalTopics: topicsCount,
    };
}

// ─── FLAGGED MESSAGES ──────────────────────────────────────────────────────────

export async function getFlaggedDebates() {
    const debates = await Debate.find({ "messages.flagged": true })
        .select("topicId messages participants createdAt status")
        .populate("topicId", "title")
        .populate("participants.FOR", "username")
        .populate("participants.AGAINST", "username")
        .sort({ createdAt: -1 })
        .limit(100);

    // Return only the flagged messages within each debate
    return debates.map((d) => ({
        debateId: d._id,
        topic: d.topicId,
        participants: d.participants,
        status: d.status,
        createdAt: d.createdAt,
        flaggedMessages: d.messages.filter((m) => m.flagged),
    }));
}

// ─── TOPIC MANAGEMENT ─────────────────────────────────────────────────────────

export async function setTopicActive(topicId: string, isActive: boolean) {
    const topic = await Topic.findByIdAndUpdate(
        topicId,
        { isActive },
        { new: true }
    );
    if (!topic) throw new NotFoundError("Topic not found");
    return topic;
}

export async function getAllTopicsAdmin() {
    return Topic.find().sort({ createdAt: -1 });
}
