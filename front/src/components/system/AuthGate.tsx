"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Authentication without authorization.
 *
 * `PanelGuard` answers "may this viewer open this panel", which is the wrong
 * question for `/charts` and `/maps`: those are module surfaces every level may
 * read, not panels. What they were missing was the *first* question — is anyone
 * signed in at all.
 *
 * They previously had only a `ModuleGate`, and `AuthContext.hasModule` returns
 * `true` while the module feed is unknown, which is exactly the state an
 * anonymous visitor is in. Every chart page was therefore reachable logged out.
 *
 * Waits for `authReady` before redirecting, or a page refresh bounces an
 * authenticated user to `/login` before the session has been read — the same
 * ordering `PanelGuard` relies on.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) router.replace("/login");
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400/70 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}