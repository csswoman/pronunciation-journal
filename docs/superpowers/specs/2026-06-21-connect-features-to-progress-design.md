# Conectar features sueltas al flujo de progreso — Design

**Fecha:** 2026-06-21
**Estado:** Aprobado (diseño) — pendiente revisión de spec por el usuario

## Problema

Tres features producen interacción evaluable del usuario pero **no escriben al flujo de progreso** (`answer_history` + SRS). El resultado se pierde al cerrar la sesión y no contribuye a historial, streak, charts de consistencia ni al repaso espaciado.

Features afectadas (auditoría 2026-06-20):

1. **AI Coach — ejercicios del chat.** `answerToolCall` ([hooks/useStreamingChat.ts:222](../../../hooks/useStreamingChat.ts#L222)) recibe cada `ExerciseResult` (con `topic`, `correct`, `score`, `ipa`) y solo actualiza `learningState` en memoria/Dexie + sincroniza el estimado CEFR. Nunca escribe `answer_history` ni rutea a `topic_srs`, pese a que cada resultado trae `topic` — la llave exacta que `savePracticeAnswer` usa para `enqueueTopicSRSUpdate`. Widgets: `FillBlankWidget`, `MultipleChoiceWidget`, `SpeakingWidget`.
2. **Interview.** `InterviewResults` ([components/interview/InterviewResults.tsx](../../../components/interview/InterviewResults.tsx)) calcula accuracy de pronunciación por turno pero no persiste nada.
3. **Mini-lessons.** `/mini-lessons/[slug]` ([app/mini-lessons/[slug]/page.tsx](../../../app/mini-lessons/[slug]/page.tsx)) es contenido estático con quiz inline; no hay marca de "lección completada" ni registro (contrasta con `/courses`, que sí lo tiene vía `recordLessonComplete`).

Las features que **sí** están conectadas (Phoneme Practice, Generic Exercises, Lexicon, Courses, Reader, Daily/Core 1000) se dejan intactas.

## Insight central

`savePracticeAnswer(userId, answer)` ([lib/practice/queries.ts:57](../../../lib/practice/queries.ts#L57)) es el punto de entrada universal del progreso. Ya maneja:
- escritura a `answer_history` vía outbox (`context`, `content_id`, `topic`, `grade`)
- ruteo automático a `topic_srs` cuando hay `topic` (`enqueueTopicSRSUpdate`)
- ruteo a word_bank / fragment SRS cuando hay `sourceRef`

El diseño **no construye nueva infraestructura de persistencia**: rutea tres UIs hacia esta función existente, en el punto donde cada feature ya conoce su resultado. Sigue el precedente exacto de `recordLessonComplete`.

Verificado: `'ai_coach'` ya es un valor válido del CHECK constraint `answer_history_context_check` ([supabase/migrations/20260616120000_answer_history_contexts.sql](../../../supabase/migrations/20260616120000_answer_history_contexts.sql)). No requiere migración de contexto.

## Approach elegido

**Approach A — rutear cada callback de finalización existente hacia `savePracticeAnswer`.** Sin abstracciones nuevas (descartado un facade `lib/progress/record.ts` por redundante con `savePracticeAnswer`; descartado un event-bus por YAGNI). Todas las escrituras son best-effort (try/catch) y nunca bloquean la UX, igual que `recordLessonComplete`.

---

## Sección 1 — AI Coach

**Call site:** `answerToolCall` en [hooks/useStreamingChat.ts:222](../../../hooks/useStreamingChat.ts#L222). Tras el update existente de `learningState`, agregar una llamada best-effort a `savePracticeAnswer`.

**Por respuesta:**
```
savePracticeAnswer(userId, {
  exerciseTypeId, slug,           // derivados del widget/tool (ver mapeo)
  isCorrect: result.correct,
  topic: result.topic,            // savePracticeAnswer lo normaliza → topic_srs
  context: 'ai_coach',
  contentId: `ai_coach:${normalizeTopic(result.topic)}`,
  timeMs: 0,
  userAnswer: <si aplica>,
})
```

**Mapeo widget → exercise type:**

| Tool/widget | slug | exerciseTypeId |
|---|---|---|
| FillBlankWidget | `fill_blank` | 5 |
| SpeakingWidget | `speak_word` | 10 |
| MultipleChoiceWidget | `multiple_choice` | **null → ver decisión** |

**Decisión requerida — `multiple_choice`:** `EXERCISE_TYPE_IDS.multiple_choice === null` ([lib/practice/types.ts:49](../../../lib/practice/types.ts#L49)) y `savePracticeAnswer` hace early-return cuando `exerciseTypeId === null` ([lib/practice/queries.ts:62](../../../lib/practice/queries.ts#L62)). Sin acción, las respuestas de opción múltiple del coach se descartan silenciosamente. Opción elegida: **agregar una fila `multiple_choice` a `exercise_types` vía migración** y asignarle su id en `EXERCISE_TYPE_IDS`, para que las respuestas más comunes del coach cuenten. (Alternativa descartada: mapear `multiple_choice`→`fill_blank`, porque contamina las analíticas por tipo.)

**`userId` en scope:** `useStreamingChat` no lo tiene hoy. Se threadea desde `useAIPractice` (que ya carga `getUserLearningState(userId)`) hacia el hook. Detalle exacto a resolver en el plan.

**Resultado:** practicar fill-blank / opción múltiple / speaking con el coach cuenta para historial, streak y topic-SRS. Cierra el loop con `/practice`.

---

## Sección 2 — Interview

**Call site:** `InterviewResults` ([components/interview/InterviewResults.tsx:57](../../../components/interview/InterviewResults.tsx#L57)) ya tiene un `useEffect` con ref-guard (`fired`) para confetti. Agregar un `useEffect` hermano con su propio ref-guard que dispara una vez al montar resultados.

**Una fila por turno de candidato con score:**
```
savePracticeAnswer(userId, {
  exerciseTypeId: 10, slug: 'speak_word',
  isCorrect: score.accuracy >= threshold,
  context: 'ai_coach',
  contentId: `interview:${turnIndex}`,
  userAnswer: result.transcript,
  timeMs: 0,
  exercisePayload: { targetWord: turn.text, accuracy: score.accuracy },
})
```

- **Sin `topic`** → no topic-SRS (correcto: turnos de pronunciación no son conceptos gramaticales).
- **Sin `sourceRef`** → no word_bank SRS.
- Contribución pura a historial/streak, sin acoplar Interview al `learningState` del coach.

**`userId` en scope:** `InterviewResults` no lo recibe hoy. Se obtiene threadeando `user.id` desde el componente dueño de la sesión (vía `useAuth`), o leyendo `useAuth` directo en `InterviewResults`. Se elige el más limpio en el plan según cómo se monta `InterviewSession`.

**Best-effort:** try/catch, nunca bloquea la UI de resultados.

---

## Sección 3 — Mini-lessons

**Wrinkle:** `/mini-lessons/[slug]/page.tsx` es Server Component (estático). `recordLessonComplete` es client-side (Dexie + Supabase browser). El trigger debe vivir en un componente cliente.

**Triggers de completado:**
- **Con quiz:** `MiniLessonQuiz` (ya es client). Al terminar el quiz (todas respondidas), llama `recordLessonComplete('mini-lessons', slug)`.
- **Sin quiz** (`content.quiz.length === 0`): nuevo componente cliente `MiniLessonComplete` en el footer con botón "Mark as read" que llama el mismo `recordLessonComplete('mini-lessons', slug)`.
- Ambos reciben `slug` (la página ya lo tiene).

**Escritura:** reusa `recordLessonComplete` → Dexie `completedLessons` (courseSlug `'mini-lessons'`) + una fila `answer_history` con `context='courses'`, `content_id='mini-lessons:<slug>'`. Aparece en streak/consistencia como las lecciones de curso.

**Idempotencia:** `markLessonComplete` (Dexie put) es idempotente por clave, pero el insert a `answer_history` duplicaría en re-finish. El componente guarda contra Dexie `completedLessons` antes de escribir (mismo patrón que `useCoursePathProgress.isComplete`). Guard exacto a confirmar en el plan.

**Quiz answers:** quedan locales (la señal de progreso es el completado, no filas por pregunta).

---

## Testing

- **AI Coach:** test unitario de que `answerToolCall` invoca `savePracticeAnswer` con `context='ai_coach'` y el `exerciseTypeId`/`topic` correctos por tipo de widget (mock de `savePracticeAnswer`).
- **Interview:** test de que montar `InterviewResults` con N turnos con score produce N llamadas a `savePracticeAnswer` con `isCorrect` derivado del threshold, y que un re-render no las duplica (ref-guard).
- **Mini-lessons:** test de que terminar el quiz / pulsar "Mark as read" llama `recordLessonComplete('mini-lessons', slug)` una sola vez y respeta el guard de idempotencia.
- Regresión: ningún cambio rompe los flujos ya conectados; los tests existentes de `savePracticeAnswer`/sync siguen verdes.

## Out of scope

- SRS de sonidos/fonemas para Interview (solo historial por ahora).
- Filas `answer_history` por pregunta individual de quiz en mini-lessons.
- Cualquier refactor de los flujos ya conectados.
- Acoplar Interview al `learningState` del coach (`strugglingSounds`).

## Documentación a actualizar

- `docs/architecture/exercises.md`: sección "Persistencia y tracking" — documentar que AI Coach, Interview y mini-lessons ahora escriben a `answer_history`/SRS, y cómo.
