"use client";

import { useEffect, useState } from "react";
import { Search } from "@/components/icons";

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");

  useEffect(() => {
    if (typeof window !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform)) {
      setShortcutLabel("⌘K");
    }
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      onFocus={onOpen}
      className="flex h-10 w-full items-center gap-2 rounded-md border border-border-subtle bg-surface-sunken px-3 text-left text-body-sm text-fg-muted transition-colors hover:border-border-default hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.96]"
      aria-haspopup="dialog"
      aria-label="Buscar en English Journal"
    >
      <Search size={16} aria-hidden />
      <span className="min-w-0 flex-1">Buscar…</span>
      <kbd className="rounded-sm border border-border-subtle bg-surface-raised px-1.5 py-0.5 font-mono text-caption text-fg-subtle">
        {shortcutLabel}
      </kbd>
    </button>
  );
}
