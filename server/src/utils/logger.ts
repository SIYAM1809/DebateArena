// Winston logger — structured JSON logging with timestamps.
// Usage: import { logger } from '../utils/logger';
//        logger.info('Server started', { port: 8080 });
//        logger.error('DB connection failed', { error: err.message });

import winston from "winston";
import { config } from "../config/env";

const { combine, timestamp, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
    // Log everything in production, only 'warn' and above in... wait, opposite:
    // In development, log everything (debug). In production, info and above.
    level: config.nodeEnv === "production" ? "info" : "debug",

    // JSON format — machine-readable, great for log aggregators
    format: combine(timestamp(), json()),

    transports: [
        // Always write to console
        new winston.transports.Console({
            // In development: colorized human-readable format
            // In production: pure JSON
            format:
                config.nodeEnv === "development" ? combine(colorize(), simple()) : combine(timestamp(), json()),
        }),
    ],
});
