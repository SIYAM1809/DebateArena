import { Debate, IDebate, DebateStatus, IMessage } from "../../models/Debate";
import { NotFoundError, AppError } from "../../utils/errors";
import { evaluateArgument } from "./ai.service";

/**
 * Retrieves a debate by ID and populates participant and topic info.
 */
export async function getDebateById(debateId: string): Promise<IDebate> {
    const debate = await Debate.findById(debateId)
        .populate("topicId", "title category")
        .populate("participants.FOR", "username rating")
        .populate("participants.AGAINST", "username rating")
        .populate("messages.sender", "username");

    if (!debate) {
        throw new NotFoundError("Debate not found");
    }

    return debate;
}

/**
 * Ensures both users have actively 'joined' the Debate.
 * We change status from WAITING to ONGOING once both confirm they are mounted in UI.
 * (Will integrate with Socket.io presence or just switch it here blindly for prototype).
 */
export async function startDebateTurnIfReady(debateId: string): Promise<IDebate> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    if (debate.status === DebateStatus.WAITING) {
        debate.status = DebateStatus.ONGOING;
        // First turn randomly chosen or always FOR? Convention is typically 'FOR' goes first.
        debate.currentTurn = "FOR";
        debate.turnEndsAt = new Date(Date.now() + 60_000); // 60 seconds per turn
        await debate.save();
    }

    return debate;
}

/**
 * Adds a message to the debate from the active turn player.
 */
export async function saveMessage(
    debateId: string,
    userId: string,
    content: string
): Promise<IDebate> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    if (debate.status !== DebateStatus.ONGOING) {
        throw new AppError("Debate is not active", 400);
    }

    // Determine side of the sender
    let side: "FOR" | "AGAINST";
    if (debate.participants.FOR.toString() === userId) {
        side = "FOR";
    } else if (debate.participants.AGAINST.toString() === userId) {
        side = "AGAINST";
    } else {
        throw new AppError("You are not a participant in this debate", 403);
    }

    // Check turn
    if (debate.currentTurn !== side) {
        throw new AppError("It is not your turn", 400);
    }

    // Evaluate the argument using HF AI
    const aiScore = await evaluateArgument(content);

    // Actually push the message
    debate.messages.push({
        sender: userId as any, // Types.ObjectId alias
        side,
        content,
        createdAt: new Date(),
        aiScore: aiScore ?? undefined
    });

    await debate.save();
    return debate;
}

/**
 * Ends current turn and switches to the other player.
 * Advances to the next round if both have spoken.
 */
export async function endTurn(debateId: string): Promise<IDebate> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    if (debate.status !== DebateStatus.ONGOING) return debate;

    if (debate.currentTurn === "AGAINST") {
        // Round over
        if (debate.round >= 3) {
            // End debate
            debate.status = DebateStatus.COMPLETED;
            debate.currentTurn = null;
            debate.turnEndsAt = null;
            // Optionally set winner to null temporarily to invoke AI judge
        } else {
            // Next round
            debate.round += 1;
            debate.currentTurn = "FOR";
            debate.turnEndsAt = new Date(Date.now() + 60_000);
        }
    } else {
        // Just next turn (FOR -> AGAINST)
        debate.currentTurn = "AGAINST";
        debate.turnEndsAt = new Date(Date.now() + 60_000);
    }

    await debate.save();
    return debate;
}

/**
 * Handle a user abandoning the debate early.
 */
export async function forfeitDebate(debateId: string, userId: string): Promise<IDebate> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    if (debate.status === DebateStatus.ONGOING || debate.status === DebateStatus.WAITING) {
        debate.status = DebateStatus.FORFEITED;

        if (debate.participants.FOR.toString() === userId) {
            debate.winner = "AGAINST";
        } else if (debate.participants.AGAINST.toString() === userId) {
            debate.winner = "FOR";
        }

        debate.currentTurn = null;
        debate.turnEndsAt = null;
        await debate.save();
    }

    return debate;
}

/**
 * Paginated list of debates for the archive page.
 * Supports filtering by status, topicId, and userId (participant).
 */
export async function listDebates(opts: {
    status?: string;
    topicId?: string;
    userId?: string;
    page: number;
    limit: number;
}): Promise<{ debates: IDebate[]; total: number; page: number; totalPages: number }> {
    const { status, topicId, userId, page, limit } = opts;

    // Build the filter query
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (topicId) filter.topicId = topicId;
    if (userId) {
        filter.$or = [
            { "participants.FOR": userId },
            { "participants.AGAINST": userId },
        ];
    }

    const skip = (page - 1) * limit;
    const [debates, total] = await Promise.all([
        Debate.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("topicId", "title category")
            .populate("participants.FOR", "username")
            .populate("participants.AGAINST", "username")
            .select("-messages"), // Exclude heavy messages array from list view
        Debate.countDocuments(filter),
    ]);

    return {
        debates: debates as IDebate[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Returns aggregate counts per debate status for the archive stats bar.
 */
export async function getDebateStats(): Promise<Record<string, number>> {
    const results = await Debate.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats: Record<string, number> = {
        WAITING: 0,
        ONGOING: 0,
        COMPLETED: 0,
        FORFEITED: 0,
    };
    for (const r of results) {
        if (r._id) stats[r._id] = r.count;
    }
    return stats;
}

/**
 * Flags a specific message within a debate for admin review.
 * Any authenticated user can flag any message (moderation by crowd).
 */
export async function flagMessage(
    debateId: string,
    messageId: string
): Promise<{ ok: boolean }> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    const message = debate.messages.find(
        (m) => m._id?.toString() === messageId
    );
    if (!message) throw new AppError("Message not found", 404);

    message.flagged = true;
    await debate.save();
    return { ok: true };
}
