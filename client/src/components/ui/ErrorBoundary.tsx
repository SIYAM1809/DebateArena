"use client";

// ErrorBoundary — React class component that catches unhandled render errors.
// Wrap page sections in this to show a fallback UI instead of a blank screen.
//
// Usage:
//   <ErrorBoundary>
//     <MyComponent />
//   </ErrorBoundary>

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production you'd send this to Sentry / LogRocket etc.
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "80px 20px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <AlertTriangle size={26} color="var(--error)" />
                    </div>

                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "24px", maxWidth: "400px" }}>
                        An unexpected error occurred. Try refreshing the page or going back to the homepage.
                    </p>

                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre
                            style={{
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                padding: "12px 16px",
                                fontSize: "0.78rem",
                                color: "var(--error)",
                                textAlign: "left",
                                marginBottom: "24px",
                                maxWidth: "600px",
                                overflowX: "auto",
                            }}
                        >
                            {this.state.error.message}
                        </pre>
                    )}

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 20px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                                background: "var(--bg-elevated)",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                            }}
                        >
                            <RefreshCw size={15} /> Try again
                        </button>
                        <Link
                            href="/"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 20px",
                                borderRadius: "var(--radius-sm)",
                                background: "linear-gradient(135deg, var(--primary), #7c74ff)",
                                color: "white",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                            }}
                        >
                            ← Home
                        </Link>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
