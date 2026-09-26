# Live Task Tracker — Plan 043: Drills de gramática A1–C1 con corrección tolerante y local

| Task | Status | Details |
| --- | --- | --- |
| 1. Fase A: Calificador tolerante `lib/exercises/answer-match.ts` | Completed | `matchAnswer`, normalización, `expandTemplate` (máx 64), `expandContractions`, `damerauLevenshtein`, derivación de `targetTokens`, tests completos |
| 2. Fase B: Conectar ejercicios existentes (`ErrorCorrection`, `SentenceTransformation`, `reorder_words`) | Completed | `feedbackFromVerdict`, hook `useDrillAttempts`, botón 'Está correcta' (A2+), `gradeReorder` con spec/bloques, tests verificados |
| 3. Fase C: "Mi respuesta también es correcta" (SelfAssessPrompt y Dexie) | Completed | `SelfAssessPrompt.tsx`, hook `useAcceptedAnswers`, persistencia en Dexie `gradedAnswers`, reporte a `reportWrongFeedback`, tests unitarios |
| 4. Fase D: Detectores de estructura `lib/exercises/structure-checks/` | Completed | ~180 verbos irregulares, registry con 26 checks, tests con ≥3 pos/neg por check (28 tests vitest pasando), integrado en `SentenceTransformationExercise` |
| 5. Fase E: Tipo nuevo `personalization` | Completed | `gradePersonalization`, componentes frame y open, registry genérico, tests pasando al 100% |
| 6. Fase F: Perfiles por nivel, schema de drill y sesión | Completed | `DRILL_PROFILES`, schema Zod con `superRefine`, builder `buildGrammarDrill`, integración en `GrammarStudyDeck`, 226 tests de decks pasando |
| 7. Fase G: Contenido A1–C1 (Pilotos y script generador) | Completed | 5 pilotos manuales A1-C1 revisados, script `generate-grammar-drills.ts`, tests de contenido pasando |
| 8. Fase H: Documentación y verificación final | Completed | `exercises.md`, `grammar-drills.md`, `plans/README.md`, `CLAUDE.md`, type-check, lint, audit:hard-rules y tests pasando al 100% |
