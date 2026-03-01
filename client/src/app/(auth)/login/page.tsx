"use client";

// Login Page
// react-hook-form handles form state — values, validation, touched state.
// zod defines the validation schema — declarative and type-safe.
// @hookform/resolvers bridges the two together.
//
// This approach means:
// - No manual state (useState) for each field
// - Validation runs on submit AND on change after first submit attempt
// - TypeScript knows the exact shape of valid form data

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, Lock, Swords } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { AxiosError } from "axios";

// ─── ZOD SCHEMA ───────────────────────────────────────────────────────────────
// Defines what valid login data looks like.
// React Hook Form will infer the TypeScript type from this automatically.
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>; // { email: string; password: string }

export default function LoginPage() {
    const { login, isLoading } = useAuth();

    const {
        register,    // Registers inputs with react-hook-form
        handleSubmit, // Wraps our submit handler with validation
        setError,    // Manually set field errors (for server-side errors)
        formState: { errors }, // Validation errors by field name
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data.email, data.password);
        } catch (err) {
            // Server returned an error — show it on the form
            const message =
                (err as AxiosError<{ error: string }>)?.response?.data?.error ||
                "Login failed. Please try again.";
            // Set on "email" field so it appears under the form (not field-specific)
            setError("root", { message });
        }
    };

    return (
        <div className="page-center">
            <div
                className="glass fade-in"
                style={{ width: "100%", maxWidth: "420px", padding: "40px" }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                            boxShadow: "0 0 24px var(--primary-glow)",
                            marginBottom: "16px",
                        }}
                    >
                        <Swords size={22} color="white" />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontFamily: "var(--font-display)",
                            marginBottom: "6px",
                        }}
                    >
                        Welcome back
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        Sign in to your DebateArena account
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ display: "flex", flexDirection: "column", gap: "18px" }}
                >
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        leftIcon={<Mail size={15} />}
                        error={errors.email?.message}
                        {...register("email")}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        leftIcon={<Lock size={15} />}
                        error={errors.password?.message}
                        {...register("password")}
                    />

                    {/* Server-level error (wrong credentials etc.) */}
                    {errors.root && (
                        <div
                            style={{
                                padding: "10px 14px",
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid var(--error)",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--error)",
                                fontSize: "0.85rem",
                            }}
                        >
                            {errors.root.message}
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "-8px",
                        }}
                    >
                        <Link
                            href="/forgot-password"
                            style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" isLoading={isLoading} fullWidth>
                        Sign in
                    </Button>
                </form>

                {/* Divider */}
                <p
                    style={{
                        textAlign: "center",
                        marginTop: "24px",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                    }}
                >
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        style={{ color: "var(--primary)", fontWeight: 600 }}
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
