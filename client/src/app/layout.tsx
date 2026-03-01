// Root layout — wraps every page in the app.
// This is a Server Component (no "use client") which means Next.js renders it
// on the server and sends HTML to the browser — good for initial page load speed.
//
// Providers.tsx (client component) is imported here to wrap children with
// React Query context without making this whole file a client component.

import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "DebateArena — AI-Judged Structured Debates",
    template: "%s | DebateArena",
  },
  description:
    "Real-time structured debates judged by AI. Match with opponents, argue your position, and get scored on logic, relevance, and persuasiveness.",
  keywords: ["debate", "AI judge", "structured debate", "argument", "logic"],
  openGraph: {
    siteName: "DebateArena",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
