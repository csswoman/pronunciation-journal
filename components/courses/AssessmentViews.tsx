"use client";

import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, RefreshCw } from "@/components/icons";
import type { AssessmentQuestion, AssessmentResult } from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";

const SELF_RATING_OPTIONS: Array<{ value: ConceptSelfRating; label: string }> = [
  { value: "unknown", label: "Todavía no" },
  { value: "familiar", label: "Me suena" },
  { value: "confident", label: "Lo uso" },
];

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
    <main className="assessment-page">
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
        <Link href={userId ? recommendedHref : "/login"}>
          {userId ? result.needsReview.length > 0 ? "Ver lecciones recomendadas" : "Ir a mi ruta" : "Iniciar sesión para continuar"}
        </Link>
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
    </main>
  );
}

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

export function AssessmentLevelPrompt({ value, onChange }: { value: CefrLevelId | "unsure" | "full" | null; onChange: (value: CefrLevelId | "unsure" | "full") => void }) {
  const levels: Array<{ value: CefrLevelId; label: string }> = [
    { value: "a1", label: "Estoy empezando" },
    { value: "a2", label: "Básico" },
    { value: "b1", label: "Intermedio" },
    { value: "b2", label: "Intermedio alto" },
    { value: "c1", label: "Avanzado" },
  ];
  return (
    <div className="assessment-level-options" role="radiogroup" aria-label="Nivel estimado">
      {levels.map((level) => (
        <label key={level.value} className={value === level.value ? "assessment-level-option assessment-level-option--selected" : "assessment-level-option"}>
          <input type="radio" name="self-reported-level" checked={value === level.value} onChange={() => onChange(level.value)} />
          <strong>{level.value.toUpperCase()}</strong>
          <span>{level.label}</span>
        </label>
      ))}
      <label className={value === "unsure" ? "assessment-level-option assessment-level-option--selected" : "assessment-level-option"}>
        <input type="radio" name="self-reported-level" checked={value === "unsure"} onChange={() => onChange("unsure")} />
        <strong>?</strong>
        <span>No estoy seguro</span>
      </label>
      <label className={value === "full" ? "assessment-level-option assessment-level-option--selected assessment-level-option--wide" : "assessment-level-option assessment-level-option--wide"}>
        <input type="radio" name="self-reported-level" checked={value === "full"} onChange={() => onChange("full")} />
        <strong>↗</strong>
        <span>Explorar todos los niveles</span>
      </label>
    </div>
  );
}

export function AssessmentInventory({ concepts, selfRatings, onRate }: { concepts: AssessmentConcept[]; selfRatings: Record<string, ConceptSelfRating>; onRate: (lessonSlug: string, value: ConceptSelfRating) => void }) {
  return (
    <div className="assessment-concepts">
      {concepts.map((concept, conceptIndex) => (
        <fieldset key={concept.lessonSlug} className="assessment-concept" aria-labelledby={`concept-${concept.lessonSlug}`}>
          <div className="assessment-concept-heading" id={`concept-${concept.lessonSlug}`}>
            <span>{String(conceptIndex + 1).padStart(2, "0")}</span>
            <span>{concept.title}</span>
          </div>
          {concept.goal ? <p>{concept.goal}</p> : null}
          <div className="assessment-concept-options">
            {SELF_RATING_OPTIONS.map((option) => {
              const selected = selfRatings[concept.lessonSlug] === option.value;
              return (
                <label key={option.value} className={selected ? "assessment-concept-option assessment-concept-option--selected" : "assessment-concept-option"}>
                  <input type="radio" name={`concept:${concept.lessonSlug}`} checked={selected} onChange={() => onRate(concept.lessonSlug, option.value)} />
                  <span aria-hidden />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function AssessmentQuestionView({ question, index, answer, onAnswer }: { question?: AssessmentQuestion; index: number; answer?: number; onAnswer: (optionIndex: number) => void }) {
  if (!question) return null;
  return (
    <div className="assessment-questions">
      <fieldset className="assessment-question">
        <legend className="sr-only">{question.prompt}</legend>
        <div className="assessment-question-heading">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>{question.passage && <p className="assessment-passage">{question.passage}</p>}<h2>{question.prompt}</h2></div>
        </div>
        <div className="assessment-options">
          {question.options.map((option, optionIndex) => {
            const selected = answer === optionIndex;
            return (
              <label key={option} className={selected ? "assessment-option assessment-option--selected" : "assessment-option"}>
                <input type="radio" name={question.id} checked={selected} onChange={() => onAnswer(optionIndex)} />
                <span className="assessment-option-marker" aria-hidden>{selected && <Check size={14} />}</span>
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
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

export function AssessmentErrorState() {
  return (
    <main className="assessment-page">
      <section className="assessment-result" role="alert">
        <AlertCircle size={28} aria-hidden />
        <p className="assessment-kicker">No se pudo abrir la evaluación</p>
        <h1>Falta el bloque de preguntas</h1>
        <p>La evaluación cambió antes de terminar. Vuelve a intentarlo para cargar el bloque correcto.</p>
        <button type="button" onClick={() => window.location.reload()}>Recargar evaluación</button>
      </section>
    </main>
  );
}
