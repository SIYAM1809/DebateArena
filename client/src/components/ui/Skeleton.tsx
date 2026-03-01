// Skeleton — pulsing placeholder blocks for loading states.
// Use <Skeleton> for a single block, <SkeletonCard> for a full card.

"use client";

import React from "react";

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = "16px", borderRadius = "var(--radius-sm)", style }: SkeletonProps) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                background: "linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-secondary) 50%, var(--bg-elevated) 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-pulse 1.4s ease-in-out infinite",
                ...style,
            }}
        />
    );
}

export function SkeletonCard() {
    return (
        <div
            className="glass"
            style={{ padding: "20px 24px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "10px" }}
        >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Skeleton width="70px" height="22px" borderRadius="100px" />
                <Skeleton width="90px" height="16px" />
            </div>
            <Skeleton height="20px" width="80%" />
            <Skeleton height="15px" width="60%" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <Skeleton width="100px" height="14px" />
                <Skeleton width="60px" height="14px" />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    );
}

// Inject the keyframe animation globally once
if (typeof document !== "undefined") {
    const styleId = "skeleton-keyframes";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `@keyframes skeleton-pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
        document.head.appendChild(style);
    }
}
