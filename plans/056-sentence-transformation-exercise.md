# Plan 056: Añadir `sentence_transformation` con generación y grading remotos

## Status

- **Priority**: P2 pedagogical
- **Effort**: L
- **Risk**: MED
- **Depends on**: 046, 048
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Transformar una oración exige producir una estructura gramatical, algo que multiple choice no mide. Como admite varias respuestas correctas, necesita grading semántico online y una degradación explícita.

## Current state and contract

- `grade-production` define guards, fallback JSON y errores públicos a copiar.
- `WrittenProductionExercise` ya resuelve textarea, online state, retry y feedback.
- Payload objetivo: `{ type, sourceSentence, instruction, referenceAnswer?, topic, sourceRef }`.
- ID propuesto 20, sujeto a preflight seguro.

## Scope

**In scope**: migración ID 20, tipos/maps/registry/adapters, prompts, rutas de generación y grading, clientes, componente, cache Dexie existente, integración topic-review y tests/docs.

**Out of scope**: grading offline como correcto, almacenar texto libre completo en logs, cache compartida en `text_fragments`, modificar WrittenProduction en un componente multimodo.

## Steps

1. Añadir ID 20 seguro y extender unión discriminada/mapas exhaustivos; añadir `grammar_deck` a `ExerciseSource` si se usa como sourceRef y actualizar tests de exhaustividad/cache.
2. Añadir prompts separados para generar batch por topic/deck y para grade. Schemas Zod deben limitar frases, instrucciones y cantidad.
3. Crear `/api/gemini/generate-transformations` y `/grade-transformation` con same-origin, auth, rate limit, helper JSON y tests de guards/parsing/fallback.
4. Cachear ejercicios generados en `generatedExercises` con IDs deterministas; no escribirlos a `text_fragments` en v1.
5. Crear cliente y componente propio siguiendo WrittenProduction. Offline: no iniciar ejercicios sin cache; un ejercicio abierto conserva respuesta pero no puede calificarse y ofrece skip/retry.
6. Convertir grade remoto a `PedagogicalFeedback + score`; enviar topic por flujo normal.
7. Integrar como formato opcional de topic-review, nunca como único formato de una sesión.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- app/api/gemini lib/exercises components/exercises lib/review` | tests verdes |
| `pnpm check:migrations && pnpm type-check && pnpm lint` | exit 0 |
| `pnpm test` | suite verde |

## Done criteria

- [ ] Buena, mala y paráfrasis válida reciben resultados coherentes en tests mock.
- [ ] Topic y score llegan a persistencia; logs no contienen producción completa.
- [ ] Cache evita regenerar el mismo batch dentro de TTL.
- [ ] Offline nunca marca una transformación como correcta localmente.

## STOP conditions

- ID 20/slug ocupado.
- El grading requiere enviar contenido ajeno al usuario o saltarse guards.
- El contrato de respuesta no puede mantenerse estricto con fixtures representativos.

## Git workflow and maintenance

- Branch: `codex/056-sentence-transformation`; commit: `feat(grammar): add sentence transformations`.
- Monitorizar costo/latencia antes de aumentar batches; conservar el cache y el formato local como fallback de sesión.
