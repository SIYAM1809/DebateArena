// Matchmaking Socket Handler
// Listen for "match:join" and "match:leave" events from clients.
// When a match is found, emit "match:found" to BOTH players.

import { Server, Socket } from "socket.io";
import * as matchmakingService from "./matchmaking.service";
import { logger } from "../../utils/logger";
import { Debate } from "../../models/Debate";

interface JoinQueuePayload {
    topicId: string;
    side: "FOR" | "AGAINST" | "RANDOM";
}

export function registerMatchmakingHandlers(io: Server, socket: Socket) {
    // We need the user payload from the socket (attached in the auth middleware in socket.ts)
    const userId = socket.data.user.userId;

    socket.on("match:join", async (payload: JoinQueuePayload) => {
        try {
            logger.info("User joined matchmaking queue", { userId, ...payload });

            const result = await matchmakingService.joinQueue(
                userId,
                socket.id,
                payload.topicId,
                payload.side
            );

            // If no match found, we just wait in the queue.
            // Emitter receives nothing (ui shows "Waiting for opponent...").
            if (!result.matchFound) {
                socket.emit("match:queued", { status: "waiting" });
                return;
            }

            // If match IS found, notify both players!
            const { debateId, opponent } = result;

            // The side we actually play (if we requested RANDOM, 
            // the opponent's side dictates our side)
            const mySide = opponent!.side === "FOR" ? "AGAINST" : "FOR";

            // Persist the match explicitly in MongoDB so both viewers and players can retrieve it
            // We do this before notifying via socket so the room fundamentally exists if they rapidly connect
            await Debate.create({
                _id: debateId,
                topicId: payload.topicId,
                participants: {
                    FOR: mySide === "FOR" ? userId : opponent!.userId,
                    AGAINST: mySide === "AGAINST" ? userId : opponent!.userId
                }
            });

            // 1. Notify the current user (the one who just joined and triggered the match)
            socket.emit("match:found", {
                debateId,
                opponentId: opponent!.userId,
                side: mySide,
                topicId: payload.topicId,
            });

            // 2. Notify the opponent (the one who was waiting in the queue)
            io.to(opponent!.socketId).emit("match:found", {
                debateId,
                opponentId: userId, // I am their opponent
                side: opponent!.side,
                topicId: payload.topicId,
            });

            logger.info("Match started!", { debateId, user1: userId, user2: opponent!.userId });

        } catch (error) {
            logger.error("Queue join failed", { error: (error as Error).message });
            socket.emit("match:error", { message: "Failed to join queue" });
        }
    });

    // Client hit cancel
    socket.on("match:cancel", async (payload: { topicId: string, side: "FOR" | "AGAINST" }) => {
        try {
            await matchmakingService.leaveQueue(userId, payload.topicId, payload.side);
            socket.emit("match:cancelled", { status: "success" });
        } catch (error) {
            logger.error("Queue cancel failed", { error: (error as Error).message });
        }
    });

    // Handle disconnect (if they close browser while queued)
    // We don't know what topic/side they were queuing for exactly from the socket alone,
    // but Redis short TTLs (45s) ensure they drop out naturally very quickly.
    // The `joinQueue` logic also ignores dead opponents (LPOP then check joinedAt).
    socket.on("disconnect", () => {
        logger.info("User disconnected from matchmaking", { userId });
        // Relies on TTL & LPOP stale-check to clean up queues
    });
}
