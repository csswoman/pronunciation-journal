"use client";

import { useAuth } from "./AuthProvider";
import Button from "@/components/ui/Button";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { supabaseEnabled, user, signOutUser } = useAuth();

  const accountLabel = user
    ? (user as { is_anonymous?: boolean }).is_anonymous
      ? "Invitado"
      : user.email ?? "Usuario"
    : "";

  return (
    <header className="py-5 border-b transition-colors" 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 gap-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {supabaseEnabled && user && (
            <>
              <span
                className="hidden sm:inline text-sm truncate max-w-[200px]"
                style={{ color: 'var(--text-secondary)' }}
                title={user.email ?? undefined}
              >
                {accountLabel}
              </span>
              <Button
                type="button"
                onClick={() => signOutUser()}
                variant="secondary"
                size="sm"
                className="text-[var(--text-primary)]"
              >
                Salir
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

