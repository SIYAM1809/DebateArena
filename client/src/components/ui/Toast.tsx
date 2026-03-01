"use client";

// Toast notification system — lightweight, no external dependency.
// Usage: const { toast } = useToast(); toast.success("Saved!");

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        info: (msg: string) => void;
    };
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── TOAST ICON ───────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    success: {
        icon: <CheckCircle size={17} />,
        color: "var(--success)",
        bg: "rgba(34, 197, 94, 0.12)",
        border: "rgba(34, 197, 94, 0.3)",
    },
    error: {
        icon: <XCircle size={17} />,
        color: "var(--error)",
        bg: "rgba(239, 68, 68, 0.12)",
        border: "rgba(239, 68, 68, 0.3)",
    },
    info: {
        icon: <Info size={17} />,
        color: "var(--primary)",
        bg: "rgba(139, 92, 246, 0.12)",
        border: "rgba(139, 92, 246, 0.3)",
    },
};

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // Max 5
        setTimeout(() => dismiss(id), 4000); // Auto-dismiss after 4 s
    }, [dismiss]);

    const toast = {
        success: (msg: string) => push(msg, "success"),
        error: (msg: string) => push(msg, "error"),
        info: (msg: string) => push(msg, "info"),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast container — bottom-right */}
            <div
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    pointerEvents: "none",
                }}
            >
                {toasts.map((t) => {
                    const cfg = TOAST_CONFIG[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 16px",
                                borderRadius: "var(--radius-md)",
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                color: cfg.color,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                                backdropFilter: "blur(12px)",
                                minWidth: "240px",
                                maxWidth: "360px",
                                pointerEvents: "all",
                                animation: "toast-slide-in 0.25s ease",
                            }}
                        >
                            {cfg.icon}
                            <span style={{ flex: 1, fontSize: "0.9rem", lineHeight: 1.4, color: "var(--text-primary)" }}>
                                {t.message}
                            </span>
                            <button
                                onClick={() => dismiss(t.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex", alignItems: "center" }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes toast-slide-in {
                    from { opacity: 0; transform: translateX(24px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}
