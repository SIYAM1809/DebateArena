// Upstash Redis client initialization.
// Upstash provides a REST-based Redis — no persistent TCP connection needed.
// This is perfect for serverless/free-tier environments.

import { Redis } from "@upstash/redis";
import { config } from "./env";
import { logger } from "../utils/logger";

// Create the Redis client using REST URL + token (not a typical TCP connection)
export const redis = new Redis({
    url: config.redis.restUrl,
    token: config.redis.restToken,
});

// Test the connection at startup
export async function connectRedis(): Promise<void> {
    try {
        // PING is the standard Redis health check — returns "PONG" if alive
        const result = await redis.ping();
        if (result === "PONG") {
            logger.info("Redis (Upstash): connected successfully ✓");
        } else {
            throw new Error(`Unexpected PING response: ${result}`);
        }
    } catch (error) {
        logger.error("Redis: connection failed", {
            error: (error as Error).message,
        });
        // Don't hard-exit here — matchmaking will degrade gracefully,
        // but we still want to know it failed
        throw error;
    }
}
