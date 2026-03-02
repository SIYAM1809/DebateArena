/**
 * Solo Practice Socket Handlers
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers socket events for solo (user vs. bot) debates.
 *
 * TEACHING NOTE — Why have separate `solo:*` events instead of reusing `debate:*`?
 *   The debate:message handler validates the turn, saves the message, and expects
 *   the opponent to be a real user whose socket will receive the update.
 *   In solo mode, after the user submits, we need to fire the bot reply automatically
 *   with a delay. Mixing this logic into the existing handler would make it messy.
 *   Separate event names keep the two flows completely independent — easier to debug,
 *   test, and explain.
 *
 * Events handled:
 *   solo:join       → joins the socket room, emits current debate state
 *   solo:message    → saves user message, then triggers bot reply after 3s delay
 *   solo:end_turn   → user passes their turn early (bot still replies)
 *   solo:forfeit    → user quits, debate is marked FORFEITED
 */

import { Server, Socket } from "socket.io";
import * as debateService from "./debate.service";
import { submitBotTurn } from "./solo.service";
import { logger } from "../../utils/logger";

// How many ms the bot "thinks" before replying — makes it feel realistic
const BOT_REPLY_DELAY_MS = 3500;

export function registerSoloHandlers(io: Server, socket: Socket) {
    const userId = socket.data.user.userId;

    // ── 1. JOIN ──────────────────────────────────────────────────────────────
    // The client calls this immediately on page mount.
    // We join the socket room so subsequent emits reach this client.
    socket.on("solo:join", async (payload: { debateId: string }) => {
        try {
            const { debateId } = payload;
            socket.join(`debate_${debateId}`);
            logger.info("User joined solo debate room", { userId, debateId });

            // Send the current debate state so the UI can render immediately
            const debate = await debateService.getDebateById(debateId);
            socket.emit("debate:updated", debate);
        } catch (error) {
            logger.error("solo:join failed", { error: (error as Error).message });
            socket.emit("debate:error", { message: "Could not join solo room" });
        }
    });

    // ── 2. USER SENDS A MESSAGE ───────────────────────────────────────────────
    socket.on("solo:message", async (payload: { debateId: string; content: string }) => {
        const { debateId, content } = payload;
        try {
            // Save the user's message — reuses the existing service function
            // which handles turn validation and AI scoring
            const afterUser = await debateService.saveMessage(debateId, userId, content);

            // Broadcast the user's message immediately so they see it in the UI
            io.to(`debate_${debateId}`).emit("debate:updated", afterUser);

            // If the debate ended after the user's message (e.g. last turn of round 3),
            // don't queue a bot reply
            if (afterUser.status !== "ONGOING") return;

            // Advance the turn from FOR → AGAINST
            const afterEndTurn = await debateService.endTurn(debateId);
            io.to(`debate_${debateId}`).emit("debate:updated", afterEndTurn);

            // If the debate is still ongoing, schedule the bot reply.
            // We only fire if it's now AGAINST's turn (the bot's turn).
            if (afterEndTurn.status === "ONGOING" && afterEndTurn.currentTurn === "AGAINST") {
                setTimeout(async () => {
                    try {
                        const afterBot = await submitBotTurn(debateId);
                        io.to(`debate_${debateId}`).emit("debate:updated", afterBot);
                    } catch (botErr) {
                        logger.error("Bot turn failed", { error: (botErr as Error).message });
                    }
                }, BOT_REPLY_DELAY_MS);
            }
        } catch (error) {
            logger.error("solo:message rejected", { error: (error as Error).message });
            socket.emit("debate:error", { message: (error as Error).message });
        }
    });

    // ── 3. USER PASSES THEIR TURN ────────────────────────────────────────────
    // User can pass without speaking — the bot will still reply.
    socket.on("solo:end_turn", async (payload: { debateId: string }) => {
        const { debateId } = payload;
        try {
            const afterEndTurn = await debateService.endTurn(debateId);
            io.to(`debate_${debateId}`).emit("debate:updated", afterEndTurn);

            if (afterEndTurn.status === "ONGOING" && afterEndTurn.currentTurn === "AGAINST") {
                setTimeout(async () => {
                    try {
                        const afterBot = await submitBotTurn(debateId);
                        io.to(`debate_${debateId}`).emit("debate:updated", afterBot);
                    } catch (botErr) {
                        logger.error("Bot turn (after pass) failed", { error: (botErr as Error).message });
                    }
                }, BOT_REPLY_DELAY_MS);
            }
        } catch (error) {
            logger.error("solo:end_turn failed", { error: (error as Error).message });
            socket.emit("debate:error", { message: (error as Error).message });
        }
    });

    // ── 4. FORFEIT (QUIT PRACTICE) ────────────────────────────────────────────
    socket.on("solo:forfeit", async (payload: { debateId: string }) => {
        try {
            const updated = await debateService.forfeitDebate(payload.debateId, userId);
            io.to(`debate_${payload.debateId}`).emit("debate:updated", updated);
        } catch (error) {
            logger.error("solo:forfeit failed", { error: (error as Error).message });
        }
    });
}
