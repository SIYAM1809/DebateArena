// Unit tests for custom error classes in src/utils/errors.ts
// Tests verify: correct HTTP status, correct class name, isOperational flag.

import {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
} from "../utils/errors";

describe("AppError", () => {
    it("defaults to status 500", () => {
        const err = new AppError("something broke");
        expect(err.statusCode).toBe(500);
        expect(err.isOperational).toBe(true);
        expect(err.message).toBe("something broke");
    });

    it("accepts a custom status code", () => {
        const err = new AppError("custom", 418);
        expect(err.statusCode).toBe(418);
    });

    it("is an instance of Error", () => {
        expect(new AppError("x")).toBeInstanceOf(Error);
    });
});

describe("ValidationError", () => {
    it("has status 400", () => {
        const err = new ValidationError("email required");
        expect(err.statusCode).toBe(400);
        expect(err.name).toBe("ValidationError");
        expect(err.isOperational).toBe(true);
    });
});

describe("UnauthorizedError", () => {
    it("has status 401 and default message", () => {
        const err = new UnauthorizedError();
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe("Unauthorized");
    });

    it("accepts custom message", () => {
        const err = new UnauthorizedError("Token expired");
        expect(err.message).toBe("Token expired");
    });
});

describe("ForbiddenError", () => {
    it("has status 403", () => {
        const err = new ForbiddenError();
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Forbidden");
    });
});

describe("NotFoundError", () => {
    it("has status 404", () => {
        const err = new NotFoundError("Debate not found");
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe("Debate not found");
    });

    it("has default message", () => {
        expect(new NotFoundError().message).toBe("Not found");
    });
});

describe("ConflictError", () => {
    it("has status 409", () => {
        const err = new ConflictError("Email already exists");
        expect(err.statusCode).toBe(409);
        expect(err.name).toBe("ConflictError");
    });
});
