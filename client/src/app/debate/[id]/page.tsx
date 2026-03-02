"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Flag, Loader2, AlertCircle, SkipForward, Swords, LogOut, Star } from "lucide-react";
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

    const [debate, setDebate] = useState<IDebate | null>(null);
    const [input, setInput] = useState("");
    const [socketError, setSocketError] = useState("");
    const [flaggedMsgs, setFlaggedMsgs] = useState<Set<string>>(new Set());
    const [flagging, setFlagging] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { isLoading, isError } = useQuery({
        queryKey: ["debate", debateId],
        queryFn: async () => {
            const res = await api.get<IDebate>(`/debates/${debateId}`);
            setDebate(res.data);
            return res.data;
        },
        enabled: !!debateId,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!accessToken || !debateId) return;
        const socket = getSocket(accessToken);
        socket.emit("debate:join", { debateId });
        socket.on("debate:updated", (d: IDebate) => { setDebate(d); setSocketError(""); });
        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
            setTimeout(() => setSocketError(""), 3000);
        });
        return () => { socket.off("debate:updated"); socket.off("debate:error"); };
    }, [accessToken, debateId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debate?.messages]);

    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    let mySide: "FOR" | "AGAINST" | null = null;
    if (debate && user) {
        if (debate.participants.FOR._id === user._id) mySide = "FOR";
        else if (debate.participants.AGAINST._id === user._id) mySide = "AGAINST";
    }

    const opponentSide = mySide === "FOR" ? "AGAINST" : "FOR";
    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn;
    const totalSeconds = 60;
    const progressPercent = Math.max(0, (secondsLeft / totalSeconds) * 100);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;
        getSocket(accessToken).emit("debate:message", { debateId, content: input.trim() });
        setInput("");
    };

    const handlePassTurn = () => {
        if (!canType || !accessToken) return;
        getSocket(accessToken).emit("debate:end_turn", { debateId });
    };

    const handleForfeit = () => {
        if (confirm("Forfeit this debate? You will instantly lose.") && accessToken) {
            getSocket(accessToken).emit("debate:forfeit", { debateId });
        }
    };

    const handleFlag = async (messageId: string) => {
        if (flagging || flaggedMsgs.has(messageId)) return;
        try {
            setFlagging(messageId);
            await api.patch(`/debates/${debateId}/messages/${messageId}/flag`);
            setFlaggedMsgs(prev => new Set(prev).add(messageId));
            toast.success("Message flagged for review");
        } catch { toast.error("Failed to flag message"); }
        finally { setFlagging(null); }
    };

    if (isLoading || !debate) return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: "16px" }}>
            <Loader2 size={40} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading debate room…</p>
        </div>
    );

    if (isError) return (
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h2 style={{ color: "var(--error)", marginBottom: "16px" }}>Debate not found</h2>
            <Button onClick={() => router.push("/topics")} variant="ghost">Back to Topics</Button>
        </div>
    );

    const forPlayer = debate.participants.FOR;
    const againstPlayer = debate.participants.AGAINST;
    const isCompleted = debate.status === DebateStatus.COMPLETED || debate.status === DebateStatus.FORFEITED;

    // Calculate per-player cumulative AI scores
    const forScore = debate.messages.filter(m => m.side === "FOR" && m.aiScore).reduce((acc, m) => acc + (m.aiScore ?? 0), 0);
    const againstScore = debate.messages.filter(m => m.side === "AGAINST" && m.aiScore).reduce((acc, m) => acc + (m.aiScore ?? 0), 0);
    const forCount = debate.messages.filter(m => m.side === "FOR" && m.aiScore).length;
    const againstCount = debate.messages.filter(m => m.side === "AGAINST" && m.aiScore).length;
    const forAvg = forCount > 0 ? Math.round(forScore / forCount) : null;
    const againstAvg = againstCount > 0 ? Math.round(againstScore / againstCount) : null;

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "16px 20px 20px", height: "calc(100vh - 72px)", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* ── TOPIC HEADER ── */}
            <div style={{
                padding: "16px 20px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(34,211,238,0.06) 100%)",
                border: "1px solid rgba(139,92,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <Swords size={18} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--primary)", marginBottom: "2px" }}>
                            Round {debate.round} of 3
                        </div>
                        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{debate.topicId.title}</h1>
                    </div>
                </div>

                {/* Status pill */}
                <div style={{
                    padding: "5px 14px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                    letterSpacing: "0.5px", textTransform: "uppercase",
                    background: isOngoing ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)",
                    color: isOngoing ? "var(--success)" : "var(--primary)",
                    border: isOngoing ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(139,92,246,0.25)",
                }}>
                    {isOngoing ? "● Live" : debate.status}
                </div>
            </div>

            {/* ── PLAYER CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
                {/* FOR player */}
                <PlayerCard
                    username={forPlayer.username}
                    side="FOR"
                    isMe={mySide === "FOR"}
                    isCurrentTurn={debate.currentTurn === "FOR"}
                    isOngoing={isOngoing}
                    avgScore={forAvg}
                    winner={debate.winner}
                />

                {/* VS divider */}
                <div style={{ textAlign: "center", fontWeight: 900, fontSize: "0.9rem", color: "var(--text-muted)", letterSpacing: "2px" }}>VS</div>

                {/* AGAINST player */}
                <PlayerCard
                    username={againstPlayer.username}
                    side="AGAINST"
                    isMe={mySide === "AGAINST"}
                    isCurrentTurn={debate.currentTurn === "AGAINST"}
                    isOngoing={isOngoing}
                    avgScore={againstAvg}
                    winner={debate.winner}
                />
            </div>

            {/* ── TIMER BAR ── */}
            {isOngoing && debate.currentTurn && (
                <div style={{
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{
                            fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                            color: isMyTurn ? "var(--primary)" : "var(--text-muted)",
                            display: "flex", alignItems: "center", gap: "6px",
                        }}>
                            <span style={{
                                width: "6px", height: "6px", borderRadius: "50%",
                                background: isMyTurn ? "var(--primary)" : "var(--text-muted)",
                                display: "inline-block",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            {isMyTurn ? "Your Turn" : `${debate.currentTurn === "FOR" ? forPlayer.username : againstPlayer.username}'s Turn`}
                        </span>
                        {isMyTurn && (
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: secondsLeft <= 10 ? "var(--error)" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                                {secondsLeft}s
                            </span>
                        )}
                    </div>
                    <div style={{ height: "4px", borderRadius: "100px", background: "var(--bg-elevated)", overflow: "hidden" }}>
                        <div style={{
                            height: "100%",
                            width: isMyTurn ? `${progressPercent}%` : "100%",
                            borderRadius: "100px",
                            background: secondsLeft <= 10
                                ? "linear-gradient(90deg, var(--error), #ff6b6b)"
                                : "linear-gradient(90deg, var(--primary), var(--accent))",
                            transition: isMyTurn ? "width 1s linear" : "none",
                            opacity: isMyTurn ? 1 : 0.3,
                        }} />
                    </div>
                </div>
            )}

            {/* ── RESULT BANNER ── */}
            {isCompleted && (
                <ResultBanner winner={debate.winner} mySide={mySide} onBack={() => router.push("/topics")} />
            )}

            {/* ── CHAT WINDOW ── */}
            <div style={{
                flex: 1,
                borderRadius: "16px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                {/* Round label inside chat */}
                {debate.round > 1 && (
                    <div style={{ textAlign: "center", padding: "10px", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Round {debate.round}
                    </div>
                )}

                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {debate.messages.length === 0 ? (
                        <EmptyChat isMyTurn={!!isMyTurn} opponentName={opponentSide === "FOR" ? forPlayer.username : againstPlayer.username} />
                    ) : (
                        debate.messages.map((msg, i) => {
                            const isMine = msg.side === mySide;
                            return (
                                <MessageBubble
                                    key={msg._id || i}
                                    content={msg.content}
                                    username={msg.sender.username}
                                    timestamp={msg.createdAt}
                                    isMine={isMine}
                                    side={msg.side}
                                    aiScore={msg.aiScore}
                                    flagged={!!msg.flagged || flaggedMsgs.has(String(msg._id))}
                                    flagging={flagging === String(msg._id)}
                                    onFlag={() => msg._id && handleFlag(String(msg._id))}
                                    showFlag={!isMine}
                                />
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {socketError && (
                    <div style={{
                        margin: "0 16px 12px", padding: "10px 14px", borderRadius: "10px",
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "var(--error)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        <AlertCircle size={14} /> {socketError}
                    </div>
                )}
            </div>

            {/* ── INPUT AREA ── */}
            <div style={{
                padding: "12px",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
            }}>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <textarea
                        value={input}
                        onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        disabled={!canType}
                        rows={1}
                        placeholder={
                            !isOngoing ? "Debate has ended." :
                                isMyTurn ? "Type your argument… (Enter to send, Shift+Enter for new line)" :
                                    "Waiting for opponent…"
                        }
                        style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: "12px",
                            border: `1px solid ${canType ? "var(--primary)" : "var(--border)"}`,
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                            outline: "none",
                            resize: "none",
                            overflow: "hidden",
                            fontSize: "0.92rem",
                            lineHeight: 1.5,
                            transition: "border-color 0.2s ease",
                            opacity: canType ? 1 : 0.5,
                            fontFamily: "inherit",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!canType || !input.trim()}
                        style={{
                            width: "44px", height: "44px", borderRadius: "12px", border: "none",
                            background: canType && input.trim() ? "var(--primary)" : "var(--bg-elevated)",
                            color: canType && input.trim() ? "white" : "var(--text-muted)",
                            cursor: canType && input.trim() ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, transition: "all 0.2s ease",
                        }}
                    >
                        <Send size={17} />
                    </button>
                </form>

                {isOngoing && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                        <button
                            onClick={handleForfeit}
                            style={{
                                background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px",
                                color: "var(--error)", fontSize: "0.78rem", fontWeight: 600, padding: "5px 12px",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: 0.7,
                                transition: "opacity 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
                        >
                            <LogOut size={13} /> Forfeit
                        </button>

                        <button
                            onClick={handlePassTurn}
                            disabled={!canType}
                            style={{
                                background: "none", border: "1px solid var(--border)", borderRadius: "8px",
                                color: canType ? "var(--text-secondary)" : "var(--text-muted)",
                                fontSize: "0.78rem", fontWeight: 600, padding: "5px 12px",
                                cursor: canType ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px",
                                opacity: canType ? 1 : 0.4, transition: "opacity 0.2s",
                            }}
                        >
                            <SkipForward size={13} /> Pass Turn
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function PlayerCard({ username, side, isMe, isCurrentTurn, isOngoing, avgScore, winner }: {
    username: string;
    side: "FOR" | "AGAINST";
    isMe: boolean;
    isCurrentTurn: boolean;
    isOngoing: boolean;
    avgScore: number | null;
    winner: string | null;
}) {
    const isWinner = winner === side;
    const isLoser = winner !== null && winner !== "TIE" && winner !== side;

    return (
        <div style={{
            padding: "12px 14px",
            borderRadius: "14px",
            border: isCurrentTurn && isOngoing
                ? `2px solid ${side === "FOR" ? "var(--success)" : "var(--error)"}`
                : "1px solid var(--border)",
            background: isCurrentTurn && isOngoing
                ? side === "FOR" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)"
                : "var(--bg-secondary)",
            transition: "all 0.3s ease",
            position: "relative",
        }}>
            {isWinner && (
                <div style={{ position: "absolute", top: "-8px", right: "10px", fontSize: "16px" }}>🏆</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: side === "FOR" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                    border: `2px solid ${side === "FOR" ? "var(--success)" : "var(--error)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 900,
                    color: side === "FOR" ? "var(--success)" : "var(--error)",
                }}>
                    {username[0].toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isLoser ? "var(--text-muted)" : "var(--text-primary)" }}>
                        {username} {isMe && <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--primary)" }}>(you)</span>}
                    </div>
                    <div style={{
                        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                        color: side === "FOR" ? "var(--success)" : "var(--error)",
                    }}>
                        {side === "FOR" ? "▲ FOR" : "▼ AGAINST"}
                    </div>
                </div>
            </div>
            {avgScore !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                    <Star size={11} style={{ color: "var(--warning)", fill: "var(--warning)" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                        Avg score: {avgScore}
                    </span>
                </div>
            )}
        </div>
    );
}

function MessageBubble({ content, username, timestamp, isMine, side, aiScore, flagged, flagging, onFlag, showFlag }: {
    content: string;
    username: string;
    timestamp: string;
    isMine: boolean;
    side: "FOR" | "AGAINST";
    aiScore?: number;
    flagged: boolean;
    flagging: boolean;
    onFlag: () => void;
    showFlag: boolean;
}) {
    const scoreColor = aiScore
        ? aiScore >= 75 ? "#10b981" : aiScore >= 50 ? "#f59e0b" : aiScore >= 30 ? "#f97316" : "#ef4444"
        : null;

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isMine ? "flex-end" : "flex-start",
            animation: "slideIn 0.2s ease",
        }}>
            {/* Meta row */}
            <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginBottom: "4px", padding: "0 4px",
                flexDirection: isMine ? "row-reverse" : "row",
            }}>
                {/* Avatar dot */}
                <div style={{
                    width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                    background: isMine ? "var(--primary)" : side === "FOR" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.55rem", fontWeight: 900,
                    color: isMine ? "white" : side === "FOR" ? "var(--success)" : "var(--error)",
                }}>
                    {username[0].toUpperCase()}
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>{username}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {showFlag && (
                    <button
                        onClick={onFlag}
                        disabled={flagging || flagged}
                        title="Flag message"
                        style={{
                            background: "none", border: "none", cursor: flagged ? "default" : "pointer",
                            color: flagged ? "var(--error)" : "var(--text-muted)", padding: "2px",
                            opacity: flagged ? 1 : 0.5, transition: "opacity 0.15s",
                        }}
                        onMouseEnter={e => { if (!flagged) e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={e => { if (!flagged) e.currentTarget.style.opacity = "0.5"; }}
                    >
                        <Flag size={10} />
                    </button>
                )}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: "78%", position: "relative", paddingBottom: aiScore !== undefined ? "8px" : "0" }}>
                <div style={{
                    padding: "10px 14px",
                    borderRadius: "14px",
                    borderBottomRightRadius: isMine ? "4px" : "14px",
                    borderBottomLeftRadius: isMine ? "14px" : "4px",
                    background: isMine
                        ? "linear-gradient(135deg, var(--primary), #7c3aed)"
                        : "var(--bg-elevated)",
                    color: isMine ? "white" : "var(--text-primary)",
                    lineHeight: 1.55,
                    fontSize: "0.9rem",
                    border: isMine ? "none" : "1px solid var(--border)",
                    boxShadow: isMine ? "0 4px 12px rgba(139,92,246,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                    {content}
                </div>

                {/* AI Score tag */}
                {aiScore !== undefined && (
                    <div style={{
                        position: "absolute",
                        bottom: "-2px",
                        [isMine ? "left" : "right"]: "4px",
                        display: "flex", alignItems: "center", gap: "3px",
                        background: scoreColor ?? "var(--bg-elevated)",
                        color: "white",
                        fontSize: "0.65rem", fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "100px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        letterSpacing: "0.3px",
                    }}>
                        <Star size={8} style={{ fill: "white", color: "white" }} />
                        {aiScore}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyChat({ isMyTurn, opponentName }: { isMyTurn: boolean; opponentName: string }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px", color: "var(--text-muted)", padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "4px" }}>⚔️</div>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
                {isMyTurn ? "The floor is yours — make your opening argument!" : `Waiting for ${opponentName} to open the debate…`}
            </p>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>Arguments are scored by AI on logic, evidence, and clarity.</p>
        </div>
    );
}

function ResultBanner({ winner, mySide, onBack }: { winner: string | null; mySide: "FOR" | "AGAINST" | null; onBack: () => void }) {
    const isWin = winner === mySide;
    const isTie = winner === "TIE";

    return (
        <div style={{
            padding: "20px 24px",
            borderRadius: "16px",
            textAlign: "center",
            background: isTie ? "rgba(139,92,246,0.1)" : isWin ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${isTie ? "rgba(139,92,246,0.3)" : isWin ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"}`,
        }}>
            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
                {isTie ? "🤝" : isWin ? "🏆" : "💀"}
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: isTie ? "var(--primary)" : isWin ? "var(--success)" : "var(--error)", marginBottom: "4px" }}>
                {isTie ? "It's a Tie!" : isWin ? "You Won!" : "You Lost"}
            </div>
            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", margin: "0 0 14px" }}>
                {isTie ? "Both sides scored equally." : isWin ? "Your arguments scored higher overall." : "Your opponent's arguments scored higher."}
            </p>
            <button onClick={onBack} style={{
                padding: "8px 20px", borderRadius: "10px", border: "1px solid var(--border)",
                background: "var(--bg-elevated)", color: "var(--text-secondary)", fontWeight: 600,
                fontSize: "0.85rem", cursor: "pointer",
            }}>
                Try Another Topic
            </button>
        </div>
    );
}
