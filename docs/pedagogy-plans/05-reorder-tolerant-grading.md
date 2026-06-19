# 05 · `reorder_words`: grading tolerante

> ⚡ **Quick win** · Impacto medio · ~1 día · Estado: 📋 Por planear

## Problema

`reorder_words` valida con **comparación exacta de string** (`exercises.md:236`):

```
placed.join(' ') === sentence
```

Una reordenación gramaticalmente válida pero distinta del original se marca **mal**. Esto:

- Frustra al alumno (sabe que su oración es correcta).
- Da una **señal de aprendizaje falsa** (registra error donde hubo acierto → contamina el SRS del plan 01).
- Es **inconsistente** con el resto: `dictation` y `sentence_dictation` usan Levenshtein tolerante. El alumno *siente* esta inconsistencia como injusticia.

## Objetivo

Aceptar órdenes alternativos válidos, o al menos hacer el grading coherente con la tolerancia del resto de ejercicios.

## Opciones (decidir en el plan)

- **A (barata):** normalizar puntuación/capitalización antes de comparar (cubre falsos negativos triviales).
- **B (media):** aceptar un conjunto de órdenes válidos pre-computados por el generador cuando la oración los admite.
- **C (cara):** validación gramatical vía IA (probablemente overkill para un quick win — diferir).

Recomendado para el quick win: **A + B**.

## Estado de partida

- Generador: `lib/exercises/generators/reorder-words.ts`.
- Componente: `components/exercises/ReorderWordsExercise.tsx`.

## Criterios de aceptación

- [ ] Una reordenación válida distinta del original no se marca como error (al menos diferencias de puntuación/capitalización).
- [ ] El grading es coherente con la filosofía de tolerancia del resto de ejercicios.
- [ ] Test que cubra el caso del orden alternativo válido.

## Riesgos / decisiones abiertas

- Computar "órdenes válidos" sin un parser gramatical es difícil en general; acotar al subconjunto seguro (puntuación, mayúsculas, y oraciones cuyo orden alternativo el generador conoce).
