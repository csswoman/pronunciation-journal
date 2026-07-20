# Plan 046: Registrar de forma segura los exercise types fonémicos 10–14

> Ejecuta cada verificación antes de avanzar. Si un ID o slug está ocupado por otra fila, detente: no reasignes IDs ni edites datos de producción sin aprobación.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug / migration
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

`lib/practice/types.ts:23-27` asigna IDs 10–14 a `speak_word`, `identify`, `ax_same_different`, `odd_one_out` y `abx`, pero ninguna migración los inserta. `answer_history.exercise_type_id` es FK: las respuestas pueden quedar fallidas en el outbox aunque la UI funcione.

## Current state and conventions

- Las migraciones existentes solo registran 1–8 y 15–18.
- `supabase/migrations/20260517120000_generic_exercise_types.sql` usa inserts idempotentes.
- La seguridad de migraciones se valida con `pnpm check:migrations`; el esquema real se valida con `pnpm audit:rls`.
- El mapa canónico ya existe en `EXERCISE_TYPE_IDS`; no cambiarlo en este plan.

## Scope

**In scope**: una nueva migración `supabase/migrations/<timestamp>_seed_phoneme_exercise_types.sql`, un test de contrato SQL bajo `lib/practice/__tests__/`, tipos Supabase solo si la herramienta de generación produce un cambio real.

**Out of scope**: UI fonémica, scoring, eliminar `identify`, aplicar la migración a producción, modificar filas conflictivas.

## Steps

1. Añadir un test que lea las migraciones y compruebe que cada par 10–14 ↔ slug existe exactamente una vez en el estado final esperado.
2. Crear una migración con dos precondiciones fail-fast: ningún ID 10–14 puede tener otro slug y ninguno de los cinco slugs puede tener otro ID. Después insertar las cinco filas con labels estables y `ON CONFLICT DO NOTHING` solo tras esas validaciones.
3. Ejecutar `pnpm check:migrations` y el test focalizado.
4. En Supabase local/staging aislado, consultar primero `exercise_types` por IDs y slugs, aplicar la migración y confirmar el mapa. Ejecutar una práctica de cada tipo disponible y verificar `answer_history`. No usar producción como entorno de prueba.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/practice/__tests__/exercise-type-migrations.test.ts` | mapa 10–14 verificado |
| `pnpm check:migrations` | exit 0 |
| `pnpm type-check` | exit 0 |

## Done criteria

- [ ] La migración es idempotente y falla ante conflictos ID↔slug.
- [ ] Los cinco tipos existen en local/staging con sus IDs canónicos.
- [ ] Una respuesta con `exercise_type_id=10` puede persistirse sin violar FK.
- [ ] No se modificó ninguna migración histórica.

## STOP conditions

- Un ID 10–14 o uno de los slugs ya está asociado a otro valor.
- La solución exige borrar o renumerar datos existentes.
- El entorno disponible apunta a producción en vez de local/staging.

## Git workflow and maintenance

- Branch: `codex/046-seed-phoneme-exercise-types`; commit: `fix(practice): seed phoneme exercise types`.
- Futuras altas deben mantener migración y `EXERCISE_TYPE_IDS` en el mismo PR. Revisar especialmente que la idempotencia no oculte conflictos.
