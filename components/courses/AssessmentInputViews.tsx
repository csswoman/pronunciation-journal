"use client";

import { AlertCircle, Check } from "@/components/icons";
import type { ClientAssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import PastelCard from "@/components/layout/PastelCard";
import { AssessmentAudioPlayer } from "./AssessmentAudioPlayer";

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

export function AssessmentInventory({
  concepts,
  selfRatings,
  onRate,
}: {
  concepts: AssessmentConcept[];
  selfRatings: Record<string, ConceptSelfRating>;
  onRate: (lessonSlug: string, value: ConceptSelfRating) => void;
}) {
  return (
    <div className="assessment-concepts">
      {concepts.map((concept, conceptIndex) => {
        const isRated = selfRatings[concept.lessonSlug] !== undefined;
        return (
          <div
            key={concept.lessonSlug}
            role="group"
            aria-labelledby={`concept-title-${concept.lessonSlug}`}
            className="assessment-concept"
          >
            <span
              className={
                isRated
                  ? "assessment-concept-indicator assessment-concept-indicator--rated"
                  : "assessment-concept-indicator"
              }
              aria-hidden
            >
              {isRated ? <Check size={16} /> : conceptIndex + 1}
            </span>
            <div className="assessment-concept-content">
              <h3 id={`concept-title-${concept.lessonSlug}`} className="assessment-concept-heading">
                {concept.title}
              </h3>
              {concept.goal ? <p>{concept.goal}</p> : null}
            </div>
            <div className="assessment-concept-options" role="radiogroup" aria-label={`Nivel para ${concept.title}`}>
              {SELF_RATING_OPTIONS.map((option) => {
                const selected = selfRatings[concept.lessonSlug] === option.value;
                return (
                  <label
                    key={option.value}
                    className={
                      selected
                        ? "assessment-concept-option assessment-concept-option--selected"
                        : "assessment-concept-option"
                    }
                  >
                    <input
                      type="radio"
                      name={`concept:${concept.lessonSlug}`}
                      checked={selected}
                      onChange={() => onRate(concept.lessonSlug, option.value)}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AssessmentQuestionView({
  question,
  index,
  total,
  answer,
  audioReadyQuestionId,
  onAnswer,
  onAudioReadyChange,
}: {
  question?: ClientAssessmentQuestion;
  index: number;
  total: number;
  answer?: number;
  audioReadyQuestionId: string | null;
  onAnswer: (optionIndex: number) => void;
  onAudioReadyChange?: (questionId: string, ready: boolean) => void;
}) {
  if (!question) return null;
  const audioReady = !question.audioSrc || audioReadyQuestionId === question.id;
  const kindLabel = {
    grammar: "Gramática",
    vocabulary: "Vocabulario",
    reading: "Lectura",
    listening: "Escucha",
  }[question.type ?? (question.passage ? "reading" : "grammar")];

  const optionsNode = (
    <div className="assessment-options">
      {question.options.map((option, optionIndex) => {
        const selected = answer === optionIndex;
        return (
          <label key={option} className={selected ? "assessment-option assessment-option--selected" : "assessment-option"}>
            <input type="radio" name={question.id} checked={selected} disabled={!audioReady} onChange={() => onAnswer(optionIndex)} />
            <span className="assessment-option-marker" aria-hidden>{selected && <Check size={14} />}</span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="assessment-questions">
      <PastelCard tone="sky" className="assessment-question-card">
        <div className="assessment-question-meta">
          <span className="assessment-badge-kind">{kindLabel.toLocaleUpperCase("es")}</span>
          <span className="assessment-meta-step">Pregunta {index + 1} de {total}</span>
        </div>
        <fieldset className="assessment-question">
          <legend className="sr-only">{question.prompt}</legend>
          {question.passage && <p className="assessment-passage pastel-card-inset">{question.passage}</p>}
          <h2>{question.prompt}</h2>
          {question.audioSrc ? (
            <AssessmentAudioPlayer
              audioSrc={question.audioSrc}
              questionId={question.id}
              title="Diálogo corto"
              onReadyChange={onAudioReadyChange}
            >
              {optionsNode}
            </AssessmentAudioPlayer>
          ) : (
            optionsNode
          )}
        </fieldset>
      </PastelCard>
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
