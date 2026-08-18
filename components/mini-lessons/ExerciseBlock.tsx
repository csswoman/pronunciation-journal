"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ExerciseBlockProps {
  instruction: string;
  items: string[];
  answers?: string[];
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block">
    <path
      d="M2 2l8 8M10 2L2 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function checkAnswer(userVal: string, correctVal: string): boolean {
  if (!correctVal) return false;
  
  const normalize = (s: string) => {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡'’"]/g, ""); // strip punctuation for flexible matching
  };

  const normalizedUser = normalize(userVal);
  
  // Clean parentheticals from the answer (e.g. "at/on (regional)" -> "at/on")
  const cleanCorrect = correctVal.replace(/\([^)]*\)/g, "");
  
  // Split by slashes to get alternatives
  const alternatives = cleanCorrect.split("/").map((alt) => normalize(alt));

  // Also match common contractions as fallback
  const normalizedUserWithContractions = normalizedUser
    .replace(/\bdo not\b/g, "dont")
    .replace(/\bdoes not\b/g, "doesnt")
    .replace(/\bdid not\b/g, "didnt")
    .replace(/\bwould not\b/g, "wouldnt")
    .replace(/\bwill not\b/g, "wont")
    .replace(/\bcannot\b/g, "cant")
    .replace(/\bis not\b/g, "isnt")
    .replace(/\bare not\b/g, "arent")
    .replace(/\bhave not\b/g, "havent")
    .replace(/\bhas not\b/g, "hasnt")
    .replace(/\b'm\b/g, "am")
    .replace(/\b're\b/g, "are")
    .replace(/\b've\b/g, "have")
    .replace(/\b'll\b/g, "will")
    .replace(/\b'd\b/g, "would");

  return alternatives.some((alt) => {
    const normAlt = alt
      .replace(/\bdo not\b/g, "dont")
      .replace(/\bdoes not\b/g, "doesnt")
      .replace(/\bdid not\b/g, "didnt")
      .replace(/\bwould not\b/g, "wouldnt")
      .replace(/\bwill not\b/g, "wont")
      .replace(/\bcannot\b/g, "cant")
      .replace(/\bis not\b/g, "isnt")
      .replace(/\bare not\b/g, "arent")
      .replace(/\bhave not\b/g, "havent")
      .replace(/\bhas not\b/g, "hasnt")
      .replace(/\b'm\b/g, "am")
      .replace(/\b're\b/g, "are")
      .replace(/\b've\b/g, "have")
      .replace(/\b'll\b/g, "will")
      .replace(/\b'd\b/g, "would");
    
    return normAlt === normalizedUser || normAlt === normalizedUserWithContractions;
  });
}

export default function ExerciseBlock({ instruction, items, answers = [] }: ExerciseBlockProps) {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [isVerified, setIsVerified] = useState(false);

  function handleInputChange(key: string, value: string) {
    setUserInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleVerify() {
    setIsVerified(true);
  }

  function handleReset() {
    setUserInputs({});
    setIsVerified(false);
  }

  // Calculate inputs count and correct inputs count
  let totalInputsCount = 0;
  let correctInputsCount = 0;

  items.forEach((item, itemIdx) => {
    const parts = item.split(/_{3,}/);
    const ansStr = answers[itemIdx] ?? "";

    if (parts.length === 1) {
      // Rewrite exercise
      totalInputsCount++;
      const userVal = userInputs[`${itemIdx}-0`] ?? "";
      if (checkAnswer(userVal, ansStr)) {
        correctInputsCount++;
      }
    } else {
      // Fill-in-blanks exercise
      const blanksCount = parts.length - 1;
      let correctAnswersForInputs: string[] = [];
      if (blanksCount > 1) {
        correctAnswersForInputs = ansStr.split("/").map((s) => s.trim());
      } else {
        correctAnswersForInputs = [ansStr.trim()];
      }

      for (let bIdx = 0; bIdx < blanksCount; bIdx++) {
        totalInputsCount++;
        const userVal = userInputs[`${itemIdx}-${bIdx}`] ?? "";
        const correctVal = correctAnswersForInputs[bIdx] ?? "";
        if (checkAnswer(userVal, correctVal)) {
          correctInputsCount++;
        }
      }
    }
  });

  const scorePct = totalInputsCount > 0 ? (correctInputsCount / totalInputsCount) * 100 : 0;
  const isGoodScore = scorePct >= 85;
  const isMidScore = scorePct >= 60 && scorePct < 85;

  return (
    <div className="mini-lessons__block">
      <p className="mini-lessons__block-label">{instruction}</p>
      
      <div className="mini-lessons__exercise-list">
        {items.map((item, itemIdx) => {
          const parts = item.split(/_{3,}/);
          const ansStr = answers[itemIdx] ?? "";

          // Render rewrite/open item (no blanks)
          if (parts.length === 1) {
            const inputKey = `${itemIdx}-0`;
            const userVal = userInputs[inputKey] ?? "";
            const isCorrect = isVerified && checkAnswer(userVal, ansStr);

            return (
              <div key={itemIdx} className="mini-lessons__exercise-item-container">
                <div className="mini-lessons__exercise-marker" aria-hidden="true">
                  <span className="mini-lessons__exercise-number">{itemIdx + 1}</span>
                </div>
                <div className="mini-lessons__exercise-content">
                  <p className="mini-lessons__exercise-prompt">{item}</p>
                  <div className="mini-lessons__exercise-input-row">
                    <input
                      type="text"
                      className={cn(
                        "mini-lessons__exercise-input",
                        "mini-lessons__exercise-input--rewrite",
                        isVerified && (isCorrect ? "mini-lessons__exercise-input--correct" : "mini-lessons__exercise-input--incorrect")
                      )}
                      value={userVal}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      disabled={isVerified}
                      placeholder="Escribe tu respuesta..."
                    />
                    {isVerified && (
                      <span className={cn(
                        "mini-lessons__feedback-icon",
                        isCorrect ? "mini-lessons__feedback-icon--correct" : "mini-lessons__feedback-icon--incorrect"
                      )}>
                        {isCorrect ? <CheckIcon /> : <CrossIcon />}
                      </span>
                    )}
                  </div>
                  {isVerified && !isCorrect && (
                    <p className="mini-lessons__exercise-correction">
                      Sugerencia: <strong className="mini-lessons__correction-highlight">{ansStr}</strong>
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Render fill-in-the-blanks item
          const blanksCount = parts.length - 1;
          let correctAnswersForInputs: string[] = [];
          if (blanksCount > 1) {
            correctAnswersForInputs = ansStr.split("/").map((s) => s.trim());
          } else {
            correctAnswersForInputs = [ansStr.trim()];
          }

          return (
            <div key={itemIdx} className="mini-lessons__exercise-item-container">
              <div className="mini-lessons__exercise-marker" aria-hidden="true">
                <span className="mini-lessons__exercise-number">{itemIdx + 1}</span>
              </div>
              <div className="mini-lessons__exercise-content">
                <p className="mini-lessons__exercise-prompt">
                  {parts.map((part, partIdx) => {
                    const isLast = partIdx === parts.length - 1;
                    if (isLast) {
                      return <span key={partIdx}>{part}</span>;
                    }

                    const inputKey = `${itemIdx}-${partIdx}`;
                    const userVal = userInputs[inputKey] ?? "";
                    const correctVal = correctAnswersForInputs[partIdx] ?? "";
                    const isCorrect = isVerified && checkAnswer(userVal, correctVal);

                    // Estimate width to prevent layout shifts
                    const inputWidth = Math.max(correctVal.length + 2, 8);

                    return (
                      <span key={partIdx} className="mini-lessons__inline-input-wrapper">
                        {part}
                        <input
                          type="text"
                          className={cn(
                            "mini-lessons__exercise-input",
                            "mini-lessons__exercise-input--inline",
                            isVerified && (isCorrect ? "mini-lessons__exercise-input--correct" : "mini-lessons__exercise-input--incorrect")
                          )}
                          style={{ width: `${inputWidth}ch` }}
                          value={userVal}
                          onChange={(e) => handleInputChange(inputKey, e.target.value)}
                          disabled={isVerified}
                          placeholder="..."
                        />
                        {isVerified && (
                          <span className={cn(
                            "mini-lessons__feedback-inline",
                            isCorrect ? "mini-lessons__feedback-inline--correct" : "mini-lessons__feedback-inline--incorrect"
                          )}>
                            {isCorrect ? <CheckIcon /> : <CrossIcon />}
                            {!isCorrect && (
                              <span className="mini-lessons__correct-hint">({correctVal})</span>
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {answers.length > 0 && (
        <div className="mini-lessons__exercise-actions">
          {isVerified ? (
            <>
              <div className={cn(
                "mini-lessons__exercise-summary",
                isGoodScore && "mini-lessons__exercise-summary--good",
                isMidScore && "mini-lessons__exercise-summary--mid",
                !isGoodScore && !isMidScore && "mini-lessons__exercise-summary--low"
              )}>
                <span>Puntuación: {correctInputsCount} de {totalInputsCount} correctas ({Math.round(scorePct)}%)</span>
              </div>
              <button
                type="button"
                className="mini-lessons__btn mini-lessons__btn--ghost"
                onClick={handleReset}
              >
                Restablecer
              </button>
            </>
          ) : (
            <>
              <div />
              <button
                type="button"
                className="mini-lessons__btn"
                onClick={handleVerify}
              >
                Verificar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
