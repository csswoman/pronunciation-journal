"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, RefreshCw } from "@/components/icons";
import {
  groupQuestionsByLevel,
  levelPassed,
  scoreAssessment,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import { persistAssessmentConceptProfile } from "@/lib/courses/assessment-profile";

const SELF_RATING_OPTIONS: Array<{ value: ConceptSelfRating; label: string }> = [
  { value: "unknown", label: "Todavía no" },
  { value: "familiar", label: "Me suena" },
  { value: "confident", label: "Lo uso" },
];

interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
  concepts?: AssessmentConcept[];
  checkpointLabel?: string;
  userId?: string;
}

export default function AssessmentClient({ mode, questions, concepts = [], checkpointLabel, userId }: AssessmentClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selfRatings, setSelfRatings] = useState<Record<string, ConceptSelfRating>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [placementStep, setPlacementStep] = useState<"inventory" | "questions">(
    mode === "placement" ? "inventory" : "questions",
  );
  const sections = groupQuestionsByLevel(questions);
  const section = sections[sectionIndex];
  const sectionConcepts = concepts.filter((concept) => concept.level === section.level);
  const showingInventory = mode === "placement" && placementStep === "inventory";
  const visibleQuestions = mode === "placement" ? section.questions : questions;
  const answered = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;
  const ratedConcepts = sectionConcepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined).length;
  const progressValue = showingInventory ? ratedConcepts : answered;
  const progressTotal = showingInventory ? sectionConcepts.length : visibleQuestions.length;

  async function saveLevel(nextResult: AssessmentResult) {
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/assessment/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          evaluatedLevel: mode === "checkpoint"
            ? questions[0]?.level ?? null
            : nextResult.conceptSignals.at(-1)?.level ?? questions[0]?.level ?? null,
          result: nextResult,
        }),
      });
      if (!response.ok) throw new Error("Failed to persist assessment result");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function completeAssessment(attemptedQuestions: AssessmentQuestion[]) {
    const checkpointLevel = questions[0]?.level;
    const assessedConcepts = concepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined);
    const nextResult = scoreAssessment(
      attemptedQuestions, answers, mode, checkpointLevel, assessedConcepts, selfRatings,
    );
    setResult(nextResult);
    window.localStorage.setItem(
      `assessment:${userId ?? "guest"}:${mode}:${checkpointLabel ?? "placement"}`,
      JSON.stringify({ ...nextResult, completedAt: new Date().toISOString() }),
    );
    if (userId) {
      void persistAssessmentConceptProfile(
        userId, nextResult.conceptSignals, nextResult.assignedLevel,
      ).catch(() => undefined);
      void saveLevel(nextResult);
    }
  }

  function finishSection() {
    if (mode === "checkpoint") {
      completeAssessment(questions);
      return;
    }

    const passed = levelPassed(section.level, section.questions, answers);
    const isLast = sectionIndex === sections.length - 1;
    if (passed && !isLast) {
      setSectionIndex((current) => current + 1);
      setPlacementStep("inventory");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    completeAssessment(sections.slice(0, sectionIndex + 1).flatMap((item) => item.questions));
  }

  if (result) {
    const recommendedSlug = result.needsReview[0]?.lessonSlug;
    const recommendedHref = `/courses?level=${result.assignedLevel.toLowerCase()}${
      recommendedSlug ? `#lesson-${recommendedSlug}` : ""
    }`;
    return (
      <main className="assessment-page">
        <section className="assessment-result">
          {result.passed ? <CheckCircle2 size={28} aria-hidden /> : <AlertCircle size={28} aria-hidden />}
          <p className="assessment-kicker">
            {mode === "checkpoint" ? (result.passed ? "Checkpoint aprobado" : "Conviene reforzar") : "Resultado"}
          </p>
          <h1>
            {mode === "checkpoint" && result.passed
              ? `Avanzas a ${result.assignedLevel}`
              : `Tu nivel actual es ${result.assignedLevel}`}
          </h1>
          <p>Acertaste {result.score} de {result.total} preguntas.</p>
          <div className="assessment-result-sections">
            {result.strengths.length > 0 && (
              <section>
                <h2>Fortalezas</h2>
                <ul>{result.strengths.map((topic) => <li key={topic.lessonSlug}>{topic.title}</li>)}</ul>
              </section>
            )}
            {result.needsReview.length > 0 && (
              <section>
                <h2>Para reforzar</h2>
                <ul>{result.needsReview.map((topic) => <li key={topic.lessonSlug}>{topic.title}</li>)}</ul>
              </section>
            )}
          </div>
          <Link href={userId ? recommendedHref : "/login"}>
            {userId
              ? result.needsReview.length > 0 ? "Ver lecciones recomendadas" : "Ir a mi ruta"
              : "Iniciar sesión para continuar"}
          </Link>
          {saving && <small>Guardando nivel…</small>}
          {saveError && (
            <div className="assessment-save-error" role="alert">
              <span>No se pudo guardar el nivel.</span>
              <button type="button" onClick={() => void saveLevel(result)}>
                <RefreshCw size={14} aria-hidden />
                Reintentar
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="assessment-page">
      <div className="assessment-shell">
        <header className="assessment-header">
          <Link href={userId ? "/courses" : "/login"} className="assessment-back">
            <ArrowLeft size={15} aria-hidden />
            {userId ? "Volver a cursos" : "Volver al inicio"}
          </Link>
          <div className="assessment-heading-row">
            <div>
              <p className="assessment-kicker">
                {mode === "placement"
                  ? `${showingInventory ? "Temas" : "Prueba de nivel"} · ${section.level.toUpperCase()}`
                  : `Checkpoint ${checkpointLabel ?? ""}`}
              </p>
              <h1>
                {showingInventory
                  ? "¿Qué temas ya conoces?"
                  : mode === "placement"
                    ? "Encuentra tu punto de partida"
                    : "Comprueba lo aprendido"}
              </h1>
              <p>
                {showingInventory
                  ? "Sé sincero: después comprobaremos estas ideas con preguntas. Tu respuesta solo ayuda a ordenar el plan."
                  : "Responde sin traductor. El resultado adapta tus ejercicios, pero no limita lo que puedes explorar."}
              </p>
            </div>
            <div className="assessment-progress-copy" aria-live="polite">
              <strong>{progressValue}</strong>
              <span>de {progressTotal}</span>
            </div>
          </div>
          <div
            className="assessment-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progressTotal}
            aria-valuenow={progressValue}
            aria-label={showingInventory ? "Temas valorados" : "Preguntas respondidas"}
          >
            <span style={{ transform: `scaleX(${progressTotal ? progressValue / progressTotal : 0})` }} />
          </div>
        </header>

        {showingInventory ? (
          <div className="assessment-concepts">
            {sectionConcepts.map((concept, conceptIndex) => (
              <fieldset key={concept.lessonSlug} className="assessment-concept">
                <legend>
                  <span>{String(conceptIndex + 1).padStart(2, "0")}</span>
                  <span>{concept.title}</span>
                </legend>
                {concept.goal ? <p>{concept.goal}</p> : null}
                <div className="assessment-concept-options">
                  {SELF_RATING_OPTIONS.map((option) => {
                    const selected = selfRatings[concept.lessonSlug] === option.value;
                    return (
                      <label
                        key={option.value}
                        className={selected
                          ? "assessment-concept-option assessment-concept-option--selected"
                          : "assessment-concept-option"}
                      >
                        <input
                          type="radio"
                          name={`concept:${concept.lessonSlug}`}
                          checked={selected}
                          onChange={() => setSelfRatings((current) => ({
                            ...current,
                            [concept.lessonSlug]: option.value,
                          }))}
                        />
                        <span aria-hidden />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        ) : (
          <div className="assessment-questions">
            {visibleQuestions.map((question, questionIndex) => (
            <fieldset key={question.id} className="assessment-question">
              <legend className="sr-only">{question.prompt}</legend>
              <div className="assessment-question-heading">
                <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                <div>
                  {question.passage && <p className="assessment-passage">{question.passage}</p>}
                  <h2>{question.prompt}</h2>
                </div>
              </div>
              <div className="assessment-options">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  return (
                    <label key={option} className={selected ? "assessment-option assessment-option--selected" : "assessment-option"}>
                      <input
                        type="radio"
                        name={question.id}
                        checked={selected}
                        onChange={() => setAnswers((current) => ({
                          ...current,
                          [question.id]: optionIndex,
                        }))}
                      />
                      <span className="assessment-option-marker" aria-hidden>
                        {selected && <Check size={14} />}
                      </span>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            ))}
          </div>
        )}

        <footer className="assessment-footer">
          <p>
            {showingInventory
              ? ratedConcepts === sectionConcepts.length
                ? "Inventario completo."
                : `Faltan ${sectionConcepts.length - ratedConcepts} temas.`
              : answered === visibleQuestions.length
                ? "Sección completa."
                : `Faltan ${visibleQuestions.length - answered} preguntas.`}
          </p>
          <button
            type="button"
            disabled={showingInventory
              ? ratedConcepts !== sectionConcepts.length
              : answered !== visibleQuestions.length}
            onClick={showingInventory ? () => {
              setPlacementStep("questions");
              window.scrollTo({ top: 0, behavior: "smooth" });
            } : finishSection}
          >
            {showingInventory
              ? "Comprobar con preguntas"
              : mode === "placement" && sectionIndex < sections.length - 1
                ? "Continuar"
                : "Ver resultado"}
          </button>
        </footer>
      </div>
    </main>
  );
}
