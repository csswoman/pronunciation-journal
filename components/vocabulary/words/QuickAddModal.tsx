"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, CornerDownLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserDecks, type DeckSummary } from "@/lib/decks/queries";
import { DeckSelector } from "./DeckSelector";
import { QuickAddSuccessState } from "./QuickAddSuccessState";

export interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; context?: string | null; deckId?: string | null }) => Promise<void> | void;
  initialText?: string;
}

export function QuickAddModal({ open, onClose, onSubmit, initialText = "" }: QuickAddModalProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [success, setSuccess] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    getUserDecks(user.id).then(setDecks);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setContext("");
    setSuccess(false);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, initialText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    void onSubmit({ text: trimmed, context: context.trim() || null, deckId: selectedDeckId });
    setSuccess(true);
    setTimeout(() => { onClose(); setSuccess(false); }, 1500);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "oklch(0 0 0 / 0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          "w-full max-w-[448px] overflow-hidden",
          "rounded-[--radius-lg] border border-[--border]",
          "bg-[--surface-raised] shadow-[--shadow-xl]",
          "animate-[modal-in_200ms_ease-out]",
        )}
      >
        {success ? (
          <QuickAddSuccessState />
        ) : (
          <>
            <div className="border-b border-[--border] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold leading-snug text-[--fg]">Save a word</h2>
                  <div className="mt-1 flex items-center gap-1">
                    <Sparkles size={11} className="shrink-0 text-[--primary]" />
                    <span className="text-[11px] leading-none text-[--text-tertiary]">
                      Meaning, IPA &amp; example added automatically
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 rounded-[--radius-sm] p-1 text-[--text-tertiary] transition-colors duration-150 hover:bg-[--surface-sunken] hover:text-[--fg]"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-[--text-tertiary]">
                  Word or phrase
                </label>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
                  }}
                  placeholder="e.g. serendipity"
                  className={cn(
                    "w-full rounded-[--radius-sm] border border-[--border]",
                    "bg-[--surface-sunken] px-3 py-2.5",
                    "text-[0.9375rem] text-[--fg] placeholder:text-[--text-placeholder]",
                    "outline-none transition-[border-color,box-shadow] duration-150",
                    "focus:border-[--border-focus] focus:shadow-[0_0_0_3px_var(--focus-color)]",
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-[--text-tertiary]">
                  Context{" "}
                  <span className="font-normal normal-case opacity-70">(optional)</span>
                </label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSubmit(); }
                  }}
                  rows={2}
                  placeholder="Sentence where you saw it…"
                  className={cn(
                    "w-full resize-none rounded-[--radius-sm] border border-[--border]",
                    "bg-[--surface-sunken] px-3 py-2",
                    "text-sm text-[--fg] placeholder:text-[--text-placeholder]",
                    "outline-none transition-[border-color,box-shadow] duration-150",
                    "focus:border-[--border-focus] focus:shadow-[0_0_0_3px_var(--focus-color)]",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[--border] bg-[--surface-base] px-5 py-3">
              <DeckSelector decks={decks} selectedId={selectedDeckId} onChange={setSelectedDeckId} />
              <Button
                onClick={() => void handleSubmit()}
                disabled={!text.trim()}
                icon={<CornerDownLeft size={13} />}
                iconPosition="right"
                size="sm"
                className="shrink-0 font-semibold"
              >
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
