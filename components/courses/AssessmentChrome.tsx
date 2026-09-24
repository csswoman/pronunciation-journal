"use client";

import Link from "next/link";
import { Check } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import type { CefrLevelId } from "@/lib/courses/types";

// Planned structure:
// <AssessmentProgress />
// <AssessmentHeader />
// <AssessmentCoverage />
// <AssessmentFooter />

export function AssessmentProgress({ value, total, label, unit }: { value: number; total: number; label: string; unit: string }) {
  return (
    <div className="assessment-progress-status">
      <div className="assessment-progress-copy" aria-live="polite">
        <strong>{value} de {total}</strong>
        <span>{unit}</span>
      </div>
      <div className="assessment-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(value, total)} aria-label={label}>
        <span style={{ transform: `scaleX(${total ? Math.min(Math.max(value / total, 0), 1) : 0})` }} />
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
          <AssessmentProgress
            value={progressValue}
            total={progressTotal}
            label={showingInventory ? "Temas valorados" : "Preguntas respondidas"}
            unit={showingInventory ? "temas" : "respondidas"}
          />
        ) : null}
      </div>
    </header>
  );
}

export interface AssessmentCoverageLevel {
  level: CefrLevelId;
  answeredQuestionCount: number;
  questionCount: number;
  ratedTopicCount: number;
  topicCount: number;
}

const LEVEL_NAMES: Record<CefrLevelId, string> = {
  a1: "Principiante",
  a2: "Básico",
  b1: "Intermedio",
  b2: "Intermedio alto",
  c1: "Avanzado",
  c2: "Maestría",
};

export function AssessmentCoverage({
  placementStartIndex,
  sectionIndex,
  levels,
  showingInventory,
}: {
  placementStartIndex: number;
  sectionIndex: number;
  levels: AssessmentCoverageLevel[];
  showingInventory: boolean;
}) {
  return (
    <aside className="assessment-coverage" aria-label="Cobertura de la evaluación">
      <h2 className="assessment-coverage-kicker">Cobertura de la evaluación</h2>
      <div className="assessment-coverage-list">
        {levels.map((item, index) => {
          const { level } = item;
          const reached = index >= placementStartIndex && index < sectionIndex;
          const current = index === sectionIndex;
          const skipped = index < placementStartIndex;
          const className = reached
            ? "assessment-coverage-item assessment-coverage-item--complete"
            : current
              ? "assessment-coverage-item assessment-coverage-item--current"
              : skipped
                ? "assessment-coverage-item assessment-coverage-item--skipped"
                : "assessment-coverage-item";
          const detail = reached
            ? `Evaluado · ${item.answeredQuestionCount} de ${item.questionCount} preguntas`
            : current && showingInventory
              ? `${item.ratedTopicCount} de ${item.topicCount} temas`
              : current
                ? `${item.answeredQuestionCount} de ${item.questionCount} preguntas`
                : skipped
                  ? "No necesario por ahora"
                  : "Pendiente";

          return (
            <div key={level} className={className} aria-current={current ? "step" : undefined}>
              <span className="assessment-coverage-step" aria-hidden>
                {reached ? <Check size={16} /> : level.toUpperCase()}
              </span>
              <div>
                <div className="assessment-coverage-heading">
                  <strong>{level.toUpperCase()} · {LEVEL_NAMES[level]}</strong>
                  {current && <Badge label="En curso" variant="default" />}
                </div>
                <small>{detail}</small>
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
  statusRole,
  showBack,
  backLabel,
  primaryLabel,
  primaryDisabled,
  secondaryDisabled,
  onBack,
  onPrimary,
}: {
  status?: string;
  statusRole?: "status" | "alert";
  showBack: boolean;
  backLabel?: string;
  primaryLabel: string;
  primaryDisabled: boolean;
  secondaryDisabled: boolean;
  onBack: () => void;
  onPrimary: () => void;
}) {
  return (
    <footer className="assessment-footer">
      {status ? <p role={statusRole}>{status}</p> : <span aria-hidden />}
      <div className="assessment-footer-actions">
        {showBack && (
          <PillButton
            variant="outline"
            className="assessment-footer-action assessment-secondary-action"
            disabled={secondaryDisabled}
            onClick={onBack}
          >
            {backLabel}
          </PillButton>
        )}
        <PillButton
          variant="primary"
          className="assessment-footer-action assessment-footer-action--primary"
          disabled={primaryDisabled}
          icon={<span aria-hidden>→</span>}
          iconPosition="right"
          onClick={onPrimary}
        >
          {primaryLabel}
        </PillButton>
      </div>
    </footer>
  );
}
