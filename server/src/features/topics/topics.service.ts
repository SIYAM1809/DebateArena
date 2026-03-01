// Topic Service — business logic for topic CRUD.

import Topic, { ITopic, TopicCategory } from "../../models/Topic";
import { NotFoundError, ConflictError } from "../../utils/errors";

// ─── LIST TOPICS ──────────────────────────────────────────────────────────────
// Supports: category filter, search query, pagination, active-only flag
export async function listTopics(opts: {
    category?: TopicCategory;
    search?: string;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
}) {
    const { category, search, activeOnly = true, page = 1, limit = 20 } = opts;

    // Build the MongoDB query filter dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (activeOnly) filter.isActive = true;
    if (category) filter.category = category;
    if (search) {
        // $text uses the text index we created on title + description
        filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
        Topic.find(filter)
            .sort(search ? { score: { $meta: "textScore" } } : { debateCount: -1 })
            // If searching, sort by relevance. Otherwise sort by popularity.
            .skip(skip)
            .limit(limit)
            .select("-createdBy"), // Don't expose who created it publicly
        Topic.countDocuments(filter),
    ]);

    return {
        topics,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─── GET ONE TOPIC ────────────────────────────────────────────────────────────
export async function getTopicById(id: string): Promise<ITopic> {
    const topic = await Topic.findById(id);
    if (!topic) throw new NotFoundError("Topic not found");
    return topic;
}

// ─── CREATE TOPIC (admin only) ────────────────────────────────────────────────
export async function createTopic(data: {
    title: string;
    description: string;
    category: TopicCategory;
    createdBy: string; // Admin userId
}): Promise<ITopic> {
    const existing = await Topic.findOne({
        title: { $regex: new RegExp(`^${data.title.trim()}$`, "i") },
    });
    if (existing) throw new ConflictError("A topic with this title already exists");

    const topic = await Topic.create(data);
    return topic;
}

// ─── TOGGLE ACTIVE STATUS (admin only) ───────────────────────────────────────
// Flips isActive. Inactive topics don't appear in matchmaking queues.
export async function toggleTopicStatus(id: string): Promise<ITopic> {
    const topic = await Topic.findById(id);
    if (!topic) throw new NotFoundError("Topic not found");

    topic.isActive = !topic.isActive;
    await topic.save();
    return topic;
}

// ─── UPDATE TOPIC (admin only) ────────────────────────────────────────────────
export async function updateTopic(
    id: string,
    data: Partial<Pick<ITopic, "title" | "description" | "category">>
): Promise<ITopic> {
    const topic = await Topic.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true } // new=true returns the updated doc; runValidators re-runs schema validation
    );
    if (!topic) throw new NotFoundError("Topic not found");
    return topic;
}
