# 04 · Narrar el camino al alumno

> 🟠 **Importante** · Impacto medio · ~1-2 días · Estado: 🟡 En progreso (working tree, sin commitear)

## Problema

Sistema coherente en el motor, **percibido como colección de ejercicios** por el alumno. El alumno pregunta "¿por qué hago esto?" en cada paso:

- Hace `reorder_words` sin saber qué punto gramatical entrena (el `topic` existe en el dato pero no se le muestra).
- Falla una palabra y la ve desaparecer — sin sensación de "esto vuelve hasta que lo domines".
- Salta de fonemas a vocabulario sin transición (dos rutas pegadas).
- No ve progreso hacia una meta (Core 1000 existe pero el alumno no siente la progresión).

El andamiaje pedagógico **existe en el código pero no es visible ni narrado**.

## Objetivo

Hacer visible la intención pedagógica que ya existe:

1. Mostrar el **objetivo del paso** (el `topic`/concepto) en la cabecera de cada step.
2. **Etiqueta de progreso Core 1000** ("742 / 1000 palabras") en la home.
3. Señal de "esto vuelve hasta dominarlo" (estado SRS visible por ítem).

## Estado de partida

- El `topic` ya está en el dato del ejercicio (`BaseGenericExercise.topic`, threaded en plan topic-srs).
- `DailyStep` ya tiene `title`/`subtitle` (`step-builders.ts`) — basta poblarlos con el objetivo real.
- Core 1000 queue ya existe (`lib/core-1000/`).
- `DeckProgressHeader` y `SessionProgressHud` (en git status) son piezas reutilizables.

## Tareas (alto nivel)

1. Poblar `subtitle` del step con el objetivo de aprendizaje legible (no solo el conteo).
2. Componente de progreso Core 1000 en la home ("N/1000").
3. Mostrar estado SRS por ítem donde tenga sentido (badge "lo estás aprendiendo" / "dominado").

## Criterios de aceptación

- [ ] Cada paso de la sesión declara qué entrena, en lenguaje del alumno.
- [ ] La home muestra avance numérico hacia Core 1000.
- [ ] Componentes ≤250 líneas, tokens de diseño, sin estilos inline (reglas de CLAUDE.md).

## Riesgos / decisiones abiertas

- **Mapear `topic` técnico → etiqueta humana**: `grammar:present_simple` → "Presente simple". Necesita un diccionario de display labels.
- No saturar la UI: la narrativa debe orientar, no abrumar.

## Implementación (2026-06-19, ⚠️ sin commitear)

> Vive solo en el working tree. **Commitear antes de cualquier cambio de rama.**

Entregado:

- **Diccionario topic→label**: `lib/practice/topic-labels.ts` (`topicDisplayLabel()`),
  con fallback a title-case para topics desconocidos. Tests en
  `lib/practice/__tests__/topic-labels.test.ts`.
- **Progreso Core 1000**: `components/home/Core1000ProgressCard.tsx`, consumido en
  `HomeMobileView.tsx` / `HomeReviewsSection.tsx`.
- **Objetivo del paso en sesión**: `components/practice/session/GenericExerciseView.tsx`
  consume `topicDisplayLabel`.

Pendiente (backlog):

- Los `subtitle` en `lib/practice/daily-plan/step-builders.ts` siguen siendo prosa
  hardcodeada. Para narrar el objetivo gramatical real del paso, deberían derivar de
  `topicDisplayLabel(topic)` cuando el step tenga un `topic` significativo.
- Badge de estado SRS por ítem ("lo estás aprendiendo" / "dominado") — tarea 3 del brief, aún no entregada.
