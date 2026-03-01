// Unit tests for src/features/auth/auth.service.ts
// Uses jest.mock factory to fully control User model behaviour.

// ─── MOCKS (must be before all imports) ──────────────────────────────────────

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findOne: mockFindOne,
        create: mockCreate,
    },
}));

jest.mock("../../config/redis", () => ({
    redis: {
        set: jest.fn().mockResolvedValue("OK"),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
    },
}));

jest.mock("../../utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import { registerUser, loginUser } from "./auth.service";
import { ConflictError, UnauthorizedError } from "../../utils/errors";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fakeUser(overrides: Record<string, unknown> = {}) {
    return {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "$2b$12$fakehashedfakehashedfakeha",
        role: "user",
        avatar: null,
        stats: { wins: 0, losses: 0, draws: 0, forfeits: 0, totalDebates: 0, avgScore: 0 },
        createdAt: new Date(),
        isBanned: false,
        ...overrides,
    };
}

// ─── registerUser ─────────────────────────────────────────────────────────────

describe("registerUser", () => {
    beforeEach(() => jest.clearAllMocks());

    it("throws ConflictError when email is already taken", async () => {
        mockFindOne.mockResolvedValueOnce(fakeUser()); // email lookup hits
        await expect(
            registerUser("newuser", "taken@example.com", "Password1!")
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("throws ConflictError when username is already taken", async () => {
        mockFindOne
            .mockResolvedValueOnce(null)        // email → free
            .mockResolvedValueOnce(fakeUser()); // username → taken
        await expect(
            registerUser("taken", "new@example.com", "Password1!")
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("returns accessToken + refreshToken and omits passwordHash on success", async () => {
        mockFindOne.mockResolvedValue(null);     // all unique
        mockCreate.mockResolvedValue(fakeUser());

        const result = await registerUser("testuser", "test@example.com", "Password1!");

        expect(typeof result.accessToken).toBe("string");
        expect(typeof result.refreshToken).toBe("string");
        expect(result.user).not.toHaveProperty("passwordHash");
        expect(result.user).toHaveProperty("username", "testuser");
    });
});

// ─── loginUser ────────────────────────────────────────────────────────────────

describe("loginUser", () => {
    beforeEach(() => jest.clearAllMocks());

    it("throws UnauthorizedError when no user matches the email", async () => {
        mockFindOne.mockResolvedValue(null);
        await expect(
            loginUser("ghost@example.com", "anypassword")
        ).rejects.toBeInstanceOf(UnauthorizedError);
    });
});
