# Recuperación de respuestas y fallos del outbox (plan 045)

Contrato de cómo una entrada `failed` del `syncOutbox` puede volver a `pending`,
y runbook para aplicar la reparación de `answer_history`.

## Clases de fallo

`attemptRemoteEntry` ([lib/sync/sync-manager.ts](../../lib/sync/sync-manager.ts)) guarda
`failureKind` en cada entrada que pasa a `failed`:

| `failureKind` | Causa | ¿Recuperación automática? |
| - | - | - |
| `permanent` | El servidor rechazó la fila: RLS `42501`, CHECK `23514`, FK `23503`, payload inválido `22P02`/`23502`, esquema `PGRST204`/`PGRST205`/`42P01`, `23505` sin clave idempotente | Solo el caso reparado de `answer_history` (abajo) |
| `exhausted` | `MAX_RETRIES` (3) errores transitorios seguidos | Sí, tras reconexión, salvo errores de autenticación |
| _(ausente)_ | Entrada anterior al plan 045 | Solo errores de red sin código (`Failed to fetch`…) |

## Rutas de recuperación

Ambas corren en `drainAndReschedule` ([init-sync-listeners.ts](../../lib/sync/init-sync-listeners.ts))
antes de cada flush: al montar la sesión y en cada evento `online`.

- **Respuestas reparadas** — [answer-recovery.ts](../../lib/sync/answer-recovery.ts).
  Solo `answer_history` del usuario activo, rechazada por `answer_history_context_check`,
  con `context` en `REPAIRED_ANSWER_CONTEXTS` (`essential-words`) e `id` UUID.
  Otro `23514` no se reencola. Conserva `id`, `createdAt` y payload; añade
  `answered_at = createdAt` si falta. Nunca toca las entradas SRS hermanas, así que
  no reaplica ratings. Backoff 0 / 1 h / 6 h.
- **Transitorios agotados** — [exhausted-recovery.ts](../../lib/sync/exhausted-recovery.ts).
  Excluye `PGRST301`/`PGRST302`/`401`/`403`. Los bundles del skill model se
  reencolan completos o no se reencolan. Backoff 5 min / 1 h / 6 h, máximo 30 por pasada.

Límites comunes ([recovery.ts](../../lib/sync/recovery.ts)): máximo
`MAX_FAILED_RECOVERIES` (3) recuperaciones por entrada, siempre por usuario, y el
reencolado revalida `status === 'failed'` dentro de la escritura Dexie (dos pestañas
o dos llamadas cuentan una sola vez).

## Identidad de Connected Speech

`recordConnectedSpeechAttempt` ([lib/sounds/queries.ts](../../lib/sounds/queries.ts))
genera un UUID por intento (o usa `attemptId` del llamador). El id viaja en el payload
del outbox, así que los reintentos reenvían la misma fila. `score` vive en
`exercise_payload.score`: `answer_history` no tiene esa columna.

Las filas antiguas `cs_<phraseId>_<ms>` quedan `permanent` (`PGRST204`/`22P02`) y
**no se recuperan**: rehacer su id rompería la regla de conservar identidad.

## Diagnóstico

`getSyncFailureDiagnostics(userId)` ([sync-diagnostics.ts](../../lib/sync/sync-diagnostics.ts))
devuelve `pending`, `failed`, `permanent`, `exhaustedRecoverable`, `repairableAnswers`,
`recoveryCapReached` y `failedByCause` (`tabla:código`). Disponible en desarrollo como
`await window.__syncRecovery.getSyncFailureDiagnostics()`. Cuando una pasada reencola
algo, se registra `[sync] requeued failed outbox entries` en la consola.

## Runbook de aplicación

Estados separados: **código local verificado** ≠ **migración remota aplicada** ≠
**respuesta real recuperada**. No marcar el plan DONE sin los tres.

1. Inspeccionar el CHECK remoto (solo lectura):
   ```sql
   SELECT pg_get_constraintdef(oid) FROM pg_constraint
   WHERE conrelid = 'public.answer_history'::regclass
     AND conname = 'answer_history_context_check';
   ```
   Si difiere de `20260616120000_answer_history_contexts.sql`, detener y revisar.
2. Con autorización explícita, aplicar
   `supabase/migrations/20260926230000_answer_history_essential_words_context.sql`.
   Repetir la consulta: debe incluir `'essential-words'` y el resto de contextos.
3. Desplegar el cliente **después** de la migración. Si el orden se invierte, cada
   respuesta gasta como máximo 3 recuperaciones (0 h, 1 h, 6 h) y luego queda aparcada.
4. En el navegador que tiene las respuestas rechazadas: abrir la app con sesión y
   conexión. Consultar el diagnóstico antes y después; `repairableAnswers` debe bajar a 0.
5. Verificar una fila real persistida:
   ```sql
   SELECT id, context, answered_at FROM answer_history
   WHERE user_id = '<uid>' AND context = 'essential-words'
   ORDER BY answered_at DESC LIMIT 5;
   ```
6. Hacer una sesión nueva de Essential Words y una de Connected Speech; ambas deben
   sincronizar sin dejar entradas `failed`.

Si el navegador ya no conserva los payloads (IndexedDB borrado, otro dispositivo), la
respuesta es irrecuperable. **No** se reconstruye desde `activity_sessions`.
