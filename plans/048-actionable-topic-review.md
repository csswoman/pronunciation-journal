# Plan 048: Convertir `topic_srs` en sesiones ejecutables de Review

> No importes `lib/courses/grammar-deck/decks.ts` en código cliente: usa `fs` y es server-only.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 046
- **Category**: direction / product
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

El hub muestra topics vencidos, pero `computeCanStartReview` los ignora y `useReviewSession` no tiene `startTopic`. El conteo promete ítems repasables que el usuario no puede abrir.

## Current state

- `server-queries.ts:86-143` carga `dueTopics` y `weakTopics`.
- `failed-sentences-core.ts:170-181` calcula `canStart` sin topics.
- `ReviewHubClient.tsx:193-219` solo lista nombres.
- `buildReviewPlan` consulta fallos, palabras y sonidos, no topics.
- `TOPIC_DECK_MAP` resuelve keywords; `getDeckBySlug` valida JSON con Zod pero solo puede ejecutarse en servidor.
- Los quiz de decks ya tienen `q`, `options`, `answer` y `explain`.

## Target design

Crear un builder puro que convierta un topic + deck ya cargado en un `DailyStep` con `multiple_choice`, IDs deterministas, `sourceRef` estable y `topic` en cada payload. Exponerlo mediante una ruta autenticada de Review que cargue el deck en servidor. El cliente solo solicita topics propios y recibe pasos validados.

## Scope

**In scope**: `lib/review/topic-review-step.ts`, `lib/review/topic-review-client.ts`, query server de topics, `app/api/review/topics/route.ts`, `topic-decks.ts`, composer, hook, ReviewHubClient, `computeCanStartReview` y tests.

**Out of scope**: nuevos formatos gramaticales, Gemini fallback, editar JSON de decks, prometer review offline sin un topic/deck cacheado.

## Steps

1. Añadir `deckSlugForTopic(topic)` y tests contra topics reales; devolver `null` sin coincidencia.
2. Implementar builder puro: máximo dos topics, máximo 3 preguntas por topic, `sourceRef: { source: 'text_fragments', id: 'grammar-deck:<slug>' }`, `topic` normalizado y contexto `review` al adaptar.
3. Crear endpoint autenticado que acepte topic opcional, compruebe que pertenece al usuario, cargue decks server-side y devuelva pasos. Sin topic devuelve hasta dos vencidos.
4. Añadir cliente de la ruta y conectarlo a `buildReviewPlan`; un fallo de red degrada a los demás tipos de review.
5. Incluir `dueTopics` en `computeCanStartReview` y añadir `startTopic(topic)` al hook; cada fila del hub obtiene botón Practicar.
6. Probar builder, autorización, IDs deterministas, topic en payload, empty/degraded state y avance de `topic_srs` mediante el flujo normal de `savePracticeAnswer`.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/review components/practice/review hooks/useReviewSession.ts` | tests focalizados verdes |
| `pnpm type-check && pnpm lint` | exit 0 |
| `pnpm test` | suite verde |

## Done criteria

- [ ] Un usuario con solo `dueTopics` puede iniciar Review.
- [ ] Cada respuesta lleva topic y actualiza `topic_srs` por outbox.
- [ ] Un topic ajeno o desconocido no permite leer decks arbitrarios.
- [ ] El bundle cliente no importa `fs` ni `decks.ts`.
- [ ] Sin red, Review conserva palabras/sonidos disponibles y explica la omisión del topic.

## STOP conditions

- La ruta necesita aceptar un slug o path proporcionado directamente por el cliente.
- No existe mapping confiable para la mayoría de topics reales; reportar inventario antes de inventar asociaciones.

## Git workflow and maintenance

- Branch: `codex/048-actionable-topic-review`; commit: `feat(review): make grammar topics actionable`.
- Al añadir formatos en 050/051/056/057, extender el builder sin mover lectura de decks al cliente y conservar multiple choice como fallback.
