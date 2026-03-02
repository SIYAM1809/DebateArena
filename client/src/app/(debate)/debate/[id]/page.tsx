"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, Flag, Swords, LogOut, SkipForward, Star } from "lucide-react";
import { api } from "@/lib/api";
import { IDebate, DebateStatus } from "@/lib/constants";
import { useAuth, getSocket } from "@/hooks/useAuth";
import { useDebateTimer } from "@/hooks/useDebateTimer";
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
    const [newMsgId, setNewMsgId] = useState<string | null>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        socket.on("debate:updated", (d: IDebate) => {
            setDebate(d);
            setSocketError("");
            const last = d.messages[d.messages.length - 1];
            if (last?._id) setNewMsgId(String(last._id));
        });
        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
            setTimeout(() => setSocketError(""), 3000);
        });
        return () => { socket.off("debate:updated"); socket.off("debate:error"); };
    }, [accessToken, debateId]);

    // Scroll only the chat div, not the page
    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [debate?.messages]);

    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    let mySide: "FOR" | "AGAINST" | null = null;
    if (debate && user) {
        if (debate.participants.FOR._id === user._id) mySide = "FOR";
        else if (debate.participants.AGAINST._id === user._id) mySide = "AGAINST";
    }

    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn;
    const totalSeconds = 60;
    const progressPct = Math.max(0, (secondsLeft / totalSeconds) * 100);

    const autoResize = useCallback((el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }, []);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;
        getSocket(accessToken).emit("debate:message", { debateId, content: input.trim() });
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handlePass = () => {
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
        } catch { toast.error("Failed to flag"); }
        finally { setFlagging(null); }
    };

    if (isLoading || !debate) return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(139,92,246,0.15)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading debate room…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (isError) return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <p style={{ color: "var(--error)", fontWeight: 700 }}>Debate not found</p>
            <button onClick={() => router.push("/topics")} style={{ padding: "8px 20px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer" }}>
                Back to Topics
            </button>
        </div>
    );

    const forPlayer = debate.participants.FOR;
    const againstPlayer = debate.participants.AGAINST;
    const isCompleted = debate.status === DebateStatus.COMPLETED || debate.status === DebateStatus.FORFEITED;

    const forMsgs = debate.messages.filter(m => m.side === "FOR" && m.aiScore !== undefined);
    const agMsgs = debate.messages.filter(m => m.side === "AGAINST" && m.aiScore !== undefined);
    const forAvg = forMsgs.length ? Math.round(forMsgs.reduce((a, m) => a + (m.aiScore ?? 0), 0) / forMsgs.length) : null;
    const agAvg = agMsgs.length ? Math.round(agMsgs.reduce((a, m) => a + (m.aiScore ?? 0), 0) / agMsgs.length) : null;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>

            {/* Ambient glow */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-60px", left: "20%", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", top: "-60px", right: "20%", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)" }} />
            </div>

            {/* ── HEADER ── */}
            <div style={{
                position: "relative", zIndex: 1,
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
                display: "flex", flexDirection: "column", gap: "8px",
            }}>
                {/* Topic */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Swords size={14} color="white" />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--primary)", flexShrink: 0 }}>Rd {debate.round}</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{debate.topicId.title}</span>
                    </div>
                    <div style={{
                        padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", flexShrink: 0,
                        background: isOngoing ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)",
                        color: isOngoing ? "var(--success)" : "var(--primary)",
                        border: isOngoing ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(139,92,246,0.25)",
                    }}>
                        {isOngoing ? "● Live" : debate.status}
                    </div>
                </div>

                {/* Players + Timer inline */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {/* FOR player */}
                    <PlayerChip
                        username={forPlayer.username}
                        side="FOR"
                        isCurrentTurn={debate.currentTurn === "FOR" && isOngoing}
                        isMe={mySide === "FOR"}
                        avgScore={forAvg}
                        winner={debate.winner}
                    />

                    {/* Timer in center */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: isMyTurn ? "var(--primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            {isMyTurn && isOngoing
                                ? <><span style={{ color: secondsLeft <= 10 ? "var(--error)" : "var(--success)", fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>{secondsLeft}s</span></>
                                : <span>●</span>
                            }
                            {isMyTurn ? " your turn" : isOngoing ? " opponent" : "ended"}
                        </div>
                        <div style={{ width: "100%", height: "3px", borderRadius: "100px", background: "var(--bg-elevated)", overflow: "hidden" }}>
                            <div style={{
                                height: "100%",
                                width: isMyTurn ? `${progressPct}%` : "100%",
                                borderRadius: "100px",
                                background: secondsLeft <= 10
                                    ? "linear-gradient(90deg, #ef4444, #f87171)"
                                    : "linear-gradient(90deg, var(--primary), var(--accent))",
                                transition: isMyTurn ? "width 1s linear" : "none",
                                opacity: isMyTurn ? 1 : 0.3,
                            }} />
                        </div>
                    </div>

                    {/* AGAINST player */}
                    <PlayerChip
                        username={againstPlayer.username}
                        side="AGAINST"
                        isCurrentTurn={debate.currentTurn === "AGAINST" && isOngoing}
                        isMe={mySide === "AGAINST"}
                        avgScore={agAvg}
                        winner={debate.winner}
                        reverse
                    />
                </div>
            </div>

            {/* ── RESULT BANNER ── */}
            {isCompleted && mySide && (
                <div style={{
                    position: "relative", zIndex: 1, margin: "10px 20px 0",
                    padding: "14px 20px", borderRadius: "14px", textAlign: "center",
                    background: debate.winner === mySide ? "rgba(16,185,129,0.1)" : debate.winner === "TIE" ? "rgba(139,92,246,0.1)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${debate.winner === mySide ? "rgba(16,185,129,0.3)" : debate.winner === "TIE" ? "rgba(139,92,246,0.3)" : "rgba(239,68,68,0.25)"}`,
                }}>
                    <span style={{ fontSize: "1.2rem" }}>{debate.winner === mySide ? "🏆" : debate.winner === "TIE" ? "🤝" : "💀"}</span>
                    <span style={{ fontWeight: 800, marginLeft: "10px", color: debate.winner === mySide ? "var(--success)" : debate.winner === "TIE" ? "var(--primary)" : "#f87171" }}>
                        {debate.winner === mySide ? "You Won!" : debate.winner === "TIE" ? "It's a Tie!" : "You Lost"}
                    </span>
                    <div style={{ marginTop: "8px" }}>
                        <button onClick={() => router.push("/topics")} style={{ padding: "6px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                            Try Another Topic
                        </button>
                    </div>
                </div>
            )}

            {/* ── CHAT WINDOW — DOMINANT AREA ── */}
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
                }}
            >
                {debate.messages.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "3rem", animation: "floatAnim 3s ease-in-out infinite", opacity: 0.35 }}>⚔️</div>
                        <p style={{ fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "1rem" }}>
                            {isMyTurn ? "The floor is yours — open the debate!" : `Waiting for ${againstPlayer.username}…`}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>Arguments are scored by AI on logic, evidence, and clarity.</p>
                    </div>
                ) : (
                    debate.messages.map((msg, i) => {
                        // true = this message is mine (show right side), false = opponent (show left side)
                        const isMine = msg.side === mySide;
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
                                {/* Label row */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    marginBottom: "4px", padding: "0 4px",
                                    flexDirection: isMine ? "row-reverse" : "row",
                                }}>
                                    <div style={{
                                        width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                        background: isMine ? "linear-gradient(135deg, var(--primary), #7c3aed)" : msg.side === "FOR" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.55rem", fontWeight: 900, color: "white",
                                    }}>
                                        {msg.sender.username[0].toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: isMine ? "var(--primary)" : msg.side === "FOR" ? "var(--success)" : "#f87171" }}>
                                        {msg.sender.username}
                                    </span>
                                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {/* Flag on opponent's messages */}
                                    {!isMine && (
                                        <button
                                            onClick={() => msg._id && handleFlag(String(msg._id))}
                                            disabled={flagging === String(msg._id) || flaggedMsgs.has(String(msg._id)) || !!msg.flagged}
                                            style={{
                                                background: "none", border: "none", padding: "1px",
                                                color: (flaggedMsgs.has(String(msg._id)) || msg.flagged) ? "var(--error)" : "var(--text-muted)",
                                                cursor: "pointer", opacity: (flaggedMsgs.has(String(msg._id)) || msg.flagged) ? 1 : 0.4,
                                                transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                            onMouseLeave={e => { if (!flaggedMsgs.has(String(msg._id)) && !msg.flagged) e.currentTarget.style.opacity = "0.4"; }}
                                        >
                                            <Flag size={10} />
                                        </button>
                                    )}
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
                                            : msg.side === "FOR"
                                                ? "rgba(16,185,129,0.07)"
                                                : "rgba(239,68,68,0.07)",
                                        color: isMine ? "white" : "var(--text-primary)",
                                        lineHeight: 1.6, fontSize: "0.9rem",
                                        border: isMine ? "none" : `1px solid ${msg.side === "FOR" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                                        boxShadow: isMine ? "0 4px 16px rgba(124,58,237,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
                                    }}>
                                        {msg.content}
                                    </div>

                                    {/* Score pill */}
                                    {msg.aiScore !== undefined && (
                                        <div style={{
                                            position: "absolute", bottom: 0,
                                            [isMine ? "left" : "right"]: "6px",
                                            display: "flex", alignItems: "center", gap: "3px",
                                            background: scoreColor!, color: "white",
                                            fontSize: "0.62rem", fontWeight: 900,
                                            padding: "2px 7px", borderRadius: "100px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
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
            </div>

            {/* ── INPUT AREA ── */}
            <div style={{
                position: "relative", zIndex: 1,
                borderTop: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
                padding: "12px 16px",
            }}>
                {socketError && (
                    <div style={{ marginBottom: "8px", padding: "7px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--error)", fontSize: "0.78rem" }}>
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
                            !isOngoing ? "Debate has ended." :
                                isMyTurn ? "Your argument… (Enter to send · Shift+Enter for new line)" :
                                    "Waiting for opponent…"
                        }
                        style={{
                            flex: 1, padding: "11px 16px", borderRadius: "14px",
                            border: `1.5px solid ${canType ? "rgba(139,92,246,0.5)" : "var(--border)"}`,
                            backgroundColor: "var(--bg-primary)", color: "var(--text-primary)",
                            outline: "none", resize: "none", overflow: "hidden",
                            fontSize: "0.92rem", lineHeight: 1.5,
                            transition: "border-color 0.2s, box-shadow 0.2s",
                            opacity: canType ? 1 : 0.5, fontFamily: "inherit",
                            boxShadow: canType ? "0 0 0 3px rgba(139,92,246,0.06)" : "none",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!canType || !input.trim()}
                        style={{
                            width: "44px", height: "44px", borderRadius: "14px", border: "none", flexShrink: 0,
                            background: canType && input.trim() ? "linear-gradient(135deg, var(--primary), #7c3aed)" : "var(--bg-elevated)",
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                        <button onClick={handleForfeit} style={{
                            background: "none", border: "none", padding: "4px 8px", borderRadius: "6px",
                            color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px", opacity: 0.5, transition: "opacity 0.2s",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                        >
                            <LogOut size={12} /> Forfeit
                        </button>
                        <button onClick={handlePass} disabled={!canType} style={{
                            background: "none", border: "none", padding: "4px 8px", borderRadius: "6px",
                            color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600,
                            cursor: canType ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", gap: "4px",
                            opacity: canType ? 0.7 : 0.3, transition: "opacity 0.2s",
                        }}
                            onMouseEnter={e => { if (canType) e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={e => { if (canType) e.currentTarget.style.opacity = "0.7"; }}
                        >
                            <SkipForward size={12} /> Pass Turn
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes floatAnim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.92) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
            `}</style>
        </div>
    );
}

// ── PlayerChip sub-component ──────────────────────────────────────────────────
function PlayerChip({ username, side, isCurrentTurn, isMe, avgScore, winner, reverse }: {
    username: string; side: "FOR" | "AGAINST"; isCurrentTurn: boolean;
    isMe: boolean; avgScore: number | null; winner: string | null; reverse?: boolean;
}) {
    const isWin = winner === side;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 10px", borderRadius: "9px",
            background: isCurrentTurn ? (side === "FOR" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)") : "var(--bg-secondary)",
            border: `1px solid ${isCurrentTurn ? (side === "FOR" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)") : "var(--border)"}`,
            transition: "all 0.3s ease",
            flexDirection: reverse ? "row-reverse" : "row",
            position: "relative",
        }}>
            {isWin && <span style={{ position: "absolute", top: "-8px", [reverse ? "left" : "right"]: "6px", fontSize: "12px" }}>🏆</span>}
            <div style={{
                width: "22px", height: "22px", borderRadius: "50%",
                background: side === "FOR" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                border: `2px solid ${side === "FOR" ? "var(--success)" : "var(--error)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", fontWeight: 900,
                color: side === "FOR" ? "var(--success)" : "var(--error)",
            }}>
                {username[0].toUpperCase()}
            </div>
            <div style={{ textAlign: reverse ? "right" : "left" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1 }}>
                    {username} {isMe && <span style={{ fontSize: "0.6rem", color: "var(--primary)", fontWeight: 600 }}>you</span>}
                </div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: side === "FOR" ? "var(--success)" : "var(--error)" }}>
                    {side === "FOR" ? "▲ FOR" : "▼ AGAINST"}
                </div>
            </div>
            {avgScore !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "1px 5px", borderRadius: "100px", background: side === "FOR" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", fontSize: "0.6rem", fontWeight: 900, color: side === "FOR" ? "var(--success)" : "var(--error)" }}>
                    <Star size={7} style={{ fill: "currentColor" }} />{avgScore}
                </div>
            )}
        </div>
    );
}
