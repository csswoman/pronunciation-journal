# Plan 072 — Variar y ampliar el banco de ítems del diagnóstico

> **Diseño (spec) generado en brainstorming, 2026-07-25.** Este documento es el
> spec; el plan ejecutable (`plans/072-*.md`) se deriva después con writing-plans.

## Por qué importa

El diagnóstico de pronunciación (plan 067) **siempre muestra las mismas preguntas**. Dos
defectos combinados lo causan:

1. **Semilla fija por usuario.** En
   `components/pronunciation-assessment/PronunciationAssessmentClient.tsx` la selección usa
   `seed: userId ?? 'guest'`. La semilla no cambia entre corridas → los mismos targets, en
   el mismo orden, cada vez.
2. **Banco de ítems minúsculo.** `lib/pronunciation/assessment/word-stress-perception.ts`
   tiene **solo 5 ítems fijos** (photograph, banana, computer, important, understand) y
   **usa los 5 siempre, en el mismo orden** — no hay muestreo dentro del target.

Resultado: el usuario ve exactamente la misma prueba cada vez, lo que la hace sentir poco
seria y no permite rehacerla para reforzar.

## Objetivo

Que cada corrida del diagnóstico varíe de forma real —distintos ítems, distinto orden—
manteniendo la reproducibilidad para tests. **Todo gratis, sin IA, sin dependencias
nuevas, sin tocar la honestidad del scoring.**

## Alcance

**In scope:**
1. **Semilla variable por sesión.** Cambiar la construcción de la semilla en
   `PronunciationAssessmentClient.tsx` para combinar `userId` con un componente de sesión
   (p.ej. timestamp de inicio o id del intento). La semilla sigue siendo *explícita y
   reproducible dentro de una corrida* (los tests que pasan una semilla fija no se rompen);
   lo que cambia es que cada nuevo diagnóstico usa una semilla distinta.
2. **Ampliar el banco de word-stress** de 5 a ~15–20 ítems con acento conocido.
3. **Muestreo de ítems dentro del target.** En vez de usar el array completo, elegir N
   (p.ej. 5) ítems de M con la semilla de sesión, reutilizando la utilidad existente
   `weightedSampleWithoutReplacement` (o un sample uniforme si no se necesita peso).
4. **Aplicar el mismo patrón de muestreo a otros targets** que hoy usen contenido fijo, si
   los hay (revisar en ejecución).

**Out of scope:**
- Producción acústica de vocales / medición de formantes → **eso es el plan 071**.
- Nuevos *tipos* de ejercicio (solo más ítems de los tipos existentes).
- Cambiar la lógica de selección de *targets* (`selectDiagnosticPrompts`) más allá de la
  semilla — ya funciona; el problema no está ahí.
- Cualquier score nuevo o cambio en `scoring.ts`.

## Diseño

### 1. Semilla por sesión

Hoy:
```ts
selectDiagnosticPrompts({ seed: userId ?? 'guest', cefrLevel: DEFAULT_CEFR })
```
Después: la semilla incorpora un valor de sesión estable durante la corrida (para que el
`useMemo` no re-muestree en cada render) pero distinto entre corridas. Ejemplo: derivar la
semilla una vez al montar de `${userId ?? 'guest'}:${sessionStartMs}` y guardarla en estado/
ref, no recalcularla por render.

**Invariante de test:** cualquier consumidor que quiera determinismo pasa una semilla
explícita; el cambio solo afecta cómo la UI *elige* la semilla por defecto.

### 2. Banco de word-stress ampliado

Extender `WORD_STRESS_PERCEPTION_ITEMS` a ~15–20 palabras con `stressedSyllableIndex`
verificado. Mantener el shape `WordStressPerceptionItem` intacto.

### 3. Muestreo dentro del target

- Word-stress deja de consumir el array completo. Se muestrean N ítems (constante, p.ej.
  `WORD_STRESS_ITEMS_PER_RUN = 5`) con la semilla de sesión.
- El scoring (`wordStressScore`) debe basarse en el **número de ítems presentados en esa
  corrida**, no en la longitud total del banco — ajustar `wordStressScore` /
  `wordStressCorrectAnswers` para recibir el total de ítems de la corrida en vez de asumir
  `WORD_STRESS_PERCEPTION_ITEMS.length`.
- Los componentes que muestran "Palabra X de N"
  (`PronunciationPerceptionPrompt.tsx`, `PronunciationEvidenceDetail.tsx`) deben usar el
  conteo de la corrida, no el del banco completo.

## Plan de pruebas

- Test: dos semillas distintas producen selecciones de ítems distintas; misma semilla →
  idéntica (reproducibilidad).
- Test: el muestreo devuelve exactamente N ítems sin repetición.
- Test: `wordStressScore` calcula correctamente sobre el conteo de la corrida (no sobre el
  banco total).
- Test de componente: "Palabra X de N" refleja el conteo de la corrida.
- Los tests existentes de `prompt-selection` y perception siguen pasando (pasan semilla
  explícita).

## Criterios de hecho (Done)

- [ ] La semilla por defecto varía entre corridas y es estable dentro de una corrida.
- [ ] Banco de word-stress ampliado a ~15–20 ítems verificados.
- [ ] Se muestrean N ítems por corrida, no el banco completo.
- [ ] Scoring y UI usan el conteo de la corrida, no la longitud del banco.
- [ ] Tests de variedad + reproducibilidad + scoring pasan.
- [ ] `pnpm type-check`, tests enfocados y `pnpm lint:design-tokens` pasan.
- [ ] Sin dependencias nuevas, sin IA, sin cambios de honestidad en el scoring.

## STOP conditions

- Ampliar el banco requiere audio TTS/grabado que no existe para las palabras nuevas →
  limitar el banco a palabras que ya tienen soporte de audio en la app.
