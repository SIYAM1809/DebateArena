"use client";

// Matchmaking Queue Modal
// Overlays the screen when a user joins a queue. It blocks interactions,
// shows an animated searching state, and listens for the "match:found" socket event.
// When found, it shows an opponent found state, then redirects to the debate room.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Swords, X } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";

export interface QueueState {
    topicId: string;
    topicTitle: string;
    side: "FOR" | "AGAINST" | "RANDOM";
}

interface MatchmakingQueueProps {
    queueState: QueueState | null;
    onCancel: () => void;
}

export default function MatchmakingQueue({ queueState, onCancel }: MatchmakingQueueProps) {
    const router = useRouter();

    // "searching" -> looking for opponent
    // "found" -> match found, showing pre-game screen
    // "connecting" -> redirecting to debate room
    const [status, setStatus] = useState<"searching" | "found" | "connecting">("searching");

    // The side we actually play (if we requested RANDOM, the server tells us our side)
    const [assignedSide, setAssignedSide] = useState<"FOR" | "AGAINST" | null>(null);

    useEffect(() => {
        if (!queueState) return;

        // Microtask approach to avoid sync setState in effect linter warnings
        const timeoutId = setTimeout(() => {
            setStatus("searching");
            setAssignedSide(null);
        }, 0);

        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) return; // Should never happen if user is on this page

        const socket = getSocket(accessToken);

        // 1. Send join request to server
        socket.emit("match:join", {
            topicId: queueState.topicId,
            side: queueState.side,
        });

        // 2. Listen for success
        const handleMatchFound = (payload: { debateId: string; opponentId: string; side: "FOR" | "AGAINST" }) => {
            setStatus("found");
            setAssignedSide(payload.side);

            // Play a sound (optional UX enhancement)
            try {
                const audio = new Audio('/match-found.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { }); // Catch browser auto-play blocks
            } catch {
                // Ignore audio errors
            }

            // Wait 3 seconds to show the "Match Found!" screen, then redirect
            setTimeout(() => {
                setStatus("connecting");
                router.push(`/debate/${payload.debateId}`);
            }, 3000);
        };

        // 3. Listen for errors
        const handleError = (payload: { message: string }) => {
            alert(`Matchmaking error: ${payload.message}`);
            onCancel();
        };

        socket.on("match:found", handleMatchFound);
        socket.on("match:error", handleError);

        // Cleanup: if component unmounts while searching, cancel match automatically
        return () => {
            clearTimeout(timeoutId);
            socket.off("match:found", handleMatchFound);
            socket.off("match:error", handleError);

            // If we unmount and we were still searching, tell server we left
            // (Using a closure variable to check current state isn't perfectly reliable
            // in useEffect cleanup, but the server handles disconnects/timeouts anyway)
            socket.emit("match:cancel", {
                topicId: queueState.topicId,
                side: queueState.side,
            });
        };
    }, [queueState, router, onCancel]);

    const handleManualCancel = () => {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) return;
        const socket = getSocket(accessToken);
        socket.emit("match:cancel", {
            topicId: queueState!.topicId,
            side: queueState!.side,
        });
        onCancel();
    };

    if (!queueState) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
            className="fade-in"
        >
            <div
                className="glass"
                style={{
                    width: "90%",
                    maxWidth: "500px",
                    padding: "40px",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Animated background glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "200px", height: "200px",
                        background: status === "found" || status === "connecting"
                            ? "radial-gradient(circle, var(--success) 0%, transparent 70%)"
                            : "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
                        opacity: 0.15,
                        filter: "blur(40px)",
                        transition: "background 1s ease",
                    }}
                />

                {status === "searching" ? (
                    // ── SEARCHING STATE ──
                    <div className="fade-in" style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
                            <Loader2 size={64} color="var(--primary)" className="animate-spin" />
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50%", left: "50%",
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <Swords size={24} color="var(--text-primary)" />
                            </div>
                        </div>

                        <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Finding Opponent</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                            Topic: <strong>{queueState.topicTitle}</strong>
                        </p>
                        <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
                            Side: {" "}
                            <span
                                style={{
                                    color: queueState.side === "FOR" ? "var(--success)"
                                        : queueState.side === "AGAINST" ? "var(--warning)"
                                            : "var(--primary)"
                                }}
                            >
                                {queueState.side}
                            </span>
                        </p>

                        <Button variant="ghost" onClick={handleManualCancel}>
                            <X size={16} /> Cancel Search
                        </Button>
                    </div>
                ) : (
                    // ── FOUND / CONNECTING STATE ──
                    <div className="fade-in" style={{ position: "relative", zIndex: 1, padding: "20px 0" }}>
                        <div
                            style={{
                                width: "80px", height: "80px",
                                borderRadius: "50%",
                                background: "rgba(34, 197, 94, 0.15)",
                                border: "2px solid var(--success)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 24px",
                                boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
                            }}
                        >
                            <Swords size={36} color="var(--success)" />
                        </div>

                        <h2 style={{ fontSize: "2rem", color: "var(--success)", marginBottom: "8px" }}>
                            Match Found!
                        </h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "16px" }}>
                            You are defending: <strong style={{
                                color: assignedSide === "FOR" ? "var(--success)" : "var(--warning)"
                            }}>{assignedSide}</strong>
                        </p>

                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "20px" }}>
                            {status === "connecting" ? "Entering arena..." : "Preparing room..."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
