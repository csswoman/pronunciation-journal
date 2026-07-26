"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, CornerDownLeft } from "@/components/icons";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const modal = modalRef.current;
    if (modal) modal.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusableElements = modal?.querySelectorAll(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const titleId = "quick-add-modal-title";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-[var(--layout-card-pad)]"
      style={{ background: "var(--overlay-medium)" }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={cn(
          "w-full max-w-md overflow-hidden",
          "rounded-[var(--radius-lg)] border border-border-subtle",
          "bg-surface-raised shadow-xl",
          "animate-[modal-in_200ms_ease-out]",
        )}
      >
        {success ? (
          <QuickAddSuccessState word={text.trim()} />
        ) : (
          <>
            <div className="border-b border-border-subtle layout-card-pad">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-kicker text-fg-subtle">VOCABULARIO</p>
                  <h2 id={titleId} className="mt-1 text-body-lg font-semibold leading-snug text-fg">Guardar palabra</h2>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Sparkles size={13} className="shrink-0 text-primary" />
                    <span className="text-body-sm leading-none text-fg-muted">
                      Añadiremos significado, IPA y ejemplo.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="shrink-0 rounded-[var(--radius-sm)] p-2 text-fg-subtle transition-colors duration-150 hover:bg-surface-sunken hover:text-fg"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-5 layout-card-pad">
              <div className="space-y-1.5">
                <label className="block text-body-sm font-semibold text-fg">
                  Palabra
                </label>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
                  }}
                  placeholder="Por ejemplo: resilient"
                  className={cn(
                  "w-full rounded-[var(--radius-sm)] border border-border-default",
                    "bg-surface-sunken px-3 py-2.5",
                    "text-fg placeholder:text-fg-subtle",
                    "outline-none transition-[border-color,box-shadow] duration-150",
                    "focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]",
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-body-sm font-semibold text-fg">
                  Contexto{" "}
                  <span className="font-normal normal-case text-fg-subtle">(opcional)</span>
                </label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSubmit(); }
                  }}
                  rows={2}
                  placeholder="La frase o situación donde la encontraste."
                  className={cn(
                    "w-full resize-none rounded-[var(--radius-sm)] border border-border-default",
                    "bg-surface-sunken px-3 py-2.5",
                    "text-body-sm text-fg placeholder:text-fg-subtle",
                    "outline-none transition-[border-color,box-shadow] duration-150",
                    "focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]",
                  )}
                />
              </div>
              <p className="-mt-2 text-caption text-fg-subtle">Pulsa Enter para guardar rápido.</p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4 sm:flex-row sm:items-center sm:justify-between">
              <DeckSelector decks={decks} selectedId={selectedDeckId} onChange={setSelectedDeckId} />
              <Button
                onClick={() => void handleSubmit()}
                disabled={!text.trim()}
                icon={<CornerDownLeft size={13} />}
                iconPosition="right"
                size="sm"
                className="shrink-0 sm:min-w-36"
              >
                Guardar palabra
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
