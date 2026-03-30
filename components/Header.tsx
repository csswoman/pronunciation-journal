"use client";

import { useAuth } from "./AuthProvider";

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
    <header className="bg-white dark:bg-gray-800 py-5 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {supabaseEnabled && user && (
            <>
              <span
                className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]"
                title={user.email ?? undefined}
              >
                {accountLabel}
              </span>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

