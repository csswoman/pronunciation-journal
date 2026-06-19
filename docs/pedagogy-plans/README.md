# Pedagogy Plans — English Journal

Backlog pedagógico derivado de la auditoría del 2026-06-19 (equipo: Linguista TESOL · Arquitecto curricular · LXD · Product Designer EdTech · Científico cognitivo).

Cada plan aquí ataca un **eslabón pedagógico roto**, no una mejora cosmética. El diagnóstico central:

> La app tiene una base técnica sólida (registry, generadores, `daily-plan`, dos motores SRS) ejecutando un modelo pedagógico a medio terminar. Faltan tres eslabones: **cerrar el SRS de vocabulario**, **añadir producción libre**, y **narrar el camino al alumno**.

Promedio de la auditoría: **~49/100**. Hechos estos tres eslabones, la app salta a los 70s reales.

---

## Orden de ejecución recomendado

El orden importa: sin el #1 (SRS cerrado), los demás no consolidan nada.

| # | Plan | Tipo | Impacto | Esfuerzo | Estado |
|---|------|------|---------|----------|--------|
| 1 | [01-close-vocab-srs.md](./01-close-vocab-srs.md) | 🔴 Crítico | Máximo | 2-3 días | ✅ Hecho |
| 2 | [02-noticing-presentation-step.md](./02-noticing-presentation-step.md) | 🔴 Crítico | Alto | 1-2 días | ✅ Hecho |
| 3 | [03-free-production-exercise.md](./03-free-production-exercise.md) | 🔴 Crítico | Alto | 4-6 días | 📋 Por planear |
| 4 | [04-narrate-the-path.md](./04-narrate-the-path.md) | 🟠 Importante | Medio | 1-2 días | 📋 Por planear |
| 5 | [05-reorder-tolerant-grading.md](./05-reorder-tolerant-grading.md) | ⚡ Quick win | Medio | 1 día | 📋 Por planear |
| 6 | [06-phoneme-vocab-bridge.md](./06-phoneme-vocab-bridge.md) | 🟠 Importante | Medio | 3-4 días | 📋 Por planear |
| 7 | [07-comprehensible-input-reader.md](./07-comprehensible-input-reader.md) | 🟠 Importante | Alto | 5-7 días | 📋 Por planear |

> Cada archivo arranca como **brief** (problema + objetivo + criterios de aceptación). Conviértelo en plan ejecutable con `superpowers:writing-plans` antes de implementar.

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
