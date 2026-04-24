"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; context?: string | null }) => Promise<void> | void;
  initialText?: string;
}

export function QuickAddModal({ open, onClose, onSubmit, initialText = "" }: QuickAddModalProps) {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset + autofocus when opened.
  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setContext("");
    // Defer to ensure the modal is mounted before focusing.
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, initialText]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Fire and close immediately — UX rule #1.
    void onSubmit({
      text: trimmed,
      context: context.trim() ? context.trim() : null,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--deep-text)]">
              Save a word
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Capture now, AI enriches in the background.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="!p-1.5"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-2.5">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Word or phrase…"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-base text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />

          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
            placeholder="Context (optional) — sentence where you saw it"
            className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Enter to save
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim()}
            size="md"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
