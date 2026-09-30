# Plan 029: Persistir sin pérdidas la reincidencia de errores del Diario

> **Executor instructions**: Lee el plan completo y comprueba el código vigente antes de ejecutar. Confirma cada verificación y actualiza `plans/README.md` al terminar. No conviertas un fallo de persistencia en éxito silencioso.
>
> **Drift check (run first)**: compara el estado actual de `lib/journal/apply-feedback.ts`, `app/api/gemini/journal-correct/route.ts`, `lib/ai-practice/queries.ts`, `lib/ai-practice/server-state.ts`, `lib/sync/sync-manager.ts` y las migraciones relevantes con esta descripción. Conserva los cambios ajenos; adapta el plan si el contrato ya cambió.

## Status

- **Execution status**: DONE (implementación y migración aplicada en Supabase remoto el 2026-09-23)

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug / persistence
- **Planned at**: commit `87636eca`, 2026-09-22; corregido tras revisar la ruta de ejecución

## Why this matters

La corrección del Diario se procesa en `POST /api/gemini/journal-correct`. `applyJournalFeedback` se ejecuta **en el servidor**: primero cambia la entrada a `corrected` y luego `scheduleErrorPatterns` lee y sobrescribe `user_learning_state`. Si esa última operación falla, solo emite un warning. El cliente puede recibir la corrección sin que el error quede programado para repaso. Una petición de corrección necesita red; guardar la entrada en Dexie no equivale a corregirla sin conexión.

La versión anterior de este plan proponía importar `db.learningState` y `persistLearningState` en `apply-feedback.ts`. Eso no es ejecutable: ambas primitivas usan IndexedDB/Dexie del navegador y la función corre en una ruta del servidor. También podía reemplazar un estado remoto existente por `createEmptyState` cuando el dispositivo no tuviera fila local.

## Current state

- `lib/journal/queries.ts` guarda entradas localmente y encola su sincronización mediante Dexie/outbox.
- `app/api/gemini/journal-correct/route.ts` valida sesión, llama a Gemini y luego ejecuta `applyJournalFeedback` en el servidor.
- `lib/journal/apply-feedback.ts` condiciona el cambio `submitted` → `corrected`, pero el fallo posterior de `scheduleErrorPatterns` no revierte ni deja una tarea durable.
- `lib/ai-practice/queries.ts` sincroniza snapshots completos de `user_learning_state` desde el cliente mediante upsert. Su hidratación actual usa `updatedAt` (última escritura gana), así que una escritura local antigua puede pisar la reincidencia calculada por el servidor.

## Scope

**In scope**: persistencia server-side de la corrección y sus patrones; deduplicación por `(user_id, entry_id, pattern_id)`; sincronización con el cliente; tests del fallo, reintento y concurrencia. Coloca acceso a Supabase en el query layer del dominio. Si hace falta una tabla o RPC, incluye migración, RLS y `check:migrations`.

**Out of scope**: prometer corrección Gemini sin red; cambiar el mapeo pedagógico `journalErrorToPatternId`; reemplazar Dexie como capa local.

## Steps

1. Diseña una operación durable e idempotente por entrada corregida. La transición de la entrada y el registro de los patrones deben confirmarse juntos, o debe quedar una tarea persistente recuperable cuando falle la segunda parte. Una segunda petición para el mismo `entryId` no puede volver a bajar el intervalo SRS ni duplicar un patrón. No bases la deduplicación solo en memoria del proceso.
2. Implementa la mutación en un `lib/journal/*queries.ts` server-side o en una RPC transaccional con RLS y alcance `user_id`. Mantén `apply-feedback.ts` como orquestador. Propaga el fallo hasta la ruta si no se logró guardar la corrección ni la tarea pendiente; no lo reduzcas a `console.warn`.
3. Define un contrato de reconciliación para `errorRecurrence` entre servidor y Dexie. Comprueba el caso de dos dispositivos y el de un outbox antiguo que sincroniza después de la corrección. Un upsert de snapshot completo con solo `updatedAt` no debe borrar los patrones registrados por el servidor. Conserva la parte no relacionada de `UserLearningState` y la propiedad del usuario.
4. Tras una corrección confirmada, refresca el estado local mediante el query layer del cliente. Si la respuesta no llegó al navegador, la hidratación posterior debe recuperar el evento. Mantén explícito que sin red la entrada puede quedar `submitted` esperando corrección; no muestres la reincidencia como programada hasta confirmar persistencia.
5. Añade pruebas de: corrección normal, petición repetida, fallo entre transición y agenda, reintento, dos dispositivos, outbox retrasado y `user_id` ajeno. Comprueba el contrato de la respuesta de `/api/gemini/journal-correct`.

## Done criteria

- [x] Ninguna corrección confirmada pierde silenciosamente patrones mapeables; la transición y la agenda ocurren en una RPC transaccional y sus fallos llegan a la ruta.
- [x] Reintentos de una misma entrada no duplican ni reprograman el error; existe deduplicación persistente por `(user_id, entry_id, pattern_id)`.
- [x] La reconciliación incorpora tombstones y conserva la reincidencia ante snapshots de otro dispositivo o outbox retrasados.
- [x] Las pruebas focalizadas de corrección, ruta, cliente, outbox y recurrencia pasan (6 archivos, 80 tests); el harness de RLS/integración incluye segundo dispositivo, outbox retrasado y usuario ajeno.
- [x] `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules` y `pnpm check:migrations` pasan.
- [x] `plans/README.md` refleja el resultado real.

## STOP conditions

- No existe forma transaccional o recuperable de asociar la agenda a la entrada corregida.
- No se puede demostrar que un snapshot de otro dispositivo conserve `errorRecurrence`.
- Falta la migración/RLS necesaria para el contrato elegido.
