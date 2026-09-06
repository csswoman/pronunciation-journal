"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { SessionSummaryArgs, TurnSaveable } from "@/lib/ai-practice/tools/registry";

// Planned structure:
// <SessionSummaryCard>
//   <SummarySection> × 3 — Corregimos / Aprendiste / Repasar
//   <SaveAllButton />
// </SessionSummaryCard>

type SaveState = "idle" | "saving" | "saved" | "error";

interface SessionSummaryCardProps {
  summary: SessionSummaryArgs;
  onSaveAll: (learned: TurnSaveable[]) => Promise<void>;
}

export default function SessionSummaryCard({ summary, onSaveAll }: SessionSummaryCardProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const isEmpty =
    summary.corrections.length === 0 &&
    summary.learned.length === 0 &&
    summary.reviewNext.length === 0;

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await onSaveAll(summary.learned);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="layout-stack w-full rounded-xl border border-border-subtle bg-surface-raised p-4">
      <p className="m-0 flex items-center gap-1.5 font-kicker font-semibold text-primary">
        <Sparkles size={14} strokeWidth={2.25} aria-hidden />
        Resumen de la sesión
      </p>

      {isEmpty && (
        <p className="m-0 text-body-sm text-fg-muted">
          Sesión corta, sin correcciones ni palabras nuevas. ¡Nos vemos en la próxima!
        </p>
      )}

      {summary.corrections.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">
            Corregimos ({summary.corrections.length})
          </h3>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {summary.corrections.map((c) => (
              <li key={`${c.original}-${c.corrected}`} className="layout-stack-tight">
                <span className="flex flex-wrap items-center gap-1.5 text-body-sm">
                  <s className="text-fg-subtle">{c.original}</s>
                  <ArrowRight size={13} strokeWidth={2} className="shrink-0 text-fg-subtle" aria-hidden />
                  <b className="font-semibold text-fg">{c.corrected}</b>
                </span>
                {c.rule && <span className="block text-caption text-fg-subtle">{c.rule}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.learned.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">
            Aprendiste ({summary.learned.length})
          </h3>
          <ul className="m-0 list-none space-y-1 p-0">
            {summary.learned.map((item) => (
              <li key={item.text} className="text-body-sm text-fg">
                <b className="font-semibold">{item.text}</b>
                <span className="text-fg-subtle"> — {item.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.reviewNext.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">Repasar</h3>
          <ul className="m-0 list-none space-y-1 p-0">
            {summary.reviewNext.map((label) => (
              <li key={label} className="text-body-sm text-fg-muted">{label}</li>
            ))}
          </ul>
        </section>
      )}

      {summary.learned.length > 0 && (
        <Button
          variant={saveState === "saved" ? "secondary" : "primary"}
          size="sm"
          disabled={saveState === "saving" || saveState === "saved"}
          isLoading={saveState === "saving"}
          onClick={() => void handleSave()}
        >
          {saveState === "saved" ? (
            <>
              <Check size={14} strokeWidth={2.25} aria-hidden />
              Guardado en Guardadas
            </>
          ) : saveState === "error" ? (
            "No se pudo guardar · reintentar"
          ) : (
            "Guardar todo en Guardadas"
          )}
        </Button>
      )}
    </div>
  );
}
