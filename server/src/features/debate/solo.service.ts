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
import { Debate, DebateStatus, IDebate } from "../../models/Debate";
import Topic from "../../models/Topic";
import { NotFoundError } from "../../utils/errors";
import { evaluateArgument } from "./ai.service";
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

/**
 * Creates a new solo debate session.
 *
 * Steps:
 *  1. Fetch the topic so we know its category (used for bot argument selection).
 *  2. Create a Debate document — user plays FOR, bot plays AGAINST.
 *  3. Set status to ONGOING immediately (no waiting for a second human).
 *  4. Return the debate.
 *
 * The returned debate has isSolo=true appended (via the lean transform in the route)
 * so the frontend can reliably distinguish solo from live sessions.
 */
export async function startSoloSession(
    userId: string,
    topicId: string
): Promise<IDebate> {
    // 1. Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) throw new NotFoundError("Topic not found");

    // 2. Create the debate document
    //    - _id is a UUID string (same pattern as live matchmaking)
    //    - participants.FOR = real user (always goes first in solo)
    //    - participants.AGAINST = BOT_USER_ID
    const debateId = uuidv4();

    const debate = new Debate({
        _id: debateId,
        topicId,
        participants: {
            FOR: new mongoose.Types.ObjectId(userId),
            AGAINST: BOT_USER_ID,
        },
        status: DebateStatus.ONGOING,   // Solo starts immediately
        currentTurn: "FOR",              // User goes first
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
 * Steps:
 *  1. Fetch the debate and its topic.
 *  2. Pick a canned argument matching the topic category and bot's side (AGAINST).
 *  3. Score it with the HuggingFace API (same pipeline as real messages).
 *  4. Push the message into the debate, then call endTurn() to advance state.
 *
 * TEACHING NOTE — Why call evaluateArgument() for the bot?
 *   Because we want real AI scores on both sides of the debate.
 *   A hiring manager looking at the transcript will see scores on every message —
 *   this makes the feature feel complete and production-grade, not faked.
 */
export async function submitBotTurn(debateId: string): Promise<IDebate> {
    // ── Step 1: Fetch the debate document (no populate needed here) ──
    const debate = await Debate.findById(debateId);
    if (!debate) throw new NotFoundError("Debate not found");

    // Safety guard: only proceed if it's actually the bot's turn
    if (debate.currentTurn !== "AGAINST" || debate.status !== DebateStatus.ONGOING) {
        return debate;
    }

    // ── Step 2: Look up the topic category directly ──
    // We do a separate Topic.findById() instead of relying on populate+lean,
    // because the populate typing can silently fail (still returns ObjectId),
    // which caused the category to always fall back to "Technology".
    const topic = await Topic.findById(debate.topicId).lean<{ category: string }>();
    const category = topic?.category ?? "Technology";

    const argument = pickBotArgument(category, "AGAINST");

    // ── Step 3: Score the argument via HuggingFace ──
    const aiScore = await evaluateArgument(argument);

    // ── Step 4: Save bot message ──
    debate.messages.push({
        sender: BOT_USER_ID as unknown as mongoose.Types.ObjectId,
        side: "AGAINST",
        content: argument,
        createdAt: new Date(),
        aiScore: aiScore ?? undefined,
    });

    await debate.save();

    // ── Step 5: Advance turn via shared service ──
    const updatedDebate = await endTurn(debateId);
    return updatedDebate;
}

