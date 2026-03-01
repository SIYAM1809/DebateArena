// Unit tests for src/features/debate/debate.service.ts
// Uses jest.mock factory approach for clean Mongoose model mocking.

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockFindById = jest.fn();
const mockSave = jest.fn().mockResolvedValue(true);

jest.mock("../../models/Debate", () => ({
    __esModule: true,
    Debate: {
        findById: mockFindById,
        find: jest.fn(),
        aggregate: jest.fn(),
    },
}));

jest.mock("./ai.service", () => ({
    evaluateArgument: jest.fn().mockResolvedValue(75),
}));

jest.mock("../../utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { getDebateById, flagMessage } from "./debate.service";
import { NotFoundError, AppError } from "../../utils/errors";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fakeDebate(msgIdOverride?: mongoose.Types.ObjectId) {
    const msgId = msgIdOverride ?? new mongoose.Types.ObjectId();
    return {
        _id: "debate123",
        status: "ONGOING",
        participants: { FOR: "user1", AGAINST: "user2" },
        messages: [
            {
                _id: msgId,
                sender: "user1",
                side: "FOR",
                content: "AI is good",
                flagged: false,
                aiScore: 80,
                createdAt: new Date(),
            },
        ],
        save: mockSave,
    };
}

// ─── getDebateById ────────────────────────────────────────────────────────────

describe("getDebateById", () => {
    beforeEach(() => jest.clearAllMocks());

    it("throws NotFoundError when debate does not exist", async () => {
        // Build a chainable mock: each .populate() returns an object with another .populate()
        // The last one resolves to null (not found)
        const leaf = { populate: jest.fn().mockResolvedValue(null) };
        const level3 = { populate: jest.fn().mockReturnValue(leaf) };
        const level2 = { populate: jest.fn().mockReturnValue(level3) };
        const level1 = { populate: jest.fn().mockReturnValue(level2) };
        mockFindById.mockReturnValue(level1);

        await expect(getDebateById("bad_id")).rejects.toBeInstanceOf(NotFoundError);
    });
});


// ─── flagMessage ──────────────────────────────────────────────────────────────

describe("flagMessage", () => {
    beforeEach(() => jest.clearAllMocks());

    it("throws NotFoundError when debate is not found", async () => {
        mockFindById.mockResolvedValue(null);
        await expect(flagMessage("bad_debate", "any_msg")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws AppError when message ID does not exist in the debate", async () => {
        const debate = fakeDebate();
        mockFindById.mockResolvedValue(debate);

        // Use a random ObjectId that definitely doesn't match
        const wrongId = new mongoose.Types.ObjectId().toString();
        await expect(flagMessage("debate123", wrongId)).rejects.toBeInstanceOf(AppError);
    });

    it("sets flagged=true and returns { ok: true } for a valid message ID", async () => {
        const msgId = new mongoose.Types.ObjectId();
        const debate = fakeDebate(msgId);
        mockFindById.mockResolvedValue(debate);

        const result = await flagMessage("debate123", msgId.toString());

        expect(result).toEqual({ ok: true });
        expect(debate.messages[0].flagged).toBe(true);
        expect(mockSave).toHaveBeenCalledTimes(1);
    });
});
