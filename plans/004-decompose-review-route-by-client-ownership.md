# Plan 004: Reducir Review a partir de sus propietarios cliente

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-measure-initial-client-payload.md`
- **Category**: perf
- **Planned at**: `7c788c6a`, 2026-09-14

## Why this matters

La ruta máxima actual es `(authenticated)/practice/review` con 558.4 KB gzip y
21 chunks. La página ya obtiene el resumen en servidor, pero `ReviewHubClient`
orquesta la sesión y puede arrastrar ejercicios que no deben montarse hasta que
el alumno inicia una cola.

## Current state

- `app/(authenticated)/practice/review/page.tsx:1-34` resuelve usuario y resumen
  en servidor y pasa sólo `summary` al cliente.
- `components/practice/review/ReviewHubClient.tsx:9-45` consume
  `useReviewSession` y `ReviewSessionLauncher` en la superficie inicial.
- `components/practice/review/ReviewSessionLauncher.tsx` es el límite natural
  entre hub y sesión activa.

## Scope

Auditar primero imports transitorios de `ReviewHubClient`,
`ReviewSessionLauncher`, `useReviewSession` y sus componentes de ejercicio.
Modificar sólo la frontera que la medición atribuya. No cambiar el algoritmo de
selección, FSRS, orden de la cola ni eventos de progreso.

## Steps

1. Añade a la salida del analizador una tabla de módulos/archivos responsables
   de los chunks exclusivos de Review; no uses tamaños de paquetes como prueba.
2. Escribe pruebas de caracterización para: resumen listo sin sesión montada,
   inicio de cola, reanudación y salida anticipada.
3. Separa visualmente `ReviewHubClient` (resumen/acciones) del runtime de sesión
   activa, con un límite de import que no monte subscripciones, audio ni
   renderizadores de ejercicios antes de pulsar iniciar.
4. Mide carga inicial de Review y navegación al iniciar; acepta el cambio sólo
   si la primera baja y la interacción sigue mostrando un estado de carga claro.

## Verification

- Tests focales de `components/practice/review` y `hooks/useReviewSession` pasan.
- `pnpm type-check`, `pnpm lint`, build limpio y `pnpm analyze:bundle:check`.
- El flujo Review conserva cola, reanudación, salida y sincronización offline.

## STOP conditions

- Si la sesión se monta para recuperar estado necesario antes de que el usuario
  pulse iniciar, conserva esa lectura mínima y sólo difiere renderizadores/audio.
- Si el cambio produce dos planes de revisión o duplica estado entre Dexie y
  Zustand, revierte.
