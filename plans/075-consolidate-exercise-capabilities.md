# Plan 075: Consolidar ejercicios activos y retirar promesas sin productor

> **Executor instructions**: Ejecuta este plan después de 073. Usa el manifest
> de cobertura creado allí como entrada verificable. No añadas formatos nuevos:
> termina `error_correction`, declara `conjugation_blank` como deferred si sigue
> sin contenido autorado y consolida únicamente primitivas duplicadas con tests
> de caracterización. Si una condición de STOP aparece, reporta sin improvisar.
> Al terminar, actualiza las filas 050, 051 y 075 en `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ce654374..HEAD -- lib/learning-loop lib/exercises lib/review lib/courses/practice public/grammar-decks components/exercises scripts package.json plans/050-error-correction-exercise.md plans/051-conjugation-blank-exercise.md`

## Status

- **Priority**: P1 pedagogy/tech-debt
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/073-connect-all-content-to-learning-loop.md
- **Reconciles**: plans/050-error-correction-exercise.md, plans/051-conjugation-blank-exercise.md
- **Category**: pedagogy, tech-debt, tests, docs
- **Planned at**: commit `ce654374`, 2026-08-10
- **Current status**: DONE (2026-08-11)

## Why this matters

La aplicación no necesita más variantes de ejercicio hasta que cada variante
existente tenga contenido que la produzca y una ruta real que la entregue. Hoy
`error_correction` y `conjugation_blank` tienen contratos, renderer y IDs, pero
no tienen productores de primera entrada en código de producto. Al mismo tiempo,
reorder/fill-blank/dictation repiten primitivas que pueden divergir.

Este plan convierte `error_correction` en práctica real a partir de contenido
autorado, deja de presentar `conjugation_blank` como capacidad activa mientras
no tenga plantillas seguras y reduce duplicación sin crear un generador universal.

## Preconditions from Plan 073

Antes de empezar deben existir y estar verdes:

- `lib/learning-loop/types.ts` — contrato de superficie/content/target/señal;
- `lib/learning-loop/content-manifest.ts` — inventario ejecutable;
- `scripts/audit-learning-loop.mjs` y script `pnpm audit:learning-loop`;
- tests que fallen ante contenido que promete práctica sin adapter.

Si el Plan 073 eligió paths distintos, actualiza este plan y su fila antes de
implementar; no mantengas dos manifests equivalentes.

## Current state

### Dos capacidades no tienen productor activo

- `lib/practice/types.ts:16-68` reserva:
  - ID 19 → `error_correction`;
  - ID 21 → `conjugation_blank`.
- `lib/exercises/types.ts` contiene ambas variantes.
- `lib/practice/exercise-renderer/generic-registry.tsx:150-151` registra sus
  componentes.
- `lib/practice/resolve-attribution.ts:19-27` conoce sus modalidades.
- Las búsquedas de producción solo encuentran tipos, adapters, feedback,
  registry, attribution y test-gallery; no un generador/call site.
- `lib/review/topic-review-step.ts:9-23` genera únicamente `multiple_choice`
  desde `deck.quiz`.

Comando de caracterización:

```powershell
git grep -l -I 'error_correction\|conjugation_blank' -- 'app/**' 'components/**' 'hooks/**' 'lib/**' ':!**/*.test.*' ':!**/__tests__/**'
```

### Los planes históricos no reflejan el estado real

- `plans/050-error-correction-exercise.md:31-37` exige generador e integración
  topic-review; sus criterios siguen sin marcar.
- `plans/051-conjugation-blank-exercise.md:30-36` exige un catálogo de plantillas
  explícitas; no existe actualmente.
- No se deben eliminar IDs/migrations históricas solo para limpiar código.

### Primitivas duplicadas

- `lib/exercises/generators/mixed-from-fragments.ts:62-69` implementa
  `shuffleDistinct` y constructores locales de reorder/dictation/fill-blank.
- `lib/exercises/generators/reorder-from-fragments.ts:8-16` repite
  `shuffleDistinct` e importa la heurística English desde el generador mixto.
- `lib/exercises/generators/reorder-words.ts:43-56` contiene una tercera copia.
- `lib/courses/practice/word-exercise-builder.ts:13-63` mantiene un adapter válido
  para Essential Words, pero también reimplementa decisiones de fill/dictation.

El objetivo no es borrar adapters por fuente. Solo deben compartirse primitivas
puras cuyas invariantes sean realmente iguales.

## Target contract

Cada `ExerciseSlug` debe declarar:

- `status`: `active`, `deferred` o `legacy`;
- al menos un productor real cuando está `active`;
- renderer y evaluator;
- fuentes compatibles;
- modalidad/skills canónicas;
- tests de generación y persistencia.

`deferred` significa que el contrato histórico permanece parseable/renderizable,
pero ninguna UI ni documento promete que el formato se seleccionará. No significa
mastery, ni autoriza generar contenido con IA.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Learning manifest | `pnpm audit:learning-loop` | exit 0, cero active capabilities sin productor |
| Generator tests | `pnpm exec vitest run lib/exercises/generators --maxWorkers=1` | todos pasan |
| Review tests | `pnpm exec vitest run lib/review --maxWorkers=1` | todos pasan |
| Exercise contract | `pnpm exec vitest run lib/practice/__tests__/exercise-type-migrations.test.ts lib/practice/exercise-renderer --maxWorkers=1` | todos pasan |
| Content audit | `pnpm audit:course-content` | exit 0 |
| Migrations | `pnpm check:migrations` | exit 0 |
| Types | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Diff hygiene | `git diff --check` | sin errores |

## Scope

**In scope**:

- `lib/learning-loop/content-manifest.ts` y su auditor, ya creados por 073
- `lib/exercises/capabilities.ts` (crear)
- `lib/exercises/generators/error-correction.ts` (crear)
- `lib/exercises/generators/primitives.ts` (crear)
- `lib/exercises/generators/mixed-from-fragments.ts`
- `lib/exercises/generators/reorder-from-fragments.ts`
- `lib/exercises/generators/reorder-words.ts`
- `lib/courses/practice/word-exercise-builder.ts` solo si una primitiva compartida
  conserva exactamente su fallback actual
- `lib/review/topic-review-step.ts`
- tests bajo `lib/exercises/generators/__tests__`, `lib/review/__tests__` y
  `lib/learning-loop/__tests__`
- `plans/050-error-correction-exercise.md`
- `plans/051-conjugation-blank-exercise.md`
- `plans/README.md`
- documentación de ejercicios que prometa capacidades activas

**Out of scope**:

- Borrar filas de `exercise_types`, migrations o payloads históricos.
- Crear frases de conjugación con Gemini o inferir semántica de tablas.
- Modificar los schedulers o el modelo de evidencia del Plan 074.
- Rediseñar componentes visuales de ejercicios.
- Unificar todos los generadores en una clase/factory universal.
- Editar masivamente `public/grammar-decks`; solo se permiten correcciones
  puntuales si una pareja autorada es inválida y el audit la identifica.

## Git workflow

- Branch sugerida: `codex/075-consolidate-exercises`.
- Commits lógicos sugeridos:
  1. `test(exercises): inventory active producers`
  2. `feat(grammar): activate authored error correction`
  3. `refactor(exercises): share safe generation primitives`
  4. `docs(plans): reconcile deferred exercise capabilities`
- Stagear paths explícitos y preservar cualquier cambio ajeno.
- No hacer push ni abrir PR sin instrucción del operador.

## Steps

### Step 1: Hacer ejecutable el inventario de capacidades

Crear `lib/exercises/capabilities.ts` como mapa exhaustivo
`Record<ExerciseSlug, ExerciseCapability>`. Como mínimo debe declarar status,
producer IDs, renderer y modalidad. `reader` puede ser active sin DB ID, pero debe
declarar que es exposure y no escribe `answer_history`.

Conectar ese mapa a `scripts/audit-learning-loop.mjs`:

- `active` sin productor → error;
- productor que apunta a slug desconocido → error;
- `deferred` expuesto como opción seleccionable/route promise → error;
- DB ID duplicado → error;
- status no implica SRS eligibility.

Estado inicial esperado:

- `error_correction`: active solo después del Step 3;
- `conjugation_blank`: deferred;
- tipos con call sites reales: active;
- compatibilidad histórica sin productor: legacy/deferred documentado.

**Verify**:

`pnpm exec vitest run lib/learning-loop/__tests__ lib/exercises/__tests__ --maxWorkers=1`
→ el fixture de active sin productor falla y el manifest real pasa al final.

### Step 2: Auditar cobertura autoral de `error_correction`

Crear un contador puro/script que inspeccione `GrammarStudyDeckData.cards` y solo
reconozca pares deterministas `bad` seguido de `good` dentro del mismo bloque,
según el contrato del Plan 050. Reportar:

- decks con al menos un par;
- pares válidos;
- pares incompletos/ambiguos omitidos;
- slugs afectados.

No emparejar por distancia textual ni reordenar líneas. El reporte debe ser
determinista y formar parte de `pnpm audit:course-content` o
`pnpm audit:learning-loop`.

**Verify**: fixture con pair válido produce 1; `bad` sin `good`, dos `bad`
seguidos y bloques separados producen 0 con reason code.

### Step 3: Activar `error_correction` desde contenido autorado

Implementar `generateErrorCorrectionFromDeck(deckSlug, topic, deck, limit)` en
`lib/exercises/generators/error-correction.ts`:

- solo usa pares aprobados por Step 2;
- conserva `bad` como prompt y `good` como `correctSentence`;
- propaga `note` como explanation cuando existe;
- usa IDs deterministas y `sourceRef` del grammar deck;
- normaliza topic con la misma autoridad que `topic-review-step.ts`;
- no usa red ni Gemini.

Actualizar `buildTopicReviewStep` para componer una mezcla acotada:

1. al menos un `error_correction` cuando el deck tenga par válido;
2. completar hasta el cap actual con `multiple_choice`;
3. conservar quiz-only como fallback si no hay par;
4. no aumentar el máximo actual de tres ejercicios por topic step.

Marcar `error_correction` active en capabilities solo después de que esta ruta y
sus tests existan.

**Verify**:

`pnpm exec vitest run lib/exercises/generators/__tests__/error-correction.test.ts lib/review/__tests__/topic-review-step.test.ts --maxWorkers=1`

Debe cubrir par válido, ausencia, ambigüedad, IDs estables, cap y fallback.

### Step 4: Declarar `conjugation_blank` deferred sin romper historia

Verificar primero que no exista un catálogo tipado de plantillas ni un productor
nuevo aterrizado desde la auditoría. Si sigue ausente:

- marcar `conjugation_blank` como `deferred` en capabilities;
- retirarlo de cualquier copy/listado que prometa formatos activos;
- mantener `ExerciseSlug`, ID 21, schema, adapter, evaluator y renderer para
  compatibilidad histórica/test-gallery;
- actualizar el Plan 051 a `REJECTED` con razón: aplazado hasta disponer de
  plantillas autoradas explícitas; no es un fallo de infraestructura.

No borres componente, tipo ni migration sin una consulta remota aprobada que
demuestre cero historial y una autorización explícita del owner.

**Verify**:

- `git grep -n -I 'conjugation_blank' -- app components lib docs` solo muestra
  compatibilidad declarada, renderer/evaluator/tests y status deferred; no un CTA
  ni productor ficticio.
- `pnpm check:migrations` sigue verde.

### Step 5: Extraer únicamente primitivas de generación equivalentes

Crear `lib/exercises/generators/primitives.ts` con:

- `shuffleDistinct<T>` con el mismo máximo de reintentos;
- predicate compartido para sentence/token minimum solo donde las reglas sean
  idénticas;
- constructor puro de reorder solo si los adapters pueden aportar domain,
  sourceRef, topic y level sin perder metadata.

Migrar las tres copias de `shuffleDistinct`. Romper la dependencia
`reorder-from-fragments → mixed-from-fragments` moviendo la heurística inglesa a
un módulo neutral solo si ambos callers requieren exactamente la misma regla.

No fuerces `word-exercise-builder.ts` a compartir distractores con fragments:
sus pools y fallback pueden ser pedagógicamente distintos. Extrae una primitiva
solo si tests demuestran equivalencia.

**Verify**:

- `git grep -n 'function shuffleDistinct' -- lib` devuelve una sola definición.
- suites de `mixed-from-fragments`, `reorder-from-fragments`, `reorder-words` y
  `word-exercise-builder` pasan sin actualizar expectativas de comportamiento.

### Step 6: Reconciliar planes y documentación

- Marcar Plan 050 DONE solo cuando el generador y topic-review estén activos.
- Marcar Plan 051 REJECTED/deferred con la razón exacta y el gate para retomarlo:
  catálogo tipado de plantillas con accepted answers y fixtures.
- Actualizar `docs/architecture/exercises.md` y el manifest de 073 para distinguir
  active/deferred/legacy.
- Registrar el reporte de cobertura, no una afirmación genérica de “integrado”.

**Verify**:

```powershell
pnpm audit:learning-loop
pnpm audit:course-content
pnpm exec vitest run lib/exercises lib/review lib/learning-loop --maxWorkers=1
pnpm check:migrations
pnpm type-check
pnpm lint
git diff --check
```

Todo debe salir con exit 0.

## Test plan

- `lib/exercises/generators/__tests__/error-correction.test.ts`: extracción
  determinista, invalid/ambiguous skips, explanation, topic/source/ID.
- `lib/review/__tests__/topic-review-step.test.ts`: mezcla acotada y fallback.
- `lib/exercises/generators/__tests__/primitives.test.ts`: no devuelve el orden
  original cuando hay una permutación posible; arrays triviales no mutan.
- Ampliar los tests existentes de reorder para probar que sus outputs no cambian.
- Test exhaustivo `ExerciseSlug` → capability; active exige producer.
- Test de migration conserva ID 19 e ID 21 exactamente una vez.

## Done criteria

- [x] Todo `ExerciseSlug` declara status y producer contract.
- [x] Ninguna capacidad active carece de productor real.
- [x] `error_correction` aparece en topic review desde pares autorados y offline.
- [x] Topic review conserva cap de tres y fallback multiple choice.
- [x] `conjugation_blank` queda deferred, sin borrar compatibilidad histórica.
- [x] Plan 050 queda realmente DONE; Plan 051 queda REJECTED/deferred con gate.
- [x] Existe una sola implementación de `shuffleDistinct`.
- [x] No se unificaron adapters con reglas pedagógicas distintas.
- [x] Learning/content audits, tests, migrations, typecheck, lint y diff check pasan.
- [x] No se añadieron tipos de ejercicio, tablas ni schedulers.

## Execution report

- Cobertura autorada: 128 decks, 272 pares válidos y 207 líneas omitidas con
  reason code; el audit imprime los slugs cubiertos.
- Capabilities: 22 activas y `conjugation_blank` deferred. `reader` declara
  exposición sin escritura a `answer_history`.
- Consolidación: `shuffleDistinct` vive únicamente en `primitives.ts`; los
  adapters conservan sourceRef, topic, level, distractores y fallbacks propios.

## STOP conditions

- Plan 073 no produjo un manifest ejecutable o su audit no está verde.
- Los grammar decks no contienen pares deterministas `bad` → `good`; reportar
  cobertura y mantener `error_correction` deferred.
- Integrar error correction requiere inferir o reescribir masivamente contenido.
- Aparece un catálogo de conjugación concurrente que cambia la decisión deferred.
- Retirar conjugation exige borrar historia o migrations.
- Compartir una primitiva cambia distractores, sourceRef, topic, level o fallback.
- Una verificación falla dos veces tras un ajuste razonable.

## Maintenance notes

- Un tipo no está terminado cuando solo tiene UI/ID; debe tener producer,
  evidence contract, call site y tests.
- El audit de capabilities debe bloquear nuevas capacidades huérfanas en CI.
- Los status deferred/legacy son parte del contrato de compatibilidad y deben
  revisarse cuando aparezca contenido autorado, no por presión de cobertura.
- Mantén adapters por fuente; comparte únicamente mecanismos puros estables.
