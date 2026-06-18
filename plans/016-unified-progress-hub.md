# Plan 016 — Hub unificado de progreso, práctica y gamificación

**Written:** 2026-06-16  
**Status:** COMPLETE (Fase 0 ✅ · Fase 1 ✅ · Fase 2 ✅ · Fase 3 ✅ · Fase 4 ✅)  
**Effort:** L (multi-PR)  
**Priority:** P1

---

## Problema

Actividades que aportan aprendizaje real (Essential Words, Sound Lab, lexicon, etc.) no se reflejan de forma coherente en Progress, el plan diario ni las métricas de racha. El esfuerzo del usuario “desaparece”.

Causas técnicas identificadas:

1. `answer_history.context='core-1000'` viola el CHECK de BD → writes fallan en silencio.
2. Streak y heatmap solo cuentan `context='daily'`.
3. Completado del plan diario vive solo en `localStorage` (`doneIds`), sin reconciliación con práctica externa.
4. `FluencyRadarCard` existe pero no está en `/progress`.
5. Sounds usa maestría binaria (`isContrastMastered`), sin % dinámico con decaimiento.
6. Review hub fragmentado (`HomeReviewQueueCard`, `/review` legacy) sin centro global.

---

## Arquitectura objetivo

```
Toda sesión completada
        ↓
recordActivitySession()   ← lib/progress/activity-hub.ts (Fase 1+)
        ↓
┌───────────────────────────────────────┐
│ answer_history │ activity_sessions    │
│ SRS updates    │ skill dimension agg  │
│ daily plan reconcile                  │
└───────────────────────────────────────┘
        ↓
Progress · Daily Plan · Review Hub
```

**Principio:** un solo bus de salida al terminar sesión. Los flujos existentes (`savePracticeAnswer`, `finishContrastSession`, `gradeCore1000Word`) delegan ahí progresivamente.

---

## Fases

### Fase 0 — Quick wins (esta PR)

| # | Tarea | Archivos |
|---|-------|----------|
| 0.1 | Migración: añadir `core-1000` y `review` al CHECK de `answer_history.context` | `supabase/migrations/20260616120000_answer_history_contexts.sql` |
| 0.2 | Streak: contar **cualquier** respuesta en `answer_history` (umbral ≥5/día Lima) | `lib/daily/streak.ts` |
| 0.3 | Heatmap / daily completion: misma fuente que streak | `lib/progress/queries.ts` |
| 0.4 | CTA en pantalla de fin de Essential Words | `SessionDone.tsx`, `Core1000Session.tsx`, `useCore1000Session.ts` |
| 0.5 | Resumen de sesión EW + `reload` para “Continuar practicando” + flush outbox al terminar | `useCore1000Session.ts` |

**Criterios de done Fase 0:**

- [x] Migración SQL aplicable sin error.
- [x] `pnpm type-check` y tests de Fase 0 verdes (`Core1000Session`, `streak`).
- [x] Essential Words escribe `answer_history` con `core-1000` (constraint ampliado).
- [x] Streak y heatmap reflejan práctica fuera del plan diario.
- [x] `SessionDone` muestra CTAs: continuar, progreso, plan diario.

---

### Fase 1 — Hub de actividad + historial ✅

| # | Tarea | Archivos |
|---|-------|----------|
| 1.1 | Tabla `activity_sessions` + RLS | `supabase/migrations/20260616130000_activity_sessions.sql` |
| 1.2 | `recordActivitySession()` + skill tags + XP | `lib/progress/activity-hub.ts` |
| 1.3 | Reconciliación plan diario (`pending` / `done` / `resolved`) | `lib/progress/daily-reconcile.ts`, `lib/daily/plan-storage.ts` |
| 1.4 | Historial en `/progress` | `ActivityHistoryCard.tsx`, `lib/progress/queries.ts` |
| 1.5 | Wire en `PracticeSession` + Essential Words | `useSessionState.ts`, `useCore1000Session.ts` |
| 1.6 | UI plan diario: badge "Practiced" | `DailyStepList.tsx`, `useDailyPlan.ts` |

**Criterios de done Fase 1:**

- [x] Migración `activity_sessions` + tipos Supabase.
- [x] `recordActivitySession` encola vía outbox (`activity_sessions` en `SyncTable`).
- [x] Historial de sesiones en `/progress`.
- [x] Pasos del plan marcados como `resolved` cuando la práctica ocurre fuera de `/daily`.
- [x] Tests `daily-reconcile` + type-check verdes.

**Depende de:** Fase 0.

---

### Fase 2 — Radar de habilidades ✅

| # | Tarea | Archivos |
|---|-------|----------|
| 2.1 | `computeFluencyScores()` (6 dimensiones, ventana 30 días) | `lib/progress/fluency-scores.ts` |
| 2.2 | Query servidor + comparación semanal | `lib/progress/queries.ts` → `getFluencyProfile` |
| 2.3 | Integrar `FluencyRadarCard` en `/progress` | `app/progress/page.tsx` |
| 2.4 | Tests unitarios | `lib/progress/__tests__/fluency-scores.test.ts` |

**Fórmula por dimensión:** `0.6 × accuracy + 0.3 × frequency + 0.1 × retention` (0–100).

**Criterios de done Fase 2:**

- [x] Scores calculados desde `answer_history` + SRS/contrastes.
- [x] Radar visible en Progress con badge semanal (Improving / Stable / Needs focus).
- [x] Type-check y tests verdes.

---

### Fase 3 — Dominio dinámico de sonidos ✅

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Columna `mastery_pct` + backfill | `supabase/migrations/20260616140000_contrast_mastery_pct.sql` |
| 3.2 | EMA con decaimiento temporal | `lib/phoneme-practice/mastery-pct.ts`, `finish-session.ts` |
| 3.3 | Agregación por IPA (mínimo entre contrastes) | `mastery-pct.ts` → `buildSoundMasteryMap`, `rankWeakestSounds` |
| 3.4 | Sound Lab + Progress UI | `useSoundLabData.ts`, `SoundLabLessonCard.tsx`, `SkillProfileCard.tsx` |
| 3.5 | Review legacy → `finishContrastSession` | `app/review/page.tsx` |
| 3.6 | Home / daily plan weakest sound | `lib/home/queries.ts`, `lib/sounds/queries.ts` |
| 3.7 | Tests | `lib/phoneme-practice/__tests__/mastery-pct.test.ts` |

**Fórmula:** `new = old × exp(-days/14) + sessionAcc × (1 - exp(-days/14))`, clamp 0–100.

**Criterios de done Fase 3:**

- [x] Migración `mastery_pct` aplicable + backfill desde accuracy lifetime.
- [x] `finishContrastSession` persiste EMA en cada sesión.
- [x] Sound Lab cards muestran dominio dinámico (umbral mastered = 85%).
- [x] Progress muestra sonidos con menor dominio.
- [x] Type-check y tests de mastery verdes.

**Depende de:** Fase 0. Excepción online-only para `/practice/sounds` según CLAUDE.md.

---

### Fase 4 — Centro global de revisión ✅

| # | Tarea | Archivos |
|---|-------|----------|
| 4.1 | Página `/practice/review` unificada | `app/practice/review/page.tsx`, `ReviewHubClient.tsx` |
| 4.2 | Queries: frases falladas, débiles, due | `lib/review/queries.ts`, `failed-sentence-step.ts` |
| 4.3 | `buildReviewPlan` priorizado + `context=review` | `composer.ts`, `step-builders.ts` |
| 4.4 | `buildDailyPlan` antepone ítems del hub si hay SRS due | `composer.ts` |
| 4.5 | Launcher compartido | `useReviewSession.ts`, `ReviewSessionLauncher.tsx` |
| 4.6 | Redirect `/review` → hub | `app/review/page.tsx` |
| 4.7 | Links home / lexicon / drill-handoff | `HomeReviewQueueCard`, `LexiconProgressStrip`, `drill-handoff.ts` |

**Criterios de done Fase 4:**

- [x] Hub con 4 secciones: frases falladas, palabras débiles, SRS vocab, sonidos due.
- [x] Sesión unificada con `context=review` en `answer_history`.
- [x] Plan diario prioriza hasta 2 pasos del hub cuando hay SRS due.
- [x] `/review` legacy redirige al hub.
- [x] Tests de parse/merge en `lib/review/__tests__/`.

**Depende de:** Fases 1–3 parcialmente.

---

## Matriz objetivo (todas las fases)

| Actividad | Historial | Streak | Radar | Daily Plan | Review Hub |
|-----------|-----------|--------|-------|------------|------------|
| Essential Words | F0 | F0 | F2 | F1 | F4 |
| Sound Lab | ✓ | F0 | F2 | F1 | F4 |
| Lexicon | parcial | F0 | F2 | — | F4 |
| Grammar | parcial | F0 | F2 | F1 | F4 |
| AI Coach | parcial | F0 | F2 | — | F4 |
| Daily Plan | ✓ | F0 | F2 | ✓ | — |
| Courses | ✓ | F0 | F2 | F1 | — |

---

## Riesgos y decisiones

1. **Umbral de racha:** mantener 5 respuestas/día (Lima) para cualquier contexto en Fase 0.
2. **Dexie vs Supabase:** EW sigue offline-first en Dexie; telemetría va por outbox → Supabase.
3. **XP server-side:** unificar en Fase 1 vía `activity_sessions.xp_earned`.
4. **No romper offline:** `recordActivitySession` encola; nunca bloquea UX.

---

## Referencias de código

| Pieza | Path |
|-------|------|
| Practice Engine | `lib/practice/queries.ts`, `lib/practice/types.ts` |
| Streak | `lib/daily/streak.ts`, `lib/daily/streak-core.ts` |
| Progress queries | `lib/progress/queries.ts` |
| Essential Words grade | `lib/core-1000/grade.ts` |
| Radar (dormant) | `components/progress/FluencyRadarCard.tsx` |
| Review plan builder | `lib/practice/daily-plan/composer.ts` → `buildReviewPlan` |
| Contrast SRS | `lib/phoneme-practice/finish-session.ts` |
