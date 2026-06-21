"use client";

import AuthProvider from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import AppShell from "@/components/layout/AppShell";

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </AuthProvider>
  );
}
