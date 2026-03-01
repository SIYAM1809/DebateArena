"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Flag, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { IDebate, DebateStatus } from "@/lib/constants";
import { useAuth, getSocket } from "@/hooks/useAuth";
import { useDebateTimer } from "@/hooks/useDebateTimer";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function DebateRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { toast } = useToast();
    const debateId = params.id as string;

    // Local State
    const [debate, setDebate] = useState<IDebate | null>(null);
    const [input, setInput] = useState("");
    const [socketError, setSocketError] = useState("");
    const [flaggedMsgs, setFlaggedMsgs] = useState<Set<string>>(new Set());
    const [flagging, setFlagging] = useState<string | null>(null); // message id currently being flagged

    // Auto-scroll ref for chat window
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── HTTP FETCH ───
    const { isLoading, isError } = useQuery({
        queryKey: ["debate", debateId],
        queryFn: async () => {
            const res = await api.get<IDebate>(`/debates/${debateId}`);
            setDebate(res.data); // Seed local state
            return res.data;
        },
        enabled: !!debateId,
        refetchOnWindowFocus: false, // We rely on sockets for live updates
    });

    // ─── SOCKET CONNECTION ───
    useEffect(() => {
        if (!accessToken || !debateId) return;

        const socket = getSocket(accessToken);

        // Join the specific room
        socket.emit("debate:join", { debateId });

        // Listen for live state updates
        socket.on("debate:updated", (updatedDebate: IDebate) => {
            setDebate(updatedDebate);
            setSocketError("");
        });

        // Listen for errors (e.g., trying to chat out of turn)
        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
            // Clear error after 3 seconds
            setTimeout(() => setSocketError(""), 3000);
        });

        return () => {
            socket.off("debate:updated");
            socket.off("debate:error");
        };
    }, [accessToken, debateId]);

    // ─── CHAT AUTO-SCROLL ───
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debate?.messages]);

    // ─── TIMER HOOK ───
    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    // ─── DERIVED STATE ───
    // Figure out which side the current user is playing
    let mySide: "FOR" | "AGAINST" | null = null;

    if (debate && user) {
        if (debate.participants.FOR._id === user._id) {
            mySide = "FOR";
        } else if (debate.participants.AGAINST._id === user._id) {
            mySide = "AGAINST";
        }
    }

    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn;

    // ─── ACTIONS ───
    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;

        const socket = getSocket(accessToken);
        socket.emit("debate:message", {
            debateId,
            content: input.trim()
        });

        setInput(""); // clear input box immediately
    };

    const handlePassTurn = () => {
        if (!canType || !accessToken) return;
        getSocket(accessToken).emit("debate:end_turn", { debateId });
    };

    const handleForfeit = () => {
        if (confirm("Are you sure you want to forfeit this debate? You will instantly lose.") && accessToken) {
            getSocket(accessToken).emit("debate:forfeit", { debateId });
        }
    };

    const handleFlag = async (messageId: string) => {
        if (flagging || flaggedMsgs.has(messageId)) return;
        try {
            setFlagging(messageId);
            await api.patch(`/debates/${debateId}/messages/${messageId}/flag`);
            setFlaggedMsgs((prev) => new Set(prev).add(messageId));
            toast.success("Message flagged for review");
        } catch {
            toast.error("Failed to flag message");
        } finally {
            setFlagging(null);
        }
    };

    // ─── RENDER HELPERS ───
    if (isLoading || !debate) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                <Loader2 size={40} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        );
    }

    if (isError) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <h2 style={{ color: "var(--error)", marginBottom: "16px" }}>Failed to load debate</h2>
                <Button onClick={() => router.push("/topics")} variant="ghost">Back to matching</Button>
            </div>
        );
    }

    const totalSeconds = 60; // Hardcoded default duration per turn (matches backend)
    const progressPercent = (secondsLeft / totalSeconds) * 100;

    return (
        <div style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "20px",
            height: "calc(100vh - 80px)", // Assuming navbar is ~80px
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }}>
            {/* ── HEADER ── */}
            <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                            Round {debate.round}
                        </span>
                        <h1 style={{ fontSize: "1.5rem", marginTop: "4px" }}>{debate.topicId.title}</h1>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                        padding: "6px 12px",
                        borderRadius: "100px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        backgroundColor: debate.status === DebateStatus.ONGOING ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: debate.status === DebateStatus.ONGOING ? "var(--success)" : "var(--error)"
                    }}>
                        {debate.status}
                    </div>
                </div>

                {/* Progress Bar (Timer) */}
                {isOngoing && debate.currentTurn && (
                    <div style={{ marginTop: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 500 }}>
                            <span style={{ color: isMyTurn ? "var(--primary)" : "var(--text-muted)" }}>
                                {isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                            </span>
                            <span style={{ color: secondsLeft <= 10 ? "var(--error)" : "inherit" }}>
                                {secondsLeft}s remaining
                            </span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-secondary)", borderRadius: "100px", overflow: "hidden" }}>
                            <div
                                style={{
                                    height: "100%",
                                    width: `${progressPercent}%`,
                                    backgroundColor: secondsLeft <= 10 ? "var(--error)" : "var(--primary)",
                                    transition: "width 1s linear, background-color 0.3s ease"
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Winner Display */}
                {debate.winner && (
                    <div style={{
                        marginTop: "16px",
                        padding: "16px",
                        backgroundColor: debate.winner === mySide ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        borderRadius: "8px",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: debate.winner === mySide ? "var(--success)" : "var(--error)"
                    }}>
                        {debate.winner === mySide ? "🏆 YOU WON!" : "💀 YOU LOST"}
                    </div>
                )}
            </div>

            {/* ── CHAT WINDOW ── */}
            <div className="glass" style={{
                flex: 1,
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "8px" }}>
                    {debate.messages.length === 0 ? (
                        <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>
                            No messages yet. {debate.currentTurn === mySide ? "Start the debate!" : "Waiting for opponent..."}
                        </div>
                    ) : (
                        debate.messages.map((msg, i) => {
                            const isMine = msg.side === mySide;

                            return (
                                <div key={msg._id || i} style={{
                                    alignSelf: isMine ? "flex-end" : "flex-start",
                                    maxWidth: "80%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isMine ? "flex-end" : "flex-start"
                                }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", padding: "0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        {msg.sender.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        {/* Flag button — visible only on opponent's messages */}
                                        {!isMine && (
                                            <button
                                                onClick={() => msg._id && handleFlag(String(msg._id))}
                                                disabled={flagging === String(msg._id) || flaggedMsgs.has(String(msg._id)) || !!msg.flagged}
                                                title="Flag this message"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    color: (flaggedMsgs.has(String(msg._id)) || msg.flagged) ? "var(--error)" : "var(--text-muted)",
                                                    opacity: (flaggedMsgs.has(String(msg._id)) || msg.flagged) ? 1 : 0.5,
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                <Flag size={11} />
                                            </button>
                                        )}
                                    </span>

                                    <div style={{
                                        padding: "12px 16px",
                                        borderRadius: "16px",
                                        borderBottomRightRadius: isMine ? "4px" : "16px",
                                        borderBottomLeftRadius: !isMine ? "4px" : "16px",
                                        backgroundColor: isMine ? "var(--primary)" : "var(--bg-secondary)",
                                        color: isMine ? "white" : "var(--text-primary)",
                                        lineHeight: 1.5,
                                        position: "relative"
                                    }}>
                                        {msg.content}

                                        {/* AI Score Badge */}
                                        {msg.aiScore !== undefined && (
                                            <div
                                                title="AI Evaluated Argument Quality"
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-10px",
                                                    [isMine ? "left" : "right"]: "-10px",
                                                    backgroundColor: msg.aiScore > 75 ? "var(--success)" : msg.aiScore < 40 ? "var(--error)" : "var(--accent)",
                                                    color: "white",
                                                    fontSize: "0.7rem",
                                                    fontWeight: "bold",
                                                    padding: "2px 6px",
                                                    borderRadius: "100px",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                                }}
                                            >
                                                AI: {msg.aiScore}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {socketError && (
                    <div style={{ color: "var(--error)", fontSize: "0.85rem", marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <AlertCircle size={14} /> {socketError}
                    </div>
                )}
            </div>

            {/* ── INPUT BLOCK ── */}
            <div className="glass" style={{ padding: "16px", borderRadius: "var(--radius-lg)" }}>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "12px" }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={!canType}
                        placeholder={
                            !isOngoing ? "Debate has ended." :
                                isMyTurn ? "Type your argument..." : "Waiting for opponent's turn..."
                        }
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            backgroundColor: canType ? "var(--bg-primary)" : "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            outline: "none",
                            transition: "border-color var(--transition-fast)",
                            opacity: canType ? 1 : 0.6
                        }}
                        onFocus={(e) => {
                            if (canType) Object.assign(e.target.style, { borderColor: "var(--primary)" });
                        }}
                        onBlur={(e) => {
                            Object.assign(e.target.style, { borderColor: "var(--border)" });
                        }}
                    />

                    <Button
                        type="submit"
                        disabled={!canType || !input.trim()}
                        style={{ width: "50px", padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                    >
                        <Send size={18} />
                    </Button>
                </form>

                {/* Turn Controls */}
                {isOngoing && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleForfeit}
                            style={{ opacity: 0.8 }}
                        >
                            <Flag size={14} style={{ marginRight: "6px" }} /> Forfeit
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePassTurn}
                            disabled={!canType}
                        >
                            Pass Turn
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
