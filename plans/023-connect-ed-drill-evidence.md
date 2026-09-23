# Plan 023: Registrar los drills de -ed como práctica recuperable

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md` y la guía Next.js de `node_modules/next/dist/docs/` si editas la ruta. Sigue el flujo Dexie + outbox existente. Actualiza solo la fila 023.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/pronunciation/ed-drills/progress.ts components/pronunciation/ed-drills/EdDrillSession.tsx components/daily/DailyStepSession.tsx lib/practice/daily-plan/ed-drill-step.ts lib/sync/types.ts lib/db/index.ts supabase/migrations`.

## Estado

- Prioridad: P1. Esfuerzo: L. Riesgo: HIGH. Categoría: arquitectura/migración.
- Depende de: 022. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

El correctivo de `-ed` aparece por evidencia de errores, pero sus nuevos intentos solo actualizan `userEdClusterProgress` en Dexie. La sesión de Daily se marca mediante `recordDailyStepCompletion` con cero ejercicios. Otro dispositivo y los reportes globales no reciben los resultados del drill.

## Estado actual y patrón

- `lib/pronunciation/ed-drills/progress.ts:32-59`: `recordAttempt` calcula precisión/nivel y hace `db.userEdClusterProgress.put(progress)` sin outbox.
- `components/pronunciation/ed-drills/EdDrillSession.tsx:51-59`: fases 1 y 2 llaman `recordAttempt`; la fase 3 cierra sin resultado evaluado.
- `components/daily/DailyStepSession.tsx:120-126`: `EdDrillSession onComplete={handleStepComplete}`.
- `lib/practice/daily-plan/ed-drill-step.ts:66-76`: ID `ed_cluster_drill:<cluster>` y `exercises: []`.
- Exemplar de persistencia de respuesta/sesión: `components/practice/session/useSessionState.ts` y `lib/practice/queries.ts`. Exemplar Dexie + outbox: `lib/chunk-of-day/srs.ts`. No atribuyas pronunciación acústica a un resultado de selección local.

## Alcance

Modificar el dominio `lib/pronunciation/ed-drills/`, `components/pronunciation/ed-drills/EdDrillSession.tsx`, los tests focalizados, `lib/sync/types.ts`, `lib/sync/sync-manager.ts`, `lib/db/index.ts`, una migración `supabase/migrations/<timestamp>_ed_cluster_progress.sql` y `lib/supabase/types.ts`/`types/supabase.ts` si la estrategia mantiene el agregado remoto; `components/daily/DailyStepSession.tsx` solo si hace falta pasar el ID exacto. Fila 023. Fuera de alcance: rediseñar las tres fases, alterar los umbrales 80%/2 intentos, declarar dominio de pronunciación por completar la escalera.

## Flujo Git

Si el operador pide rama, usa `codex/023-connect-ed-drill-evidence` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Define una identidad estable por intento evaluado y un evento con cluster, fase, resultado y usuario. Elige la tabla remota con RLS propia y política de upsert, o una proyección desde `answer_history` si el tipo de ejercicio existente representa fielmente la tarea; documenta por qué. **Verifica**: `node scripts/check-migrations.mjs` → exit 0 si hay migración.
2. Persiste cada intento evaluado offline y sincronízalo idempotentemente. `started`, exposición y fase 3 sin evaluación no generan respuestas correctas ficticias. **Verifica**: tests de reintento, mismo usuario/otro usuario, fallo offline y recuperación.
3. Registra una `activity_sessions` por sesión que tuvo al menos un intento evaluado; evita duplicar al cerrar/reabrir. En Daily, reconcilia el `ed_cluster_drill:<cluster>` exacto solo tras completar la práctica asignada. **Verifica**: tests de ruta suelta y Daily con el mismo cluster y cluster ajeno.
4. Ejecuta `node_modules/.bin/tsc.cmd --noEmit`, ESLint de archivos tocados, `node_modules/.bin/tsx.cmd scripts/audit-learning-loop.mjs`, `node scripts/check-migrations.mjs`, `node scripts/audit-rls.mjs` y `git diff --check` → exit 0 o advertencias RLS preexistentes documentadas. Ejecuta además `pnpm type-check && pnpm lint` si `pnpm` no intenta instalar.

## STOP y mantenimiento

Detente si ningún `ExerciseSlug` representa fielmente la fase evaluada: no reutilices `identify` o `speak_word` solo para obtener una fila en `answer_history`; especifica un nuevo tipo con su migración y tests en una ampliación aprobada del plan. No afirma sincronización entre dispositivos hasta verificar la migración aplicada en el entorno remoto. Revisa que los eventos sean fuente del agregado, no que se duplique un estado paralelo en Zustand.
