# Plan 057: Añadir `translation_es_en` con grading híbrido

## Status

- **Priority**: P2 pedagogical
- **Effort**: L
- **Risk**: MED
- **Depends on**: 046, 048
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Traducir de español a inglés practica recuperación y forma. Un match exacto puede calificarse localmente; las paráfrasis válidas necesitan Gemini. El diseño híbrido reduce costo y sigue ofreciendo feedback offline sin fingir equivalencia semántica.

## Current state and contract

- Payload: `{ type:'translation_es_en', sourceEs, referenceEn, acceptedAnswers?, topic, sourceRef }`.
- `WrittenProductionExercise` y Plan 056 aportan patrones de textarea/feedback/rutas.
- ID propuesto 22, sujeto a preflight seguro.

## Scope

**In scope**: migración ID 22, tipos/maps/registry, generación batch por topic, precheck local, ruta Gemini para paráfrasis, componente, cache, topic-review y tests/docs.

**Out of scope**: traducción en sentido inglés→español, traducción de párrafos, considerar Levenshtein semánticamente correcto, escribir datasets masivos.

## Steps

1. Añadir ID 22 y slug de forma segura; extender tipos, adapters, registry y tests exhaustivos.
2. Definir normalizador que ignore case/puntuación/espacios y contracciones equivalentes solo cuando estén en `acceptedAnswers`. Match local exacto evita red.
3. Crear generación batch autenticada por topic/CEFR con schema `{sourceEs, referenceEn, acceptedAnswers?}` y cache Dexie determinista.
4. Crear prompt/ruta de grading que solo se llama tras fallar el precheck; devuelve correct, score, explanation y correction bajo Zod.
5. Offline tras mismatch: mostrar referencia y feedback de comparación, pero registrar incorrecto o permitir retry; nunca aceptar por distancia Levenshtein solamente.
6. Crear componente propio reutilizando piezas visuales de producción sin añadir flags a WrittenProduction.
7. Integrar opcionalmente en topic-review y probar exacto, puntuación, accepted answer, paráfrasis remota, mala, offline y persistencia topic/score.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- app/api/gemini lib/exercises components/exercises lib/review` | tests verdes |
| `pnpm check:migrations && pnpm type-check && pnpm lint` | exit 0 |
| `pnpm test` | suite verde |

## Done criteria

- [ ] Match local correcto no llama Gemini.
- [ ] Paráfrasis mock válida se acepta online con feedback estructurado.
- [ ] Offline degrada de forma honesta y conserva usabilidad.
- [ ] Topic y score persisten con ID 22.
- [ ] Generación/cache respetan CEFR y límites de contenido.

## STOP conditions

- ID 22/slug ocupado.
- La implementación pretende aceptar por Levenshtein una traducción semánticamente distinta.
- El modo offline exige descargar contenido no cacheado sin una estrategia aprobada.

## Git workflow and maintenance

- Branch: `codex/057-translation-es-en`; commit: `feat(grammar): add Spanish to English translation`.
- Accepted answers deben seguir siendo explícitas; revisar métricas antes de relajar grading local o aumentar llamadas remotas.
