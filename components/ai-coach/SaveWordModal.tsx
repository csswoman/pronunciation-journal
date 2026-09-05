"use client";

import { useEffect, useRef, useState } from "react";
import type { Difficulty } from "@/lib/types";
import Button from "@/components/ui/Button";
import { H3 } from "@/components/ui/Typography";

interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

interface SaveWordModalProps {
  word: string;
  context: string;
  onConfirm: (data: SaveWordData) => void;
  onClose: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "Fácil", color: "bg-success-soft text-success border-success" },
  { value: "medium", label: "Medio", color: "bg-warning-soft text-warning border-warning" },
  { value: "hard", label: "Difícil", color: "bg-warning-soft text-warning border-warning" },
];

export default function SaveWordModal({ word, context, onConfirm, onClose }: SaveWordModalProps) {
  const [meaning, setMeaning] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ word, meaning, difficulty, context });
  };

  const titleId = "save-word-modal-title";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md bg-surface-raised rounded-2xl shadow-xl layout-card-pad space-y-4"
      >
        <div className="flex items-center justify-between">
          <H3 id={titleId} className="text-body-lg font-bold">
            Guardar vocabulario
          </H3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            className="text-fg-subtle hover:text-fg-muted dark:hover:text-fg"
            icon={
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
          </Button>
        </div>

        <div className="px-3 py-2 bg-primary-soft rounded-lg">
          <p className="text-body-lg font-semibold text-primary">{word}</p>
          {context !== word && (
            <p className="text-body-sm text-fg-subtle mt-0.5 italic">&ldquo;{context}&rdquo;</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-fg-muted mb-1">
              Significado <span className="text-fg-subtle font-normal">(opcional)</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Añade una definición o traducción..."
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-sunken text-fg placeholder:text-fg-placeholder text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-fg-muted mb-2">
              Dificultad
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <Button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  variant={difficulty === d.value ? "primary" : "secondary"}
                  size="sm"
                  className={`flex-1 ${ difficulty === d.value ? d.color + " ring-2 ring-offset-1 ring-current" : "text-fg-subtle" }`}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              Guardar palabra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
