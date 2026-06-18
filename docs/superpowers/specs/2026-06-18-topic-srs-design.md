# Topic SRS — Cerrar el "círculo perfecto" de repaso

**Fecha:** 2026-06-18
**Estado:** Aprobado (diseño)
**Branch objetivo:** dev

## Problema

La app tiene tres mecanismos SRS desconectados, lo que crea silos de datos:

| Dominio | Escribe | Review lo lee | Estado |
|---------|---------|---------------|--------|
| Palabras | `word_bank` (SM-2 completo) | ✅ | OK |
| Sonidos | `user_contrast_progress` (SR completo) | ✅ | OK |
| Oraciones | `answer_history` | ⚠️ muestra fallas, sin intervalos | Sin scheduling |
| Cursos / lecciones / gramática | `answer_history` | 🔴 nunca | **Data silo** |

Los ejercicios de cursos, lecciones y gramática escriben a `answer_history` con `context` y `content_id`, pero el review hub nunca los consulta. Acumulan datos que no impulsan ninguna repetición espaciada. Las oraciones se muestran como "falladas" pero sin fecha de próxima revisión.

El usuario quiere un "círculo perfecto": *todo lo que se practica se repasa*, porque todo es aprendizaje.

## Decisión de modelo

**La unidad de repaso es el CONCEPTO (topic), no el ejercicio ni la lección.**

Razones:
- No depende de que cada lección tenga ejercicios asociados (problema actual: no todas los tienen). Si el SRS programara *ejercicios*, las lecciones sin ejercicios quedarían fuera del círculo. Programar *conceptos* desacopla aprendizaje de entrega.
- Es lo que ya hacen los dos sistemas sanos: `word_bank` repasa *la palabra*; `user_contrast_progress` repasa *el contraste*. Ambos son concepto-céntricos.
- Desacopla entrega: cuando toca repasar un concepto, se entrega el mejor ejercicio disponible; agregar tipos nuevos no rompe el círculo.

El círculo perfecto:

```
Lección enseña concepto → practicas (cualquier ejercicio) → SRS programa el CONCEPTO
  → toca repasar → se entrega un ejercicio que cubre ese concepto → repites
```

Hallazgo clave: el "concepto" **ya existe en runtime** como el campo `topic: string` que viaja en cada ejercicio (`lib/ai-practice/tools/registry.ts`, `lib/exercises/design.ts`), y `lib/ai-practice/learning-state.ts` ya rastrea "weak topics" por ese string. Solo falta persistirlo y programarlo.

## Enfoque elegido (Opción B)

SRS sobre el `topic` string directamente, reusando el patrón de `word_bank`. **No** se normaliza contenido ni se crea tabla de referencia de conceptos. **No** se refactorizan los sistemas SRS existentes que funcionan.

### Nueva tabla Supabase: `topic_srs`

Patrón espejo de `word_bank`, con `topic` (string normalizado) como clave en vez de `word_id`.

```
topic_srs
  id              uuid pk default gen_random_uuid()
  user_id         uuid not null references auth.users(id) on delete cascade
  topic           text not null            -- normalizado (ver normalizeTopic)
  ease_factor     real not null default 2.5
  interval_days   integer not null default 0
  repetitions     integer not null default 0
  next_review_at  timestamptz
  last_reviewed_at timestamptz
  srs_status      text not null default 'new'   -- 'new' | 'learning' | 'review'
  review_count    integer not null default 0
  created_at      timestamptz not null default now()
  updated_at      timestamptz not null default now()
  unique (user_id, topic)
```

- **RLS obligatorio**: políticas `select/insert/update/delete` donde `auth.uid() = user_id` (igual que `word_bank`).
- Índice en `(user_id, next_review_at)` para la consulta de "due".
- Migración en `supabase/migrations/` con timestamp posterior a `20260616140000`.

### Normalización de topic — `normalizeTopic()`

Normalización ligera (predecible, sin diccionario de mantenimiento):
- lowercase + trim
- colapsar espacios y guiones bajos/medios a un separador único
- **conservar el prefijo de dominio** (`grammar:`, `vocab:`, etc.)

Ejemplos: `"Present Simple"` → `"present simple"`; `grammar:present_simple` → `grammar:present simple`. `grammar:articles` y `vocab:articles` permanecen distintos (son conceptos distintos).

Vive en `lib/practice/normalize-topic.ts` (función pura, testeable de forma aislada).

## Flujo de datos

### Escritura (al guardar una respuesta)

1. `answer_history` gana una columna `topic` (text, nullable) — migración aparte. Se persiste el topic normalizado en cada respuesta para trazabilidad y para el panel de historial.
2. `lib/practice/queries.ts` → `savePracticeAnswer()`: tras guardar el answer, si el ejercicio trae `topic`, llamar a un nuevo `enqueueTopicSRSUpdate()` análogo a `enqueueWordBankSRSUpdate()`.
3. `lib/practice/topic-srs-queries.ts` (nuevo): aplica SM-2 (reusar la lógica/util SM-2 existente que usa `word_bank`, no reimplementar) sobre la fila `topic_srs` correspondiente, upsert por `(user_id, topic)`. Se encola en el outbox (`lib/sync/`) como el resto.

### Lectura (review hub)

4. `lib/review/server-queries.ts`: nueva `getDueTopicsForReview(userId)` que filtra `topic_srs` por `next_review_at <= now()`, más conteo de débiles (`srs_status in ('new','learning')`), espejo de `getWordsDueForReview` / `getWeakWordsForReviewServer`.
5. `getReviewHubSummary()` agrega `dueTopics` / `weakTopics` al summary.
6. `lib/review/srs-history-queries.ts`: añadir `topic_srs` como cuarta fuente normalizada en el panel de historial (junto a words, sounds, sentences).

### Entrega del repaso

7. Cuando el usuario elige repasar un topic, se entrega un ejercicio que lo cubre. Reusar el generador de ejercicios de práctica (`lib/ai-practice` / `lib/exercises`) pasando el `topic` como objetivo. La respuesta de ese ejercicio vuelve a alimentar `topic_srs` (cierra el ciclo).

## UI / Transparencia

El usuario pidió explícitamente transparencia. El review hub debe mostrar el topic como un dominio de primera clase:
- Sección de "Conceptos / Topics" en `ReviewHubClient` con conteo de due + weak, paralela a Words y Sounds.
- El `SrsHistoryPanel` muestra topics con su `next_review_at` y estado, igual que los otros dominios.
- Reusar componentes existentes del hub (no inventar UI nueva): mismas tarjetas/contadores.

## Componentes (estructura planeada)

```
// Capa de datos (nuevos)
// lib/practice/normalize-topic.ts        — normalizeTopic() (puro)
// lib/practice/topic-srs-queries.ts      — enqueueTopicSRSUpdate + SM-2 sobre topic_srs
// lib/review/server-queries.ts           — getDueTopicsForReview (añadir)
// lib/review/srs-history-queries.ts      — fuente topic_srs (añadir)

// Migraciones
// supabase/migrations/*_topic_srs.sql            — tabla + RLS + índice
// supabase/migrations/*_answer_history_topic.sql — columna topic nullable

// UI (extender, no crear de cero)
// components/review/ReviewHubClient        — sección Topics
// components/review/SrsHistoryPanel        — fila/dominio topics
```

## Manejo de errores

- Si un ejercicio no trae `topic`, se omite el update de `topic_srs` (no se inventa). Comportamiento actual de cursos/lecciones sin topic queda igual hasta que se les asigne uno — no regresión.
- Outbox: el update de `topic_srs` sigue el mismo patrón de reintento/flush que `word_bank`; no rompe offline en práctica (la escritura SRS de topic se encola). Nota: este flujo es práctica general (Dexie⇄Supabase aplica), distinto del caso `/practice/sounds` online-only.
- `getDueTopicsForReview` con error → fallback graceful (lista vacía + log), como ya hace `getReviewWords`.

## Fuera de alcance (YAGNI)

- Tabla `grammar_topics` normalizada / FKs (Opción A). Descartado: requiere backfill y mantenimiento.
- Refactor a tabla única `review_items` (Opción C). Descartado: reescribe sistemas sanos.
- Diccionario de sinónimos / normalización agresiva. Descartado: mantenimiento.

## Testing

- `normalize-topic.test.ts`: casos de lowercase, espacios/guiones, conservación de prefijo, conceptos distintos no fusionados.
- `topic-srs-queries.test.ts`: SM-2 produce intervalos correctos; upsert por `(user_id, topic)`; status transitions.
- `srs-history-queries`: topic aparece normalizado junto a otros dominios.
- Migración: verificar RLS (no leer filas de otro user).
- No romper los 496 tests existentes del módulo de ejercicios.

## Criterios de éxito

- Un ejercicio de curso/gramática/oración con `topic` fallado o practicado genera/actualiza una fila en `topic_srs` con `next_review_at`.
- El review hub muestra topics due y permite repasarlos, entregando un ejercicio del topic.
- El panel de historial SRS muestra los cuatro dominios (words, sounds, sentences, topics) de forma unificada y transparente.
- Cero regresiones en word_bank y contrast SRS.
