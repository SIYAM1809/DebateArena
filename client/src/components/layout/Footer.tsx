import Link from "next/link";
import { Github, Twitter, MessageSquare, Swords } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-24 border-t relative overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>

            {/* Subtle background glow effect behind the footer */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl opacity-[0.03] pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at top, var(--primary) 0%, transparent 70%)'
                }}
            />

            <div className="container mx-auto px-6 py-20 relative z-10">
                {/* 
                    Main Footer Grid Layout
                    5 columns total to balance the weight of the brand description vs links
                */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-16">

                    {/* Brand Section (Takes up 5 columns out of 12) */}
                    <div className="md:col-span-5 flex flex-col items-start pr-12">
                        <Link href="/" className="flex items-center gap-3 mb-8 transition-transform hover:scale-105" style={{ transformOrigin: 'left center' }}>
                            <div className="p-2.5 rounded-xl border shadow-lg" style={{ background: 'var(--primary-dim)', borderColor: 'var(--primary-glow)', boxShadow: '0 0 20px rgba(108, 99, 255, 0.15)' }}>
                                <Swords className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                            </div>
                            <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                                DebateArena
                            </span>
                        </Link>

                        <p className="text-[1.05rem] leading-relaxed mb-10 max-w-[400px]" style={{ color: 'var(--text-secondary)' }}>
                            The premier platform for structured, real-time debates.
                            Hone your argumentation skills against global opponents
                            with instant, unbiased judging by AI.
                        </p>

                        {/* Copyright */}
                        <div className="mt-auto flex items-center gap-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            <span>&copy; {currentYear} DebateArena.</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span>All rights reserved.</span>
                        </div>
                    </div>

                    {/* Spacer column for visual breathing room */}
                    <div className="hidden md:block md:col-span-1"></div>

                    {/* Platform Links (Takes up 2 columns) */}
                    <div className="md:col-span-2 flex flex-col">
                        <h4 className="font-bold text-white mb-8 uppercase tracking-wider text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
                            Platform
                        </h4>
                        <ul className="space-y-5 font-medium text-[0.95rem]">
                            <li>
                                <Link href="/" className="transition-all hover:translate-x-1 inline-block hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/topics" className="transition-all hover:translate-x-1 inline-block hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Browse Topics
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="transition-all hover:translate-x-1 inline-block hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/archive" className="transition-all hover:translate-x-1 inline-block hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Debate Archive
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links (Takes up 2 columns) */}
                    <div className="md:col-span-2 flex flex-col">
                        <h4 className="font-bold text-white mb-8 uppercase tracking-wider text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }}></span>
                            Legal
                        </h4>
                        <ul className="space-y-5 font-medium text-[0.95rem]">
                            <li>
                                <Link href="#" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Socials (Takes up last 2 columns) */}
                    <div className="md:col-span-2 flex flex-col">
                        <h4 className="font-bold text-white mb-8 uppercase tracking-wider text-xs">
                            Connect
                        </h4>
                        <div className="flex gap-4">
                            <a href="#" className="p-3 rounded-xl transition-all hover:-translate-y-1 hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <Twitter className="w-[1.125rem] h-[1.125rem]" />
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl transition-all hover:-translate-y-1 hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <Github className="w-[1.125rem] h-[1.125rem]" />
                                <span className="sr-only">GitHub</span>
                            </a>
                            <a href="#" className="p-3 rounded-xl transition-all hover:-translate-y-1 hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <MessageSquare className="w-[1.125rem] h-[1.125rem]" />
                                <span className="sr-only">Discord</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}
