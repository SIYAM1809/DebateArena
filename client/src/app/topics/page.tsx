"use client";

// Topics Browse Page
// Users land here after login. Displays topics fetched from /api/v1/topics.
// Implements category filtering, search, and loading states.
// Uses React Query for data fetching (caching, deduping, background updates).

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { TOPIC_CATEGORIES, TopicCategory, Topic } from "@/lib/constants";
import TopicCard from "@/components/topics/TopicCard";
import MatchmakingQueue, { QueueState } from "@/components/matchmaking/MatchmakingQueue";
import Input from "@/components/ui/Input";

interface TopicsResponse {
    topics: Topic[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function TopicsPage() {

    // ─── STATE ───
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<TopicCategory | "All">("All");
    const [queueState, setQueueState] = useState<QueueState | null>(null);

    // ─── DATA FETCHING ───
    // useQuery automatically re-fetches when queryKey changes (search or category)
    const { data, isLoading, isError } = useQuery({
        queryKey: ["topics", activeCategory, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeCategory !== "All") params.append("category", activeCategory);
            if (search) params.append("search", search);

            const res = await api.get<TopicsResponse>(`/topics?${params.toString()}`);
            return res.data;
        },
        // Keep stale data while searching to prevent UI flashes
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // ─── ACTIONS ───
    const handleJoinQueue = (topicId: string, side: "FOR" | "AGAINST" | "RANDOM") => {
        const topic = data?.topics.find(t => t._id === topicId);
        if (!topic) return;

        setQueueState({
            topicId,
            topicTitle: topic.title,
            side,
        });
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
            {/* ── HEADER ── */}
            <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <h1
                    className="gradient-text"
                    style={{
                        fontSize: "2.5rem",
                        fontFamily: "var(--font-display)",
                        marginBottom: "12px",
                        display: "inline-block"
                    }}
                >
                    Choose Your Battleground
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                    Select a topic you&apos;re passionate about and join the matchmaking queue to debate a live opponent.
                </p>
            </div>

            {/* ── CONTROLS (Search & Filter) ── */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    marginBottom: "40px"
                }}
            >
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                    {/* Search Bar */}
                    <div style={{ flex: "1 1 300px", maxWidth: "500px" }}>
                        <Input
                            placeholder="Search topics..."
                            leftIcon={<Search size={18} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        justifyContent: "center"
                    }}
                >
                    {["All", ...TOPIC_CATEGORIES].map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category as TopicCategory | "All")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "100px",
                                border: "1px solid",
                                borderColor: activeCategory === category ? "var(--primary)" : "var(--border)",
                                background: activeCategory === category ? "rgba(139, 92, 246, 0.1)" : "transparent",
                                color: activeCategory === category ? "var(--primary)" : "var(--text-secondary)",
                                fontSize: "0.9rem",
                                fontWeight: activeCategory === category ? 600 : 500,
                                cursor: "pointer",
                                transition: "all var(--transition-fast)",
                            }}
                            onMouseEnter={(e) => {
                                if (activeCategory !== category) {
                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
                                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeCategory !== category) {
                                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                                }
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT GRID ── */}
            {isLoading ? (
                // Loading State
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", color: "var(--primary)" }}>
                    <Loader2 size={40} className="animate-spin" />
                </div>
            ) : isError ? (
                // Error State
                <div className="glass" style={{ textAlign: "center", padding: "60px", color: "var(--error)" }}>
                    <h3>Failed to load topics.</h3>
                    <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Please check your connection and try again.</p>
                </div>
            ) : data?.topics.length === 0 ? (
                // Empty State
                <div className="glass" style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Search size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No topics found</h3>
                    <p style={{ color: "var(--text-muted)" }}>
                        We couldn&apos;t find any topics matching your search.
                    </p>
                </div>
            ) : (
                // Grid
                <div
                    className="fade-in"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "24px"
                    }}
                >
                    {data?.topics.map((topic) => (
                        <TopicCard
                            key={topic._id}
                            topic={topic}
                            onJoinQueue={handleJoinQueue}
                            isQueueingFor={queueState?.topicId}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Context */}
            {data && data.pagination.pages > 1 && (
                <div style={{ textAlign: "center", marginTop: "40px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Showing {data.topics.length} of {data.pagination.total} topics
                </div>
            )}

            {/* Matchmaking Overlay */}
            <MatchmakingQueue
                queueState={queueState}
                onCancel={() => setQueueState(null)}
            />
        </div>
    );
}
