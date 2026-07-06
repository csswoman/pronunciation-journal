# Plan 09 — Hilo entre pasos del daily plan

**Estado:** ✅ Implementado (2026-07-03)

## Problema

El alumno practica vocabulario en pasos separados (`word_intro` → `word_review` → `context_practice` → `reader`) sin ver que las mismas palabras reaparecen a propósito. El motor ya las reutiliza; la UI no lo narraba.

## Solución

1. **`featuredWords`** en `DailyStep` — palabras ancla de cada paso vocab/reader.
2. **`getThreadHintsForStep(steps, index)`** — detecta palabras del paso actual que ya aparecieron en un paso vocab/reader anterior.
3. **`StepThreadHints`** — muestra en checklist y durante la sesión: `cat · from Intro`.

## Archivos

| Archivo | Rol |
|---------|-----|
| `lib/practice/types.ts` | `featuredWords?: string[]` en `DailyStep` |
| `lib/practice/daily-plan/step-builders.ts` | Puebla `featuredWords` en intro/review/context |
| `lib/practice/daily-plan/async-step-builders.ts` | Puebla `featuredWords` en reader |
| `lib/practice/daily-plan/step-thread.ts` | Lógica pura del hilo |
| `components/daily/StepThreadHints.tsx` | UI compacta |
| `components/daily/DailyStepList.tsx` | Hilo en checklist |
| `components/daily/DailyStepSession.tsx` | Hilo durante el paso |

## Criterios de aceptación

- [x] Palabra en `word_review` que estuvo en `word_intro` muestra hint con origen Intro.
- [x] `context_practice` muestra hints de intro y/o review.
- [x] Pasos de fonema no contaminan el hilo.
- [x] Tests unitarios en `step-thread.test.ts` y `StepThreadHints.test.tsx`.

## Fuera de alcance (diferido)

- Animaciones o líneas visuales entre tarjetas del checklist.
- Hilo cross-session (“viste esta palabra ayer”).
