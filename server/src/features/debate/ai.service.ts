import { config } from "../../config/env";
import { logger } from "../../utils/logger";

/**
 * Argument Evaluation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Google Gemini (gemini-2.0-flash) to grade debate argument quality.
 *
 * TEACHING NOTE — Why Gemini over HuggingFace sentiment analysis?
 *   DistilBERT measures SENTIMENT (positive/negative language tone).
 *   That's a terrible proxy for argument quality — a polite but weak argument
 *   scores high, a blunt but logical argument scores low.
 *   Gemini is an LLM — it can actually read the argument, understand what
 *   it's saying, and judge its logical strength. That's a real judge.
 *
 * API used: Gemini REST API (no SDK needed — plain fetch works fine)
 * Model: gemini-2.0-flash — free tier, extremely fast, 15 req/min
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const SCORING_MODEL = "gemini-2.0-flash";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string | null> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    const url = `${GEMINI_API_BASE}/${SCORING_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,   // Lower = more deterministic scores
                maxOutputTokens: 64, // Scores + brief rationale, nothing more
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        logger.warn("Gemini API error", { status: response.status, error: err });
        return null;
    }

    const data = (await response.json()) as GeminiResponse;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Grades a debate argument from 1-100 using Gemini.
 *
 * Scoring criteria (communicated to Gemini in the prompt):
 *   - Logical strength: Is there a clear reasoning chain?
 *   - Evidence quality: Are claims supported, or just assertions?
 *   - Relevance: Does it stay on topic?
 *   - Clarity: Is it easy to follow?
 *
 * Returns null if Gemini is unavailable (no API key, rate limit, network error).
 * The caller should treat null as "no score available" and skip displaying the badge.
 */
export async function evaluateArgument(content: string): Promise<number | null> {
    if (!config.geminiApiKey) {
        logger.warn("GEMINI_API_KEY not set — skipping argument scoring.");
        return null;
    }

    const prompt = `You are an impartial debate judge. Score the following debate argument from 1 to 100 based on:
- Logical strength (is there a clear reasoning chain?)
- Evidence quality (are claims supported, not just asserted?)
- Relevance (does it stay on topic?)
- Clarity (easy to follow?)

Reply with ONLY a single integer from 1 to 100. No explanation, no punctuation, just the number.

Argument:
"${content.slice(0, 800)}"`;

    try {
        const raw = await callGemini(prompt);
        if (!raw) return null;

        // Extract first number found in the response (handles "Score: 78" etc.)
        const match = raw.match(/\d+/);
        if (!match) return null;

        const score = parseInt(match[0], 10);

        // Clamp to valid range in case Gemini doesn't listen
        return Math.max(1, Math.min(100, score));
    } catch (error) {
        logger.error("evaluateArgument failed", { error: (error as Error).message });
        return null;
    }
}

/**
 * Generates a contextual counter-argument using Gemini.
 * Called by solo.service.ts to produce the bot's reply.
 *
 * @param topicTitle  - The debate topic title (e.g. "Governments should regulate AI")
 * @param userMessage - The user's most recent argument
 * @param context     - Optional: the recent conversation history for context
 * @returns A fresh, on-topic counter-argument string, or null on failure
 */
export async function generateBotReply(
    topicTitle: string,
    userMessage: string,
    context?: string
): Promise<string | null> {
    if (!config.geminiApiKey) return null;

    const contextSection = context
        ? `\nRecent debate so far:\n${context}\n`
        : "";

    const prompt = `You are a skilled, concise debate opponent arguing AGAINST the following position:
"${topicTitle}"
${contextSection}
The opponent just said:
"${userMessage.slice(0, 600)}"

Write ONE sharp counter-argument in 2-4 sentences (≤120 words). 
Rules:
- Directly address what the opponent said — do not give a generic argument
- No opening phrases like "I disagree", "However", "Actually", or "That's interesting"
- No ending filler. Just the argument itself.
- Stay factual and logical. No emotional hyperbole.`;

    try {
        const reply = await callGemini(prompt);
        return reply || null;
    } catch (error) {
        logger.error("generateBotReply failed", { error: (error as Error).message });
        return null;
    }
}
