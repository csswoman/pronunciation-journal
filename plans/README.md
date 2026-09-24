# Planes de implementación

Tres series. La primera (001–004, peso y carga) está cerrada. La segunda
(005–019) sale de la auditoría pedagógica del 2026-09-18 sobre `c869029c`:
cómo se evalúa y avanza el nivel, si el contenido está conectado al ciclo de
evidencia, y qué ve el usuario que no proviene de datos reales. La tercera
(020–027) sale de la auditoría de cableado del 2026-09-22 sobre `eb4cb5d3`.

Cada ejecutor: lee el plan completo antes de empezar, respeta sus STOP
conditions y actualiza su fila al terminar. Los planes nuevos usan ramas
`codex/NNN-slug` desde `dev` solo si el operador pide crear una rama; no hacen
commit ni push sin instrucción explícita. Las ramas `advisor/*` de la serie 2
son históricas.

## Serie 3 — plan diario y evidencia evaluable (2026-09-22, `eb4cb5d3`)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 020 | Progreso muestra participación en Daily sin afirmar planes completos | P1 | M | — | DONE |
| 021 | Cada respuesta de teoría cuenta una sola vez | P1 | S | — | DONE |
| 022 | La práctica externa resuelve solo targets diarios equivalentes | P1 | M | 021 | DONE |
| 023 | Los drills de -ed guardan intentos y actividad recuperable | P1 | L | 022 | DONE |
| 024 | Focus registra actividad y respuestas evaluadas | P1 | L | 021, 022 | DONE |
| 025 | El quiz de inmersión registra respuestas y su paso exacto | P2 | M | 021, 022 | DONE |
| 026 | Las habilidades dependen de la tarea evaluada | P2 | M | 021, 024 | DONE |
| 027 | Tests runtime verifican las salidas declaradas | P2 | M | 022–026 | DONE (2026-09-23; 10 superficies con escritores reales; hallazgo: quiz de cursos no es replay-safe) |

Orden recomendado: **021 → 020 → 022 → 023 → 024 → 025 → 026 → 027**.
020 puede ejecutarse en paralelo con 021. 023–025 pueden ejecutarse por separado
después de 022, pero comparten el contrato de `activity_sessions`: revisar
solapamientos antes de integrarlos. 027 se ejecuta al final para probar los
caminos de producción ya implementados.

La comprobación de catálogo actual (`node_modules/.bin/tsx.cmd
scripts/audit-learning-loop.mjs`) pasa con 4.125 entradas y 0 incidencias;
comprueba declaraciones, no llamadas runtime. Los tests focalizados de
reconciliación, actividad y evidence exits pasan (3 archivos, 13 tests). En este
checkout `pnpm audit:learning-loop` intentó reinstalar `node_modules` y abortó
sin TTY; los planes permiten usar los binarios locales existentes, dejando
constancia de esa sustitución. No se ha verificado la aplicación de migraciones
en Supabase remoto.

## Serie 2 — evaluación, progresión y contenido honesto (2026-09-18, `c869029c`)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 005 | Eliminar datos inventados en Home, Diario, Daily, landing y enlaces rotos | P1 | M | — | DONE (rama `advisor/005-remove-fabricated-ui-data`) |
| 006 | Progreso no presenta cobertura ni volumen como dominio | P1 | S | — | DONE |
| 007 | El nivel y su procedencia solo los escribe el servidor tras re-puntuar | P1 | M | — | DONE |
| 008 | Todas las pantallas leen el nivel por `resolveLearnerLevel`; estado "desconocido" | P1 | M | — (mejor tras 007) | DONE |
| 009 | Retirar el estimador de nivel por precisión de pronunciación y la semilla B1 | P2 | S | — (mejor tras 008) | DONE |
| 010 | Home propone el checkpoint cuando el alumno está listo | P2 | M | 007, 008 | DONE (rama `advisor/010-checkpoint-readiness`) |
| 011 | Daily incluye temas vencidos; repaso de temas sin target fantasma | P2 | M | — | DONE (rama `advisor/011-daily-topic-srs`) |
| 012 | Inmersión offline-first (outbox) y en el manifest | P2 | M | — | DONE (rama `advisor/012-immersion-offline-manifest`) |
| 013 | Los 37 mazos engVid entran en la Ruta o dejan de publicarse | P1 | M | — | DONE (mazos conservados como borradores no publicados) |
| 014 | El placement de invitado llega a la cuenta; fallos visibles | P2 | S | 007 | DONE (rama `advisor/014-guest-claim`) |
| 015 | El contador de Repaso solo promete colas ejecutables | P2 | M | — | DONE |
| 016 | La vista previa del plan diario en Home refleja el plan real | P2 | M | — | DONE (Home y Daily comparten `useDailyPlan`) |
| 017 | Mini-lecciones ordenadas por nivel y candidatas del Plan diario | P3 | M | 008 | DONE |
| 018 | Mazos personales, juegos, word-rain y word-search registran actividad | P3 | L | 012 | DONE |
| 019 | SRS de chunks y frases del sistema sincroniza vía outbox | P3 | L | — | DONE |

Orden recomendado: 013 → 005 → 006 → 007 → 008 → 009 → 011 → 012 → 010 → 014 → 015 → 016 → 017 → 018 → 019.

Estados: TODO | IN PROGRESS | DONE | BLOCKED (motivo) | REJECTED (motivo).

### Dependencias

- 013 primero porque desbloquea `pnpm test` (dos de los tres archivos que
  fallan son los tests de contenido que estos mazos rompen desde `865381f8`).
- 008 asume que 007 ya movió las escrituras al servidor; puede ejecutarse
  antes, pero entonces `ProfileSettings` seguirá escribiendo por cliente.
- 010 usa la validación de checkpoint de 007 y el lector de 008.
- 014 depende de 007 si la ruta pasa a exigir `answers`.
- 018 reutiliza el patrón de "superficie de actividad" que 012 introduce en el manifest.

### Baseline de verificación (medido el 2026-09-18)

- `pnpm type-check`: exit 0.
- `pnpm audit:learning-loop`: OK, 3836 entradas, 0 issues (pero solo audita
  lo que ya está en el manifest; ver 012 y 018).
- `pnpm test`: 838 archivos pasan, **3 fallan** (17 tests):
  `lib/content/__tests__/content-integrity.test.ts` y
  `lib/courses/__tests__/content-audit.test.ts` (37 mazos huérfanos y con
  <6 tarjetas; plan 013) y
  `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
  (el mock de `@/lib/db` no exporta `ensureDbReady`, que
  `lib/learner-level/client-queries.ts` ahora importa; lo resuelve el
  propietario, no hay plan).

## Hallazgos considerados y descartados (no re-auditar)

- **Completar un mazo al llegar a la última tarjeta escribe `lesson_completions`**: permitido por el contrato (Mazos = completion); `topic-progress.ts` lo excluye del dominio. Solo era un problema de presentación (plan 006).
- **`savePracticeAnswer` actualiza word_bank y topic a la vez**: atribución multi-outcome legítima, no doble registro.
- **`SAMPLE_NOTEBOOK_DATA` en `lib/journal/notebook-types.ts`**: solo parámetro por defecto; el único caller pasa datos reales. No visible. (Borrarlo es opcional.)
- **`SAMPLE_FLASHCARDS` en `HomeEssentialWordsBody`**: arte decorativo junto a un contador real; no se presenta como datos del usuario.
- **`DEFAULT_GAPS` en `lib/focus/gap-suggestions.ts`**: fallback etiquetado `source: 'default'` y mostrado como tal. Correcto.
- **Rutas `/test` y `/dev/sounds`**: gateadas con `notFound()` en producción.
- **Pila de pronunciación**: no afirma precisión acústica; `PronunciationEvidenceDetail` lo aclara. Cumple el contrato.
- **`practice_estimate` en el CHECK SQL**: se deja en la base (sin filas); solo se retira del código (plan 009).
- **`failureFallback` de los checkpoints**: bajar de nivel al fallar es decisión de producto; anotado en 010, no planificado.
- **Consolidar los 4 stores de escritura del nivel en `setLearnerLevel`**: útil, pero después de 007/008/009; no planificado todavía.

## Serie 1 — peso y carga (2026-09-14, `7c788c6a`)

| Plan | Objetivo | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 001 | Hacer fiable la medición de chunks diferidos | P1 | M | — | DONE |
| 002 | Aislar preferencias UI del esquema Dexie | P1 | M | 001 | DONE |
| 003 | Mantener el constructor diario fuera del hub inicial | P1 | M | 001 | DONE |
| 004 | Reducir Review según atribución de módulos | P2 | M | 001 | DONE |

Descartados en la serie 1: subir `bundle-budget.json` sin medición de
navegación; excluir chunks por hash (inestable con Turbopack).
