# Plan 047: Persistir el score real de `speak_word`

> Mantén compatible el tercer argumento opcional: los demás ejercicios fonémicos deben seguir llamando `onSubmit` con dos argumentos.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 046
- **Category**: bug
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

`SpeakScoredExercise` calcula un score 0–100, pero `components/exercises/SpeakScoredExercise.tsx:110-114` solo envía corrección y transcript. `answerToGrade` ya convierte el score en SM-2; hoy recibe `undefined` y termina calificando por rapidez/corrección.

## Current state

- `PracticeSubmitHandler` y `PracticeSubmitExtras` ya soportan `{ score?, feedback? }` en `lib/practice/types.ts:188-210`.
- `useSessionState.handleSubmit` ya copia `extras.score` a `PracticeAnswer`.
- `PhonemeRenderContext.onSubmit` y `PhonemeExerciseView` estrechan el contrato a dos argumentos.
- `lib/practice/__tests__/grade.test.ts` ya cubre la conversión score→grade; falta probar el cableado UI.

## Scope

**In scope**: `phoneme-registry.tsx`, `PhonemeExerciseView.tsx`, `SpeakScoredExercise.tsx` y tests de estos componentes/registry.

**Out of scope**: motor de evaluación, umbrales SM-2, fallback shadowing, migraciones y rediseño visual.

## Steps

1. Cambiar los contratos de registry y view para usar `PracticeSubmitHandler`.
2. Tipar `SpeakScoredExercise.onSubmit` con el mismo handler y enviar `{ score: scored.score }` al continuar.
3. Mantener el fallback sin STT sin score; no inventar una puntuación.
4. Añadir un test que simule resultado 60–80 y verifique el tercer argumento, y otro que confirme que el fallback sigue omitiéndolo.
5. Ejecutar test focalizado, typecheck y lint.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- components/exercises lib/practice/__tests__/grade.test.ts` | score propagado y grading verde |
| `pnpm type-check` | exit 0 |
| `pnpm lint` | exit 0 |

## Done criteria

- [ ] `onSubmit(scored.correct, scored.transcript, { score: scored.score })` llega a `useSessionState`.
- [ ] Los siete tipos fonémicos restantes compilan sin wrappers nuevos.
- [ ] Shadowing no reporta score falso.
- [ ] Tests cubren score y fallback.

## STOP conditions

- El cambio requiere modificar el motor `defaultEvaluationEngine`.
- Otro flujo depende de que se descarte explícitamente el tercer argumento.

## Git workflow and maintenance

- Branch: `codex/047-propagate-speak-score`; commit: `fix(practice): persist speak word score`.
- Si aparecen nuevos ejercicios fonémicos con métricas continuas, reutilizar `PracticeSubmitExtras`; no crear callbacks paralelos.
