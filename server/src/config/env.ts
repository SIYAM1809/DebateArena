// This file runs at server startup and validates every required env var.
// If anything is missing, the server refuses to start — no silent failures.

import dotenv from "dotenv";
dotenv.config();

const REQUIRED_VARS = [
    "PORT",
    "MONGODB_URI",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CLIENT_URL",
];

function validateEnv(): void {
    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(
            `\n[ENV ERROR] Missing required environment variables:\n  ${missing.join("\n  ")}\n`
        );
        console.error("Copy .env.example to server/.env and fill in the values.\n");
        process.exit(1); // Kill the process — don't boot with broken config
    }
}

validateEnv();

// Export typed config object for safe use throughout the app
export const config = {
    port: parseInt(process.env.PORT || "8080", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    mongodbUri: process.env.MONGODB_URI as string,
    redis: {
        restUrl: process.env.UPSTASH_REDIS_REST_URL as string,
        restToken: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET as string,
        refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    },
    clientUrl: process.env.CLIENT_URL as string,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
        apiKey: process.env.CLOUDINARY_API_KEY || "",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    },
    email: {
        user: process.env.EMAIL_USER || "",
        appPassword: process.env.EMAIL_APP_PASSWORD || "",
    },
    huggingFaceToken: process.env.HUGGING_FACE_TOKEN || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
};
