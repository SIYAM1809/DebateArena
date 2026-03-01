"use client";

// Reusable Button component with loading state and variants.
// Having one shared Button keeps the design consistent across the whole app —
// change styles here, and every button updates automatically.

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children: ReactNode;
    fullWidth?: boolean;
}

// Style maps — keeps inline styles organized
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        background: "linear-gradient(135deg, var(--primary), #7c74ff)",
        color: "white",
        border: "none",
        boxShadow: "0 2px 12px var(--primary-glow)",
    },
    ghost: {
        background: "transparent",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
    },
    danger: {
        background: "transparent",
        color: "var(--error)",
        border: `1px solid var(--error)`,
    },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: "6px 14px", fontSize: "0.8rem" },
    md: { padding: "10px 20px", fontSize: "0.9rem" },
    lg: { padding: "13px 28px", fontSize: "1rem" },
};

export default function Button({
    variant = "primary",
    size = "md",
    isLoading = false,
    fullWidth = false,
    children,
    disabled,
    style,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            disabled={isDisabled}
            style={{
                ...variantStyles[variant],
                ...sizeStyles[size],
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: fullWidth ? "100%" : "auto",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
                transition: "all var(--transition-fast)",
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!isDisabled && variant === "primary") {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px var(--primary-glow)";
                }
                if (!isDisabled && variant === "ghost") {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }
            }}
            onMouseLeave={(e) => {
                if (!isDisabled && variant === "primary") {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px var(--primary-glow)";
                }
                if (!isDisabled && variant === "ghost") {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }
            }}
            {...props}
        >
            {isLoading ? (
                <>
                    {/* Spinning loader */}
                    <span
                        style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "white",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
            ) : null}
            {children}
        </button>
    );
}
