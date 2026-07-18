# Sistemas SRS — English Journal

Cuatro sistemas de repetición espaciada conviven en la app. Cada uno tiene un dominio distinto y no se solapan.

| Sistema | Almacenamiento | Algoritmo | Clave |
| --- | --- | --- | --- |
| Vocabulario user-owned | `word_bank` (Supabase ⇄ Dexie) | SM-2 cliente | `id` (uuid) |
| Fonemas | `user_sound_progress` (Supabase) | SM-2 simplificado | `sound_id` |
| Essential Words (NGSL / `c1k:`) | `srsData` (Dexie, offline-first) | SM-2 cliente | `c1k:<word>` |
| Temas / conceptos del curso | `topic_srs` (Supabase) | SM-2 cliente | `normalizeTopic()` |

---

## 1. `word_bank` — Vocabulario user-owned

**Propósito:** Tarjetas de vocabulario que el usuario agrega explícitamente desde cualquier contexto (lexicón, práctica, diario).

**Tabla:** `word_bank`

**Algoritmo:** SM-2 implementado en el cliente (`lib/srs/computeSM2.ts`). Los campos `ease_factor` e `interval_days` se actualizan tras cada revisión.

**Campos clave:**

| Campo | Rol |
|---|---|
| `ease_factor` | Factor de facilidad SM-2 (inicia en 2.5) |
| `interval_days` | Días hasta la próxima revisión |
| `next_review_at` | Fecha calculada de próxima revisión |
| `difficulty` | Dificultad intrínseca de la palabra (0–1) |
| `status` | Estado de audio: `pending`, `ready`, `error` |

**Sincronización:** Dexie ⇄ Supabase vía `lib/sync/`.

**Punto de entrada futuro:** Cuando lexicón necesite marcar palabras como "learned", lo hará insertando en `word_bank` (Tarea 12). No se necesita una tabla separada de progreso.

---

## 2. `user_sound_progress` — Fonemas

**Propósito:** Rastrea el dominio de fonemas individuales por usuario. Alimenta el perfil de habilidades fonemáticas.

**Tabla:** `user_sound_progress`

**Algoritmo:** SM-2 simplificado, evaluado tras ejercicios de pronunciación.

**Campos clave:**

| Campo | Rol |
|---|---|
| `sound_id` | Referencia a `sounds.id` |
| `level` | Nivel de dominio actual |
| `next_review_at` | Próxima revisión programada |
| `last_practiced_at` | Última vez practicado |

**Queries:** `lib/practice/queries.ts`

---

## 3. `srsData` (`c1k:`) — Essential Words (NGSL)

**Propósito:** Repaso espaciado tipo Anki sobre las ~2800 palabras de alta frecuencia (NGSL), no solo las primeras 1000. Sustituye al antiguo `Core1000Session`, que reiniciaba siempre desde la primera palabra sin persistir progreso.

**Ruta canónica:** `/practice/essential-words` (hub + sesión + Baúl). `/practice/core-1000` redirige ahí por compatibilidad con bookmarks antiguos; no usarla en enlaces nuevos.

**Tabla:** `srsData` (Dexie, IndexedDB) — offline-first, sin sincronización a Supabase. Las entradas se distinguen por el prefijo `c1k:` en `wordId` (ej. `c1k:work`). No renombrar el prefijo ni los `wordId` almacenados: orfanaría el progreso del usuario. La capa de datos sigue en `lib/core-1000/`.

**Algoritmo:** SM-2 cliente (`lib/srs/computeSM2.ts`), igual que `word_bank`.

**Estado (`status`):** cada fila SRS puede estar en `active`, `snoozed` o `mastered`. Si `status` falta, se trata como `active` (`effectiveStatus` en `lib/srs/status.ts`).

| Estado | Comportamiento |
|---|---|
| `active` | Entra en la cola de repaso según SM-2 |
| `snoozed` | Fuera de la cola hasta `nextReview`; visible en el Baúl SRS |
| `mastered` | Nunca vence; solo buscable en el Baúl SRS |

**«Ya la sé» → snooze:** en sesión, el botón llama `snoozeEssentialWord` (`lib/db/index.ts`) con **90 días** por defecto y saca la palabra de la cola al momento. No muestra aún las opciones de dominio permanente.

**Snooze vencido → reactivación automática:** antes de construir la cola, `prepareCore1000SrsEntries` (`lib/core-1000/prepare-srs.ts`) aplica `activateExpiredSnoozes` (`lib/srs/status.ts`). Si `nextReview` ya pasó, la fila vuelve a `active`, entra en la cola y sale del Baúl. Esas cartas llevan `fromSnooze` en la cola.

**Al volver del snooze (`fromSnooze`):** en la tarjeta de speak, además del flujo normal, aparecen dos acciones secundarias (sin bloquear el micrófono):
- «Seguir en 90 días» → otro snooze (`snoozeEssentialWord`)
- «No me la recuerdes más» → `masterEssentialWord` (sale del SRS; solo queda en el Baúl)

**Baúl SRS (`SrsVault`):** componente trigger + modal (`components/practice/srs-vault/`) en `/practice/essential-words` y en Review hub (fase `idle`). Lista entradas `snoozed` y `mastered`, con filtros y búsqueda (`lib/srs/vault.ts`). Desde el Baúl se puede cambiar el intervalo (7 / 30 / 90 / 180), practicar ya o marcar como dominada.

**Migración legacy:** filas antiguas con `archived: true` se convierten una sola vez a `status: snoozed` vía `migrateArchivedSrsRows` (`lib/db/index.ts`), usando `migrateArchivedRow` (`lib/srs/migrate-archived.ts`). Idempotente; se ejecuta al abrir el Baúl y al leer entradas.

**Cola de sesión (estilo Anki):** lógica pura en `lib/core-1000/queue.ts`, testeable sin React:

| Función | Rol |
|---|---|
| `buildSessionQueue` | Ordena vencidas primero, luego nuevas por rango |
| `reinsertLearning` | Reinserta una palabra fallada ~3 turnos después (relapse en la misma sesión) |
| `deriveCounts` | Cuenta restantes por tipo (`new` · `learning` · `review`) para el HUD |
| `appendNewBatch` | Sube el cupo diario cuando el usuario pide "aprender más" |

Cada ítem lleva `kind: 'new' | 'learning' | 'review'` (antes era un booleano `isNew`).

**Orquestación:** `hooks/useEssentialWordsSession.ts`. Las palabras falladas difieren su escritura SM-2 (`pendingLapsesRef`) hasta `finishSession`, para no programarlas a mañana a mitad de sesión.

**Contenido — `sentence_ipa`:** cada palabra con `example_sentence` incluye transcripción IPA de la frase completa (CMU + acento léxico + weak forms cuando aplica). Obligatorio si hay `ipa_weak` (`lib/core-1000/schema.ts`).

**Validación de contenido:** `scripts/validate-core-1000.mjs` verifica que cada palabra aparezca en su `example_sentence` (entendiendo conjugaciones, plurales, posesivos e irregulares). Sale con código 1 si hay desajustes.

---

## 4. `topic_srs` — Temas / conceptos del curso

**Propósito:** Cierra el bucle práctica → repaso para los conceptos gramaticales y temáticos del curso. Cada concepto practicado entra al ciclo SRS y aparece como cuarto dominio en el Review Hub.

**Tabla:** `topic_srs` (Supabase). Espeja `word_bank` con columnas SM-2, RLS por `user_id`, y `UNIQUE (user_id, topic)`. Migración: `supabase/migrations/20260618120000_topic_srs.sql`.

**Algoritmo:** SM-2 cliente. La escritura se encola con `enqueueTopicSRSUpdate` (`lib/practice/topic-srs-queries.ts`) tras guardar una respuesta.

**Clave del tema:** `normalizeTopic()` (`lib/practice/normalize-topic.ts`) produce la clave canónica: minúsculas, espacios colapsados, prefijo de dominio preservado (`grammar:present simple`). Mantiene distintos los conceptos homónimos entre dominios (`grammar:articles` ≠ `vocab:articles`).

**Trazabilidad:** `answer_history.topic` (nullable) guarda el tema del ejercicio que originó la respuesta. Migración: `supabase/migrations/20260618130000_answer_history_topic.sql`.

**Lectura para el Review Hub:** `lib/review/srs-history-queries.ts` lee temas vencidos/débiles y los expone como cuarto dominio junto a vocabulario, fonemas y Essential Words.

---

## Convención: `content_id` en `answer_history`

El campo `answer_history.content_id` usa prefijos para que las queries SRS puedan filtrar por fuente sin joins:

| Formato | Fuente | Ejemplo |
| --- | --- | --- |
| `word_bank:<uuid>` | `word_bank` (vocabulario del usuario) | `word_bank:abc-123` |
| `<opaque>` (sin prefijo) | Ejercicios fonemáticos / sin `sourceRef` | `42:pick_word:seat:a,b` |

**Cómo se construye:**

1. El generator emite `sourceRef: { source, id }` en el `GenericExercise`.
2. El adapter (`fromGenericExercise`) copia `sourceRef` a `PracticeExercise`.
3. `PracticeSession.handleSubmit` copia `sourceRef` a `ExerciseResult`.
4. `savePracticeAnswer` serializa como `"${source}:${id}"` cuando `sourceRef` está presente; de lo contrario usa `contentId` literal.

**Para conectar SRS de `word_bank`:** filtrar `answer_history` donde `content_id LIKE 'word_bank:%'` y extraer el UUID con `substring(content_id, 11)`.

---

## Tabla eliminada: `user_word_progress`

Esta tabla (eliminada 2026-05-21) era un tercer sistema SRS para rastrear progreso por palabra en el lexicón. Se eliminó porque:

- No tenía datos reales de usuarios.
- Duplicaba responsabilidad con `word_bank`.
- `word_bank` cubre el mismo caso de uso con mayor riqueza de datos.

Migración de baja: `supabase/migrations/20260521000000_drop_user_word_progress.sql`
