# Plan 003: Mantener el compositor diario fuera del hub inicial

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-measure-initial-client-payload.md`
- **Category**: perf
- **Planned at**: `7c788c6a`, 2026-09-14

## Why this matters

El hub diario necesita mostrar el plan en caché inmediatamente, pero el camino
de caché vacía carga generadores, catálogos, queries de sonidos, chunks y Dexie.
Eso no debe pertenecer al módulo inicial de la pantalla si el usuario ya tiene
un plan vigente o aún está viendo el skeleton.

## Current state

- `hooks/useDailyPlan.ts:107-125` restaura primero `loadCachedDailyPlan` y sólo
  después llama al compositor.
- `lib/practice/daily-plan/composer.ts:1-68` importa fetchers, DB, catálogos y
  define `buildDailyPlan`.
- `lib/daily/plan-storage.ts` es el contrato de caché diaria y de ids hechos o
  resueltos; debe seguir siendo la fuente local para offline.

## Scope

Modificar `hooks/useDailyPlan.ts`, tests de hook/plan y, si hace falta, un
adaptador pequeño bajo `lib/practice/daily-plan/`. No mover la fuente de verdad
de Dexie a Zustand, ni cambiar tipos `DailyPlan`/`DailyStep`, ni eliminar
offline.

## Steps

1. Añade pruebas de caracterización: plan en caché no invoca el compositor; sin
   caché lo invoca una vez; fallo del import/compositor deja `status: error`.
2. Importa dinámicamente el compositor sólo en la rama sin caché, usando una
   ruta directa y analizable. Importa constantes desde su archivo específico,
   no desde el barrel que reexporta el compositor.
3. Conserva `saveCachedDailyPlan`, `hydrateStepIds`, reintentos, selección de
   lección y manejo de usuario nulo exactamente como están.
4. Con el plan 001, confirma que `/daily` baja su JavaScript inicial; registra
   por separado el chunk cargado en primera generación de plan.

## Verification

- Test focal nuevo de `useDailyPlan` pasa en jsdom/fake IndexedDB.
- `pnpm type-check && pnpm lint` salen 0.
- Build limpio y métrica de ruta de `/daily` mejoran sin regresión en
  `deferredChunksGzipKB` ni en el flujo offline.

## STOP conditions

- Si el import dinámico duplica el compositor o incrementa la carga inicial
  medida, revierte y reporta el manifest/chunks antes de buscar otra técnica.
- Si el plan no puede generarse offline tras el cambio, no continúes.
