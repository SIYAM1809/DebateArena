"use client";

// Leaderboard Page — top users ranked by wins and average AI score.
// Top 3 players get gold / silver / bronze treatments.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Trophy, User, Star, Swords, TrendingUp, Crown } from "lucide-react";
import { api } from "@/lib/api";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardUser {
    _id: string;
    username: string;
    avatar: string | null;
    stats: {
        debatesPlayed: number;
        wins: number;
        losses: number;
        avgScore: number;
    };
}

async function fetchLeaderboard(): Promise<LeaderboardUser[]> {
    const { data } = await api.get<{ users: LeaderboardUser[] }>("/users/leaderboard");
    return data.users;
}

// ─── MEDAL CONFIG ─────────────────────────────────────────────────────────────

const MEDALS: Record<number, { color: string; bg: string; icon: string }> = {
    0: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", icon: "🥇" },
    1: { color: "#C0C0C0", bg: "rgba(192,192,192,0.10)", icon: "🥈" },
    2: { color: "#CD7F32", bg: "rgba(205,127,50,0.12)", icon: "🥉" },
};

// ─── ROW ──────────────────────────────────────────────────────────────────────

function LeaderboardRow({ user, rank }: { user: LeaderboardUser; rank: number }) {
    const medal = MEDALS[rank];
    const winRate = user.stats.debatesPlayed > 0
        ? Math.round((user.stats.wins / user.stats.debatesPlayed) * 100)
        : 0;

    return (
        <Link href={`/profile/${user._id}`} style={{ textDecoration: "none" }}>
            <div
                className="glass"
                style={{
                    padding: "14px 20px",
                    borderRadius: "var(--radius-md)",
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto auto auto",
                    gap: "16px",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    ...(medal ? { background: medal.bg, borderColor: medal.color + "44" } : {}),
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(139,92,246,0.15)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
            >
                {/* Rank */}
                <div style={{ textAlign: "center" }}>
                    {medal ? (
                        <span style={{ fontSize: "1.5rem" }}>{medal.icon}</span>
                    ) : (
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)" }}>
                            #{rank + 1}
                        </span>
                    )}
                </div>

                {/* User */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "36px", height: "36px",
                        borderRadius: "50%",
                        background: user.avatar ? "none" : "linear-gradient(135deg, var(--primary), #a78bfa)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                    }}>
                        {user.avatar
                            ? <Image src={user.avatar} alt={user.username} width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <User size={16} color="white" />
                        }
                    </div>
                    <div>
                        <div style={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: medal ? medal.color : "var(--text-primary)",
                        }}>
                            {user.username}
                            {rank === 0 && <Crown size={14} style={{ marginLeft: "6px", display: "inline", verticalAlign: "middle" }} color="#FFD700" />}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {user.stats.debatesPlayed} debates
                        </div>
                    </div>
                </div>

                {/* Win Rate */}
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: winRate >= 60 ? "var(--success)" : winRate >= 40 ? "var(--warning)" : "var(--error)" }}>
                        {winRate}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Win Rate</div>
                </div>

                {/* Wins */}
                <div style={{ textAlign: "center", minWidth: "50px" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--success)" }}>{user.stats.wins}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Wins</div>
                </div>

                {/* Avg Score */}
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)" }}>
                        {user.stats.avgScore?.toFixed(1) ?? "—"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Avg Score</div>
                </div>
            </div>
        </Link>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
    const { data: users, isLoading, isError } = useQuery({
        queryKey: ["leaderboard"],
        queryFn: fetchLeaderboard,
        staleTime: 60_000, // Cache for 1 minute
    });

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>

            {/* ── HEADER ── */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "56px", height: "56px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #FFD700, #f59e0b)",
                    boxShadow: "0 0 30px rgba(255,215,0,0.3)",
                    marginBottom: "16px",
                }}>
                    <Trophy size={28} color="white" />
                </div>
                <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
                    Leaderboard
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    Top debaters ranked by wins and AI argument scores.
                </p>
            </div>

            {/* ── COLUMN LABELS ── */}
            {users && users.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto auto auto",
                    gap: "16px",
                    padding: "0 20px",
                    marginBottom: "8px",
                }}>
                    <div />
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>PLAYER</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "center", minWidth: "60px" }}>WIN %</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "center", minWidth: "50px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <TrendingUp size={12} /> WINS
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "center", minWidth: "60px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <Star size={12} /> SCORE
                    </div>
                </div>
            )}

            {/* ── TABLE ── */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                </div>
            ) : isError ? (
                <div className="glass" style={{ textAlign: "center", padding: "60px", color: "var(--error)" }}>
                    Failed to load leaderboard.
                </div>
            ) : !users || users.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Swords size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ color: "var(--text-muted)" }}>
                        No debaters yet! <Link href="/topics" style={{ color: "var(--primary)" }}>Be the first.</Link>
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {users.map((u, i) => (
                        <LeaderboardRow key={u._id} user={u} rank={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
