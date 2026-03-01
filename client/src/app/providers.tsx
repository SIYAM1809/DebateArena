"use client";

// Providers wrapper — a Client Component that wraps all children with global providers.
// Layout.tsx itself can stay a Server Component; we push the "use client" down here.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
    // Create the QueryClient inside the component so each browser session
    // gets its own cache (important for SSR — avoids sharing data between users)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // Data is considered fresh for 1 minute
                        retry: 1,             // Only retry failed queries once
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </QueryClientProvider>
    );
}
