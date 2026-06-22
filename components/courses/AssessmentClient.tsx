"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, RefreshCw } from "lucide-react";
import {
  groupQuestionsByLevel,
  levelPassed,
  scoreAssessment,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/courses/assessment";

interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
  checkpointLabel?: string;
}

export default function AssessmentClient({
  mode,
  questions,
  checkpointLabel,
}: AssessmentClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const sections = groupQuestionsByLevel(questions);
  const section = sections[sectionIndex];
  const visibleQuestions = mode === "placement" ? section.questions : questions;
  const answered = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;

  async function saveLevel(nextResult: AssessmentResult) {
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/assessment/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          evaluatedLevel: questions[0]?.level ?? null,
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
    const nextResult = scoreAssessment(attemptedQuestions, answers, mode, checkpointLevel);
    setResult(nextResult);
    window.localStorage.setItem(
      `assessment:${mode}:${checkpointLabel ?? "placement"}`,
      JSON.stringify({ ...nextResult, completedAt: new Date().toISOString() }),
    );
    void saveLevel(nextResult);
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
          <Link href={recommendedHref}>
            {result.needsReview.length > 0 ? "Ver lecciones recomendadas" : "Ir a mi ruta"}
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
          <Link href="/courses" className="assessment-back">
            <ArrowLeft size={15} aria-hidden />
            Volver a cursos
          </Link>
          <div className="assessment-heading-row">
            <div>
              <p className="assessment-kicker">
                {mode === "placement"
                  ? `Prueba de nivel · ${section.level.toUpperCase()}`
                  : `Checkpoint ${checkpointLabel ?? ""}`}
              </p>
              <h1>{mode === "placement" ? "Encuentra tu punto de partida" : "Comprueba lo aprendido"}</h1>
              <p>Responde sin traductor. El resultado adapta tus ejercicios, pero no limita lo que puedes explorar.</p>
            </div>
            <div className="assessment-progress-copy" aria-live="polite">
              <strong>{answered}</strong>
              <span>de {visibleQuestions.length}</span>
            </div>
          </div>
          <div
            className="assessment-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={visibleQuestions.length}
            aria-valuenow={answered}
            aria-label="Preguntas respondidas"
          >
            <span style={{ transform: `scaleX(${visibleQuestions.length ? answered / visibleQuestions.length : 0})` }} />
          </div>
        </header>

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

        <footer className="assessment-footer">
          <p>
            {answered === visibleQuestions.length
              ? "Sección completa."
              : `Faltan ${visibleQuestions.length - answered} preguntas.`}
          </p>
          <button
            type="button"
            disabled={answered !== visibleQuestions.length}
            onClick={finishSection}
          >
            {mode === "placement" && sectionIndex < sections.length - 1 ? "Continuar" : "Ver resultado"}
          </button>
        </footer>
      </div>
    </main>
  );
}
