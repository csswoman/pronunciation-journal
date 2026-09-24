# Plan 027: Verificar las salidas reales del ciclo de aprendizaje

> **Ejecutor**: lee `CLAUDE.md` y `ENGINEERING_STANDARDS.md`. Este plan agrega comprobaciones de regresión para los contratos implementados en 020–026. Actualiza solo la fila 027 del índice.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- scripts/audit-learning-loop.mjs lib/learning-loop/evidence-exits.ts lib/learning-loop/__tests__/evidence-exits.test.ts lib/learning-loop/__tests__/roundtrip.integration.test.ts lib/exercises/capabilities.ts`.

## Estado

- **Ejecución**: DONE (2026-09-23). Las diez superficies tienen un caso que ejecuta los escritores reales contra el outbox.
- Prioridad: P2. Esfuerzo: M. Riesgo: LOW. Categoría: tests/DX.
- Depende de: 022, 023, 024, 025 y 026. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

`audit:learning-loop` comprueba manifest, IDs y declaraciones de salida, pero no ejecuta cada camino de producción. Un adaptador puede declarar `savePracticeAnswer` y `recordActivitySession` sin llamar a esos escritores. Los tests de aceptación deben probar los eventos persistidos y la reconciliación real por superficie.

## Estado actual y patrón

- `lib/learning-loop/evidence-exits.ts:29-43`: `auditEvidenceExits` comprueba existencia de un contrato y que un objetivo tenga `answerWriter`/`sessionWriter`; son cadenas declarativas.
- `scripts/audit-learning-loop.mjs:12-30`: enumera rutas y comprueba mapeos/allowlist; no ejecuta runners.
- `lib/learning-loop/__tests__/evidence-exits.test.ts`: valida declaraciones.
- `lib/learning-loop/__tests__/roundtrip.integration.test.ts`: modelo útil de selección → `savePracticeAnswer` → `recordActivitySession` → outbox → proyección, con IndexedDB simulado. El runner normal excluye `*.integration.test.ts`; `package.json` ofrece `test:learning-loop:integration` con config explícita.

## Alcance

Modificar `lib/learning-loop/__tests__/roundtrip.integration.test.ts` o tests de integración nuevos en el mismo directorio, `lib/learning-loop/__tests__/evidence-exits.test.ts`, y `scripts/audit-learning-loop.mjs`/`evidence-exits.ts` solo para enlazar un inventario comprobable de superficies. Fila 027. Fuera de alcance: reescribir la lógica productiva para que pasen tests, declarar Focus/`-ed` como objetivos antes de sus planes, convertir una prueba con mocks del escritor en prueba del runtime.

## Flujo Git

Si el operador pide rama, usa `codex/027-audit-runtime-learning-exits` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Define una tabla de aceptación por superficie con propietario, identidad de respuesta, salida de actividad, reconciliación y señal que no debe producir (exposición, skip o navegación). Abarca al menos PracticeSession, Essential Words, chunks, cursos, misiones, Focus, `-ed`, inmersión, juegos y reader. **Verifica**: test de inventario que falle si una superficie declarada carece de caso.
2. Amplía pruebas de extremo a extremo locales con los productores reales o sus hooks públicos y los escritores/outbox verdaderos; no mockees `savePracticeAnswer` ni `recordActivitySession` en estas pruebas. Comprueba ID estable, aislamiento de usuario, respuesta omitida, reconciliación exacta y cero dominio para actividad sola. **Verifica**: `node_modules/.bin/vitest.cmd run --config vitest.integration.config.ts lib/learning-loop/__tests__/roundtrip.integration.test.ts --maxWorkers=1` → exit 0.
3. Conserva el audit estático para consistencia de catálogo y explícita en su salida que no sustituye los tests runtime. Añade el comando de integración a un gate existente solo si su coste medido es aceptable; si no, documéntalo como gate antes de PR. **Verifica**: `node_modules/.bin/tsx.cmd scripts/audit-learning-loop.mjs`, tests de contratos, `node_modules/.bin/tsc.cmd --noEmit`, ESLint de archivos tocados y `git diff --check` → exit 0.

## STOP y mantenimiento

Detente si una superficie no expone un punto público testeable: documenta el hue y limita el test a un componente con interacción real, sin declarar cobertura runtime desde un mock de escritores. Las futuras superficies entran tanto al inventario como a la prueba de roundtrip pertinente.

## Resultado (2026-09-23)

El inventario `lib/learning-loop/__tests__/runtime-exit-inventory.test.ts` registra propietario, identidad, actividad, reconciliación, señal prohibida y caso de cada superficie. Falla si falta una superficie, si se elimina su caso o si una fila deja de ser de nivel `runtime`. Ninguna prueba del inventario simula `savePracticeAnswer` ni `recordActivitySession`; solo se reemplazan auth, TTS/voz, sonidos de UI y el `flushOutbox` de red.

| Superficie | Nivel | Caso |
|---|---|---|
| PracticeSession | hook-runtime | `useSessionState.roundtrip.test.tsx`: submit público → respuestas, outbox y reconciliación. |
| Essential Words | runtime | `runtime-writers.integration.test.ts`: la misma cadena de `submitGrade`/`finishSession` con escritores reales. |
| Chunks | hook-runtime | `useSessionState.roundtrip.test.tsx`: ejercicios reales de chunk → `content_srs` canónico y solo su paso. |
| Cursos | runtime | `producer-roundtrip.integration.test.ts`: `recordLessonQuizAttempt` → respuestas y el study deck exacto. |
| Misiones | runtime | `producer-roundtrip.integration.test.ts`: reducer → `persistMissionSession` → evidencia de pronunciación real. |
| Focus | component-runtime | `FocusContentViewer.roundtrip.test.tsx`: clics reales del runner → evidencia de topic y paso exacto. |
| `-ed` | component-runtime | `EdDrillSession.roundtrip.test.tsx`: clics de las tres fases → intento, actividad y paso explícito. |
| Inmersión | runtime | `producer-roundtrip.integration.test.ts`: productor → respuesta, actividad y reconciliación de la lección exacta. |
| Juegos | runtime | `roundtrip.integration.test.ts` (sin cambios). |
| Reader | runtime | `roundtrip.integration.test.ts` (sin cambios). |

### Hallazgos (fuera de alcance, sin corregir)

- **Cursos no es replay-safe**: `LessonQuizAnswerInput` no lleva `attemptId`, así que `savePracticeAnswer` genera un id por llamada (`lib/practice/queries.ts:122`). Reenviar el mismo quiz duplica las respuestas. El caso `does not accept a retried submission as replay-safe` fija el comportamiento actual; si se corrige, ese test debe invertirse.
- **PracticeSession genera el id por submit**: `buildExerciseResult` no fija `attemptId`. Solo `submittingRef` impide el doble envío dentro de la misma sesión montada.

### Gates

Antes de PR: `pnpm test:learning-loop:integration` (4 archivos, 24 tests, ~15 s en Windows) y `pnpm audit:learning-loop`. El audit solo revisa catálogo y salidas declaradas, y así lo indica su salida. Las pruebas de componentes están en la suite normal (`pnpm test`), así que ya corren en CI y en `prepush`. La integración ya es un paso de CI (`Verify learning-loop integrations`); no se añade a `prepush`. En esta máquina, `tsx scripts/audit-learning-loop.mjs` necesita `NODE_OPTIONS=--conditions=react-server` por el import de `server-only` en `decks.ts`; con esa condición reporta 4125 entradas y 0 incidencias.
