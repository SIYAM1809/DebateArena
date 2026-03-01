"use client";

// Register Page — same pattern as login but with more fields.
// Note: password and confirmPassword cross-field validation handled by zod's
// .refine() — checks that both passwords match before the form submits.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { User, Mail, Lock, Swords } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { AxiosError } from "axios";

// ─── ZOD SCHEMA ───────────────────────────────────────────────────────────────
const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username cannot exceed 20 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
        email: z.string().email("Please enter a valid email"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        // .refine checks conditions that span multiple fields
        message: "Passwords don't match",
        path: ["confirmPassword"], // Error appears under confirmPassword field
    });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser, isLoading } = useAuth();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        try {
            await registerUser(data.username, data.email, data.password);
        } catch (err) {
            const message =
                (err as AxiosError<{ error: string }>)?.response?.data?.error ||
                "Registration failed. Please try again.";
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
                    <h1 style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", marginBottom: "6px" }}>
                        Join DebateArena
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        Create your account and start debating
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                    <Input
                        label="Username"
                        type="text"
                        placeholder="debater_pro"
                        leftIcon={<User size={15} />}
                        error={errors.username?.message}
                        {...register("username")}
                    />

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
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        leftIcon={<Lock size={15} />}
                        error={errors.password?.message}
                        {...register("password")}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        leftIcon={<Lock size={15} />}
                        error={errors.confirmPassword?.message}
                        {...register("confirmPassword")}
                    />

                    {/* Server-level error */}
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

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        style={{ marginTop: "4px" }}
                    >
                        Create Account
                    </Button>
                </form>

                <p
                    style={{
                        textAlign: "center",
                        marginTop: "24px",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                    }}
                >
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
