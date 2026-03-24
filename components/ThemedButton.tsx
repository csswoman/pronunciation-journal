"use client";

import React from "react";

export default function ThemedButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium " +
        "bg-[var(--color-accent)] text-[var(--color-text-on-accent)] " +
        "hover:bg-[var(--color-accent-hover)] active:brightness-95 " +
        "focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-opacity-30"
      }
    >
      {children}
    </button>
  );
}
