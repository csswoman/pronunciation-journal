# Plan 055: Presupuestar JavaScript descargado en navegaciones reales

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada
> verificación indicada y confirma su resultado antes de continuar. Si ocurre
> una condición de STOP, detente y reporta; no improvises. Al terminar,
> actualiza la fila de este plan en `plans/series-7-light-client-and-level-packs.md`.
>
> **Drift check (run first)**:
> `git diff --stat 26c05b4f..HEAD -- scripts/analyze-bundle.mjs scripts/bundle-budget.json scripts/__tests__/analyze-bundle.test.ts tests/performance/cold-navigation-js.spec.ts docs/architecture/performance.md .github/workflows/ci.yml`
> Si cambió cualquiera de estos archivos, compara el estado vivo con los
> extractos de este plan. Si cambió la semántica de medición, STOP.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `26c05b4f`, 2026-09-28

## Why this matters

El build reporta 3.157,7 KB gzip publicados, pero esa cifra suma todos los
chunks emitidos para todas las rutas. El usuario no descarga ese inventario en
una sola visita. Además, `maxRouteGzipKB` proviene del cierre de
`client_reference_manifest`, no de tráfico observado. Antes de optimizar o
cambiar presupuestos, CI debe distinguir: shell compartido, inventario total y
JavaScript realmente descargado durante una navegación fría.

## Current state

- `scripts/analyze-bundle.mjs:63-78` enumera todo `.next/static/chunks/*.js` y
  solo excluye el chunk detectado de CMUdict.
- `scripts/analyze-bundle.mjs:256-260` asigna `maxRouteGzipKB` directamente a
  `initialRouteGzipKB` con derivación `client_reference_manifest`.
- `scripts/bundle-budget.json` bloquea por `publishedChunksGzipKB: 2550`, aunque
  el runtime raíz sigue en 165,9 KB y las rutas no descargan juntas el total.
- `tests/performance/cold-navigation-js.spec.ts` ya captura respuestas JavaScript
  reales, pero solo cubre `/practice/review` y `/login` y no produce un resumen
  reutilizable por CI.
- El patrón vigente exige `next start`, puerto dedicado, `reuseExistingServer:
  false` y un `.next/BUILD_ID` válido; conservarlo.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused unit tests | `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts` | exit 0 |
| Performance browser tests | `pnpm test:perf:cold-nav` | todas las rutas configuradas pasan |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Production build | `pnpm build` | exit 0 y `.next/BUILD_ID` existe |
| Bundle report | `pnpm analyze:bundle:check` | exit 0 con la nueva semántica |

## Suggested executor toolkit

- Lee `node_modules/next/dist/docs/01-app/02-guides/package-bundling.md` antes de
  cambiar la medición de Next 16.
- Usa `next-dev-loop` para la ejecución de `next start` y las rutas reales.

## Scope

**In scope**:

- `scripts/analyze-bundle.mjs`
- `scripts/bundle-budget.json`
- `scripts/__tests__/analyze-bundle.test.ts`
- `tests/performance/cold-navigation-js.spec.ts`
- `tests/performance/client-payload-budget.json` (create)
- `.github/workflows/ci.yml`
- `docs/architecture/performance.md`

**Out of scope**:

- Cambiar componentes o imports de producto.
- Subir límites para hacer pasar el build actual.
- Excluir chunks mediante hashes.
- Afirmar tamaños de producción sin una ejecución limpia del build correspondiente.

## Git workflow

- Rama solo si el operador la pide: `codex/055-real-client-payloads` desde `dev`.
- No commit ni push sin instrucción explícita.
- Si se pide commit: `perf(bundle): budget real cold navigation payloads`.

## Steps

### Step 1: Extraer un capturador reutilizable de JavaScript frío

En `tests/performance/cold-navigation-js.spec.ts`, extrae la captura de
respuestas JS a un helper que:

1. excluya CSS;
2. deduplique URLs;
3. registre bytes del body realmente recibido;
4. devuelva `route`, `chunkCount`, `rawKB` y lista de chunks;
5. empiece cada caso con contexto sin caché.

No llames “gzip” al tamaño de `response.body()`; es el body decodificado por
Playwright. Usa `rawKB` y conserva la definición en documentación.

**Verify**: `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts` → exit 0.

### Step 2: Cubrir las navegaciones críticas

Añade casos para `/`, `/offline`, `/daily`, `/tracking` y `/practice`. Conserva
`/login` y `/practice/review`. Cada ruta debe esperar un marcador hidratado
específico; no uses `body` ni un contenedor genérico. Si auth de invitado no
permite llegar a una ruta, usa el marcador de redirección o banner real y
registra esa limitación; no falsifiques una sesión autenticada.

Escribe el resultado combinado en un artefacto ignorado, por ejemplo
`test-results/client-payload-summary.json`.

**Verify**: `pnpm build` seguido de `pnpm test:perf:cold-nav` → todos los casos
pasan y el JSON contiene las siete rutas.

### Step 3: Introducir presupuestos por navegación

Crea `tests/performance/client-payload-budget.json` con límites explícitos por
ruta basados en el primer baseline limpio. El test debe fallar si una ruta
supera su límite y mostrar delta en KB. Usa tolerancia pequeña y documentada;
no reutilices automáticamente el 10 % del inventario global.

Mantén `rootMainGzipKB` como gate. Mantén `publishedChunksGzipKB` como
diagnóstico y delta de crecimiento, pero retíralo como bloqueo absoluto solo
cuando los presupuestos de navegación estén activos en CI. No borres la métrica.

**Verify**: añade tests unitarios para presupuestos ausentes, excedidos y dentro
del límite; `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts` → pass.

### Step 4: Integrar CI y actualizar el contrato

En `.github/workflows/ci.yml`, ejecuta la captura de navegación contra el build
de producción sin duplicar un segundo build. Si el aislamiento de jobs impide
reusar `.next`, sube/baja el artefacto existente o crea un job dependiente; no
uses `next dev`.

Actualiza `docs/architecture/performance.md` con definiciones separadas para:

- root main;
- cierre del manifiesto;
- inventario publicado;
- bytes descargados en navegación fría.

Incluye el baseline y fecha reales producidos por el mismo build.

**Verify**: `pnpm type-check && pnpm lint` → exit 0; revisión de workflow sin
instalar dependencias nuevas.

## Test plan

- Extiende `scripts/__tests__/analyze-bundle.test.ts` siguiendo sus casos de
  `assertBudget`.
- Extiende `tests/performance/cold-navigation-js.spec.ts`; conserva las
  aserciones contra artefactos de desarrollo, CSS y CMUdict.
- Ejecuta únicamente los dos tests focalizados y los checks mínimos del repo.
- La aceptación de navegador debe usar el build exacto que generó el resumen.

## Done criteria

- [ ] CI conserva `rootMainGzipKB` y reporta `publishedChunksGzipKB`.
- [ ] CI bloquea por presupuestos observados de las rutas críticas.
- [ ] El reporte no llama gzip a bytes decodificados.
- [ ] `/offline`, `/daily`, `/tracking`, `/practice`, `/practice/review`, `/login` y `/` aparecen en el artefacto.
- [ ] `pnpm vitest run scripts/__tests__/analyze-bundle.test.ts` pasa.
- [ ] `pnpm type-check && pnpm lint` pasa.
- [ ] `pnpm build && pnpm test:perf:cold-nav` pasa en un entorno con navegador.
- [ ] No hay cambios fuera del scope salvo actualización del índice del plan.

## STOP conditions

- La captura no puede distinguir el build actual de un servidor ya levantado.
- Una ruta requiere credenciales reales no disponibles para el ejecutor.
- El browser devuelve cuerpos transformados que hacen incomparable el baseline.
- Cambiar CI exige subir límites sin establecer primero el baseline observado.

## Maintenance notes

Cada ruta nueva de alto tráfico debe obtener presupuesto. El inventario total
sigue siendo útil para detectar expansión del deploy, pero nunca debe
presentarse como bytes descargados por una persona.
