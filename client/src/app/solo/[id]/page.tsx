"use client";

/**
 * Solo Practice Debate Room
 * ─────────────────────────────────────────────────────────────────────────────
 * This page is nearly identical to the live debate room (/debate/[id]/page.tsx)
 * but uses `solo:*` socket events instead of `debate:*`, and renders the opponent
 * as "🤖 AI Bot" instead of a real username.
 *
 * TEACHING NOTE — Why copy instead of making a shared component?
 *   The solo and live rooms look the same but differ in enough places
 *   (socket events, opponent display, timer duration, button labels, flag visibility)
 *   that a shared component would need so many conditional props it becomes
 *   harder to read than two focused files. This is a deliberate tradeoff.
 *
 * Key differences from /debate/[id]/page.tsx:
 *   1. Emits solo:join / solo:message / solo:end_turn / solo:forfeit
 *   2. Opponent is displayed as "🤖 AI Bot" (identified by BOT_USER_ID constant)
 *   3. Flag button is hidden (no point flagging a bot)
 *   4. "Forfeit" is renamed "Quit Practice"
 *   5. A prominent "SOLO PRACTICE" banner shows at the top
 *   6. Bot messages show a pulsing "thinking" state while waiting for the bot's reply
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, AlertCircle, Bot, LogOut, SkipForward } from "lucide-react";
import { api } from "@/lib/api";
import { IDebate, DebateStatus } from "@/lib/constants";
import { useAuth, getSocket } from "@/hooks/useAuth";
import { useDebateTimer } from "@/hooks/useDebateTimer";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

/**
 * The bot's reserved MongoDB ObjectId (must match server/src/features/debate/solo.service.ts).
 * We use this to identify bot messages for special rendering.
 */
const BOT_USER_ID = "000000000000000000000001";

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function SoloPracticeRoom() {
    const params = useParams();
    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { toast } = useToast();
    const debateId = params.id as string;

    // Local state
    const [debate, setDebate] = useState<IDebate | null>(null);
    const [input, setInput] = useState("");
    const [socketError, setSocketError] = useState("");
    const [isBotThinking, setIsBotThinking] = useState(false); // Pulsing "bot is thinking" indicator

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── HTTP FETCH ───
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

    // ─── SOCKET CONNECTION ───
    useEffect(() => {
        if (!accessToken || !debateId) return;

        const socket = getSocket(accessToken);

        // Join the solo room
        socket.emit("solo:join", { debateId });

        socket.on("debate:updated", (updatedDebate: IDebate) => {
            setDebate(updatedDebate);
            setSocketError("");
            // When the bot responds, we know it's done "thinking"
            setIsBotThinking(false);
        });

        socket.on("debate:error", (err: { message: string }) => {
            setSocketError(err.message);
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
    }, [debate?.messages, isBotThinking]);

    // ─── TIMER HOOK ───
    const { secondsLeft } = useDebateTimer(debate?.turnEndsAt || null);

    // ─── DERIVED STATE ───
    // In solo mode the user always plays FOR
    const mySide = "FOR" as const;
    const isMyTurn = debate?.currentTurn === mySide;
    const isOngoing = debate?.status === DebateStatus.ONGOING;
    const canType = isOngoing && isMyTurn && !isBotThinking;

    // ─── ACTIONS ───
    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !canType || !accessToken) return;

        const socket = getSocket(accessToken);
        socket.emit("solo:message", {
            debateId,
            content: input.trim(),
        });

        setInput("");
        setIsBotThinking(true); // Show "AI is thinking..." state
    };

    const handlePassTurn = () => {
        if (!canType || !accessToken) return;
        getSocket(accessToken).emit("solo:end_turn", { debateId });
        setIsBotThinking(true);
    };

    const handleQuitPractice = () => {
        if (confirm("Quit this practice session? Your progress will not count for rankings.") && accessToken) {
            getSocket(accessToken).emit("solo:forfeit", { debateId });
            toast.info("Practice session ended.");
            router.push("/topics");
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
                <h2 style={{ color: "var(--error)", marginBottom: "16px" }}>Failed to load practice session</h2>
                <Button onClick={() => router.push("/topics")} variant="ghost">Back to Topics</Button>
            </div>
        );
    }

    const totalSeconds = 90;
    const progressPercent = Math.max(0, (secondsLeft / totalSeconds) * 100);

    return (
        <div style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "20px",
            height: "calc(100vh - 80px)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
        }}>

            {/* ── SOLO MODE BANNER ── */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.1))",
                border: "1px solid rgba(139,92,246,0.3)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--primary)",
            }}>
                <Bot size={16} />
                SOLO PRACTICE MODE — Debate the AI Bot. Results don&apos;t affect your ranking.
            </div>

            {/* ── HEADER ── */}
            <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                            Round {debate.round}
                        </span>
                        <h1 style={{ fontSize: "1.5rem", marginTop: "4px" }}>{debate.topicId.title}</h1>
                    </div>

                    {/* Players banner */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.88rem" }}>
                        <div style={{
                            padding: "6px 12px", borderRadius: "8px",
                            background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)",
                            color: "var(--success)", fontWeight: 600,
                        }}>
                            👤 You (FOR)
                        </div>
                        <span style={{ color: "var(--text-muted)" }}>vs</span>
                        <div style={{
                            padding: "6px 12px", borderRadius: "8px",
                            background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)",
                            color: "var(--primary)", fontWeight: 600,
                        }}>
                            🤖 AI Bot (AGAINST)
                        </div>
                    </div>
                </div>

                {/* Timer bar */}
                {isOngoing && debate.currentTurn && (
                    <div style={{ marginTop: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 500 }}>
                            <span style={{ color: isMyTurn ? "var(--primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {isMyTurn ? "YOUR TURN" : (
                                    isBotThinking ? (
                                        <>
                                            <span style={{
                                                display: "inline-block",
                                                width: "8px", height: "8px",
                                                borderRadius: "50%",
                                                background: "var(--primary)",
                                                animation: "pulse 1s infinite",
                                            }} />
                                            AI BOT IS THINKING...
                                        </>
                                    ) : "AI BOT&apos;S TURN"
                                )}
                            </span>
                            {isMyTurn && (
                                <span style={{ color: secondsLeft <= 10 ? "var(--error)" : "inherit" }}>
                                    {secondsLeft}s remaining
                                </span>
                            )}
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-secondary)", borderRadius: "100px", overflow: "hidden" }}>
                            <div
                                style={{
                                    height: "100%",
                                    width: isMyTurn ? `${progressPercent}%` : "100%",
                                    backgroundColor: secondsLeft <= 10 ? "var(--error)" : "var(--primary)",
                                    transition: isMyTurn ? "width 1s linear, background-color 0.3s ease" : "none",
                                    animation: !isMyTurn ? "pulse-bar 1.5s ease-in-out infinite" : "none",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Result banner */}
                {debate.status !== DebateStatus.ONGOING && debate.status !== DebateStatus.WAITING && (
                    <div style={{
                        marginTop: "16px",
                        padding: "20px",
                        borderRadius: "12px",
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        background: debate.winner === mySide
                            ? "rgba(16, 185, 129, 0.15)"
                            : debate.winner === "AGAINST"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(139, 92, 246, 0.15)",
                        color: debate.winner === mySide
                            ? "var(--success)"
                            : debate.winner === "AGAINST"
                                ? "var(--error)"
                                : "var(--primary)",
                        border: `1px solid ${debate.winner === mySide ? "rgba(16,185,129,0.3)" : debate.winner === "AGAINST" ? "rgba(239,68,68,0.3)" : "rgba(139,92,246,0.3)"}`,
                    }}>
                        {debate.status === DebateStatus.COMPLETED ? (
                            debate.winner === mySide ? "🏆 You Won the Practice Round!" :
                                debate.winner === "AGAINST" ? "🤖 The AI Bot Won — Keep Practicing!" :
                                    "🤝 It's a Tie!"
                        ) : (
                            "Practice session ended."
                        )}
                        <div style={{ marginTop: "12px" }}>
                            <Button size="sm" onClick={() => router.push("/topics")} style={{ marginRight: "10px" }}>
                                Try Another Topic
                            </Button>
                        </div>
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
                overflow: "hidden",
            }}>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "8px" }}>
                    {debate.messages.length === 0 ? (
                        <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", flexDirection: "column", gap: "12px" }}>
                            <Bot size={40} style={{ opacity: 0.3 }} />
                            <span>You go first — type your opening argument below!</span>
                        </div>
                    ) : (
                        debate.messages.map((msg, i) => {
                            const isBot = msg.sender._id === BOT_USER_ID;
                            const isMine = !isBot; // In solo mode, all non-bot messages are yours

                            return (
                                <div key={msg._id || i} style={{
                                    alignSelf: isMine ? "flex-end" : "flex-start",
                                    maxWidth: "80%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isMine ? "flex-end" : "flex-start",
                                }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", padding: "0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        {isBot ? (
                                            <><Bot size={11} /> AI Bot • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                                        ) : (
                                            <>{user?.username ?? "You"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
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
                                        position: "relative",
                                        border: isBot ? "1px solid rgba(139, 92, 246, 0.2)" : "none",
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
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
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

                    {/* Bot thinking indicator */}
                    {isBotThinking && (
                        <div style={{
                            alignSelf: "flex-start",
                            maxWidth: "80%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                        }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", padding: "0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Bot size={11} /> AI Bot is composing a reply...
                            </span>
                            <div style={{
                                padding: "14px 20px",
                                borderRadius: "16px",
                                borderBottomLeftRadius: "4px",
                                backgroundColor: "var(--bg-secondary)",
                                border: "1px solid rgba(139, 92, 246, 0.2)",
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: "8px", height: "8px", borderRadius: "50%",
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
                            !isOngoing ? "Practice session has ended." :
                                isBotThinking ? "Waiting for AI Bot reply..." :
                                    isMyTurn ? "Type your argument..." : "Waiting for AI Bot..."
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
                            opacity: canType ? 1 : 0.6,
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

                {/* Controls */}
                {isOngoing && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleQuitPractice}
                            style={{ opacity: 0.8, display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <LogOut size={14} /> Quit Practice
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePassTurn}
                            disabled={!canType}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <SkipForward size={14} /> Pass Turn
                        </Button>
                    </div>
                )}
            </div>

            {/* ── KEYFRAME ANIMATIONS ── */}
            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-8px); }
                }
                @keyframes pulse-bar {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
