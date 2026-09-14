# Plan 002: Evitar que preferencias UI importen el esquema Dexie

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-measure-initial-client-payload.md`
- **Category**: perf/tech-debt
- **Planned at**: `7c788c6a`, 2026-09-14

## Why this matters

`lib/db/index.ts` contiene el esquema Dexie completo y también una tabla genérica
de preferencias. Un CTA que sólo recuerda el modo de práctica puede importar
todo el esquema offline. La preferencia no representa dominio, evidencia ni
progreso; debe tener una frontera pequeña y versionada.

## Current state

- `lib/db/index.ts:431,543` declara y migra `practicePrefs`.
- `lib/db/index.ts:1338-1373` guarda intereses y `lastPracticeMode` juntos.
- `components/practice/hub/PracticeHubClient.tsx:6,40-52` lee el modo anterior.
- Las tarjetas del hub y `components/practice/games/GameCard.tsx` escriben ese
  modo al navegar.

## Scope

Crear `lib/practice/last-practice-mode.ts`; actualizar consumidores y mocks.
No mover intereses de usuario, SRS, tablas Dexie ni modificar el esquema sin una
migración separada.

## Steps

1. Implementa `getLastPracticeMode` y `setLastPracticeMode` con una clave
   `localStorage` versionada, `try/catch` para modo privado y retorno neutral
   `null`. Mantén el contrato `Promise` para no reescribir handlers.
2. Reemplaza únicamente imports de esas dos funciones en hub, juegos y Home.
   No cambies imports de `db` que leen evidencia o datos offline reales.
3. Actualiza los mocks de Vitest a la nueva ruta; añade pruebas unitarias de
   storage bloqueado y valor ausente.
4. Deja los helpers Dexie antiguos temporalmente sólo si hay consumidores fuera
   de UI; elimínalos en un plan posterior cuando una búsqueda confirme cero usos.

## Verification

- `pnpm vitest run components/practice/hub/__tests__/PracticeHubClient.test.tsx components/practice/hub/__tests__/GamesSection.test.tsx components/practice/games/__tests__/GamesPage.test.tsx components/home/__tests__/HomePlanDone.test.tsx` pasa.
- `pnpm type-check` y `pnpm lint` salen 0.
- La medición definida por el plan 001 muestra que `/practice` no importa el
  esquema Dexie únicamente por `lastPracticeMode`.

## STOP conditions

- Si el modo anterior se usa como evidencia pedagógica, no lo muevas a
  `localStorage`; reporta el hallazgo.
- Si un consumidor requiere sincronización entre dispositivos, crea un contrato
  de preferencias separado; no reutilices `practicePrefs` sin revisión.
