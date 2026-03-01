"use client";

// User Profile Page — shows user stats, avatar placeholder, and debate history.

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { User, Trophy, Swords, TrendingUp, Calendar, Star, Award } from "lucide-react";
import { api } from "@/lib/api";
import { IDebate, DebateStatus } from "@/lib/constants";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface UserProfile {
    _id: string;
    username: string;
    avatar: string | null;
    role: string;
    stats: {
        debatesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
        forfeits: number;
        totalScore: number;
        avgScore: number;
    };
    createdAt: string;
}

interface DebateHistoryResponse {
    debates: IDebate[];
    total: number;
    totalPages: number;
}

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile> {
    const { data } = await api.get<{ user: UserProfile }>(`/users/${userId}`);
    return data.user;
}

async function fetchUserDebates(userId: string): Promise<DebateHistoryResponse> {
    const { data } = await api.get<DebateHistoryResponse>(`/users/${userId}/debates?limit=10`);
    return data;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
    return (
        <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <Icon size={22} color={color} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
        </div>
    );
}

// ─── DEBATE ROW ───────────────────────────────────────────────────────────────

function DebateHistoryRow({ debate, userId }: { debate: IDebate; userId: string }) {
    const forUser = debate.participants?.FOR as { _id: string; username?: string } | undefined;
    const againstUser = debate.participants?.AGAINST as { _id: string; username?: string } | undefined;
    const topic = debate.topicId as { title?: string } | undefined;

    // Did this user win?
    const userSide = forUser?._id === userId ? "FOR" : "AGAINST";
    const didWin = debate.winner === userSide;
    const isDraw = debate.winner === "TIE";
    const isForfeited = debate.status === DebateStatus.FORFEITED;

    const resultColor = didWin ? "var(--success)" : isDraw ? "var(--warning)" : "var(--error)";
    const resultLabel = didWin ? "Win" : isDraw ? "Draw" : isForfeited ? "Forfeit" : "Loss";

    return (
        <Link href={`/debate/${debate._id}`} style={{ textDecoration: "none" }}>
            <div
                className="glass"
                style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-sm)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
            >
                <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {topic?.title ?? "Unknown Topic"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {forUser?.username ?? "?"} vs {againstUser?.username ?? "?"}
                    </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(debate.createdAt).toLocaleDateString()}
                </div>
                <span style={{
                    padding: "3px 12px",
                    borderRadius: "100px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: resultColor,
                    background: `${resultColor}1a`,
                    border: `1px solid ${resultColor}`,
                    minWidth: "60px",
                    textAlign: "center",
                }}>
                    {resultLabel}
                </span>
            </div>
        </Link>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = use(params);

    const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
        queryKey: ["userProfile", userId],
        queryFn: () => fetchProfile(userId),
    });

    const { data: history } = useQuery({
        queryKey: ["userDebates", userId],
        queryFn: () => fetchUserDebates(userId),
        enabled: !!profile,
    });

    if (profileLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (profileError || !profile) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <h2 style={{ color: "var(--error)" }}>User not found</h2>
                <Link href="/" style={{ color: "var(--primary)", marginTop: "16px", display: "inline-block" }}>← Back to home</Link>
            </div>
        );
    }

    const winRate = profile.stats.debatesPlayed > 0
        ? Math.round((profile.stats.wins / profile.stats.debatesPlayed) * 100)
        : 0;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>

            {/* ── PROFILE HEADER ── */}
            <div className="glass fade-in" style={{ padding: "32px", borderRadius: "var(--radius-md)", marginBottom: "24px", display: "flex", gap: "24px", alignItems: "center" }}>
                {/* Avatar */}
                <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: profile.avatar ? "none" : "linear-gradient(135deg, var(--primary), #a78bfa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                    border: "2px solid var(--primary)",
                }}>
                    {profile.avatar
                        ? <Image src={profile.avatar} alt={profile.username} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <User size={36} color="white" />
                    }
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <h1 style={{ fontSize: "1.8rem", fontFamily: "var(--font-display)", margin: 0 }}>
                            {profile.username}
                        </h1>
                        {profile.role === "admin" && (
                            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "100px", background: "rgba(234,179,8,0.15)", color: "var(--warning)", border: "1px solid var(--warning)" }}>
                                Admin
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        <Calendar size={13} />
                        Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                </div>

                {/* Win rate */}
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: winRate >= 50 ? "var(--success)" : "var(--error)", lineHeight: 1 }}>
                        {winRate}%
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Win Rate</div>
                </div>
            </div>

            {/* ── STATS GRID ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "12px",
                marginBottom: "32px",
            }}>
                <StatCard label="Debates" value={profile.stats.debatesPlayed} icon={Swords} color="var(--primary)" />
                <StatCard label="Wins" value={profile.stats.wins} icon={Trophy} color="var(--success)" />
                <StatCard label="Losses" value={profile.stats.losses} icon={Award} color="var(--error)" />
                <StatCard label="Draws" value={profile.stats.draws} icon={TrendingUp} color="var(--warning)" />
                <StatCard label="Avg Score" value={profile.stats.avgScore?.toFixed(1) ?? "0.0"} icon={Star} color="var(--info, #60a5fa)" />
            </div>

            {/* ── DEBATE HISTORY ── */}
            <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "16px" }}>Recent Debates</h2>

                {!history || history.debates.length === 0 ? (
                    <div className="glass" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No debates yet. <Link href="/topics" style={{ color: "var(--primary)" }}>Join one!</Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {history.debates.map((d) => (
                            <DebateHistoryRow key={d._id} debate={d} userId={userId} />
                        ))}
                    </div>
                )}

                {history && history.total > 10 && (
                    <Link
                        href={`/archive?userId=${userId}`}
                        style={{
                            display: "block",
                            textAlign: "center",
                            marginTop: "16px",
                            color: "var(--primary)",
                            fontSize: "0.9rem",
                        }}
                    >
                        View all {history.total} debates →
                    </Link>
                )}
            </div>
        </div>
    );
}
