"use client";

import Link from "next/link";
import type { CefrLevelId } from "@/lib/courses/types";

// Planned structure:
// <AssessmentProgress />
// <AssessmentHeader />
// <AssessmentCoverage />
// <AssessmentFooter />

export function AssessmentProgress({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="assessment-progress-status">
      <div className="assessment-progress-copy" aria-live="polite">
        <strong>{value}</strong>
        <span>de {total}</span>
      </div>
      <div className="assessment-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={label}>
        <span style={{ transform: `scaleX(${total ? value / total : 0})` }} />
      </div>
    </div>
  );
}

export function AssessmentHeader({
  mode,
  userId,
  checkpointLabel,
  sectionLevel,
  showingLevelPrompt,
  showingInventory,
  progressValue,
  progressTotal,
}: {
  mode: "placement" | "checkpoint";
  userId?: string;
  checkpointLabel?: string;
  sectionLevel: CefrLevelId;
  showingLevelPrompt: boolean;
  showingInventory: boolean;
  progressValue: number;
  progressTotal: number;
}) {
  return (
    <header className="assessment-header">
      <Link href={userId ? "/courses" : "/login"} className="assessment-back">
        <span aria-hidden>←</span>
        {userId ? "Volver a cursos" : "Volver al inicio"}
      </Link>
      <div className="assessment-heading-row">
        <div>
          <p className="assessment-kicker">
            {showingLevelPrompt ? "Antes de empezar" : mode === "placement" ? `${showingInventory ? "Temas" : "Prueba de nivel"} · ${sectionLevel.toUpperCase()}` : `Checkpoint ${checkpointLabel ?? ""}`}
          </p>
          <h1>
            {showingLevelPrompt ? "¿Qué nivel crees tener?" : showingInventory ? "¿Qué temas ya conoces?" : mode === "placement" ? "Encuentra tu punto de partida" : "Comprueba lo aprendido"}
          </h1>
          <p>
            {showingLevelPrompt
              ? "Es una referencia inicial, no una nota. Si no estás seguro, empezaremos desde A1 y dejaremos que tus respuestas orienten el resultado."
              : showingInventory
              ? "Sé sincero: después comprobaremos estas ideas con preguntas. Tu respuesta solo ayuda a ordenar el plan."
              : "Responde sin traductor. El resultado adapta tus ejercicios, pero no limita lo que puedes explorar."}
          </p>
        </div>
        {mode === "checkpoint" || (mode === "placement" && !showingLevelPrompt) ? (
          <AssessmentProgress value={progressValue} total={progressTotal} label={showingInventory ? "Temas valorados" : "Preguntas respondidas"} />
        ) : null}
      </div>
    </header>
  );
}

export function AssessmentCoverage({ placementStartIndex, sectionIndex, levels }: { placementStartIndex: number; sectionIndex: number; levels: CefrLevelId[] }) {
  return (
    <aside className="assessment-coverage" aria-label="Cobertura de la evaluación">
      <p className="assessment-coverage-kicker">Cobertura de la evaluación</p>
      <div className="assessment-coverage-list">
        {levels.map((level, index) => {
          const reached = index >= placementStartIndex && index < sectionIndex;
          const current = index === sectionIndex;
          return (
            <div key={level} className={reached ? "assessment-coverage-item assessment-coverage-item--complete" : current ? "assessment-coverage-item assessment-coverage-item--current" : "assessment-coverage-item"}>
              <span aria-hidden>{reached ? "✓" : current ? "•" : "○"}</span>
              <div>
                <strong>{current ? `En curso · ${level.toUpperCase()}` : level.toUpperCase()}</strong>
                <small>{reached ? "Completado" : current ? "Responde este bloque" : index < placementStartIndex ? "No necesario por ahora" : "Pendiente"}</small>
              </div>
            </div>
          );
        })}
      </div>
      <p className="assessment-coverage-note">El nivel de ajustes orienta el inicio; el resultado depende de tus respuestas.</p>
    </aside>
  );
}

export function AssessmentFooter({
  status,
  showBack,
  backLabel,
  primaryLabel,
  primaryDisabled,
  onBack,
  onPrimary,
}: {
  status?: string;
  showBack: boolean;
  backLabel?: string;
  primaryLabel: string;
  primaryDisabled: boolean;
  onBack: () => void;
  onPrimary: () => void;
}) {
  return (
    <footer className="assessment-footer">
      {status ? <p>{status}</p> : <span aria-hidden />}
      <div className="assessment-footer-actions">
        {showBack && <button type="button" className="assessment-secondary-action" onClick={onBack}>{backLabel}</button>}
        <button type="button" disabled={primaryDisabled} onClick={onPrimary}>{primaryLabel}</button>
      </div>
    </footer>
  );
}
