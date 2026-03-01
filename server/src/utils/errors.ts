// Custom error classes — subclass Error with HTTP status codes.
// This lets the global error handler in app.ts automatically pick the right HTTP status.
//
// Usage:
//   throw new NotFoundError('Debate not found');        → 404
//   throw new UnauthorizedError('Invalid token');       → 401
//   throw new ValidationError('Email is required');     → 400
//   throw new AppError('Something broke', 500);         → 500

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean; // true = expected/safe errors, false = programming bugs

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        // Maintains proper stack trace (V8 only)
        Error.captureStackTrace(this, this.constructor);
    }
}

// 400 — Client sent bad data
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

// 401 — Not authenticated (no token or invalid token)
export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

// 403 — Authenticated but not allowed (e.g. non-admin hitting admin route)
export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

// 404 — Resource not found
export class NotFoundError extends AppError {
    constructor(message: string = "Not found") {
        super(message, 404);
    }
}

// 409 — Conflict (e.g. duplicate email on register)
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
