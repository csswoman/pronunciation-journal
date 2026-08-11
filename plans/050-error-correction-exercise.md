# Plan 050: Añadir `error_correction` local y offline

## Status

- **Priority**: P1 pedagogical
- **Effort**: M
- **Risk**: MED
- **Depends on**: 046, 048
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17
- **Current status**: DONE (2026-08-11 via Plan 075 — authored-pair generator,
  topic-review call site, capability audit and deterministic coverage report)

## Why this matters

Los grammar decks solo evalúan con multiple choice aunque muchos contienen pares `bad`/`good`. Este formato convierte contenido ya autorado en corrección activa sin Gemini y cierra el resultado en `topic_srs`.

## Current state

- `GrammarCardBlock` incluye `pairs` con líneas `{ variant, text, note? }`.
- `GenericExercise` es una unión discriminada y `GENERIC_REGISTRY` es la única vía de render.
- `fromGenericExercise` toma ID, slug, sourceRef y topic; `PracticeSubmitHandler` acepta feedback pedagógico.
- IDs 1–18 están reservados; este plan propone 19, sujeto al mismo preflight fail-fast de Plan 046.

## Scope

**In scope**: migración ID 19, tipos/slugs/adapters/registry, generador puro, grading tolerante, componente ≤250 líneas, integración en topic-review y tests/docs.

**Out of scope**: Gemini, editar decks, refactorizar componentes grandes existentes, reutilizar `FillBlankExercise` con modos booleanos.

## Steps

1. Validar ID 19↔`error_correction` y añadir migración idempotente que falle ante conflictos.
2. Añadir variante `{ sentence, correctSentence, errorWord?, explanation?, topic }`, `ExerciseSource`/sourceRef de grammar deck, slug e ID en todos los mapas exhaustivos.
3. Crear generador que reciba `GrammarStudyDeckData` ya cargado, empareje `bad` seguido de `good`, omita pares incompletos y produzca IDs deterministas.
4. Crear normalización y grading local: exacto normalizado = correcto; diferencia mínima de ortografía puede producir feedback `form_error`, pero no convertir una frase gramaticalmente distinta en correcta.
5. Registrar un componente de input textual siguiendo `SentenceDictationExercise`, con corrección, explicación y retry accesible.
6. Añadir el formato al builder de Plan 048 cuando el deck tenga pares; multiple choice continúa como fallback.
7. Actualizar `docs/architecture/exercises.md` y probar migración, generador, grading, registry y persistencia de topic.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/exercises/generators lib/exercises/__tests__ components/exercises lib/review` | tests verdes |
| `pnpm check:migrations && pnpm type-check && pnpm lint` | exit 0 |
| `pnpm test` | suite verde |

## Done criteria

- [x] Un deck fixture genera ejercicios válidos con topic/sourceRef deterministas.
- [x] Respuestas correctas, incorrectas y typo cercano producen feedback distinto.
- [x] El tipo se renderiza solo vía registry y persiste con ID 19.
- [x] Funciona sin red una vez cargado el deck.

## Closure report (Plan 075)

`pnpm audit:learning-loop` encontró 272 pares adyacentes válidos en 128 decks y
207 líneas omitidas de forma determinista. El generador solo acepta `bad`
seguido inmediatamente de `good` dentro del mismo bloque; topic review incluye
como máximo una corrección y completa hasta tres ejercicios con quiz.

## STOP conditions

- ID 19 o slug ocupado.
- Los decks no permiten emparejar bad/good determinísticamente; reportar cobertura antes de inferir pares por similitud.

## Git workflow and maintenance

- Branch: `codex/050-error-correction`; commit: `feat(grammar): add error correction exercises`.
- Al evolucionar el schema de pairs, conservar compatibilidad con decks actuales y revisar el generador con el content audit.
