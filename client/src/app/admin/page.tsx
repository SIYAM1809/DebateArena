"use client";

// Admin Dashboard — platform-level stats, flagged message review, topic management.
// Access is restricted to users with role === "admin" (enforced on both client and server).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
    Users, Swords, Flag, Tag, CheckCircle,
    ToggleLeft, ToggleRight, ShieldAlert, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { SkeletonList } from "@/components/ui/Skeleton";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SiteStats {
    totalUsers: number;
    debates: Record<string, number>;
    totalDebates: number;
    flaggedDebates: number;
    totalTopics: number;
}

interface FlaggedDebate {
    debateId: string;
    topic: { title: string } | null;
    status: string;
    createdAt: string;
    flaggedMessages: { _id: string; content: string; side: string; sender: { username: string } }[];
}

interface AdminTopic {
    _id: string;
    title: string;
    category: string;
    isActive: boolean;
    debateCount: number;
}

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────

async function fetchStats(): Promise<SiteStats> {
    const { data } = await api.get<SiteStats>("/admin/stats");
    return data;
}

async function fetchFlagged(): Promise<FlaggedDebate[]> {
    const { data } = await api.get<{ debates: FlaggedDebate[] }>("/admin/flagged");
    return data.debates;
}

async function fetchTopics(): Promise<AdminTopic[]> {
    const { data } = await api.get<{ topics: AdminTopic[] }>("/admin/topics");
    return data.topics;
}

// ─── STAT BOX ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, icon: Icon, color = "var(--primary)" }: { label: string; value: number | string; icon: React.ElementType; color?: string }) {
    return (
        <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <Icon size={22} color={color} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{label}</div>
        </div>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const qc = useQueryClient();

    // Client-side guard
    useEffect(() => {
        if (user && user.role !== "admin") router.push("/");
    }, [user, router]);

    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["adminStats"], queryFn: fetchStats });
    const { data: flagged, isLoading: flaggedLoading } = useQuery({ queryKey: ["adminFlagged"], queryFn: fetchFlagged });
    const { data: topics, isLoading: topicsLoading } = useQuery({ queryKey: ["adminTopics"], queryFn: fetchTopics });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            api.patch(`/admin/topics/${id}/toggle`, { isActive }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["adminTopics"] });
            toast.success("Topic updated");
        },
        onError: () => toast.error("Failed to update topic"),
    });

    if (!user) return null;

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px" }}>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
                <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: "linear-gradient(135deg, var(--error), #f97316)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 20px rgba(239,68,68,0.3)",
                }}>
                    <ShieldAlert size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontFamily: "var(--font-display)", margin: 0 }}>Admin Dashboard</h1>
                    <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.85rem" }}>
                        Logged in as <strong>{user.username}</strong>
                    </p>
                </div>
            </div>

            {/* ── STATS ── */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
                    Platform Stats
                </h2>
                {statsLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="glass" style={{ height: "100px", borderRadius: "var(--radius-md)" }} />
                        ))}
                    </div>
                ) : stats ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
                        <StatBox label="Users" value={stats.totalUsers} icon={Users} color="var(--primary)" />
                        <StatBox label="Debates" value={stats.totalDebates} icon={Swords} color="var(--info, #60a5fa)" />
                        <StatBox label="Completed" value={stats.debates.COMPLETED ?? 0} icon={CheckCircle} color="var(--success)" />
                        <StatBox label="Flagged" value={stats.flaggedDebates} icon={Flag} color="var(--error)" />
                        <StatBox label="Topics" value={stats.totalTopics} icon={Tag} color="var(--warning)" />
                    </div>
                ) : null}
            </section>

            {/* ── FLAGGED MESSAGES ── */}
            <section style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
                    🚩 Flagged Messages
                </h2>
                {flaggedLoading ? <SkeletonList count={3} /> : !flagged || flagged.length === 0 ? (
                    <div className="glass" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <CheckCircle size={28} color="var(--success)" style={{ marginBottom: "8px" }} />
                        <p>No flagged messages. All clear!</p>
                    </div>
                ) : flagged.map((d) => (
                    <div key={d.debateId} className="glass" style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                                {d.topic?.title ?? "Unknown Topic"}
                            </div>
                            <Link href={`/debate/${d.debateId}`} style={{ fontSize: "0.8rem", color: "var(--primary)" }}>
                                View debate →
                            </Link>
                        </div>
                        {d.flaggedMessages.map((m) => (
                            <div key={m._id} style={{
                                padding: "10px 14px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(239,68,68,0.07)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                marginBottom: "8px",
                            }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                                    <strong style={{ color: m.side === "FOR" ? "var(--success)" : "var(--error)" }}>
                                        [{m.side}]
                                    </strong>{" "}
                                    {m.sender?.username ?? "Unknown"}
                                </div>
                                <div style={{ fontSize: "0.9rem" }}>{m.content}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </section>

            {/* ── TOPIC MANAGEMENT ── */}
            <section>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", color: "var(--text-secondary)" }}>
                    Topic Management
                </h2>
                {topicsLoading ? <SkeletonList count={4} /> : !topics ? null : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {topics.map((t) => (
                            <div key={t._id} className="glass" style={{
                                padding: "14px 18px",
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{t.title}</div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                        {t.category} · {t.debateCount} debates
                                    </div>
                                </div>

                                {/* Active status badge */}
                                <span style={{
                                    padding: "2px 10px",
                                    borderRadius: "100px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: t.isActive ? "var(--success)" : "var(--text-muted)",
                                    background: t.isActive ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
                                    border: `1px solid ${t.isActive ? "var(--success)" : "var(--border)"}`,
                                }}>
                                    {t.isActive ? "Active" : "Inactive"}
                                </span>

                                {/* Toggle button */}
                                <button
                                    onClick={() => toggleMutation.mutate({ id: t._id, isActive: !t.isActive })}
                                    disabled={toggleMutation.isPending}
                                    title={t.isActive ? "Deactivate topic" : "Activate topic"}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: toggleMutation.isPending ? "wait" : "pointer",
                                        color: t.isActive ? "var(--success)" : "var(--text-muted)",
                                        display: "flex",
                                        alignItems: "center",
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    {toggleMutation.isPending
                                        ? <Loader2 size={20} className="animate-spin" />
                                        : t.isActive
                                            ? <ToggleRight size={26} />
                                            : <ToggleLeft size={26} />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
