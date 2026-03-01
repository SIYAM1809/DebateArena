"use client";

// Reusable Input component with label, error state, and icon support.
// Consistent styling across all forms — register, login, profile edit, etc.

import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;   // Error message shown below the input
    leftIcon?: ReactNode;
}

export default function Input({
    label,
    error,
    leftIcon,
    id,
    style,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                    }}
                >
                    {label}
                </label>
            )}

            {/* Input wrapper — needed for icon positioning */}
            <div style={{ position: "relative" }}>
                {leftIcon && (
                    <span
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            pointerEvents: "none",
                        }}
                    >
                        {leftIcon}
                    </span>
                )}

                <input
                    id={inputId}
                    style={{
                        width: "100%",
                        padding: leftIcon ? "11px 14px 11px 38px" : "11px 14px",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        fontFamily: "var(--font-body)",
                        outline: "none",
                        transition: "border-color var(--transition-fast)",
                        ...style,
                    }}
                    onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = error
                            ? "var(--error)"
                            : "var(--primary)";
                    }}
                    onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = error
                            ? "var(--error)"
                            : "var(--border)";
                    }}
                    {...props}
                />
            </div>

            {/* Error message */}
            {error && (
                <span
                    style={{
                        fontSize: "0.78rem",
                        color: "var(--error)",
                    }}
                >
                    {error}
                </span>
            )}
        </div>
    );
}
