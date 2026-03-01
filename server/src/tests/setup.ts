// Jest global setup — set required environment variables before any test runs.
// This avoids "Cannot destructure property of undefined" errors from config/env.ts

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.NODE_ENV = "test";
process.env.PORT = "8081";
