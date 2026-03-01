"use client";

// Forgot Password Page — two-step flow:
// Step 1: Enter email → server sends OTP
// Step 2: Enter OTP + new password → password changed

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, KeyRound, Lock } from "lucide-react";
import { api } from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { AxiosError } from "axios";

// ─── STEP 1 SCHEMA (just email) ───────────────────────────────────────────────
const emailSchema = z.object({
    email: z.string().email("Please enter a valid email"),
});

// ─── STEP 2 SCHEMA (otp + new password) ──────────────────────────────────────
const resetSchema = z
    .object({
        otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numbers only"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState(""); // Carry email into step 2
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1 form
    const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
    // Step 2 form
    const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

    // ─── STEP 1: Send OTP ─────────────────────────────────────────────────────
    const onSendOtp = async (data: EmailForm) => {
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email: data.email });
            setEmail(data.email);
            setStep(2);
        } catch (err) {
            const message = (err as AxiosError<{ error: string }>)?.response?.data?.error || "Failed to send code";
            emailForm.setError("root", { message });
        } finally {
            setIsLoading(false);
        }
    };

    // ─── STEP 2: Reset Password ───────────────────────────────────────────────
    const onReset = async (data: ResetForm) => {
        setIsLoading(true);
        try {
            await api.post("/auth/reset-password", {
                email,
                otp: data.otp,
                newPassword: data.newPassword,
            });
            setSuccess(true);
        } catch (err) {
            const message = (err as AxiosError<{ error: string }>)?.response?.data?.error || "Reset failed";
            resetForm.setError("root", { message });
        } finally {
            setIsLoading(false);
        }
    };

    const cardStyle: React.CSSProperties = {
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
    };

    if (success) {
        return (
            <div className="page-center">
                <div className="glass fade-in" style={cardStyle}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
                        <h2 style={{ marginBottom: "8px" }}>Password reset!</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                            Your password has been changed successfully.
                        </p>
                        <Link href="/login">
                            <Button fullWidth>Sign in now</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-center">
            <div className="glass fade-in" style={cardStyle}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h1 style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", marginBottom: "6px" }}>
                        {step === 1 ? "Reset your password" : "Enter the code"}
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {step === 1
                            ? "We'll send a 6-digit code to your email"
                            : `We sent a code to ${email}`}
                    </p>
                </div>

                {/* ── STEP 1 ── */}
                {step === 1 ? (
                    <form
                        onSubmit={emailForm.handleSubmit(onSendOtp)}
                        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                    >
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail size={15} />}
                            error={emailForm.formState.errors.email?.message}
                            {...emailForm.register("email")}
                        />
                        {emailForm.formState.errors.root && (
                            <p style={{ color: "var(--error)", fontSize: "0.85rem" }}>
                                {emailForm.formState.errors.root.message}
                            </p>
                        )}
                        <Button type="submit" isLoading={isLoading} fullWidth>
                            Send reset code
                        </Button>
                    </form>
                ) : (
                    /* ── STEP 2 ── */
                    <form
                        onSubmit={resetForm.handleSubmit(onReset)}
                        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                    >
                        <Input
                            label="6-digit code"
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            leftIcon={<KeyRound size={15} />}
                            error={resetForm.formState.errors.otp?.message}
                            {...resetForm.register("otp")}
                        />
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            leftIcon={<Lock size={15} />}
                            error={resetForm.formState.errors.newPassword?.message}
                            {...resetForm.register("newPassword")}
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            placeholder="••••••••"
                            leftIcon={<Lock size={15} />}
                            error={resetForm.formState.errors.confirmPassword?.message}
                            {...resetForm.register("confirmPassword")}
                        />
                        {resetForm.formState.errors.root && (
                            <p style={{ color: "var(--error)", fontSize: "0.85rem" }}>
                                {resetForm.formState.errors.root.message}
                            </p>
                        )}
                        <Button type="submit" isLoading={isLoading} fullWidth>
                            Reset password
                        </Button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                            }}
                        >
                            ← Try a different email
                        </button>
                    </form>
                )}

                <p
                    style={{
                        textAlign: "center",
                        marginTop: "20px",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                    }}
                >
                    <Link href="/login" style={{ color: "var(--primary)" }}>
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
