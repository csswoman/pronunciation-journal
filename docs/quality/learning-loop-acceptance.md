# Learning-loop acceptance

- Fecha de ejecución técnica: 2026-08-11
- Commit base: `8d69ef3b`
- Entorno: Windows local, Node 24, Supabase CLI local y Chromium headless
- Cuenta browser: `plan076-smoke@local.test` (solo Supabase local; fixture técnico, no participante)
- Estado: **PARCIAL** — gates técnicos y matriz visual verdes; recorridos con datos y piloto pendientes

## Evidencia automatizada disponible

| Gate | Resultado | Evidencia |
|---|---|---|
| Runtime Essential Words `off`/`shadow`/`on` | PASS | `runtime-engine.integration.test.ts`: 10/10; puerto de contrastes local, sin Supabase |
| Round-trip local/outbox | PASS | `roundtrip.integration.test.ts`: 1/1; selección, answer idempotente, sesión, reconciliación y proyección |
| Manifest/capabilities | PASS | `pnpm audit:learning-loop`: 3,230 entradas, 0 issues |
| Coverage completa, corrida 1 | PASS | 539 archivos, 3,282 tests; 71.84% statements, 62.12% branches, 72.27% functions, 75.20% lines; 382.44 s |
| Coverage completa, corrida 2 | PASS | 539 archivos, 3,282 tests; 71.84% statements, 62.11% branches, 72.29% functions, 75.20% lines; 386.36 s |
| TypeScript | PASS | `pnpm type-check`, exit 0 |
| ESLint | PASS con baseline | exit 0; 21 warnings existentes/locales, 0 errors; el nuevo round-trip no añade warnings |
| Tokens de diseño | PASS | 0 violaciones |
| Migraciones | PASS | 85 archivos, 0 patrones de alto riesgo |
| State duplication | PASS | 0 overlaps Dexie/Zustand |
| Course content | PASS | 155/155 tests |
| YAML CI | PASS | `.github/workflows/ci.yml` parseado con `js-yaml` |
| Diff whitespace | PASS | `git diff --check`, exit 0 |

## Recorridos de aceptación

`PASS técnico` significa que el contrato se ejerció con writers/read models
reales en Node o con una prueba focalizada existente. No equivale a aceptación
visual en navegador.

| # | Recorrido | Funcional | Visual | Evidencia / pendiente concreto |
|---:|---|---|---|---|
| 1 | Daily muestra reason coherente y abre el target exacto | PASS técnico | PARCIAL | `/daily` respondió 200 en toda la matriz, pero el fixture quedó en `Preparando tu plan…`; no hubo step visible cuyo reason/href pudiera contrastarse. El round-trip sí comprueba prioridad `due` → `route_next`, dedupe y `selection.reason`. |
| 2 | Essential Words registra un fallo y un acierto una sola vez | PASS técnico | PARCIAL | La sesión real mostró `Hoy tienes 15 ejercicios`. Se respondió `be` para `the`: opción correcta verde con check, incorrecta roja con X y explicación; después se marcó `Lo dije bien`. Al abandonar la sesión incompleta, Progreso siguió en cero y Review vacío, así que no se declara persistencia browser PASS. Capturas: `076-essential-words-first-exercise.png`, `076-essential-words-after-correct.png`. |
| 3 | Ruta/Mazo/Mini-lección equivalentes actualizan el mismo topic | PASS técnico parcial | PARCIAL | `/courses` renderizó A1, lecciones y Sound Lab en toda la matriz. No se sembró un mismo topic en Ruta, Mazo y Mini-lección, por lo que falta observar la convergencia en UI. |
| 4 | Tracking phrase sin target queda activity-only; con target acredita al owner | PASS técnico parcial | PARCIAL | `/tracking` renderizó las acciones `Guardar palabra`/`Guardar frase` y el empty state. No se crearon las dos frases de contraste, así que falta validar copy y owner renderizados. |
| 5 | Misión desde Daily completa solo el step originador con objetivo y evidencia | PASS técnico | NOT RUN browser | Los tests `launch.test.ts` y `persistence.test.ts` validan target y step exactos. Daily no produjo un step visible en el fixture local, por lo que no se inició la misión desde esa procedencia. |
| 6 | Review topic-only inicia correctamente | PASS técnico | PARCIAL | `/practice/review` respondió 200 y mostró sus siete grupos en desktop/móvil, pero el fixture estaba `Estás al día`; falta un topic due real para iniciar la sesión. |
| 7 | `error_correction` aparece desde un deck real y conserva fallback | PASS técnico | NOT RUN browser | Audit: 128 decks y 272 pares autorados; `topic-review-step.test.ts` valida authored-first y fallback. El fixture vacío no expuso un deck ejecutable. |
| 8 | Progreso separa actividad, cobertura y aprendizaje | PASS técnico | PASS presentación | `/progress` presenta tarjetas independientes `ACTIVIDAD`, `COBERTURA` y `APRENDIZAJE`, con el aviso de que practicar, completar y demostrar se cuentan por separado. Verificado en las ocho combinaciones visuales. La proyección de una sesión terminada sigue cubierta solo por integración. |

## Matriz visual ejecutada

Cada recorrido aplicable debe verificarse en:

| Tema | Desktop | Móvil |
|---|---|---|
| Claro, hue inicial (`250`) | PASS · 7/7 rutas, HTTP 200 | PASS · 7/7 rutas, HTTP 200 |
| Oscuro, hue inicial (`250`) | PASS · 7/7 rutas, HTTP 200 | PASS · 7/7 rutas, HTTP 200 |
| Claro, hue alternativo (`155`) | PASS · 7/7 rutas, HTTP 200 | PASS · 7/7 rutas, HTTP 200 |
| Oscuro, hue alternativo (`155`) | PASS · 7/7 rutas, HTTP 200 | PASS · 7/7 rutas, HTTP 200 |

Rutas: `/`, `/daily`, `/practice/essential-words`, `/practice/review`,
`/progress`, `/tracking` y `/courses`. Desktop: 1440 × 1000; móvil:
390 × 844. Las 56 capturas están bajo
`C:/Users/karla/.codex/visualizations/2026/08/11/019fef8a-a52c-7641-93a6-df733f1c9a1a/`
con prefijo `076-`. Muestras inspeccionadas: Progreso oscuro hue 155, Progreso
oscuro móvil hue 250, Essential Words claro móvil hue 155, Review oscuro móvil
hue 155 y Ruta clara móvil hue 155.

## Ejecución local del smoke browser

El 2026-08-11 se reactivó el stack local sin `db reset`:

- Auth/Kong/REST respondieron localmente; `/auth/v1/health` devolvió 200.
- `supabase migration up --local` aplicó las ocho migraciones pendientes desde
  `20260730211112` hasta `20260809221206`.
- Se creó el usuario local determinista `plan076-smoke@local.test`; no se creó,
  borró ni modificó ningún usuario remoto.
- El login directo por password contra Auth local pasó y el listado posterior
  reportó cero migraciones locales pendientes.

Con autorización del operador se detuvo el `next dev` anterior y se levantó la
copia de trabajo real en el puerto 3000 con las variables del Supabase local.
Chromium necesitó `bypassCSP` porque la política `connect-src 'self' https:`
bloquea el endpoint HTTP local `127.0.0.1:54321`; no se modificó el CSP de
producción. El login directo de Auth y la navegación browser ocurrieron con el
fixture local.

Hallazgos del smoke que no se corrigieron por estar fuera del alcance de 076:

- durante la hidratación de `/login`, Playwright detectó que la imagen del hero
  móvil interceptaba el botón submit en 1440 px; el runner necesitó clic forzado;
- después del login, el footer siguió mostrando `Explorando sin cuenta`, por lo
  que los recorridos que exigen atribución a cuenta no se promueven a PASS;
- Daily permaneció en preparación con el fixture vacío y Review no tuvo targets;
- la consola reportó `svg height: Expected length, "auto"`; los abortos
  intermitentes de carga de Essential Words ocurrieron durante la navegación
  rápida de la matriz, mientras una pasada estable sí cargó la sesión completa.

## Criterio de cierre

Este documento solo puede cambiar a `PASS` cuando los ocho recorridos tengan
evidencia browser concreta con los estados de datos requeridos. La matriz visual
ya está ejecutada; no sustituye los recorridos funcionales ni el piloto frío.
