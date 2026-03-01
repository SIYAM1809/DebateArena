import { Server, Socket } from "socket.io";
import * as debateService from "./debate.service";
import { logger } from "../../utils/logger";

interface JoinDebatePayload {
    debateId: string;
}

interface MessagePayload {
    debateId: string;
    content: string;
}

export function registerDebateHandlers(io: Server, socket: Socket) {
    const userId = socket.data.user.userId;

    // 1. Join a specific debate room
    socket.on("debate:join", async (payload: JoinDebatePayload) => {
        try {
            const { debateId } = payload;

            // Join the socket.io room
            socket.join(`debate_${debateId}`);
            logger.info("User joined debate room", { userId, debateId });

            // Trigger service to check if we should transition from WAITING -> ONGOING
            // The service inherently checks if the debate is waiting, and conditionally starts it.
            // NOTE: In a true production app, you might only start it if BOTH users signal 'joined'.
            // For now, if anyone connects to the room, we'll try to kick it off or at least fetch it.
            const updatedDebate = await debateService.startDebateTurnIfReady(debateId);

            // Broadcast the debate state so clients can sync
            io.to(`debate_${debateId}`).emit("debate:updated", updatedDebate);

        } catch (error) {
            logger.error("Failed to join debate room", { error: (error as Error).message });
            socket.emit("debate:error", { message: "Could not join debate room" });
        }
    });

    // 2. Handle sending a message during turn
    socket.on("debate:message", async (payload: MessagePayload) => {
        try {
            // Save into Mongoose (enforces turn validation)
            const updatedDebate = await debateService.saveMessage(
                payload.debateId,
                userId,
                payload.content
            );

            // Broadcast the specific new message to the room to save bandwidth?
            // Or just broadcast the full state/latest message. We'll emit the whole debate for simplicity here.
            io.to(`debate_${payload.debateId}`).emit("debate:updated", updatedDebate);
        } catch (error) {
            logger.error("Message rejected", { error: (error as Error).message });
            socket.emit("debate:error", { message: (error as Error).message });
        }
    });

    // 3. Handle ending a turn early
    socket.on("debate:end_turn", async (payload: { debateId: string }) => {
        try {
            const updatedDebate = await debateService.endTurn(payload.debateId);
            io.to(`debate_${payload.debateId}`).emit("debate:updated", updatedDebate);
        } catch (error) {
            logger.error("End turn failed", { error: (error as Error).message });
            socket.emit("debate:error", { message: (error as Error).message });
        }
    });

    // 4. Forfeit via manual button
    socket.on("debate:forfeit", async (payload: { debateId: string }) => {
        try {
            const updatedDebate = await debateService.forfeitDebate(payload.debateId, userId);
            io.to(`debate_${payload.debateId}`).emit("debate:updated", updatedDebate);
        } catch (error) {
            logger.error("Forfeit failed", { error: (error as Error).message });
        }
    });

    // Handle abrupt disconnects (socket closes)
    socket.on("disconnect", () => {
        // Technically we should figure out which rooms they were in and notify the opponent.
        // For this prototype, the frontend will just see them timeout their turn.
        logger.info("User disconnected from debate namespace", { userId });
    });
}
