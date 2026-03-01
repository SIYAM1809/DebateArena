import Link from "next/link";
import { Github, Twitter, MessageSquare, Swords } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand Section */}
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/20 p-2 rounded-lg" style={{ background: 'var(--primary-glow)' }}>
                                <Swords className="w-5 h-5 text-primary" style={{ color: 'var(--primary)' }} />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-white">
                                DebateArena
                            </span>
                        </Link>
                        <p className="max-w-md" style={{ color: 'var(--text-muted)' }}>
                            The premier platform for structured, real-time debates.
                            Hone your argumentation skills against global opponents,
                            with instant, unbiased judging by AI.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">
                            Platform
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/topics" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Browse Topics
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/archive" className="transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                                    Debate Archive
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Socials & Legal */}
                    <div>
                        <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">
                            Connect
                        </h4>
                        <div className="flex gap-4 mb-8">
                            <a href="#" className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <Twitter className="w-5 h-5" />
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <Github className="w-5 h-5" />
                                <span className="sr-only">GitHub</span>
                            </a>
                            <a href="#" className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)' }}>
                                <MessageSquare className="w-5 h-5" />
                                <span className="sr-only">Discord</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        &copy; {currentYear} DebateArena. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link href="#" className="transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                            Privacy Policy
                        </Link>
                        <Link href="#" className="transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
