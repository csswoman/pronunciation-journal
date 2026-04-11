"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface BottomNavProps {
  className?: string;
}

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Practice",
    href: "/practice",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    name: "AI",
    href: "/ai-practice",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: "Progress",
    href: "/progress",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Practice", href: "/practice" },
  { name: "AI Practice", href: "/ai-practice" },
  { name: "Progress", href: "/progress" },
  { name: "Saved Words", href: "/saved-words" },
  { name: "Decks", href: "/decks" },
  { name: "IPA Chart", href: "/ipa" },
  { name: "Lessons", href: "/lessons" },
  { name: "Profile", href: "/profile" },
];

export default function BottomNav({ className = "" }: BottomNavProps) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {showMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
      {showMenu && (
        <div className="fixed bottom-16 left-4 right-4 bg-[var(--card-bg)] border border-[var(--line-divider)] rounded-lg shadow-lg z-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-[var(--primary)] bg-[var(--btn-regular-bg)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t border-[var(--line-divider)] flex items-center justify-around px-2 py-2 ${className}`}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                active
                  ? "text-[var(--primary)] bg-[var(--btn-regular-bg)]"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
            showMenu
              ? "text-[var(--primary)] bg-[var(--btn-regular-bg)]"
              : "text-[var(--text-tertiary)]"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
      </nav>
    </>
  );
}
