"use client";

interface HeaderProps {
  title: string;
  activeTab: "words" | "decks";
  onTabChange: (tab: "words" | "decks") => void;
}

export default function Header({ title, activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-white py-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-6">
          {title}
        </h1>
        <nav className="flex justify-center">
          <ul className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <li>
              <button
                onClick={() => onTabChange("words")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "words"
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
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
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={activeTab === "decks" ? { color: "#5468FF" } : {}}
              >
                My decks
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

