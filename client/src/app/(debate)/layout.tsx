// Debate room layout — no footer, no scroll, full viewport
// The debate room IS the product — it deserves the full screen.
import Navbar from "@/components/layout/Navbar";
import Providers from "@/app/providers";

export default function DebateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Navbar />
            <main style={{ flex: 1, overflow: "hidden" }}>
                {children}
            </main>
        </div>
    );
}
