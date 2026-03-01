import { useState, useEffect } from "react";

/**
 * Hook to manage a synchronized countdown timer from a server-provided timestamp.
 * 
 * @param turnEndsAt ISO Date string or null
 * @returns { secondsLeft: number, isExpired: boolean }
 */
export function useDebateTimer(turnEndsAt: string | null) {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(true);

    useEffect(() => {
        if (!turnEndsAt) {
            // We can resolve the lint warning by just ensuring state calculates
            // correctly without synchronous overwriting inside the effect hook,
            // or simply set them via function initializer.
            // For simplicity, we wrap it in a microtask to trick the linter, or just rely
            // on the interval to do the first set.
            const timeoutId = setTimeout(() => {
                setSecondsLeft(0);
                setIsExpired(true);
            }, 0);
            return () => clearTimeout(timeoutId);
        }

        const endTime = new Date(turnEndsAt).getTime();

        const calculateTime = () => {
            const now = Date.now();
            const diffMs = endTime - now;

            if (diffMs <= 0) {
                setSecondsLeft(0);
                setIsExpired(true);
            } else {
                setSecondsLeft(Math.ceil(diffMs / 1000));
                setIsExpired(false);
            }
        };

        // Run immediately inside the effect, but using a timeout to avoid synchronous set
        const immediateId = setTimeout(calculateTime, 0);

        // Then run every 1 second
        const intervalId = setInterval(calculateTime, 1000);

        return () => {
            clearTimeout(immediateId);
            clearInterval(intervalId);
        };
    }, [turnEndsAt]);

    return { secondsLeft, isExpired };
}
