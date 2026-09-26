# Plan 041: Banco de ejercicios pregenerados con la cuota diaria que sobra

> **Executor instructions**: Sigue el plan por fases (A → B → C) y paso a paso; ejecuta cada
> verificación antes de avanzar. Si ocurre algo de "STOP conditions", detente y reporta. El job de
> generación **nunca** puede consumir la reserva de las tareas interactivas: usa siempre el presupuesto
> del Plan 035. Respeta `CLAUDE.md` (Supabase solo desde `lib/*/queries.ts`, RLS en tablas nuevas,
> `service_role` solo en servidor, prompts solo en `lib/ai-prompts.ts`). Al terminar cada fase,
> actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- app/api/jobs .github/workflows/drain-enrichment.yml lib/ai-practice hooks/useStreamingChat.ts lib/ai-usage lib/gemini lib/ai-prompts.ts`
> Compara los extractos con el código vivo; si no coinciden, STOP.

## Estado

- **Status**: DONE
- **Priority**: P2
- **Effort**: M–L (fase A: 1 día · fase B: 1 día · fase C: 1 día)
- **Risk**: MED
- **Depends on**: `plans/035-resilient-free-ai-quotas-and-voice.md` fase B (tabla `ai_usage_daily`, `reserveModel`) y
  `plans/037-coach-and-exercises-fewer-faster-ai-calls.md` fases A y B1 (sets de 5 ejercicios, cola local, `coachSeenItems`).
  Si alguna no está DONE, STOP.
- **Category**: IA / rendimiento / costo
- **Planned at**: commit `866979df`, 2026-09-23

## Por qué importa

La cuota diaria de Gemini se reinicia a medianoche del Pacífico y lo que no se usa se pierde. Mientras
tanto, cada vez que alguien pide práctica al Coach espera a que la IA genere los ejercicios y gasta una
request, aunque otra persona del mismo nivel haya pedido algo casi igual. Este plan genera por la noche,
con la cuota sobrante, sets de ejercicios por nivel CEFR y tema, y los guarda en Supabase como contenido
del sistema. El Coach sirve primero desde ese banco: respuesta al instante, 0 requests en el momento de
uso, disponible sin conexión y compartido entre las personas que usan la app.

## Estado actual

- `app/api/jobs/drain-enrichment/route.ts` — worker de fondo protegido por `CRON_SECRET` (`verifyCronSecret`),
  `maxDuration = 120`, lotes pequeños (`BATCH_SIZE = 3`), backoff por intento, usa `getSupabaseAdminClient()`
  (`lib/supabase/admin`). **Es el patrón a copiar.**
- `.github/workflows/drain-enrichment.yml` — lo invoca con `curl` en `cron: "17 */2 * * *"` (Vercel Hobby solo
  permite cron diario). Variables: `ENRICHMENT_DRAIN_URL` (variable del repo) y `CRON_SECRET` (secreto).
- `lib/ai-practice/tools/registry.ts` — `MultipleChoiceArgs`, `FillBlankArgs`, `SpeakingArgs` y `parseToolArgs(name, raw)`
  (valida args de herramientas). Los ejercicios del banco se guardan con **el mismo formato** que las llamadas
  a herramientas, para que `PracticeSession` los muestre sin cambios.
- `lib/ai-practice/types.ts:38-41` — `AIMessage` de rol `model` = `{ contentParts, toolCalls: Map<string, ToolCall>, timestamp }`;
  `ToolCall = { id, name, args, status: "pending" | ... }`. Un set del banco se inyecta como un mensaje `model` local.
- `TOPIC_CATALOG` (`lib/topic-catalog`) — ids canónicos de tema que ya usa el Coach.
- `lib/ai-practice/learning-state.ts` — `selectNextExerciseTopic` y temas débiles del usuario.
- Migraciones de ejemplo: contenido compartido de solo lectura en `supabase/migrations/20260909004300_immersion_lessons.sql:31-43`
  (RLS + política `select` para `authenticated`; escritura solo con `service_role`).
- Tras el Plan 035: `lib/ai-usage/budget.ts` (`reserveModel(model, feature)`, `DAILY_BUDGET`) y tabla `ai_usage_daily`.
- Tras el Plan 037: cola local de ejercicios en `useStreamingChat`, tabla Dexie `coachSeenItems`.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/content-bank app/api/jobs lib/ai-practice hooks` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Auditorías | `pnpm audit:hard-rules` | exit 0 |

## Alcance

**Dentro**: migración nueva en `supabase/migrations/`, `lib/content-bank/` (crear: `types.ts`, `queries.ts`,
`generate.ts`, `select.ts`), `app/api/jobs/fill-content-bank/route.ts` (crear), `.github/workflows/fill-content-bank.yml`
(crear), `lib/ai-prompts.ts` (un prompt nuevo), `hooks/useStreamingChat.ts` o un hook nuevo `hooks/useCoachBankSet.ts`,
`lib/db/` (tabla Dexie de caché), tests. Además, los documentos listados en el paso de documentación.

**Fuera**: contenido personalizado (Reader con palabras del usuario, correcciones del Diario), misiones,
cambios al presupuesto del Plan 035, generación de audio.

## Fase A — Tabla y job de generación

### A1. Tabla `content_bank_items`
Migración `supabase/migrations/<timestamp>_content_bank_items.sql`:
`id uuid pk default gen_random_uuid()`, `kind text check (kind in ('coach_exercise'))`, `tool_name text`, `level text`
(A1–C2), `topic_id text`, `payload jsonb` (args de la herramienta), `prompt_version text`, `stem_hash text unique`
(hash del enunciado normalizado, evita duplicados), `quality_flags int default 0`, `created_at timestamptz default now()`.
Índice `(kind, level, topic_id)`. RLS habilitado; política `select` para `authenticated` con `quality_flags < 3`;
**sin** políticas de escritura (solo `service_role`).
**Verify**: aplica la migración en local o rama; `select` como usuario autenticado funciona e `insert` falla.

### A2. Prompt y generador
En `lib/ai-prompts.ts` añade `CONTENT_BANK_EXERCISE_SET_PROMPT` + `buildContentBankSetPrompt({ level, topicId, avoidStems })`:
pide 5 ejercicios en JSON (mismo contenido que los args de `render_multiple_choice` / `render_fill_blank` / `render_speaking`,
con `commonWrongAnswers`, `hint`, `explanation` y `acceptableAnswers` completos). Si el Plan 036 está DONE, usa su
opción `schema`. En `lib/content-bank/generate.ts`, `generateBankSet(level, topicId)` llama con `callGeminiJson`, valida
cada ítem con `parseToolArgs` y descarta los inválidos.
**Verify**: test con Gemini simulado: 5 ítems válidos → 5 filas; 1 inválido → 4 filas.

### A3. Job `fill-content-bank`
`app/api/jobs/fill-content-bank/route.ts`, copiando la protección y estructura de `drain-enrichment`:
1. Elige hasta 4 combinaciones `(level, topic)` con menos ítems en el banco (prioriza los niveles de los usuarios activos).
2. Antes de cada set, pide `reserveModel(model, 'content-bank')`. Además, **no generes** si el uso de hoy del modelo supera
   el 60% de su `DAILY_BUDGET` (así queda margen para el uso interactivo del día siguiente, que empieza tras la medianoche PT).
3. Inserta con `upsert` sobre `stem_hash` (ignora duplicados).
Workflow `.github/workflows/fill-content-bank.yml`: una ejecución diaria a las `0 6 * * *` (≈23:00 hora del Pacífico
en verano, 22:00 en invierno), con `workflow_dispatch` para pruebas; variable `CONTENT_BANK_FILL_URL`.
**Verify**: test de la ruta: sin secreto → 401; presupuesto por encima del 60% → 0 llamadas; caso normal → ≤4 sets.

## Fase B — El Coach sirve primero desde el banco

### B1. Consulta y selección
`lib/content-bank/queries.ts`: `fetchBankItems(level, topicIds, limit)`. `lib/content-bank/select.ts` (pura):
`pickBankSet(items, seenStems, weakTopics)` → 5 ítems no vistos, priorizando temas débiles y mezclando formatos
(máx. 2 del mismo `tool_name`). Guarda los ítems descargados en una tabla Dexie `contentBankCache` para uso offline.
**Verify**: tests de `pickBankSet`: excluye vistos, respeta mezcla, devuelve <5 si no hay suficientes.

### B2. Integración con la cola del Coach
Cuando la cola local del Plan 037 se vacía y la persona pide práctica, primero intenta `pickBankSet`. Si hay 5 ítems,
crea un mensaje `model` local (una frase corta de introducción + 5 `ToolCall` con `status: "pending"`, ids `bank_<uuid>`)
**sin llamar a `/api/gemini`**. Si hay menos de 5, llama a la IA como hoy. Marca cada ítem mostrado en `coachSeenItems`.
**Verify**: test del hook: banco con 5 ítems → 0 `fetch` a `/api/gemini` y 5 ejercicios renderizados; banco vacío → 1 `fetch`.

## Fase C — Descarga para usar sin conexión

### C1. Descarga por nivel
Añade al gestor de `lib/offline/` una entrada "Ejercicios del Coach · nivel X" que guarda en `contentBankCache` hasta
100 ítems del nivel de la persona. Sin conexión, B2 usa solo la caché.
**Verify**: test: sin red y con caché → set servido; sin red y sin caché → mensaje de "necesitas conexión" existente.

## Paso final — Documentación

| Archivo | Qué escribir |
|---|---|
| `docs/architecture/content-bank.md` (crear) | Qué se pregenera, cuándo corre el job, la regla del 60%, deduplicación por `stem_hash`, orden banco → IA, caché offline |
| `docs/deployment/environments.md` | Variable de repo `CONTENT_BANK_FILL_URL` y reutilización de `CRON_SECRET` |
| `docs/architecture/ai-coach.md` | Paso "banco primero" en el flujo de práctica |
| `docs/README.md` → tabla "Arquitectura" | Enlace a `content-bank.md` |
| `README.md` → "Architecture highlights" | Una línea: el contenido de práctica se pregenera con la cuota sobrante |

**Verify**: `grep -n "content-bank" docs/README.md docs/deployment/environments.md` → ≥2 resultados.

## Criterios de aceptación

- [x] La tabla tiene RLS: lectura para autenticados, sin escritura desde el cliente.
- [x] El job no genera cuando el modelo supera el 60% del presupuesto diario.
- [x] Un set servido desde el banco no hace requests a `/api/gemini`.
- [x] Ítems ya vistos no se repiten; los sets mezclan formatos.
- [x] Sin conexión, el Coach sirve sets desde la caché descargada.
- [x] `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules` en exit 0. `pnpm test`: 19 fallas preexistentes
      en archivos fuera del alcance de este plan (`app/__tests__/csp.test.ts`, `CoursePathProgressClient`,
      `DailyChecklist`, `DailyLessonCard`, `DailyOverviewSummary`, `SessionRecapCard`, `SessionReady`),
      confirmadas en `dev` con y sin el WIP no relacionado presente. Todo lo del alcance de 041
      (`lib/content-bank`, `hooks/useCoachBankSet`, `app/api/jobs/fill-content-bank`) pasa.
- [x] Documentación del paso final actualizada.

Migración `20260925180000_content_bank_items` aplicada al proyecto remoto (`enpxrijfnkcgvkyrjxod`) el
2026-09-26. Se detectó que la tabla heredó privilegios por defecto de Supabase (INSERT/UPDATE/DELETE para
`authenticated`), igual que ocurrió antes con `deck_suggestions_cache`; se corrigió con la migración
`20260925180100_content_bank_items_revoke_authenticated_writes`. Verificado con `has_table_privilege`:
`authenticated` solo tiene SELECT, `service_role` tiene acceso completo.

## STOP conditions

- Los Planes 035 fase B o 037 fases A/B1 no están DONE.
- El job necesita más de 120 s por ejecución con 4 sets (reduce a 2 y reporta).
- Más de 1 de cada 5 ítems generados falla `parseToolArgs` en la primera ejecución real.
- Hace falta exponer `service_role` o escribir en la tabla desde el cliente.

## Notas de mantenimiento

- Cambiar el prompt → subir `prompt_version`; los ítems viejos siguen válidos salvo que se decida purgarlos.
- `quality_flags` lo incrementa el Plan 042 cuando alguien reporta un ítem malo; a partir de 3 deja de servirse.
- Siguiente paso posible (sin plan): textos genéricos de Reader por nivel y tema con el mismo job.
