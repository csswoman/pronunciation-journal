# Plan 001: Medir correctamente la carga inicial del cliente

> Ejecuta cada paso y detente si la representación de chunks de Next no permite
> distinguir un import dinámico de un módulo inicial. No subas presupuestos como
> sustituto de esa evidencia.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf/dx
- **Planned at**: `7c788c6a`, 2026-09-14

## Why this matters

`scripts/analyze-bundle.mjs` suma todos los archivos no clasificados como CMU
dictionary. El propio presupuesto documenta que un `next/dynamic` crea un chunk
pero no reduce `allChunksGzipKB`; por tanto hoy una mejora de carga inicial puede
fallar CI aunque el usuario no descargue el código al navegar. Hay que tener dos
medidas explícitas: JavaScript de navegación inicial y JavaScript publicado total.

## Current state

- `scripts/analyze-bundle.mjs:39-77` clasifica sólo CMUdict por contenido.
- `scripts/analyze-bundle.mjs:122-178` deriva rutas desde manifests de cliente.
- `scripts/bundle-budget.json` bloquea `allChunksGzipKB` y `maxRouteGzipKB`.
- `docs/architecture/performance.md:35-57` afirma que el agregado sólo incluye
  chunks eager, pero su implementación no prueba esa condición para imports dinámicos.

## Scope

Modificar sólo `scripts/analyze-bundle.mjs`, `scripts/bundle-budget.json`,
`docs/architecture/performance.md` y tests nuevos para el script. No modificar
componentes ni ocultar chunks por hash.

## Steps

1. Añade fixtures mínimos de manifests con un módulo inicial y un import dinámico
   conocido; extrae el parser a funciones testeables sin cambiar aún presupuestos.
   Verifica con `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts`.
2. Investiga el manifest/metadata emitido por Next 16.3.3 y usa una señal estable
   (no un nombre de archivo) para separar `initialRouteGzipKB` de
   `publishedChunksGzipKB`. Si no existe señal, conserva el agregado actual y
   añade una medición de red Playwright para `/daily` y `/practice/review`.
3. Publica ambos valores en `bundle-summary.json`; deja que CI bloquee la carga
   inicial por ruta y registre, no bloquee, el total publicado hasta tener un
   presupuesto justificado por navegación real.
4. Actualiza el documento con baseline, fecha, máquina/Node 24 y la semántica
   exacta de cada métrica.

## Verification

- `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts` pasa.
- `pnpm build` termina con exit 0.
- `pnpm analyze:bundle:check` pasa con la métrica de carga inicial; el informe
  conserva el total publicado como diagnóstico.

## STOP conditions

- Si el manifiesto no identifica con certeza un chunk diferido, no lo excluyas.
  Implementa la medición de red o reporta el límite.
- Si una modificación haría invisible CMUdict o cualquier chunk real al informe,
  revierte y reporta.
