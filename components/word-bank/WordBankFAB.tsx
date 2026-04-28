"use client";

import { useCallback, useEffect, useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { QuickAddModal } from "@/app/words/components/QuickAddModal";
import { quickAddWord } from "@/lib/word-bank/queries";
import { useAuth } from "@/components/auth/AuthProvider";

export function WordBankFAB() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  // Global shortcut: N opens, Escape is handled inside QuickAddModal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openModal]);

  if (!user) return null;

  const handleSubmit = async (input: { text: string; context?: string | null }) => {
    setSaving(true);
    try {
      await quickAddWord(input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        title="Add to Word Bank (N)"
        aria-label="Add word to Word Bank"
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 md:bottom-6 md:right-6"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-text-on-accent)",
          boxShadow: "0 4px 20px color-mix(in oklch, var(--color-accent) 40%, transparent)",
        }}
      >
        <BookmarkPlus size={20} />
        {saving && (
          <span
            className="absolute inset-0 rounded-full border-2 border-current animate-spin"
            style={{ borderTopColor: "transparent" }}
          />
        )}
      </button>

      <QuickAddModal
        open={open}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
