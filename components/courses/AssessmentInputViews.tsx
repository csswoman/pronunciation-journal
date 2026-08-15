"use client";

import { AlertCircle, Check } from "@/components/icons";
import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";

const SELF_RATING_OPTIONS: Array<{ value: ConceptSelfRating; label: string }> = [
  { value: "unknown", label: "Todavía no" },
  { value: "familiar", label: "Me suena" },
  { value: "confident", label: "Lo uso" },
];

// Planned structure:
// <AssessmentLevelPrompt />
// <AssessmentInventory />
// <AssessmentQuestionView />
// <AssessmentErrorState />

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

export function AssessmentErrorState() {
  return (
    <div className="assessment-page assessment-page--result">
      <section className="assessment-result" role="alert">
        <AlertCircle size={28} aria-hidden />
        <p className="assessment-kicker">No se pudo abrir la evaluación</p>
        <h1>Falta el bloque de preguntas</h1>
        <p>La evaluación cambió antes de terminar. Vuelve a intentarlo para cargar el bloque correcto.</p>
        <button type="button" onClick={() => window.location.reload()}>Recargar evaluación</button>
      </section>
    </div>
  );
}
