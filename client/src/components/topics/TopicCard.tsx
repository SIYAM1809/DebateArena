"use client";

// Topic Card Component
// Displays a single debate topic on the topics grid.
// Shows the category badge, title, description, popularity, and join buttons.

import { Users, Flame } from "lucide-react";
import { Topic } from "@/lib/constants";
import Button from "@/components/ui/Button";

interface TopicCardProps {
    topic: Topic;
    onJoinQueue: (topicId: string, side: "FOR" | "AGAINST" | "RANDOM") => void;
    isQueueingFor?: string | null; // If this topic ID is currently joining a queue
}


export default function TopicCard({
    topic,
    onJoinQueue,
    isQueueingFor,
}: TopicCardProps) {
    const isJoining = isQueueingFor === topic._id;

    return (
        <div
            className="glass"
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "24px",
                height: "100%", // For equal height grids
                transition: "transform var(--transition-normal)",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
        >
            {/* ── HEADER ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                }}
            >
                <span
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                    }}
                >
                    {topic.category}
                </span>

                {topic.debateCount > 100 && (
                    <div
                        title="Highly debated topic"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "var(--error)", // Orange/red flame
                            fontSize: "0.8rem",
                            fontWeight: 600,
                        }}
                    >
                        <Flame size={14} /> Hot
                    </div>
                )}
            </div>

            {/* ── BODY ── */}
            <h3
                style={{
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    marginBottom: "12px",
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                }}
            >
                {topic.title}
            </h3>
            <p
                style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    flexGrow: 1, // Pushes buttons to bottom
                }}
            >
                {topic.description}
            </p>

            {/* ── FOOTER (Popularity & Buttons) ── */}
            <div style={{ marginTop: "24px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        marginBottom: "16px",
                    }}
                >
                    <Users size={14} />
                    {topic.debateCount.toLocaleString()} matches played
                </div>

                {/* Join Queue Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        size="sm"
                        style={{ flex: 1, background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", border: "1px solid rgba(34, 197, 94, 0.2)" }}
                        onClick={() => onJoinQueue(topic._id, "FOR")}
                        disabled={isJoining}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            if (isJoining) return;
                            (e.currentTarget as HTMLElement).style.background = "var(--success)";
                            (e.currentTarget as HTMLElement).style.color = "white";
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            if (isJoining) return;
                            (e.currentTarget as HTMLElement).style.background = "rgba(34, 197, 94, 0.1)";
                            (e.currentTarget as HTMLElement).style.color = "var(--success)";
                        }}
                    >
                        Join FOR
                    </Button>

                    <Button
                        size="sm"
                        style={{ flex: 1, background: "rgba(249, 115, 22, 0.1)", color: "var(--warning)", border: "1px solid rgba(249, 115, 22, 0.2)" }}
                        onClick={() => onJoinQueue(topic._id, "AGAINST")}
                        disabled={isJoining}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            if (isJoining) return;
                            (e.currentTarget as HTMLElement).style.background = "var(--warning)";
                            (e.currentTarget as HTMLElement).style.color = "white";
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            if (isJoining) return;
                            (e.currentTarget as HTMLElement).style.background = "rgba(249, 115, 22, 0.1)";
                            (e.currentTarget as HTMLElement).style.color = "var(--warning)";
                        }}
                    >
                        Join AGAINST
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    style={{ marginTop: "8px" }}
                    onClick={() => onJoinQueue(topic._id, "RANDOM")}
                    isLoading={isJoining}
                >
                    {isJoining ? "Joining..." : "Random Side (Faster)"}
                </Button>
            </div>
        </div>
    );
}
