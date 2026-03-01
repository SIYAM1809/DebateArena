import Link from "next/link";
import { Github, Twitter, MessageSquare } from "lucide-react";
import Image from "next/image";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            style={{
                marginTop: '96px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg-base)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Subtle background glow effect behind the footer */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    height: '500px',
                    maxWidth: '1000px',
                    opacity: 0.04,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 80% 80% at 50% -20%, var(--primary) 0%, transparent 100%)'
                }}
            />

            <div
                style={{
                    width: '100%',
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '100px 32px 64px 32px',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {/* Main Footer Flexbox Layout */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '64px 32px'
                    }}
                >
                    {/* Brand Section */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            flex: '1 1 400px',
                            maxWidth: '100%'
                        }}
                    >
                        <Link
                            href="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '32px',
                                textDecoration: 'none'
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--primary-glow)',
                                    background: 'var(--bg-surface)',
                                    boxShadow: '0 0 20px rgba(108, 99, 255, 0.15)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                <Image src="/logo.png" alt="DebateArena Logo" width={40} height={40} style={{ objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.025em', color: '#fff' }}>
                                DebateArena
                            </span>
                        </Link>

                        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '40px', maxWidth: '400px', color: 'var(--text-secondary)' }}>
                            The premier platform for structured, real-time debates.
                            Hone your argumentation skills against global opponents
                            with instant, unbiased judging by AI.
                        </p>

                        {/* Copyright */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: 'auto' }}>
                            <span>&copy; {currentYear} DebateArena.</span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#334155' }}></span>
                            <span>All rights reserved.</span>
                        </div>
                    </div>

                    {/* Links Container Block to ensure they stay together on medium screens */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: '32px 64px',
                            flex: '1 1 400px'
                        }}
                    >
                        {/* Platform Links */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px' }}>
                            <h4 style={{ fontWeight: 700, color: '#fff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                                Platform
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontWeight: 500, fontSize: '0.95rem' }}>
                                <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
                                <Link href="/topics" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Browse Topics</Link>
                                <Link href="/leaderboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Leaderboard</Link>
                                <Link href="/archive" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Debate Archive</Link>
                            </div>
                        </div>

                        {/* Legal Links */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px' }}>
                            <h4 style={{ fontWeight: 700, color: '#fff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                                Legal
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontWeight: 500, fontSize: '0.95rem' }}>
                                <Link href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
                                <Link href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
                            </div>
                        </div>

                        {/* Socials */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px' }}>
                            <h4 style={{ fontWeight: 700, color: '#fff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                                Connect
                            </h4>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <a href="#" style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                    <Twitter width={18} height={18} />
                                    <span className="sr-only">Twitter</span>
                                </a>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                    <Github width={18} height={18} />
                                    <span className="sr-only">GitHub</span>
                                </a>
                                <a href="#" style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                    <MessageSquare width={18} height={18} />
                                    <span className="sr-only">Discord</span>
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Global hover overrides for links that we rendered using strict inline styles */}
            <style>{`
            footer a { transition: all 0.2s ease; }
            footer a:hover { color: #fff !important; }
            footer .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
            `}</style>
        </footer>
    );
}
