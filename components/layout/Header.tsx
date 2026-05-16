"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import { H1 } from "@/components/ui/Typography";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { supabaseEnabled, user, signOutUser } = useAuth();

  const accountLabel = user
    ? (user as { is_anonymous?: boolean }).is_anonymous
      ? "Guest"
      : user.email ?? "User"
    : "";

  return (
    <header className="py-5 border-b border-border-default bg-surface-raised transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 gap-4">
        <H1 className="text-xl font-bold">
          {title}
        </H1>
        <div className="flex items-center gap-3 shrink-0">
          {supabaseEnabled && user && (
            <>
              <span
                className="hidden sm:inline text-sm truncate max-w-[200px] text-fg-muted"
                title={user.email ?? undefined}
              >
                {accountLabel}
              </span>
              <Button
                type="button"
                onClick={() => signOutUser()}
                variant="secondary"
                size="sm"
                className="text-fg"
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

