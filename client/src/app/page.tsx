"use client";

// DebateArena Landing Page — shown to all users at the root URL.
// Logged-in users see a "Start Debating" CTA → /topics
// Logged-out users see Register / Login CTAs.

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Swords, Trophy, Brain, Zap, Users, Star, Bot } from "lucide-react";

// ── FEATURE CARDS ────────────────────────────────────────────────────────────

const features = [
  {
    icon: Swords,
    title: "Real-Time Debates",
    desc: "Face off against a live opponent in a turn-based debate room powered by WebSockets.",
    color: "var(--primary)",
    bg: "rgba(139,92,246,0.12)",
  },
  {
    icon: Brain,
    title: "AI Judging",
    desc: "Every argument is scored instantly by a Hugging Face AI model — no bias, just logic.",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.12)",
  },
  {
    icon: Zap,
    title: "Instant Matchmaking",
    desc: "Pick a topic, join the queue, and get matched with a live opponent in seconds.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    desc: "Climb the global rankings by winning debates and earning high AI scores.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  {
    icon: Users,
    title: "Community Archive",
    desc: "Browse thousands of completed debates, read arguments and learn winning strategies.",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
  },
  {
    icon: Star,
    title: "Earn Your Rank",
    desc: "Your win rate and average AI score build your public profile. Stand out from the crowd.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
  },
  {
    icon: Bot,
    title: "Solo Practice Mode",
    desc: "No opponent? No problem. Debate our AI bot instantly — get real AI scores and try the full experience in 3 minutes.",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
  },
];

// ── HOW IT WORKS STEPS ────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Pick a Topic", desc: "Browse topics by category — Politics, Tech, Philosophy, Science, Society, Ethics." },
  { num: "02", title: "Join the Queue", desc: "Click Start Debate and wait seconds to be matched with a real opponent." },
  { num: "03", title: "Argue Your Case", desc: "Take turns posting arguments. Each message is AI-scored in real time." },
  { num: "04", title: "See Who Won", desc: "When time's up, your scores decide the winner. Climb the leaderboard." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        position: "relative",
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: "10%", left: "15%", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "10%", width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "100px",
          border: "1px solid rgba(139,92,246,0.4)",
          background: "rgba(139,92,246,0.1)",
          fontSize: "0.82rem", fontWeight: 600, color: "var(--primary)",
          marginBottom: "28px", letterSpacing: "0.5px",
        }}>
          <Zap size={13} /> AI-Judged Real-Time Debates
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(2.6rem, 7vw, 5rem)",
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          lineHeight: 1.05,
          marginBottom: "24px",
          maxWidth: "820px",
          background: "linear-gradient(135deg, #fff 40%, var(--primary) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1px",
        }}>
          Debate Smarter.<br />Win With Logic.
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          color: "var(--text-secondary)",
          maxWidth: "560px",
          lineHeight: 1.7,
          marginBottom: "44px",
        }}>
          Pick a topic, get matched with a live opponent in seconds, and let our AI judge every argument. No bias. Just logic.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          {user ? (
            <Link href="/topics" style={{
              padding: "14px 32px", borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--primary), #7c74ff)",
              color: "white", fontWeight: 700, fontSize: "1rem",
              textDecoration: "none", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
            }}>
              <Swords size={18} /> Start Debating
            </Link>
          ) : (
            <>
              <Link href="/register" style={{
                padding: "14px 32px", borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, var(--primary), #7c74ff)",
                color: "white", fontWeight: 700, fontSize: "1rem",
                textDecoration: "none", boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
              }}>
                Get Started — Free
              </Link>
              <Link href="/login" style={{
                padding: "14px 32px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem",
                textDecoration: "none",
              }}>
                Sign In
              </Link>
            </>
          )}
          <Link href="/leaderboard" style={{
            padding: "14px 24px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-secondary)", fontWeight: 500, fontSize: "1rem",
            textDecoration: "none", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Trophy size={16} /> Leaderboard
          </Link>
          <Link href="/topics" style={{
            padding: "14px 24px", borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(139,92,246,0.4)",
            background: "rgba(139,92,246,0.08)",
            color: "var(--primary)", fontWeight: 600, fontSize: "1rem",
            textDecoration: "none", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Bot size={16} /> Try Solo Practice
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "40px", marginTop: "64px", flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { val: "Real-Time", label: "WebSocket debates" },
            { val: "AI Scored", label: "every argument" },
            { val: "$0", label: "free forever" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>{s.val}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 20px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>
          How It Works
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "48px" }}>
          From zero to debating in under 60 seconds.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {steps.map((step) => (
            <div key={step.num} className="glass" style={{
              padding: "24px", borderRadius: "var(--radius-md)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                fontSize: "3rem", fontWeight: 900, color: "var(--primary)", opacity: 0.15,
                position: "absolute", top: "8px", right: "12px", lineHeight: 1,
              }}>
                {step.num}
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px", letterSpacing: "1px" }}>
                STEP {step.num}
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>{step.title}</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 20px", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>
          Everything You Need to Win
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "48px" }}>
          A complete debate platform built for serious thinkers.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {features.map((f) => (
            <div key={f.title} className="glass" style={{
              padding: "24px 28px", borderRadius: "var(--radius-md)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: f.bg, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "16px",
              }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "8px", fontSize: "1.05rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 20px" }}>
        <div style={{
          maxWidth: "700px", margin: "0 auto", textAlign: "center",
          padding: "60px 40px", borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))",
          border: "1px solid rgba(139,92,246,0.3)",
        }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "16px" }}>
            Ready to Test Your Argument Skills?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "1.05rem" }}>
            Join DebateArena today. It&apos;s free, real-time, and AI-powered.
          </p>
          <Link href={user ? "/topics" : "/register"} style={{
            padding: "16px 40px", borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--primary), #7c74ff)",
            color: "white", fontWeight: 800, fontSize: "1.05rem",
            textDecoration: "none",
            boxShadow: "0 10px 40px rgba(139,92,246,0.5)",
            display: "inline-block",
          }}>
            {user ? "Browse Topics →" : "Create Free Account →"}
          </Link>
        </div>
      </section>

    </div>
  );
}
