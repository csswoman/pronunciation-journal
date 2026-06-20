# Pedagogy Plans — English Journal

Backlog pedagógico derivado de la auditoría del 2026-06-19 (equipo: Linguista TESOL · Arquitecto curricular · LXD · Product Designer EdTech · Científico cognitivo).

Cada plan aquí ataca un **eslabón pedagógico roto**, no una mejora cosmética. El diagnóstico central:

> La app tiene una base técnica sólida (registry, generadores, `daily-plan`, dos motores SRS) ejecutando un modelo pedagógico a medio terminar. Faltan tres eslabones: **cerrar el SRS de vocabulario**, **añadir producción libre**, y **narrar el camino al alumno**.

Promedio de la auditoría: **~49/100**. Hechos estos tres eslabones, la app salta a los 70s reales.

---

## Estado de implementación (actualizado 2026-06-19, commit `ce60eab`)

Los **7 planes están implementados en código** y `pnpm test` pasa (624 tests).
Esta tabla refleja el estado verificado contra el código y la DB, no el plan original.

| # | Plan | Tipo | Estado código | DB (remote) | Pendiente |
|---|------|------|---------------|-------------|-----------|
| 1 | [01-close-vocab-srs.md](./01-close-vocab-srs.md) | 🔴 Crítico | ✅ Committed (`b37ba57`) | ✅ | — |
| 2 | [02-noticing-presentation-step.md](./02-noticing-presentation-step.md) | 🔴 Crítico | ✅ Committed (`f468c9c`) | ✅ | — |
| 3 | [03-free-production-exercise.md](./03-free-production-exercise.md) | 🔴 Crítico | ✅ Committed (`b95c4df`) | ✅ slugs `written/spoken_production` | — |
| 4 | [04-narrate-the-path.md](./04-narrate-the-path.md) | 🟠 Importante | 🟡 **Sin commitear** (working tree) | n/a | Commit + wiring de `topicDisplayLabel` en step subtitles |
| 5 | [05-reorder-tolerant-grading.md](./05-reorder-tolerant-grading.md) | ⚡ Quick win | ✅ Committed | n/a | Opción B diferida |
| 6 | [06-phoneme-vocab-bridge.md](./06-phoneme-vocab-bridge.md) | 🟠 Importante | ✅ Committed (`433961f`) | n/a | Tarea 3 diferida (opcional) |
| 7 | [07-comprehensible-input-reader.md](./07-comprehensible-input-reader.md) | 🟠 Importante | ✅ Committed (11 commits) | ✅ tabla `reader_passages` | Verificar si falta slug `reader` en `exercise_types`; QA manual |

> Los briefs originales (problema + objetivo + criterios) se conservan abajo; cada
> uno cierra con una sección **Implementación** que documenta lo entregado y lo diferido.

### Backlog vivo

1. **Commitear plan 04** — vive solo en el working tree (`topic-labels.ts`, `Core1000ProgressCard.tsx`, 10 archivos `M`). Un cambio de rama lo pierde.
2. **Completar wiring de plan 04** — los `subtitle` de `lib/practice/daily-plan/step-builders.ts` siguen siendo prosa hardcodeada; deberían consumir `topicDisplayLabel()` para narrar el objetivo gramatical real del paso.
3. **Verificar slug `reader`** — `reader_passages` existe, pero `exercise_types` no tiene fila `reader`. El reader es un `DailyStep` propio, así que probablemente no la necesita; confirmar que ningún lookup la espera.
4. **QA manual reader** — completar daily plan con ≥3 due → verificar reader step + exposure tracking, y reread offline desde Dexie.

---

## Briefs

### 1. Cerrar el loop SRS de vocabulario/gramática 🔴

**Problema:** `docs/architecture/exercises.md:347` — los ejercicios genéricos registran en `answer_history` pero **no actualizan SM-2**. Una palabra que fallas hoy no reaparece programada. El reciclaje es lotería, no spaced repetition.

**Objetivo:** Disparar SM-2 sobre `word_bank` (y `topic_srs`) desde `savePracticeAnswer` usando `sourceRef.id` / `topic`. Mergear el plan `topic-srs` existente.

**Por qué primero:** Sin esto, ningún otro eslabón consolida. Es el bug pedagógico #1.

**Aceptación:** fallar una palabra en `fill_blank` crea/actualiza su fila SM-2 y la re-entrega el review hub cuando vence.

---

### 2. Paso de presentación / noticing antes de testear 🔴

**Problema:** El alumno salta directo a recuperación (`fill_blank`, `match_pairs`) sin un encuentro previo con la palabra. Cognitivamente = testear antes de enseñar → carga extrínseca alta.

**Objetivo:** Insertar un paso de presentación (forma + significado + audio) para palabras nuevas antes de su primer test. Reusar `WordStudyCard` (ya en staging).

**Aceptación:** una palabra en estado `new` muestra card de estudio antes de su primer ejercicio de recuperación.

---

### 3. Ejercicio de producción libre (escrita + oral) con grading IA 🔴

**Problema:** Ruptura total Controlled→Free. `speak_word` es repetición de 1 palabra; `sentence_dictation` es copiar al oído. Cero lenguaje propio del alumno → cero transferencia (score 35/100).

**Objetivo:** Nuevo tipo de ejercicio "usa X en una oración" (escrito) + extender `SpeakScoredExercise.tsx` (en staging) de palabra a respuesta libre. Grading vía `/api/gemini/*` con prompt en `lib/ai-prompts.ts`.

**Aceptación:** el alumno produce una oración original; la IA evalúa uso correcto del ítem objetivo y da feedback.

---

### 4. Narrar el camino al alumno 🟠

**Problema:** Sistema coherente en el motor, percibido como colección por el alumno. Pregunta "¿por qué hago esto?" en cada paso. El `topic` existe en el dato pero no se muestra.

**Objetivo:** Mostrar el objetivo del paso (`topic`/concepto), etiqueta de progreso Core 1000 ("742/1000"), y sensación de "esto vuelve hasta dominarlo".

**Aceptación:** cada paso de la sesión declara qué entrena; la home muestra avance hacia Core 1000.

---

### 5. `reorder_words`: grading tolerante ⚡

**Problema:** Valida con comparación exacta de string (`exercises.md:236`). Un orden alternativo válido se marca mal → frustración + señal de aprendizaje falsa. Inconsistente con el Levenshtein de dictation.

**Objetivo:** Aceptar órdenes alternativos gramaticalmente válidos, o validar con tolerancia coherente con el resto.

**Aceptación:** una reordenación válida distinta del original no se marca como error.

---

### 6. Puente fonema ↔ vocabulario 🟠

**Problema:** Phoneme (`user_sound_progress`) y vocab (`word_bank`) son dos apps pegadas. Si fallas /ɪ/ vs /iː/, el sistema no te trae `ship/sheep` desde tu word_bank.

**Objetivo:** Cuando un sonido es débil, priorizar palabras del `word_bank` que lo contienen en la sesión de vocab.

**Aceptación:** un sonido débil influye en la selección de palabras del paso de vocabulario.

---

### 7. Reader de comprehensible input 🟠

**Problema:** No hay input >1 oración. Cero Comprehensible Input (Krashen, i+1). Reading extensivo ausente.

**Objetivo:** Párrafos cortos (generados/curados) que reciclan el vocabulario reciente del alumno, con comprensión ligera.

**Aceptación:** el alumno lee un párrafo con su vocab reciclado y demuestra comprensión.

---

## Notas de arquitectura

- Todos los planes son **evolución, no demolición**. La arquitectura de generadores + registry + `daily-plan` ya está al ~60% del rediseño ideal.
- Nuevos tipos de ejercicio siguen el flujo de `docs/architecture/exercises.md:367` (tipo discriminado → generador → componente → migración → registro).
- Grading IA: prompts solo en `lib/ai-prompts.ts`, llamadas solo vía `/api/gemini/*` (hard rule de CLAUDE.md).
- SRS: reusar `lib/srs/compute.ts` (SM-2), no reimplementar.
