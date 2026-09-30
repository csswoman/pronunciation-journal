"use client";

import Link from "next/link";
import { RefreshCw, RotateCcw } from "@/components/icons";
import type { AssessmentResult } from "@/lib/courses/assessment";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import type { CefrLevelId } from "@/lib/courses/types";
import { AssessmentCheckpointResultView, type AssessmentTopicPreview } from "./AssessmentCheckpointResultView";
import { AssessmentPlacementResultView } from "./AssessmentPlacementResultView";

// Planned structure:
// <AssessmentResultView>
//   <assessment result header />
//   <checkpoint pass/review | placement result />
//   <save status />
// </AssessmentResultView>

interface AssessmentResultViewProps {
  mode: "placement" | "checkpoint";
  result: AssessmentResult;
  userId?: string;
  saving: boolean;
  saveError: boolean;
  onRetry: () => void;
  onRedo?: () => void;
  nextLevelTopics?: AssessmentTopicPreview[];
}

function AssessmentResultHeader({
  mode,
  level,
  total,
  userId,
  onRedo,
}: {
  mode: "placement" | "checkpoint";
  level?: CefrLevelId;
  total: number;
  userId?: string;
  onRedo?: () => void;
}) {
  const title = mode === "placement"
    ? total > 0 ? `Prueba de nivel · ${total} preguntas` : "Plan de inicio"
    : `Examen de nivel ${level?.toUpperCase() ?? "A1"} · ${total} preguntas`;

  return (
    <header className="assessment-result-header">
      <Link href={userId ? "/courses" : "/login"} className="assessment-result-exit">
        <span aria-hidden>×</span>
        {mode === "placement" ? "Salir de la prueba" : "Salir del examen"}
      </Link>
      <div className="assessment-result-header__side">
        <span className="assessment-result-label">{title}</span>
        {onRedo && (
          <button
            type="button"
            onClick={onRedo}
            className="assessment-result-redo"
            title="Repetir la evaluación"
          >
            <RotateCcw size={13} aria-hidden />
            <span>Hacer de nuevo</span>
          </button>
        )}
      </div>
    </header>
  );
}

function AssessmentResultSaveStatus({
  userId,
  saving,
  saveError,
  onRetry,
}: {
  userId?: string;
  saving: boolean;
  saveError: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="assessment-result-save-status" aria-live="polite">
      {!userId && (
        <small className="assessment-guest-note">
          Progreso guardado en este dispositivo. <Link href="/login">Inicia sesión</Link> si deseas sincronizarlo.
        </small>
      )}
      {saving && <small>Guardando el resultado en este dispositivo…</small>}
      {saveError && (
        <div className="assessment-save-error" role="alert">
          <span>No se pudo guardar el progreso en este dispositivo.</span>
          <button type="button" onClick={onRetry}>
            <RefreshCw size={14} aria-hidden />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

export function AssessmentResultView({
  mode,
  result,
  userId,
  saving,
  saveError,
  onRetry,
  onRedo,
  nextLevelTopics = [],
}: AssessmentResultViewProps) {
  const level = result.evaluatedLevels?.[0] ?? "a1";
  const levelIndex = ASSESSMENT_LEVEL_ORDER.indexOf(level);
  const nextLevel = levelIndex >= 0 ? ASSESSMENT_LEVEL_ORDER[levelIndex + 1] ?? null : null;

  return (
    <div className="assessment-page assessment-page--result assessment-results">
      <AssessmentResultHeader
        mode={mode}
        level={level}
        total={result.total}
        userId={userId}
        onRedo={onRedo}
      />
      {mode === "checkpoint" ? (
        <AssessmentCheckpointResultView
          result={result}
          level={level}
          nextLevel={nextLevel}
          userId={userId}
          nextLevelTopics={nextLevelTopics}
          onRedo={onRedo}
        />
      ) : (
        <AssessmentPlacementResultView result={result} onRedo={onRedo} />
      )}
      <AssessmentResultSaveStatus
        userId={userId}
        saving={saving}
        saveError={saveError}
        onRetry={onRetry}
      />
    </div>
  );
}

// Planned structure:
// <AssessmentSectionFeedbackView>
//   <assessment section header />
//   <checkpoint pass/review details />
// </AssessmentSectionFeedbackView>

export function AssessmentSectionFeedbackView({
  result,
  level,
  nextLevel,
  nextLevelTopics = [],
  canContinueAfterFailure,
  onContinue,
}: {
  result: AssessmentResult;
  level: CefrLevelId;
  nextLevel: CefrLevelId;
  nextLevelTopics?: AssessmentTopicPreview[];
  canContinueAfterFailure: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="assessment-page assessment-page--result assessment-results">
      <AssessmentResultHeader mode="checkpoint" level={level} total={result.total} />
      {!result.passed && canContinueAfterFailure && (
        <p className="assessment-section-continue-note">
          Elegiste explorar niveles posteriores. Puedes continuar; este bloque seguirá marcado para repasar.
        </p>
      )}
      <AssessmentCheckpointResultView
        result={result}
        level={level}
        nextLevel={nextLevel}
        nextLevelTopics={nextLevelTopics}
        canContinueAfterFailure={canContinueAfterFailure}
        onContinue={onContinue}
      />
    </div>
  );
}
