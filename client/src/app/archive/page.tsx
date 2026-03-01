"use client";

// Archive Page — Browse all completed and forfeited debates.
// Supports filtering by status and category, with client-side search.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Trophy, SkipForward, Loader2, Calendar, User } from "lucide-react";
import { api } from "@/lib/api";
import Input from "@/components/ui/Input";
import { IDebate } from "@/lib/constants";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface DebateListResponse {
    debates: IDebate[];
    total: number;
    page: number;
    totalPages: number;
}

interface DebateStats {
    WAITING: number;
    ONGOING: number;
    COMPLETED: number;
    FORFEITED: number;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: "Completed", color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
    FORFEITED: { label: "Forfeited", color: "var(--warning)", bg: "rgba(234,179,8,0.1)" },
    ONGOING: { label: "Live", color: "var(--primary)", bg: "rgba(139,92,246,0.1)" },
    WAITING: { label: "Waiting", color: "var(--text-muted)", bg: "rgba(148,163,184,0.1)" },
};

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────

async function fetchDebates(status?: string, page = 1) {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status && status !== "ALL") params.set("status", status);
    const { data } = await api.get<DebateListResponse>(`/debates?${params}`);
    return data;
}

async function fetchStats() {
    const { data } = await api.get<DebateStats>("/debates/stats");
    return data;
}

// ─── DEBATE ROW CARD ──────────────────────────────────────────────────────────

function DebateCard({ debate }: { debate: IDebate }) {
    const status = STATUS_LABELS[debate.status] ?? STATUS_LABELS.WAITING;
    const topic = debate.topicId as { title: string; category: string } | undefined;
    const forUser = debate.participants?.FOR as { username?: string } | undefined;
    const againstUser = debate.participants?.AGAINST as { username?: string } | undefined;

    const winnerLabel =
        debate.winner === "FOR" ? forUser?.username
            : debate.winner === "AGAINST" ? againstUser?.username
                : debate.winner === "TIE" ? "Draw" : null;

    return (
        <Link href={`/debate/${debate._id}`} style={{ textDecoration: "none" }}>
            <div
                className="glass"
                style={{
                    padding: "20px 24px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "16px",
                    alignItems: "center",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(139,92,246,0.15)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
            >
                {/* Left: topic + participants */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span
                            style={{
                                padding: "2px 10px",
                                borderRadius: "100px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: status.color,
                                background: status.bg,
                                border: `1px solid ${status.color}`,
                            }}
                        >
                            {status.label}
                        </span>
                        {topic?.category && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {topic.category}
                            </span>
                        )}
                    </div>

                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
                        {topic?.title ?? "Unknown Topic"}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <User size={13} />
                        <span style={{ color: "var(--success)", fontWeight: 500 }}>{forUser?.username ?? "?"}</span>
                        <span style={{ color: "var(--text-muted)" }}>FOR</span>
                        <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>vs</span>
                        <span style={{ color: "var(--error)", fontWeight: 500 }}>{againstUser?.username ?? "?"}</span>
                        <span style={{ color: "var(--text-muted)" }}>AGAINST</span>
                    </div>
                </div>

                {/* Right: winner + date */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {winnerLabel && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "6px" }}>
                            <Trophy size={14} color="var(--warning)" />
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--warning)" }}>
                                {winnerLabel}
                            </span>
                        </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "0.8rem", justifyContent: "flex-end" }}>
                        <Calendar size={12} />
                        {new Date(debate.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ArchivePage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["debates", statusFilter, page],
        queryFn: () => fetchDebates(statusFilter, page),
    });

    const { data: stats } = useQuery({
        queryKey: ["debateStats"],
        queryFn: fetchStats,
    });

    // Client-side search filter (by topic title)
    const debates = (data?.debates ?? []).filter((d) => {
        if (!search) return true;
        const topic = d.topicId as { title?: string } | undefined;
        return topic?.title?.toLowerCase().includes(search.toLowerCase());
    });

    const STATUS_FILTERS = ["ALL", "COMPLETED", "FORFEITED", "ONGOING", "WAITING"];

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

            {/* ── HEADER ── */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{
                    fontSize: "2.5rem",
                    fontFamily: "var(--font-display)",
                    marginBottom: "8px",
                }}>
                    Debate Archive
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    Browse past debates. Click any row to read the full transcript.
                </p>
            </div>

            {/* ── STATS BAR ── */}
            {stats && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "12px",
                    marginBottom: "28px",
                }}>
                    {[
                        { key: "COMPLETED", label: "Completed", Icon: Trophy, color: "var(--success)" },
                        { key: "ONGOING", label: "Live Now", Icon: Loader2, color: "var(--primary)" },
                        { key: "FORFEITED", label: "Forfeited", Icon: SkipForward, color: "var(--warning)" },
                    ].map(({ key, label, Icon, color }) => (
                        <div key={key} className="glass" style={{ padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                            <Icon size={20} color={color} style={{ marginBottom: "6px" }} />
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{stats[key as keyof DebateStats]}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── SEARCH + FILTERS ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <Input
                    placeholder="Search by topic..."
                    leftIcon={<Search size={16} />}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                padding: "6px 16px",
                                borderRadius: "100px",
                                border: "1px solid",
                                borderColor: statusFilter === s ? "var(--primary)" : "var(--border)",
                                background: statusFilter === s ? "rgba(139,92,246,0.15)" : "transparent",
                                color: statusFilter === s ? "var(--primary)" : "var(--text-secondary)",
                                fontSize: "0.85rem",
                                fontWeight: statusFilter === s ? 600 : 400,
                                cursor: "pointer",
                                transition: "all var(--transition-fast)",
                            }}
                        >
                            {s === "ALL" ? "All" : STATUS_LABELS[s]?.label ?? s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── LIST ── */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Loader2 size={40} className="animate-spin" color="var(--primary)" />
                </div>
            ) : isError ? (
                <div className="glass" style={{ textAlign: "center", padding: "60px", color: "var(--error)" }}>
                    <p>Failed to load debates. Is the backend running?</p>
                </div>
            ) : debates.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Trophy size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ color: "var(--text-muted)" }}>No debates found. Try a different filter.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {debates.map((d) => <DebateCard key={d._id} debate={d} />)}
                </div>
            )}

            {/* ── PAGINATION ── */}
            {data && data.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "32px" }}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        style={{
                            padding: "8px 20px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: page <= 1 ? "var(--text-muted)" : "var(--text-primary)",
                            cursor: page <= 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        ← Prev
                    </button>
                    <span style={{ padding: "8px 16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Page {data.page} of {data.totalPages}
                    </span>
                    <button
                        disabled={page >= data.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        style={{
                            padding: "8px 20px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: page >= data.totalPages ? "var(--text-muted)" : "var(--text-primary)",
                            cursor: page >= data.totalPages ? "not-allowed" : "pointer",
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
