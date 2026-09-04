"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, RefreshCw } from "@/components/icons";
import type { AssessmentResult } from "@/lib/courses/assessment";

// Planned structure:
// <AssessmentResultView>
//   <icon + copy />
//   <strengths | needs review />
//   <cta + save status />
// </AssessmentResultView>

export function AssessmentResultView({
  mode,
  result,
  userId,
  saving,
  saveError,
  onRetry,
}: {
  mode: "placement" | "checkpoint";
  result: AssessmentResult;
  userId?: string;
  saving: boolean;
  saveError: boolean;
  onRetry: () => void;
}) {
  const recommendedSlug = result.needsReview[0]?.lessonSlug;
  const planOnly = mode === "placement" && result.total === 0 && result.conceptSignals.some((signal) => signal.status === "learn");
  const recommendedHref = `/courses?level=${result.assignedLevel.toLowerCase()}${
    recommendedSlug ? `#lesson-${recommendedSlug}` : ""
  }`;

  return (
    <div className="assessment-page assessment-page--result">
      <section className="assessment-result">
        {result.passed
          ? <CheckCircle2 className="assessment-result-icon assessment-result-icon--success" size={28} aria-hidden />
          : <AlertCircle className="assessment-result-icon assessment-result-icon--error" size={28} aria-hidden />}
        <p className="assessment-kicker">
          {planOnly ? "Tu plan de inicio" : mode === "checkpoint" ? (result.passed ? "Checkpoint aprobado" : "Conviene reforzar") : "Resultado"}
        </p>
        <h1>
          {planOnly ? "Empezamos por aquí" : mode === "checkpoint" && result.passed ? `Avanzas a ${result.assignedLevel}` : `Tu nivel actual es ${result.assignedLevel}`}
        </h1>
        <p>{planOnly ? "Marcaste estos temas como nuevos. No hace falta responder preguntas todavía." : `Acertaste ${result.score} de ${result.total} preguntas.`}</p>
        {result.evaluatedLevels && result.evaluatedLevels.length > 0 && (
          <div className="assessment-result-meta" aria-label="Cobertura de la evaluación">
            <span>Evaluado: {result.evaluatedLevels[0].toUpperCase()}–{result.evaluatedLevels.at(-1)?.toUpperCase()}</span>
            <span>Confianza orientativa: {result.confidence === "high" ? "alta" : result.confidence === "medium" ? "media" : "inicial"}</span>
            <small>Se basa en los bloques y respuestas completados, no es una certificación.</small>
          </div>
        )}
        <div className="assessment-result-sections">
          {result.strengths.length > 0 && (
            <section>
              <h2>Fortalezas</h2>
              <ul>{result.strengths.map((topic) => <li key={topic.lessonSlug}>{topic.title}</li>)}</ul>
            </section>
          )}
          {result.needsReview.length > 0 && (
            <section>
              <h2>{planOnly ? "Para empezar" : "Para reforzar"}</h2>
              <ul>{result.needsReview.map((topic) => <li key={topic.lessonSlug}>{topic.title}</li>)}</ul>
            </section>
          )}
        </div>
        <Link href={recommendedHref}>
          {result.needsReview.length > 0 ? "Ver lecciones recomendadas" : "Ir a mi ruta"}
        </Link>
        {!userId && (
          <small className="assessment-guest-note">
            Progreso guardado en este dispositivo. <Link href="/login">Inicia sesión</Link> si deseas sincronizar en la nube.
          </small>
        )}
        {saving && <small>Guardando nivel…</small>}
        {saveError && (
          <div className="assessment-save-error" role="alert">
            <span>No se pudo guardar el nivel.</span>
            <button type="button" onClick={onRetry}>
              <RefreshCw size={14} aria-hidden />
              Reintentar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
