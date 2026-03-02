"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, Bot, LogOut, SkipForward, Star, Zap, ChevronRight } from "lucide-react";
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
    const [newMsgId, setNewMsgId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

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
            const last = d.messages[d.messages.length - 1];
            if (last?._id) setNewMsgId(String(last._id));
        });
        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
            setTimeout(() => setSocketError(""), 3000);
        });
        return () => { socket.off("debate:updated"); socket.off("debate:error"); };
    }, [accessToken, debateId]);

    // Scroll only the chat container, not the whole page
    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [debate?.messages, isBotThinking]);

    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    // User is always FOR in solo mode
    const mySide = "FOR" as const;
    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn && !isBotThinking;
    const totalSeconds = 90;
    const progressPct = Math.max(0, (secondsLeft / totalSeconds) * 100);

    const autoResize = useCallback((el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }, []);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;
        getSocket(accessToken).emit("solo:message", { debateId, content: input.trim() });
        setInput("");
        setIsBotThinking(true);
        if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    };

    const handlePass = () => {
        if (!canType || !accessToken) return;
        getSocket(accessToken).emit("solo:end_turn", { debateId });
        setIsBotThinking(true);
    };

    const handleQuit = () => {
        if (confirm("Quit this practice session?") && accessToken) {
            getSocket(accessToken).emit("solo:forfeit", { debateId });
            toast.info("Practice session ended.");
            router.push("/topics");
        }
    };

    // ── LOADING STATE ──
    if (isLoading || !debate) return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(139,92,246,0.15)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Preparing your practice arena…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (isError) return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <p style={{ color: "var(--error)", fontWeight: 700 }}>Session not found</p>
            <button onClick={() => router.push("/topics")} style={{ padding: "8px 20px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem" }}>
                Back to Topics
            </button>
        </div>
    );

    const isCompleted = debate.status !== DebateStatus.ONGOING && debate.status !== DebateStatus.WAITING;

    // Average AI scores
    const myMsgs = debate.messages.filter(m => m.side === "FOR" && m.aiScore !== undefined);
    const botMsgs = debate.messages.filter(m => m.side === "AGAINST" && m.aiScore !== undefined);
    const myAvg = myMsgs.length ? Math.round(myMsgs.reduce((a, m) => a + (m.aiScore ?? 0), 0) / myMsgs.length) : null;
    const botAvg = botMsgs.length ? Math.round(botMsgs.reduce((a, m) => a + (m.aiScore ?? 0), 0) / botMsgs.length) : null;

    const isUsingGemini = debate.messages.some(m => m.side === "AGAINST");

    return (
        <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-primary)",
            position: "relative",
            overflow: "hidden",
        }}>

            {/* ── AMBIENT GLOW BACKGROUND ── */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-80px", left: "15%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", top: "-60px", right: "10%", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)" }} />
            </div>

            {/* ── HEADER: Topic + Solo Badge ── */}
            <div style={{
                position: "relative", zIndex: 1,
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                background: "rgba(var(--bg-primary-rgb, 10,10,20), 0.95)",
                backdropFilter: "blur(12px)",
                display: "flex", flexDirection: "column", gap: "8px",
            }}>
                {/* Row 1: Solo badge + topic */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "3px 10px", borderRadius: "100px",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))",
                        border: "1px solid rgba(139,92,246,0.3)",
                        fontSize: "0.68rem", fontWeight: 800, letterSpacing: "1.2px",
                        color: "#c4b5fd", textTransform: "uppercase", flexShrink: 0,
                    }}>
                        <Bot size={11} /> Solo Practice
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                            Round {debate.round}/3
                        </span>
                        <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                        <h1 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                            {debate.topicId.title}
                        </h1>
                    </div>
                </div>

                {/* Row 2: Player vs Bot with timer */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Me */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "5px 10px", borderRadius: "8px",
                        background: isMyTurn && isOngoing ? "rgba(16,185,129,0.1)" : "var(--bg-secondary)",
                        border: `1px solid ${isMyTurn && isOngoing ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
                        transition: "all 0.3s ease",
                    }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "white" }}>
                            {(user?.username ?? "Y")[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1 }}>{user?.username ?? "You"}</div>
                            <div style={{ fontSize: "0.6rem", color: "var(--success)", fontWeight: 700 }}>▲ FOR</div>
                        </div>
                        {myAvg !== null && (
                            <div style={{ display: "flex", alignItems: "center", gap: "2px", marginLeft: "4px", padding: "1px 6px", borderRadius: "100px", background: "rgba(16,185,129,0.1)", fontSize: "0.65rem", fontWeight: 800, color: "var(--success)" }}>
                                <Star size={8} style={{ fill: "currentColor" }} />{myAvg}
                            </div>
                        )}
                    </div>

                    {/* Timer bar in the middle */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: isMyTurn ? "var(--primary)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "4px" }}>
                            {isMyTurn && isOngoing
                                ? <><span style={{ color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>{secondsLeft}s</span> remaining</>
                                : isBotThinking
                                    ? <><span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#a78bfa", animation: "pulse 1s infinite" }} />AI thinking</>
                                    : "Opponent's turn"
                            }
                        </div>
                        <div style={{ width: "100%", height: "3px", borderRadius: "100px", background: "var(--bg-elevated)", overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: isMyTurn ? `${progressPct}%` : "100%",
                                borderRadius: "100px",
                                background: isBotThinking
                                    ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
                                    : secondsLeft <= 10
                                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                                        : "linear-gradient(90deg, var(--primary), var(--accent))",
                                transition: isMyTurn ? "width 1s linear" : "none",
                                opacity: isMyTurn ? 1 : 0.4,
                                animation: isBotThinking ? "shimmer 1.5s ease-in-out infinite" : "none",
                            }} />
                        </div>
                    </div>

                    {/* Bot */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "5px 10px", borderRadius: "8px",
                        background: !isMyTurn && isOngoing ? "rgba(139,92,246,0.1)" : "var(--bg-secondary)",
                        border: `1px solid ${!isMyTurn && isOngoing ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                        transition: "all 0.3s ease",
                    }}>
                        {botAvg !== null && (
                            <div style={{ display: "flex", alignItems: "center", gap: "2px", marginRight: "4px", padding: "1px 6px", borderRadius: "100px", background: "rgba(139,92,246,0.1)", fontSize: "0.65rem", fontWeight: 800, color: "#c4b5fd" }}>
                                <Star size={8} style={{ fill: "currentColor" }} />{botAvg}
                            </div>
                        )}
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1 }}>AI Bot</div>
                            <div style={{ fontSize: "0.6rem", color: "#c4b5fd", fontWeight: 700 }}>▼ AGAINST</div>
                        </div>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.2))", border: "2px solid rgba(139,92,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", position: "relative" }}>
                            🤖
                            {isBotThinking && <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", border: "2px solid #a78bfa", animation: "ringPulse 1.5s ease-in-out infinite" }} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RESULT BANNER ── */}
            {isCompleted && (
                <div style={{
                    position: "relative", zIndex: 1,
                    margin: "12px 20px 0",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    textAlign: "center",
                    background: debate.winner === mySide ? "rgba(16,185,129,0.1)" : debate.winner === "TIE" ? "rgba(139,92,246,0.1)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${debate.winner === mySide ? "rgba(16,185,129,0.3)" : debate.winner === "TIE" ? "rgba(139,92,246,0.3)" : "rgba(239,68,68,0.25)"}`,
                }}>
                    <span style={{ fontSize: "1.4rem" }}>{debate.winner === mySide ? "🏆" : debate.winner === "TIE" ? "🤝" : "🤖"}</span>
                    <span style={{ fontWeight: 800, fontSize: "1rem", marginLeft: "10px", color: debate.winner === mySide ? "var(--success)" : debate.winner === "TIE" ? "var(--primary)" : "#f87171" }}>
                        {debate.winner === mySide ? "You beat the bot!" : debate.winner === "TIE" ? "It's a tie!" : "AI Bot wins — keep practicing!"}
                    </span>
                    <div style={{ marginTop: "10px" }}>
                        <button onClick={() => router.push("/topics")} style={{ padding: "7px 18px", borderRadius: "9px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                            Try Another Topic
                        </button>
                    </div>
                </div>
            )}

            {/* ── CHAT WINDOW — THE MAIN ATTRACTION ── */}
            <div
                ref={chatRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                    zIndex: 1,
                    scrollBehavior: "smooth",
                }}
            >
                {debate.messages.length === 0 && !isBotThinking ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", color: "var(--text-muted)", padding: "40px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", opacity: 0.3, animation: "floatAnim 3s ease-in-out infinite" }}>⚔️</div>
                        <div>
                            <p style={{ fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 6px", fontSize: "1.05rem" }}>You go first</p>
                            <p style={{ fontSize: "0.83rem", margin: 0 }}>Make your opening argument. The AI will craft a specific counter to what you say.</p>
                        </div>
                    </div>
                ) : (
                    debate.messages.map((msg, i) => {
                        // In solo mode: user is always FOR (right side), bot is always AGAINST (left side)
                        const isMine = msg.side === "FOR";
                        const isNew = msg._id === newMsgId;
                        const scoreColor = msg.aiScore !== undefined
                            ? msg.aiScore >= 75 ? "#10b981" : msg.aiScore >= 50 ? "#f59e0b" : msg.aiScore >= 30 ? "#f97316" : "#ef4444"
                            : null;

                        return (
                            <div
                                key={msg._id || i}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isMine ? "flex-end" : "flex-start",
                                    animation: isNew ? "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none",
                                }}
                            >
                                {/* Label */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    marginBottom: "4px", padding: "0 4px",
                                    flexDirection: isMine ? "row-reverse" : "row",
                                }}>
                                    <div style={{
                                        width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                        background: isMine ? "linear-gradient(135deg, var(--primary), #7c3aed)" : "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.2))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.55rem", fontWeight: 900, color: "white",
                                    }}>
                                        {isMine ? (user?.username ?? "Y")[0].toUpperCase() : "🤖"}
                                    </div>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: isMine ? "var(--primary)" : "#a78bfa" }}>
                                        {isMine ? (user?.username ?? "You") : "AI Bot"}
                                    </span>
                                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>

                                {/* Bubble */}
                                <div style={{ maxWidth: "72%", position: "relative", paddingBottom: msg.aiScore !== undefined ? "10px" : "0" }}>
                                    <div style={{
                                        padding: "11px 15px",
                                        borderRadius: "16px",
                                        borderBottomRightRadius: isMine ? "4px" : "16px",
                                        borderBottomLeftRadius: isMine ? "16px" : "4px",
                                        background: isMine
                                            ? "linear-gradient(135deg, #7c3aed, var(--primary))"
                                            : "rgba(139,92,246,0.08)",
                                        color: isMine ? "white" : "var(--text-primary)",
                                        lineHeight: 1.6,
                                        fontSize: "0.9rem",
                                        border: isMine ? "none" : "1px solid rgba(139,92,246,0.18)",
                                        boxShadow: isMine
                                            ? "0 4px 16px rgba(124,58,237,0.3)"
                                            : "0 2px 8px rgba(0,0,0,0.06)",
                                    }}>
                                        {msg.content}
                                    </div>

                                    {/* AI Score pill */}
                                    {msg.aiScore !== undefined && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: 0,
                                            [isMine ? "left" : "right"]: "6px",
                                            display: "flex", alignItems: "center", gap: "3px",
                                            background: scoreColor!,
                                            color: "white",
                                            fontSize: "0.62rem", fontWeight: 900,
                                            padding: "2px 7px", borderRadius: "100px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
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

                {/* Bot thinking indicator */}
                {isBotThinking && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", animation: "popIn 0.3s ease" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px", padding: "0 4px" }}>
                            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem" }}>🤖</div>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa" }}>AI Bot</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>crafting reply…</span>
                        </div>
                        <div style={{
                            padding: "12px 18px", borderRadius: "16px", borderBottomLeftRadius: "4px",
                            background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)",
                            display: "flex", gap: "5px", alignItems: "center",
                        }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#a78bfa", animation: `bounce 1.2s ease-in-out infinite ${i * 0.18}s` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT AREA ── */}
            <div style={{
                position: "relative", zIndex: 1,
                borderTop: "1px solid var(--border)",
                background: "rgba(var(--bg-secondary-rgb, 15,15,30), 0.97)",
                backdropFilter: "blur(12px)",
                padding: "12px 16px",
            }}>
                {socketError && (
                    <div style={{ marginBottom: "8px", padding: "7px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--error)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        ⚠️ {socketError}
                    </div>
                )}

                <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={!canType}
                        rows={1}
                        placeholder={
                            !isOngoing ? "Practice session ended." :
                                isBotThinking ? "AI Bot is crafting a reply…" :
                                    isMyTurn ? "Your argument… (Enter to send · Shift+Enter for new line)" :
                                        "Waiting…"
                        }
                        style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "14px",
                            border: `1.5px solid ${canType ? "rgba(139,92,246,0.5)" : "var(--border)"}`,
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                            outline: "none",
                            resize: "none",
                            overflow: "hidden",
                            fontSize: "0.92rem",
                            lineHeight: 1.5,
                            transition: "border-color 0.2s, box-shadow 0.2s",
                            opacity: canType ? 1 : 0.5,
                            fontFamily: "inherit",
                            boxShadow: canType ? "0 0 0 3px rgba(139,92,246,0.06)" : "none",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!canType || !input.trim()}
                        style={{
                            width: "44px", height: "44px", borderRadius: "14px", border: "none", flexShrink: 0,
                            background: canType && input.trim()
                                ? "linear-gradient(135deg, var(--primary), #7c3aed)"
                                : "var(--bg-elevated)",
                            color: canType && input.trim() ? "white" : "var(--text-muted)",
                            cursor: canType && input.trim() ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s ease",
                            boxShadow: canType && input.trim() ? "0 4px 12px rgba(124,58,237,0.35)" : "none",
                        }}
                    >
                        <Send size={17} />
                    </button>
                </form>

                {isOngoing && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <button onClick={handleQuit} style={{
                            background: "none", border: "none", padding: "4px 8px",
                            color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                            opacity: 0.6, transition: "opacity 0.2s", borderRadius: "6px",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                        >
                            <LogOut size={12} /> Quit
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button onClick={handlePass} disabled={!canType} style={{
                                background: "none", border: "none", padding: "4px 8px",
                                color: canType ? "var(--text-muted)" : "var(--text-muted)",
                                fontSize: "0.75rem", fontWeight: 600,
                                cursor: canType ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", gap: "4px",
                                opacity: canType ? 0.7 : 0.3, transition: "opacity 0.2s", borderRadius: "6px",
                            }}
                                onMouseEnter={e => { if (canType) e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={e => { if (canType) e.currentTarget.style.opacity = "0.7"; }}
                            >
                                <SkipForward size={12} /> Pass Turn
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "var(--text-muted)", opacity: 0.6 }}>
                                <Zap size={10} style={{ color: "#a78bfa" }} />
                                Powered by Gemini
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
                @keyframes shimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
                @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-7px); } }
                @keyframes ringPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.15); } }
                @keyframes floatAnim { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.92) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
        </div>
    );
}
