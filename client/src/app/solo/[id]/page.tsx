"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, AlertCircle, Bot, LogOut, SkipForward, Star, Swords, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { IDebate, DebateStatus } from "@/lib/constants";
import { useAuth, getSocket } from "@/hooks/useAuth";
import { useDebateTimer } from "@/hooks/useDebateTimer";
import { useToast } from "@/components/ui/Toast";

const BOT_USER_ID = "000000000000000000000001";

export default function SoloPracticeRoom() {
    const params = useParams();
    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { toast } = useToast();
    const debateId = params.id as string;

    const [debate, setDebate] = useState<IDebate | null>(null);
    const [input, setInput] = useState("");
    const [socketError, setSocketError] = useState("");
    const [isBotThinking, setIsBotThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { isLoading, isError } = useQuery({
        queryKey: ["solo-debate", debateId],
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
        socket.emit("solo:join", { debateId });
        socket.on("debate:updated", (d: IDebate) => {
            setDebate(d);
            setSocketError("");
            setIsBotThinking(false);
        });
        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
            setTimeout(() => setSocketError(""), 3000);
        });
        return () => { socket.off("debate:updated"); socket.off("debate:error"); };
    }, [accessToken, debateId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [debate?.messages, isBotThinking]);

    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    const mySide = "FOR" as const;
    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn && !isBotThinking;
    const totalSeconds = 90;
    const progressPercent = Math.max(0, (secondsLeft / totalSeconds) * 100);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;
        getSocket(accessToken).emit("solo:message", { debateId, content: input.trim() });
        setInput("");
        setIsBotThinking(true);
    };

    const handlePassTurn = () => {
        if (!canType || !accessToken) return;
        getSocket(accessToken).emit("solo:end_turn", { debateId });
        setIsBotThinking(true);
    };

    const handleQuitPractice = () => {
        if (confirm("Quit this practice session? Progress won't affect your ranking.") && accessToken) {
            getSocket(accessToken).emit("solo:forfeit", { debateId });
            toast.info("Practice session ended.");
            router.push("/topics");
        }
    };

    if (isLoading || !debate) return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: "16px" }}>
            <Loader2 size={40} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--text-muted)" }}>Preparing practice room…</p>
        </div>
    );

    if (isError) return (
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h2 style={{ color: "var(--error)", marginBottom: "16px" }}>Session not found</h2>
            <button onClick={() => router.push("/topics")} style={{ padding: "8px 20px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer" }}>
                Back to Topics
            </button>
        </div>
    );

    const isCompleted = debate.status !== DebateStatus.ONGOING && debate.status !== DebateStatus.WAITING;

    // Compute average AI scores
    const myMessages = debate.messages.filter(m => m.side === "FOR" && m.aiScore);
    const botMessages = debate.messages.filter(m => m.side === "AGAINST" && m.aiScore);
    const myAvg = myMessages.length > 0 ? Math.round(myMessages.reduce((a, m) => a + (m.aiScore ?? 0), 0) / myMessages.length) : null;
    const botAvg = botMessages.length > 0 ? Math.round(botMessages.reduce((a, m) => a + (m.aiScore ?? 0), 0) / botMessages.length) : null;

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "16px 20px 20px", height: "calc(100vh - 72px)", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* ── SOLO BANNER ── */}
            <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 16px", borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(34,211,238,0.07) 100%)",
                border: "1px solid rgba(139,92,246,0.25)",
            }}>
                <Sparkles size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.3px" }}>
                    SOLO PRACTICE MODE
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                    — Debate the AI Bot. Won&apos;t affect your ranking.
                </span>
            </div>

            {/* ── TOPIC HEADER ── */}
            <div style={{
                padding: "14px 18px", borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(34,211,238,0.05) 100%)",
                border: "1px solid rgba(139,92,246,0.18)",
                display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
            }}>
                <div style={{
                    width: "34px", height: "34px", borderRadius: "10px",
                    background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <Swords size={17} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--primary)", marginBottom: "2px" }}>
                        Round {debate.round} of 3
                    </div>
                    <h1 style={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{debate.topicId.title}</h1>
                </div>
            </div>

            {/* ── PLAYER CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
                {/* You */}
                <SoloPlayerCard
                    label={user?.username ?? "You"}
                    emoji="👤"
                    side="FOR"
                    isCurrentTurn={isMyTurn && isOngoing}
                    avgScore={myAvg}
                    winner={debate.winner}
                />
                <div style={{ textAlign: "center", fontWeight: 900, fontSize: "0.85rem", color: "var(--text-muted)", letterSpacing: "2px" }}>VS</div>
                {/* Bot */}
                <SoloPlayerCard
                    label="AI Bot"
                    emoji="🤖"
                    side="AGAINST"
                    isCurrentTurn={!isMyTurn && isOngoing}
                    avgScore={botAvg}
                    winner={debate.winner}
                    isBot
                    isThinking={isBotThinking}
                />
            </div>

            {/* ── TIMER BAR ── */}
            {isOngoing && (
                <div style={{
                    padding: "10px 16px", borderRadius: "12px",
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{
                            fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                            color: isMyTurn ? "var(--primary)" : "var(--text-muted)",
                            display: "flex", alignItems: "center", gap: "7px",
                        }}>
                            <span style={{
                                width: "6px", height: "6px", borderRadius: "50%",
                                background: isMyTurn ? "var(--primary)" : isBotThinking ? "#a78bfa" : "var(--text-muted)",
                                display: "inline-block",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            {isMyTurn ? "Your Turn" : isBotThinking ? "AI Bot is thinking…" : "AI Bot's Turn"}
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
                            background: isBotThinking
                                ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
                                : secondsLeft <= 10
                                    ? "linear-gradient(90deg, var(--error), #ff6b6b)"
                                    : "linear-gradient(90deg, var(--primary), var(--accent))",
                            transition: isMyTurn ? "width 1s linear" : "none",
                            opacity: isMyTurn ? 1 : 0.5,
                            animation: isBotThinking ? "shimmer 1.5s ease-in-out infinite" : "none",
                        }} />
                    </div>
                </div>
            )}

            {/* ── RESULT BANNER ── */}
            {isCompleted && (
                <SoloResultBanner winner={debate.winner} mySide={mySide} onBack={() => router.push("/topics")} />
            )}

            {/* ── CHAT WINDOW ── */}
            <div style={{
                flex: 1,
                borderRadius: "16px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
            }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {debate.messages.length === 0 && !isBotThinking ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px", color: "var(--text-muted)", padding: "40px 20px", textAlign: "center" }}>
                            <Bot size={40} style={{ opacity: 0.25 }} />
                            <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>You go first — make your opening argument!</p>
                            <p style={{ fontSize: "0.82rem", margin: 0 }}>The AI will craft a counter-argument specific to what you say.</p>
                        </div>
                    ) : (
                        debate.messages.map((msg, i) => {
                            const isBot = msg.sender._id === BOT_USER_ID;
                            const isMine = !isBot;
                            const scoreColor = msg.aiScore
                                ? msg.aiScore >= 75 ? "#10b981" : msg.aiScore >= 50 ? "#f59e0b" : msg.aiScore >= 30 ? "#f97316" : "#ef4444"
                                : null;

                            return (
                                <div key={msg._id || i} style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: isMine ? "flex-end" : "flex-start",
                                    animation: "slideIn 0.2s ease",
                                }}>
                                    {/* Meta */}
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        marginBottom: "4px", padding: "0 4px",
                                        flexDirection: isMine ? "row-reverse" : "row",
                                    }}>
                                        <div style={{
                                            width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                                            background: isMine ? "var(--primary)" : "rgba(139,92,246,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.6rem",
                                        }}>
                                            {isMine ? (user?.username ?? "Y")[0].toUpperCase() : "🤖"}
                                        </div>
                                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                            {isBot ? "AI Bot" : (user?.username ?? "You")}
                                        </span>
                                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div style={{ maxWidth: "78%", position: "relative", paddingBottom: msg.aiScore !== undefined ? "8px" : "0" }}>
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
                                            border: isMine ? "none" : "1px solid rgba(139,92,246,0.15)",
                                            boxShadow: isMine ? "0 4px 12px rgba(139,92,246,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                                        }}>
                                            {msg.content}
                                        </div>

                                        {/* AI score tag */}
                                        {msg.aiScore !== undefined && (
                                            <div style={{
                                                position: "absolute",
                                                bottom: "-2px",
                                                [isMine ? "left" : "right"]: "4px",
                                                display: "flex", alignItems: "center", gap: "3px",
                                                background: scoreColor ?? "var(--bg-elevated)",
                                                color: "white",
                                                fontSize: "0.65rem", fontWeight: 800,
                                                padding: "2px 7px", borderRadius: "100px",
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                                letterSpacing: "0.3px",
                                            }}>
                                                <Star size={8} style={{ fill: "white", color: "white" }} />
                                                {msg.aiScore}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Bot thinking bubbles */}
                    {isBotThinking && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", animation: "slideIn 0.2s ease" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", padding: "0 4px" }}>
                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>🤖</div>
                                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>AI Bot</span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>thinking…</span>
                            </div>
                            <div style={{
                                padding: "12px 18px", borderRadius: "14px", borderBottomLeftRadius: "4px",
                                background: "var(--bg-elevated)", border: "1px solid rgba(139,92,246,0.2)",
                                display: "flex", gap: "5px", alignItems: "center",
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: "7px", height: "7px", borderRadius: "50%",
                                        background: "var(--primary)", opacity: 0.7,
                                        animation: `bounce 1.2s infinite ${i * 0.2}s`,
                                    }} />
                                ))}
                            </div>
                        </div>
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
            <div style={{ padding: "12px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <textarea
                        value={input}
                        onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        disabled={!canType}
                        rows={1}
                        placeholder={
                            !isOngoing ? "Practice session ended." :
                                isBotThinking ? "AI Bot is crafting a reply…" :
                                    isMyTurn ? "Type your argument… (Enter to send)" : "Waiting…"
                        }
                        style={{
                            flex: 1, padding: "10px 14px", borderRadius: "12px",
                            border: `1px solid ${canType ? "var(--primary)" : "var(--border)"}`,
                            backgroundColor: "var(--bg-primary)", color: "var(--text-primary)",
                            outline: "none", resize: "none", overflow: "hidden",
                            fontSize: "0.92rem", lineHeight: 1.5, transition: "border-color 0.2s",
                            opacity: canType ? 1 : 0.5, fontFamily: "inherit",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!canType || !input.trim()}
                        style={{
                            width: "44px", height: "44px", borderRadius: "12px", border: "none", flexShrink: 0,
                            background: canType && input.trim() ? "var(--primary)" : "var(--bg-elevated)",
                            color: canType && input.trim() ? "white" : "var(--text-muted)",
                            cursor: canType && input.trim() ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <Send size={17} />
                    </button>
                </form>

                {isOngoing && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                        <button onClick={handleQuitPractice} style={{
                            background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px",
                            color: "var(--error)", fontSize: "0.78rem", fontWeight: 600, padding: "5px 12px",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: 0.7, transition: "opacity 0.2s",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
                        >
                            <LogOut size={13} /> Quit Practice
                        </button>
                        <button onClick={handlePassTurn} disabled={!canType} style={{
                            background: "none", border: "1px solid var(--border)", borderRadius: "8px",
                            color: canType ? "var(--text-secondary)" : "var(--text-muted)",
                            fontSize: "0.78rem", fontWeight: 600, padding: "5px 12px",
                            cursor: canType ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px",
                            opacity: canType ? 1 : 0.4, transition: "opacity 0.2s",
                        }}>
                            <SkipForward size={13} /> Pass Turn
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-7px); } }
                @keyframes shimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
            `}</style>
        </div>
    );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SoloPlayerCard({ label, emoji, side, isCurrentTurn, avgScore, winner, isBot, isThinking }: {
    label: string;
    emoji: string;
    side: "FOR" | "AGAINST";
    isCurrentTurn: boolean;
    avgScore: number | null;
    winner: string | null;
    isBot?: boolean;
    isThinking?: boolean;
}) {
    const isWinner = winner === side;

    return (
        <div style={{
            padding: "12px 14px", borderRadius: "14px",
            border: isCurrentTurn
                ? `2px solid ${side === "FOR" ? "var(--success)" : "rgba(139,92,246,0.6)"}`
                : "1px solid var(--border)",
            background: isCurrentTurn
                ? side === "FOR" ? "rgba(16,185,129,0.06)" : "rgba(139,92,246,0.06)"
                : "var(--bg-secondary)",
            transition: "all 0.3s ease",
            position: "relative",
        }}>
            {isWinner && <div style={{ position: "absolute", top: "-8px", right: "10px", fontSize: "15px" }}>🏆</div>}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: side === "FOR" ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.15)",
                    border: `2px solid ${side === "FOR" ? "var(--success)" : "rgba(139,92,246,0.6)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem",
                }}>
                    {emoji}
                </div>
                <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{label}</div>
                    <div style={{
                        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                        color: side === "FOR" ? "var(--success)" : "rgba(139,92,246,0.8)",
                    }}>
                        {side === "FOR" ? "▲ FOR" : "▼ AGAINST"}
                    </div>
                </div>
            </div>

            {isThinking && (
                <div style={{ fontSize: "0.68rem", color: "#a78bfa", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                    <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#a78bfa", animation: "pulse 1s infinite" }} />
                    Generating reply…
                </div>
            )}

            {avgScore !== null && !isThinking && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "6px" }}>
                    <Star size={10} style={{ color: "var(--warning)", fill: "var(--warning)" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>Avg: {avgScore}</span>
                </div>
            )}
        </div>
    );
}

function SoloResultBanner({ winner, mySide, onBack }: { winner: string | null; mySide: "FOR" | "AGAINST"; onBack: () => void }) {
    const isWin = winner === mySide;
    const isTie = winner === "TIE";

    return (
        <div style={{
            padding: "20px 24px", borderRadius: "16px", textAlign: "center",
            background: isTie ? "rgba(139,92,246,0.1)" : isWin ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.08)",
            border: `1px solid ${isTie ? "rgba(139,92,246,0.3)" : isWin ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.25)"}`,
        }}>
            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
                {isTie ? "🤝" : isWin ? "🏆" : "🤖"}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: isTie ? "var(--primary)" : isWin ? "var(--success)" : "var(--primary)", marginBottom: "4px" }}>
                {isTie ? "It's a Tie!" : isWin ? "You Beat the Bot!" : "The AI Bot Won — Keep Practicing!"}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 14px" }}>
                {isTie ? "Evenly matched." : isWin ? "Your arguments scored higher." : "Try a different approach next time."}
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
