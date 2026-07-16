"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthGate, AuthProvider, useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <ReadonlyBanner />
        {children}
      </main>
    </div>
  );
}

function ReadonlyBanner() {
  const { user, isFullAccess } = useAuth();
  if (!user || isFullAccess) return null;
  return (
    <div className="readonly-banner">
      Signed in as <strong>{user.email}</strong> with read-only access. Ask an
      admin to invite this email on Team members to unlock editing and the Team
      page.
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <Shell>{children}</Shell>
      </AuthGate>
    </AuthProvider>
  );
}
