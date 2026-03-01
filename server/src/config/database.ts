// MongoDB connection using Mongoose with retry logic.
// The server will attempt to connect up to 5 times before giving up.
// This handles transient network issues at startup.

import mongoose from "mongoose";
import { config } from "./env";
import { logger } from "../utils/logger";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000; // Wait 3 seconds between attempts

export async function connectDatabase(): Promise<void> {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        try {
            attempts++;
            logger.info(`MongoDB: connecting (attempt ${attempts}/${MAX_RETRIES})...`);

            await mongoose.connect(config.mongodbUri, {
                // These options help with connection stability
                serverSelectionTimeoutMS: 5000, // Give up if can't select server in 5s
                socketTimeoutMS: 45000,         // Close socket after 45s inactivity
            });

            logger.info("MongoDB: connected successfully ✓");
            return; // Connection successful, stop retrying

        } catch (error) {
            logger.error(`MongoDB: connection attempt ${attempts} failed`, {
                error: (error as Error).message,
            });

            if (attempts >= MAX_RETRIES) {
                logger.error("MongoDB: all retry attempts exhausted. Shutting down.");
                process.exit(1); // Can't run without a database
            }

            logger.info(`MongoDB: retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

// Graceful disconnect — called on SIGTERM/SIGINT
export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    logger.info("MongoDB: disconnected.");
}
