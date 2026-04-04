"use client";

import { useUserRole } from "@/hooks/useUserRole";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isPremium, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Checking permissions…</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--page-bg)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-tertiary)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Access restricted</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This section requires admin role.</p>
      </div>
    );
  }

  return <>{children}</>;
}
