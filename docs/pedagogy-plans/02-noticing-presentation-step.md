# 02 · Paso de presentación / noticing antes de testear

> 🔴 **Crítico** · Impacto alto · ~1-2 días · Estado: 📋 Por planear
>
> Depende conceptualmente de [01](./01-close-vocab-srs.md) (el estado SRS define qué es "nuevo").

## Problema

El alumno salta directo a recuperación (`fill_blank`, `match_pairs`, `sentence_context`) **sin un encuentro previo** con la palabra. Cognitivamente esto es testear antes de enseñar: la carga cognitiva extrínseca es alta y la primera exposición es un fallo en lugar de un aprendizaje.

En SLA esto rompe la etapa de **Noticing** (Schmidt): el alumno necesita *advertir* la forma, el significado y el sonido antes de poder recuperarlos.

## Objetivo

Insertar un **paso de presentación** (no-test) para palabras en estado `new`, antes de su primer ejercicio de recuperación:

- Forma escrita + significado/traducción + audio (TTS o `audio_url`).
- Sin puntuación: es exposición, no evaluación.
- Reusar `WordStudyCard` (ya existe en staging, `components/practice/core-1000/WordStudyCard.tsx`).

## Estado de partida

- `WordStudyCard.tsx` ya está construido (en el git status actual como modificado).
- `daily-plan/step-builders.ts` es donde se ensamblan los pasos — añadir un `buildPresentationStep` antes de `buildWordReviewStep`.
- El estado `new` vendrá del SRS cerrado en plan 01.

## Tareas (alto nivel)

1. `buildPresentationStep(words, context)`: filtra palabras en estado `new` (sin SRS o `srs_status === 'new'`).
2. Renderizar `WordStudyCard` en la sesión (modo no-evaluado, avanza con "Got it").
3. Insertar el paso al inicio del flujo de vocabulario en el daily-plan.
4. Marcar la palabra como "presentada" (transición `new → learning`) al avanzar.

## Criterios de aceptación

- [ ] Una palabra `new` muestra card de estudio antes de su primer test.
- [ ] Una palabra ya conocida (estado `review`/`learning`) NO repite presentación.
- [ ] El paso no registra answer_history como si fuera un test.
- [ ] `pnpm type-check && pnpm test` verde.

## Riesgos / decisiones abiertas

- **¿Cuántas palabras nuevas por sesión?** Definir tope (carga cognitiva — sugerido 5-7).
- **Transición de estado**: ¿"presentada" cuenta como primera repetición SM-2 o es estado previo? Coordinar con plan 01.
