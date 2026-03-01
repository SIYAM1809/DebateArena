"use client";

// Navbar — top navigation bar.
// "use client" because it reads auth state (Zustand) and has click handlers.
//
// Shows different links depending on login status:
// - Logged out: Login / Register buttons
// - Logged in: Topics, username, Logout

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Swords, Trophy, User, LogOut, Menu, X, Zap, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

export default function Navbar() {
    const { user, clearAuth } = useAuthStore();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Even if the server call fails, clear client state
        } finally {
            disconnectSocket();
            clearAuth();
        }
    };

    const navLinks = [
        { href: "/topics", label: "Topics", icon: <Swords size={16} /> },
        { href: "/leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
        { href: "/archive", label: "Archive", icon: <Zap size={16} /> },
    ];

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "rgba(10, 10, 15, 0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderBottom: "1px solid var(--border)",
            }}
        >
            <div
                className="container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "64px",
                }}
            >
                {/* ── Logo ── */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                    }}
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                            boxShadow: "0 0 16px var(--primary-glow)",
                        }}
                    >
                        <Swords size={16} color="white" />
                    </span>
                    Debate<span style={{ color: "var(--primary)" }}>Arena</span>
                </Link>

                {/* ── Desktop Nav Links ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                    className="desktop-nav"
                >
                    {navLinks.map(({ href, label, icon }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: isActive(href)
                                    ? "var(--primary)"
                                    : "var(--text-secondary)",
                                background: isActive(href) ? "var(--primary-dim)" : "transparent",
                                transition: "all var(--transition-fast)",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(href)) {
                                    (e.currentTarget as HTMLElement).style.color =
                                        "var(--text-primary)";
                                    (e.currentTarget as HTMLElement).style.background =
                                        "var(--bg-elevated)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(href)) {
                                    (e.currentTarget as HTMLElement).style.color =
                                        "var(--text-secondary)";
                                    (e.currentTarget as HTMLElement).style.background =
                                        "transparent";
                                }
                            }}
                        >
                            {icon}
                            {label}
                        </Link>
                    ))}
                </div>

                {/* ── Auth Section ── */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {user ? (
                        <>
                            {/* Username link to profile */}
                            <Link
                                href={`/profile/${user._id}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "6px 12px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    transition: "all var(--transition-fast)",
                                }}
                            >
                                <User size={14} />
                                {user.username}
                            </Link>

                            {/* Admin shield — only shown to admins */}
                            {user.role === "admin" && (
                                <Link
                                    href="/admin"
                                    title="Admin Dashboard"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        background: "rgba(239,68,68,0.08)",
                                        color: "var(--error)",
                                        transition: "all var(--transition-fast)",
                                    }}
                                >
                                    <ShieldAlert size={16} />
                                </Link>
                            )}

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                title="Logout"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--border)",
                                    background: "transparent",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    transition: "all var(--transition-fast)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.color = "var(--error)";
                                    (e.currentTarget as HTMLElement).style.borderColor =
                                        "var(--error)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.color =
                                        "var(--text-muted)";
                                    (e.currentTarget as HTMLElement).style.borderColor =
                                        "var(--border)";
                                }}
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                    transition: "color var(--transition-fast)",
                                }}
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "white",
                                    background:
                                        "linear-gradient(135deg, var(--primary), #7c74ff)",
                                    boxShadow: "0 2px 12px var(--primary-glow)",
                                    transition: "all var(--transition-fast)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform =
                                        "translateY(-1px)";
                                    (e.currentTarget as HTMLElement).style.boxShadow =
                                        "0 4px 20px var(--primary-glow)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform =
                                        "translateY(0)";
                                    (e.currentTarget as HTMLElement).style.boxShadow =
                                        "0 2px 12px var(--primary-glow)";
                                }}
                            >
                                Get Started
                            </Link>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="mobile-menu-btn"
                        style={{
                            display: "none",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* ── Mobile Menu ── */}
            {menuOpen && (
                <div
                    style={{
                        borderTop: "1px solid var(--border)",
                        padding: "12px 24px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                    }}
                >
                    {navLinks.map(({ href, label, icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 14px",
                                borderRadius: "var(--radius-sm)",
                                color: isActive(href)
                                    ? "var(--primary)"
                                    : "var(--text-secondary)",
                                background: isActive(href) ? "var(--primary-dim)" : "transparent",
                                fontWeight: 500,
                                fontSize: "0.9rem",
                            }}
                        >
                            {icon}
                            {label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Responsive styles */}
            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
        </nav>
    );
}
