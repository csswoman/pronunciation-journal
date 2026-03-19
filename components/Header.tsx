"use client";

import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "./AuthProvider";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { isDark, toggleDarkMode, mounted } = useDarkMode();
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
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
            suppressHydrationWarning
          >
          {!mounted ? (
            // Render placeholder during SSR to match initial client render
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        </div>
      </div>
    </header>
  );
}

