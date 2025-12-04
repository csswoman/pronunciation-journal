"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

interface HeaderProps {
  title: string;
  activeTab: "words" | "decks";
  onTabChange: (tab: "words" | "decks") => void;
}

export default function Header({ title, activeTab, onTabChange }: HeaderProps) {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <header className="bg-white dark:bg-gray-800 py-5 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
          {title}
        </h1>
        <div className="flex items-center gap-4">
          <nav className="flex justify-center">
            <ul className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <li>
                <button
                  onClick={() => onTabChange("words")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "words"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  style={activeTab === "words" ? { color: "#5468FF" } : {}}
                >
                  My words
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange("decks")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "decks"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  style={activeTab === "decks" ? { color: "#5468FF" } : {}}
                >
                  My decks
                </button>
              </li>
            </ul>
          </nav>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
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

