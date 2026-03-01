import "./config/env";
import { createServer } from "http";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { initSocket } from "./socket";
import { logger } from "./utils/logger";
import { config } from "./config/env";

async function bootstrap(): Promise<void> {
    await connectDatabase();
    await connectRedis();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
        logger.info(`DebateArena server running`, {
            port: config.port,
            env: config.nodeEnv,
            url: `http://localhost:${config.port}`,
        });
        logger.info(`Health check: http://localhost:${config.port}/health`);
    });

    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);
        httpServer.close(async () => {
            await disconnectDatabase();
            logger.info("Server closed cleanly.");
            process.exit(0);
        });

        setTimeout(() => {
            logger.error("Forced shutdown — graceful shutdown timed out");
            process.exit(1);
        }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
        logger.error("Unhandled promise rejection", { reason });
        process.exit(1);
    });
}

bootstrap().catch((err) => {
    logger.error("Server failed to start", { error: (err as Error).message });
    process.exit(1);
});
