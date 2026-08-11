# Plan 076: Cerrar la aceptación técnica y medir el ciclo real de aprendizaje

> **Executor instructions**: Este plan no añade nuevas funciones pedagógicas.
> Primero cierra las verificaciones que quedaron abiertas después de 074–075;
> después prepara y ejecuta un piloto frío de retención/transferencia. Sigue cada
> fase en orden, ejecuta todos los comandos y registra resultados reales. No
> marques el plan DONE si el piloto de día 7 no ocurrió. No fabriques resultados,
> no debilites coverage y no conviertas completion en learning.
>
> **Drift check (run first)**:
> `git diff --stat 8d69ef3b..HEAD -- .github/workflows/ci.yml package.json vitest.config.ts vitest.integration.config.ts playwright.config.ts tests lib/essential-words lib/learning-loop lib/practice lib/progress docs plans/README.md`
>
> **Dirty-worktree warning**: al planificar había cambios locales no committeados
> en `vitest.config.ts`, dos simulation tests, varios tests de UI,
> `lib/practice/daily-plan/composer.ts` y componentes Essential Words. Ejecuta
> `git status --short` y `git diff` antes de tocar cualquier archivo; conserva el
> trabajo ajeno y detente si se solapa con este plan.

## Status

- **Priority**: P1 release/pedagogy
- **Effort**: M de ingeniería + 7–14 días calendario de piloto
- **Risk**: MED
- **Depends on**: plans/074-sanitize-review-and-learning-evidence.md, plans/073-connect-all-content-to-learning-loop.md, plans/075-consolidate-exercise-capabilities.md
- **Category**: correctness, tests, CI, product validation
- **Planned at**: commit `8d69ef3b`, 2026-08-11
- **Current status**: IN PROGRESS — gates técnicos y matriz visual verdes; recorridos browser con datos y piloto día 0/2/7 pendientes

## Why this matters

Los planes 074–075 conectaron contenido, targets, ejercicios, evidencia,
scheduling y Progreso. La arquitectura ya puede describir el ciclo, pero todavía
faltan puertas independientes que prueben que el runtime lo ejecuta de extremo a
extremo: una integración Essential Words está roja, el audit del learning loop no
corre en CI y no existe una prueba round-trip que demuestre conteos exactos entre
Daily, answers, sesiones, Repaso y Progreso.

Incluso con todas las pruebas técnicas verdes, eso no demuestra aprendizaje. El
segundo objetivo es realizar un piloto pequeño con comprobaciones frías a 2 y 7
días, separando retención, transferencia, actividad y completion. Sus resultados
deciden si se activa el Plan 043 o se ajustan contenidos/políticas; no se añaden
ejercicios por intuición.

## Current state

### Lo que sí está verde

- `pnpm audit:learning-loop` reporta 3,230 entradas y cero issues:
  - 175 Ruta;
  - 175 grammar decks;
  - 50 Mini-lecciones;
  - 2,797 Essential Words;
  - 11 Sound Lab;
  - 11 pronunciation path;
  - 8 oral missions;
  - 3 clases dinámicas de Tracking.
- `lib/exercises/capabilities.ts` declara 22 capacidades activas y
  `conjugation_blank` deferred.
- El audit de contenido encuentra 128 decks con 272 pares válidos para
  `error_correction`.
- TypeScript sale con exit 0; ESLint no tiene errores bloqueantes.
- Tests focalizados de manifest, Progress, Review, capabilities y generators
  pasan.

### Integración Essential Words reproduciblemente roja

Comando ejecutado el 2026-08-11:

```powershell
pnpm exec vitest run --config vitest.integration.config.ts lib/essential-words/__tests__/runtime-engine.integration.test.ts --maxWorkers=1
```

Resultado: 6 pasan, 3 fallan. El error común es:

```text
Error: getSupabaseBrowserClient solo puede usarse en el cliente.
runtime-engine.ts:119 -> getAllContrastProgress(userId)
```

- `lib/essential-words/runtime-engine.ts:111-123` carga progreso de contrastes al
  construir una sesión skill.
- `lib/essential-words/__tests__/runtime-engine.integration.test.ts:1-27` usa
  Node + fake IndexedDB y mocks de Essential Words/Practice, pero no declara el
  puerto de contraste.
- `vitest.integration.config.ts:4-13` dice que las integraciones pueden requerir
  entorno real, pero esta suite en particular pretende ser determinista y no
  debería abrir un Supabase real.
- La suite normal excluye `*.integration.test.*`; nombrar ese archivo en
  `pnpm test` no lo ejecuta. Por eso 074 pudo parecer verde sin correr este gate.

### El audit nuevo no bloquea CI

- `package.json` expone `audit:learning-loop`.
- `.github/workflows/ci.yml:29-65` corre lint, type-check, coverage, migrations,
  RLS, tokens, prompts, state duplication y validadores Essential Words, pero no
  corre `audit:learning-loop` ni la integración focalizada off/shadow/on.

### El contrato de evidence exits todavía es declarativo

- `lib/learning-loop/evidence-exits.ts:10-35` enumera writers esperados por
  adapter.
- `lib/learning-loop/__tests__/evidence-exits.test.ts:5-13` verifica que el
  manifest tenga un contrato y que no haya adapters duplicados.
- Ese test no ejecuta runners ni cuenta writes. Es útil como inventario, pero no
  prueba por sí solo “exactamente una answer y una sesión”.

### Coverage no tiene aún una ejecución reproducible registrada

`pnpm test:coverage` se ejecutó durante más de cinco minutos sin resumen y fue
interrumpido. Había cambios locales que elevaban timeouts de simulaciones en
`vitest.config.ts`, `mandatory-audit.test.ts` y
`multidimensional-feasibility.test.ts`. No se sabe aún si el problema es solo
tiempo de instrumentación, un worker colgado o una suite concreta. No declarar
coverage verde hasta obtener exit 0 y reporte final.

### No existe aceptación browser del ciclo integrado

- `playwright.config.ts` limita `testDir` a `tests/a11y`.
- Los specs actuales cubren login, diagnóstico y accesibilidad de misión.
- No hay recorrido automatizado Daily → ejercicio → answer/session → Repaso →
  Progreso.
- `tests/a11y/auth.setup.ts` puede saltar auth si anonymous sign-in no está
  habilitado; un nuevo gate no puede pasar silenciosamente mediante skip.

## Acceptance contract

### Técnica

1. Una answer aceptada tiene ID idempotente y se persiste exactamente una vez.
2. Una sesión completa escribe un solo `activity_sessions` summary.
3. Solo el step Daily originador se reconcilia.
4. La misma evidencia aparece en Repaso/Progreso con target, modalidad y
   provenance correctos.
5. Completion/exposure/intent no aumentan learning.
6. Off, shadow y on conservan las invariantes que les corresponden.
7. El manifest y capabilities son gates bloqueantes en CI.
8. Coverage termina con sus umbrales actuales; no se excluye código para pasar.

### Pedagógica

1. El piloto usa comprobaciones frías: no mostrar la respuesta inmediatamente
   antes de evaluar.
2. Medir por target y modalidad, no solo accuracy global.
3. Separar retención del mismo material y transferencia a material nuevo.
4. Registrar completion/actividad aparte; no cuentan como acierto.
5. Comparar la retención observada con el objetivo SRS existente de 0.90 de forma
   descriptiva. Con muestras pequeñas no cambiar políticas ni declarar
   calibración aprobada.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Runtime integration | `pnpm exec vitest run --config vitest.integration.config.ts lib/essential-words/__tests__/runtime-engine.integration.test.ts --maxWorkers=1` | 9/9 pasan |
| Learning round-trip | `pnpm exec vitest run --config vitest.integration.config.ts lib/learning-loop/__tests__/roundtrip.integration.test.ts --maxWorkers=1` | todos pasan |
| Learning audit | `pnpm audit:learning-loop` | 3,230+ entradas, 0 issues; cambios autorales legítimos pueden aumentar el total |
| Content audit | `pnpm audit:course-content` | exit 0 |
| Coverage | `pnpm test:coverage` | exit 0, resumen final y umbrales actuales cumplidos |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0; warnings preexistentes se reportan, no se expanden |
| Design | `pnpm lint:design-tokens` | exit 0 |
| Migrations | `pnpm check:migrations` | exit 0 |
| State | `pnpm audit:state-duplication` | cero overlaps no permitidos |
| Diff | `git diff --check` | sin errores |

## Scope

**In scope**:

- `lib/essential-words/__tests__/runtime-engine.integration.test.ts`
- `vitest.integration.config.ts` solo si hace falta un setup determinista común
- `lib/learning-loop/__tests__/roundtrip.integration.test.ts` (crear)
- helpers de test bajo `lib/learning-loop/__tests__/fixtures/` (crear si se usan)
- `.github/workflows/ci.yml`
- `package.json`
- `vitest.config.ts` y las suites de simulación solo para estabilizar coverage
  sin bajar umbrales ni excluir producción
- `playwright.config.ts` y `tests/learning-loop/` únicamente si existe un fixture
  de auth determinista que no pueda saltarse silenciosamente
- `docs/quality/learning-loop-acceptance.md` (crear)
- `docs/research/learning-loop-pilot.md` (crear)
- `plans/074-sanitize-review-and-learning-evidence.md`
- `plans/032-post-production-improvement-roadmap.md`
- `plans/README.md`

**Out of scope**:

- Nuevos tipos de ejercicio o contenido masivo.
- Activar Plan 043 antes de medir retorno/retención.
- Reactivar `conjugation_blank` sin plantillas autoradas.
- Cambiar FSRS, `desiredRetention`, presupuestos o MaturityPolicy.
- Añadir PostHog/Sentry u otro proveedor solo para completar el piloto.
- Modificar `lib/essential-words/runtime-engine.ts` para satisfacer el test si el
  runtime browser actual es correcto; primero declarar/mokear el puerto externo
  en la prueba.
- Usar producción para pruebas destructivas o crear/borrar usuarios reales.
- Rediseño UI. El smoke visual solo valida superficies cambiadas por 073–075.

## Git workflow

- Branch sugerida: `codex/076-learning-loop-acceptance`.
- Antes de crearla, resolver o preservar el worktree sucio; nunca incluir cambios
  ajenos mediante `git add -A`.
- Commits sugeridos:
  1. `test(learning): restore deterministic runtime integration`
  2. `ci(learning): gate manifest and round-trip evidence`
  3. `test(coverage): stabilize instrumented simulation suites`
  4. `docs(learning): record acceptance and cold-retention pilot`
- Stagear paths explícitos. No hacer push ni PR sin instrucción del operador.

## Steps

### Step 1: Restaurar la integración determinista off/shadow/on

En `runtime-engine.integration.test.ts`, declarar explícitamente el puerto de
contrastes usado por `buildSkillSession`. Preferencia:

```ts
vi.mock('@/lib/phoneme-practice/queries', () => ({
  getAllContrastProgress: vi.fn(async () => []),
}))
```

Si el módulo necesita otros exports al importarse, usar `importOriginal` y
sobrescribir solo `getAllContrastProgress`. No conectar a Supabase real y no
poner `window` falso solo para superar el guard.

Después reforzar la suite:

- limpiar `savePracticeAnswer` mocks entre casos;
- off correcto/incorrecto persiste una answer por attempt ID;
- on persiste una answer por attempt ID;
- repetir el mismo attempt ID no crea una segunda llamada/write;
- shadow conserva su semántica documentada sin inventar skill writes;
- dos intentos diferentes sobre la misma palabra siguen siendo dos answers.

Si el test demuestra que producción también puede llamar este código fuera del
navegador, STOP: en ese caso se necesita un puerto inyectable de runtime y debe
ampliarse el scope explícitamente antes de editar source.

**Verify**:

`pnpm exec vitest run --config vitest.integration.config.ts lib/essential-words/__tests__/runtime-engine.integration.test.ts --maxWorkers=1`
→ 9/9 o más pasan, cero acceso real a Supabase.

### Step 2: Crear una integración round-trip del learning loop

Crear `lib/learning-loop/__tests__/roundtrip.integration.test.ts` con Node +
`fake-indexeddb/auto`. Usar writers reales de Dexie/outbox y mockear únicamente
red/clock/UUID cuando sea necesario. El escenario mínimo:

1. construir candidatos Daily con reasons `due`, `route_next` y `saved_intent`;
2. seleccionar con `selectDailyCandidates` y comprobar prioridad/dedupe;
3. persistir una `PracticeAnswer` con attempt ID, target, modalidad y provenance;
4. reproducir el mismo submit y comprobar un solo answer outbox;
5. registrar la sesión una vez y comprobar un solo activity summary;
6. reconciliar únicamente el step originador;
7. proyectar facts y comprobar que objective evidence aparece en learning;
8. añadir completion/intent y comprobar que solo cambian coverage/intención, no
   learning;
9. añadir un fallo posterior del mismo target y comprobar que queda reviewable.

No basta con leer `EVIDENCE_EXIT_CONTRACTS`: el test debe llamar writers y
read-model functions reales. No afirmar sincronización remota; esta integración
prueba la frontera local/outbox idempotente.

**Verify**:

`pnpm exec vitest run --config vitest.integration.config.ts lib/learning-loop/__tests__/roundtrip.integration.test.ts --maxWorkers=1`
→ todos los conteos exactos pasan.

### Step 3: Convertir invariantes en gates de CI

Añadir al job `lint-and-test` de `.github/workflows/ci.yml`, después de typecheck y
antes de coverage:

```yaml
- name: Audit integrated learning loop
  run: pnpm audit:learning-loop

- name: Verify learning-loop integrations
  run: pnpm test:learning-loop:integration
```

Crear `test:learning-loop:integration` en `package.json` con la configuración de
integración y únicamente las suites deterministas del Step 1 y Step 2. No añadir
todo `pnpm test:integration`, porque otras suites pueden requerir credenciales
reales.

El job debe tener `timeout-minutes` explícito. Ningún gate puede saltarse por
falta de Supabase, porque estos dos tests no usan una base remota.

**Verify**:

- ejecutar localmente ambos scripts;
- validar YAML;
- confirmar con `git grep -n 'audit:learning-loop\|test:learning-loop:integration' .github package.json` que package y CI coinciden.

### Step 4: Hacer reproducible la cobertura completa

Primero medir, no aumentar timeouts a ciegas:

1. correr coverage con reporter que identifique el último archivo iniciado;
2. correr individualmente las simulation suites sospechosas bajo coverage;
3. registrar duración y distinguir timeout de test, worker detenido o costo total;
4. conservar los cambios locales existentes solo si están respaldados por esa
   medición.

Soluciones permitidas:

- timeout local en suites demostrablemente costosas;
- `testTimeout` de coverage si múltiples suites instrumentadas necesitan el
  mismo margen;
- limitar workers para memoria/estabilidad;
- separar un comando coverage en shards que luego combinen cobertura, si Vitest
  conserva exactamente los umbrales actuales.

Soluciones prohibidas:

- excluir archivos productivos o simulaciones relevantes;
- bajar thresholds;
- convertir fallos en warnings;
- dejar un proceso sin límite.

Añadir `timeout-minutes: 15` al job CI que contiene coverage. El comando debe
terminar con resumen final al menos dos veces consecutivas en la máquina local o
una vez local + una vez CI.

**Verify**: `pnpm test:coverage` → exit 0, sin tests skipped inesperadamente y
con artefacto `coverage/` válido.

### Step 5: Ejecutar smoke funcional y visual de las superficies conectadas

Antes de evaluar UI, leer `PRODUCT.md`, `DESIGN.md`, `THEME_SYSTEM.md` y
`docs/design/visual-language.md`.

Crear `docs/quality/learning-loop-acceptance.md` con fecha, commit, cuenta/entorno
y evidencia para estos recorridos:

1. Daily muestra reason coherente y abre el target exacto.
2. Essential Words: un fallo y un acierto aparecen una vez en historial/progreso.
3. Ruta/Mazo/Mini-lección equivalentes actualizan el mismo topic.
4. Tracking phrase sin target avisa activity-only; con target acredita al owner.
5. Misión desde Daily solo completa el step originador al lograr objetivo con
   target evidenciado.
6. Review topic-only inicia correctamente.
7. `error_correction` aparece desde un deck real y conserva fallback.
8. Progreso separa actividad, cobertura y aprendizaje.

Validar claro, oscuro y un hue distinto; desktop y viewport móvil. Registrar
PASS/FAIL y captura/path cuando sea útil. No corregir UI fuera de este plan: un
FAIL visual se convierte en finding/plan separado.

Automatizar con Playwright solo si hay auth determinista. Un spec que se salta
por falta de guest auth no satisface el gate; en ese caso conservar el smoke como
evidencia manual explícita.

**Verify**: el documento contiene ocho recorridos con resultado y no usa
“se ve bien” sin superficie/estado concreto.

### Step 6: Preparar y ejecutar el piloto frío de 7 días

Crear `docs/research/learning-loop-pilot.md` con protocolo pre-registrado:

- cohorte: usuario(s) reales identificados solo por alias no sensible;
- targets: 20–30 total, distribuidos entre vocabulario, grammar topic,
  listening/pronunciation y frases;
- baseline sin ayuda;
- práctica a través de al menos tres superficies;
- retest frío a día 2 y día 7;
- transferencia con oración/contexto nuevo para targets compatibles;
- campos: target ID, modalidad, origen, baseline, hints, resultado inmediato,
  día 2, día 7, transfer, latencia y skips técnicos;
- métricas: retención por target/modalidad, transfer success, follow-through de
  recomendación, answers duplicadas/faltantes y targets no resolubles.

Reglas de decisión:

- cero answers/sessions duplicadas o faltantes; cualquier caso reabre aceptación
  técnica;
- no llamar “mastered” a un único acierto;
- usar 0.90 solo como referencia del scheduler, no como conclusión estadística;
- no cambiar política con menos de 30 checks elegibles por segmento/modalidad;
- si el principal problema es que el usuario no vuelve al repaso, proponer Plan
  043;
- si vuelve pero falla retención, investigar contenido/scaffolding/scheduling;
- si retiene pero no transfiere, priorizar producción contextual/misiones;
- `conjugation_blank` sigue deferred salvo evidencia + plantillas autoradas.

El plan queda IN PROGRESS entre baseline y día 7. Tras el retest, anexar tabla de
resultados, limitaciones y una decisión `continue`, `adjust` o `stop`; nunca
rellenar resultados retrospectivamente.

**Verify**: revisión humana confirma fechas reales y que cada resultado tiene
target/provenance/modalidad; la sección de decisión cita los datos del piloto.

### Step 7: Reconciliar backlog y cerrar el plan

Solo después de las fases anteriores:

- marcar los criterios realmente verificados del Plan 074 con `[x]`;
- reconciliar Plan 032: `plans/README.md` dice que T50 Reader está pendiente,
  mientras `TODO.md` lo registra como HECHO; verificar evidencia y cerrar o
  corregir el registro sin inventar QA;
- actualizar fila 076 con commits, resultados técnicos y estado del piloto;
- mantener Plan 043 TODO-condicional salvo que el piloto active su trigger;
- registrar cualquier fallo visual/pedagógico como finding separado, no ampliar
  silenciosamente 076.

**Verify**: `plans/README.md`, Plan 032, Plan 074, Plan 076 y `TODO.md` no se
contradicen.

## Test plan

- `runtime-engine.integration.test.ts`: mock del puerto de contraste, 9/9 verde,
  off/shadow/on, attempts distintos e idempotencia del mismo ID.
- `roundtrip.integration.test.ts`: Daily reason/dedupe, answer outbox,
  activity-session outbox, exact reconciliation y projections honestas.
- `audit:learning-loop`: manifest/capabilities/evidence contracts.
- Coverage completa con thresholds existentes.
- Smoke manual de ocho recorridos, tres temas y dos viewports.
- Piloto: baseline, día 2, día 7 y transferencia con datos sin PII.

## Done criteria

- [x] La integración Essential Words pasa completa con la config correcta.
- [x] Off/shadow/on e idempotencia tienen assertions directas.
- [x] Existe un round-trip que ejecuta writers/read models, no solo declarations.
- [x] `audit:learning-loop` bloquea CI.
- [x] La integración focalizada del learning loop bloquea CI sin credenciales.
- [x] `pnpm test:coverage` termina y conserva thresholds.
- [x] CI tiene timeout explícito y artefacto coverage.
- [x] Typecheck, lint, design tokens, migrations, state audit y diff check pasan.
- [ ] Ocho recorridos funcionales/visuales tienen evidencia PASS en claro,
      oscuro, hue alternativo, desktop y móvil según aplique.
- [ ] El piloto tiene baseline, día 2, día 7 y transferencia reales.
- [ ] Duplicados/faltantes de answer/session en el piloto son cero.
- [ ] Resultados separan actividad, coverage, retention y transfer.
- [ ] Plan 043 se activa o permanece condicional por evidencia explícita.
- [ ] Plan 032/074/076, índice y TODO quedan reconciliados.

## STOP conditions

- Los cambios locales se solapan con config/tests/composer y no pueden
  preservarse con seguridad.
- La integración solo puede pasar conectándose a Supabase real o creando
  `window` falso en Node.
- El round-trip exige duplicar writers/schedulers o inventar un event store.
- Coverage solo pasa reduciendo thresholds o excluyendo producción.
- El E2E requiere crear/borrar usuarios de producción.
- El smoke descubre un fallo de producto que requiere rediseño amplio; registrar
  finding separado.
- No hay participante/datos reales para día 7: dejar IN PROGRESS, no DONE.
- La muestra es insuficiente para decidir una política; documentar incertidumbre
  y no ajustar FSRS/Daily.
- Una verificación falla dos veces tras un ajuste razonable.

## Maintenance notes

- Un audit declarativo necesita siempre al menos una integración que ejerza sus
  writers y conteos.
- Toda capability/content addition debe mantener `audit:learning-loop` verde en
  CI.
- Las suites `*.integration.test.*` críticas requieren un script/gate explícito;
  la suite normal las excluye por diseño.
- Mantener el piloto reproducible y pequeño. Escalar contenido solo después de
  observar retención/transferencia, no porque los tests técnicos pasen.
- No promover completion, bookmark, racha o actividad a learning en futuras
  métricas.
