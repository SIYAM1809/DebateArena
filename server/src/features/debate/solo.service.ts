/**
 * Solo Practice Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the lifecycle of a solo debate session (user vs. AI bot).
 *
 * TEACHING NOTE — Why does the bot need a fake ObjectId?
 *   The Debate schema has two required fields: participants.FOR and participants.AGAINST,
 *   both typed as ObjectId references to the User collection.
 *   MongoDB will accept any ObjectId even if no matching User document exists.
 *   So we use a well-known constant ("000000000000000000000001") as the bot's identity.
 *   The frontend knows to render "🤖 AI Bot" whenever it sees this ID.
 */

import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { Debate, DebateStatus, IDebate, AiSource } from "../../models/Debate";
import Topic from "../../models/Topic";
import { NotFoundError } from "../../utils/errors";
import { evaluateArgument, generateBotReply } from "./ai.service";
import { pickBotArgument } from "./botArguments";
import { endTurn } from "./debate.service";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/**
 * A reserved, well-known ObjectId that we always use for the bot.
 * No real User document with this ID needs to exist.
 * The frontend checks against this to display "🤖 AI Bot" instead of a username.
 */
export const BOT_USER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

/** How long each user turn lasts in milliseconds (90s — more generous than live debates) */
const USER_TURN_DURATION_MS = 90_000;

// ─── START SESSION ─────────────────────────────────────────────────────────────

export async function startSoloSession(
    userId: string,
    topicId: string
): Promise<IDebate> {
    const topic = await Topic.findById(topicId);
    if (!topic) throw new NotFoundError("Topic not found");

    const debateId = uuidv4();

    const debate = new Debate({
        _id: debateId,
        topicId,
        participants: {
            FOR: new mongoose.Types.ObjectId(userId),
            AGAINST: BOT_USER_ID,
        },
        status: DebateStatus.ONGOING,
        currentTurn: "FOR",
        turnEndsAt: new Date(Date.now() + USER_TURN_DURATION_MS),
        round: 1,
        messages: [],
        winner: null,
    });

    await debate.save();
    return debate;
}

// ─── BOT TURN ─────────────────────────────────────────────────────────────────

/**
 * Executes the bot's turn for a given debate.
 *
 * Flow:
 *  1. Fetch the debate document.
 *  2. Look up the topic title + category.
 *  3. Try to generate a Gemini reply (contextual, references the user's last message).
 *     Falls back to a canned argument if Gemini is unavailable.
 *  4. Score the bot's argument with Gemini (same pipeline as user messages).
 *  5. Save and advance the turn.
 *
 * TEACHING NOTE — Why does the bot also get scored?
 *   Because we want real AI scores on BOTH sides of the debate.
 *   A hiring manager looking at the transcript sees scores on every message —
 *   this makes the feature feel complete and production-grade, not faked.
 */
export async function submitBotTurn(
    debateId: string,
    preferredModel: "gemini" | "canned" = "gemini"
): Promise<IDebate> {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    if (debate.currentTurn !== "AGAINST" || debate.status !== DebateStatus.ONGOING) {
        return debate;
    }

    const topic = await Topic.findById(debate.topicId).lean<{ title: string; category: string }>();
    const topicTitle = topic?.title ?? "the debate topic";
    const category = topic?.category ?? "Technology";

    const recentMessages = debate.messages.slice(-4);
    const conversationContext = recentMessages
        .map(m => { const role = m.side === "FOR" ? "User" : "Bot"; return `${role}: ${m.content}`; })
        .join("\n");
    const userLastMessage = recentMessages.filter(m => m.side === "FOR").at(-1)?.content ?? "";

    // ── Generate reply, respecting the user's preferred model ──
    let argument: string;
    let aiSource: AiSource = "canned";

    if (preferredModel === "gemini") {
        // Try Gemini; fall through to canned on any failure
        const geminiReply = await generateBotReply(topicTitle, userLastMessage, conversationContext);
        if (geminiReply) {
            argument = geminiReply;
            aiSource = "gemini";
        } else {
            argument = pickBotArgument(category, "AGAINST");
            aiSource = "canned"; // Gemini unavailable or key not set — fell back
        }
    } else {
        argument = pickBotArgument(category, "AGAINST");
        aiSource = "canned";
    }

    const scoreValue = await evaluateArgument(argument);

    debate.messages.push({
        sender: BOT_USER_ID as unknown as mongoose.Types.ObjectId,
        side: "AGAINST",
        content: argument,
        createdAt: new Date(),
        aiScore: scoreValue ?? undefined,
        aiSource,          // ← stored so UI can display which AI replied
    });

    await debate.save();
    return await endTurn(debateId);
}

