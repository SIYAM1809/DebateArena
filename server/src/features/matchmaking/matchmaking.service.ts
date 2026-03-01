// Matchmaking Service
// Handles queueing users via Redis for specific topics and sides.
// Whenever a user joins, it immediately checks if an opponent is waiting.
// If yes -> creates a match (debate). If no -> adds user to the queue.

import { v4 as uuidv4 } from "uuid";
import { redis } from "../../config/redis";
import { logger } from "../../utils/logger";

// We use Upstash Redis (REST API), so we don't have true blocking commands (BRPOP).
// We simulate it using atomic Lua scripts or simple GET/SET/DEL combinations.

export type Side = "FOR" | "AGAINST";

interface QueueEntry {
    userId: string;
    socketId: string;
    joinedAt: number;
}

export interface MatchResult {
    matchFound: boolean;
    debateId?: string;
    opponent?: {
        userId: string;
        socketId: string;
        side: Side;
    };
}

// ─── JOIN QUEUE & MATCH ───────────────────────────────────────────────────────
// Returns { matchFound: true, debateId, opponent } OR { matchFound: false }
export async function joinQueue(
    userId: string,
    socketId: string,
    topicId: string,
    preferredSide: Side | "RANDOM"
): Promise<MatchResult> {
    const now = Date.now();
    const entry: QueueEntry = { userId, socketId, joinedAt: now };

    // 1. Determine which queues to check/join based on preference
    // If RANDOM, we randomly assign a primary side, but check both.
    let targetSide: Side = preferredSide === "RANDOM"
        ? (Math.random() > 0.5 ? "FOR" : "AGAINST")
        : preferredSide;

    let opponentSide: Side = targetSide === "FOR" ? "AGAINST" : "FOR";

    // 2. Try to find an opponent (Dequeue)
    // Redis lists: LPOP removes and returns the first element
    const queueKeyOpponent = `queue:${topicId}:${opponentSide}`;
    const opponentRaw = await redis.lpop<QueueEntry>(queueKeyOpponent);

    if (opponentRaw) {
        // We found an opponent!
        // Edge case: if the opponent has been waiting > 30s, their connection
        // might be dead (handled by client timeout, but we clean up here too just in case)
        if (now - opponentRaw.joinedAt > 40000) {
            // Opponent expired, discard them and try to find another one recursively
            logger.info("Discarded expired queue entry", { userId: opponentRaw.userId });
            return joinQueue(userId, socketId, topicId, preferredSide);
        }

        // Edge case: user matched themselves (e.g. opened two tabs)
        if (opponentRaw.userId === userId) {
            logger.warn("User matched themselves, discarding old entry", { userId });
            return joinQueue(userId, socketId, topicId, preferredSide);
        }

        // Match successful!
        const debateId = uuidv4(); // Generate a unique ID for this debate room

        logger.info("Match found!", {
            debateId,
            topicId,
            user1: userId,
            user2: opponentRaw.userId
        });

        return {
            matchFound: true,
            debateId,
            opponent: {
                userId: opponentRaw.userId,
                socketId: opponentRaw.socketId,
                side: opponentSide, // The side the opponent is playing
            }
        };
    }

    // 3. No opponent found - Enqueue ourselves
    // If RANDOM, we just picked a random side to queue as.
    const queueKeySelf = `queue:${topicId}:${targetSide}`;

    // RPUSH adds to the end of the list
    await redis.rpush(queueKeySelf, entry);

    // Set TTL of 45 seconds on the queue key so it doesn't grow infinitely
    // if players disconnect without dequeuing.
    await redis.expire(queueKeySelf, 45);

    logger.info("Joined queue", { userId, topicId, side: targetSide });

    return { matchFound: false };
}

// ─── LEAVE QUEUE ──────────────────────────────────────────────────────────────
// Removes a user from the queue (e.g. if they cancel or disconnect)
export async function leaveQueue(
    userId: string,
    topicId: string,
    side: Side
): Promise<void> {
    const queueKey = `queue:${topicId}:${side}`;

    // Redis REST doesn't have LREM to easily remove by object value.
    // We have to pull the list, filter, and replace.
    // This is safe here because queues are extremely short (usually 0-1 people)
    // because they match instantly.

    const currentQueue = await redis.lrange<QueueEntry>(queueKey, 0, -1);
    if (!currentQueue || currentQueue.length === 0) return;

    const filteredQueue = currentQueue.filter(entry => entry.userId !== userId);

    if (filteredQueue.length === currentQueue.length) {
        return; // User wasn't in this queue
    }

    // Transaction to overwrite the list
    const pipeline = redis.pipeline();
    pipeline.del(queueKey);
    if (filteredQueue.length > 0) {
        pipeline.rpush(queueKey, ...filteredQueue);
        pipeline.expire(queueKey, 45);
    }
    await pipeline.exec();

    logger.info("Left queue", { userId, topicId, side });
}

// ─── CLEANUP (Cron hook) ──────────────────────────────────────────────────────
// Optional: a function to prune dead queue entries globally if needed.
// Relying on the 45s EXPIRE + manual cleanup on LPOP is usually enough.
