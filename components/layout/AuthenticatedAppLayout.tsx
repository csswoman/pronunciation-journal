"use client";

import type { User } from "@supabase/supabase-js";
import AuthProvider from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import AppShell from "@/components/layout/AppShell";

export default function AuthenticatedAppLayout({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider initialUser={initialUser}>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </AuthProvider>
  );
}
