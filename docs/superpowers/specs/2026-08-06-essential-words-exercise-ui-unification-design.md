# Essential Words — Unificación de UI de ejercicios

Fecha: 2026-08-06
Estado: aprobado

## Problema

Las 7 cards de ejercicio de `/practice/essential-words` (Cloze, RecallTranslation,
Recognize, RecognizeAudio, Dictation, WeakForm, SpeakReview) no comparten un
patrón visual consistente:

- El botón "Continuar" que avanza al siguiente ejercicio se renderiza **fuera**
  del borde de la card en algunos casos (bloque genérico en
  `EssentialWordsSession.tsx`), y **dentro** en otros (`DictationCard`,
  `SpeakReviewCard`). Visualmente rompe el contenedor de la card.
- El feedback de correcto/incorrecto es texto plano específico de cada card
  (p. ej. "Escribiste X, la respuesta era Y"), sin la señal visual clara
  (ícono ✓/✗ + color) que ya usa sound-lab vía `InlineFeedback`.
- Durante la fase de ejercicios no hay barra de progreso — solo un botón de
  salir (X) suelto. La fase de estudio (`WordStudyCard`) sí tiene
  `EssentialWordsStudyChrome` con X + barra + contador.
- La pantalla final (`SessionDone`) existe y está completa (stats, struggling
  words, preview de mañana) pero en la práctica no se alcanza — hay un bug de
  flujo en algún punto entre el último intento y `finishSession()`.

## Diseño

### 1. Banner de feedback unificado

Reutilizar `InlineFeedback` (`components/practice/session/InlineFeedback.tsx`)
sin modificarlo. Se muestra en las 7 cards apenas se resuelve el intento
final (no en el primer intento fallido del flujo de dos intentos de
Cloze/RecallTranslation, donde sigue el botón "Intentar de nuevo" existente).
El detalle específico de cada card (AnswerDiff, oración revelada, grid
coloreado de RecognizeOptionGrid, score % de QuietSpeakFeedback) se mantiene
sin cambios de contenido, renderizado debajo del banner.

### 2. Botón "Continuar" dentro de cada card

Eliminar el bloque de botón externo en `EssentialWordsSession.tsx`
(~línea 342-355, gateado por `pendingAttempt`). En su lugar, pasar
`onContinue` / `isContinuing` como props a cada card de ejercicio; cada card
renderiza su propio botón `Continuar` (`Button variant="primary" size="lg"`,
mismo patrón que ya usa `DictationCard`) dentro de su contenedor.

- `ClozeCard`, `RecallTranslationCard`: ganan `onContinue`/`isContinuing`,
  dejan de resolver automáticamente hacia el padre tras corregir.
- `RecognizeCard`, `RecognizeAudioCard`, `WeakFormCard`: pasan de avance
  automático inmediato a esperar clic en "Continuar" (mismo patrón).
- `DictationCard`: ya tiene el patrón, se mantiene igual salvo el banner.
- `SpeakReviewCard`: conserva su botón propio ("Guardar y ver la siguiente"),
  ya interno; solo se le agrega el banner arriba de `QuietSpeakFeedback`.

### 3. Barra de progreso durante ejercicios

Reusar `EssentialWordsStudyChrome` (ya usado en la fase `study`) también en
la rama de fase de ejercicios de `EssentialWordsSession.tsx`, reemplazando
el botón X suelto actual. Mismo componente, misma posición relativa, para
que study y exercise luzcan idénticos en su chrome superior.

### 4. Bug: no se alcanza la pantalla final

`SessionDone.tsx` no requiere cambios de contenido. El problema es de flujo:
algo impide que `phase` llegue a `"done"` en la práctica normal, o la
transición ocurre pero se revierte. Se investiga con systematic-debugging
como tarea explícita del plan, con foco inicial en `planNextStep`,
`reinsertLearning`, y las condiciones de `finishSession()` en
`hooks/useEssentialWordsSession.ts`. No se asume la causa de antemano.

## Archivos afectados

- `components/practice/essential-words/EssentialWordsSession.tsx` — quitar
  botón externo, pasar `onContinue`/`isContinuing` a las 7 cards, usar
  `EssentialWordsStudyChrome` en fase ejercicio, arreglar transición a `done`.
- `components/practice/essential-words/ClozeCard.tsx`
- `components/practice/essential-words/RecallTranslationCard.tsx`
- `components/practice/essential-words/RecognizeCard.tsx`
- `components/practice/essential-words/RecognizeAudioCard.tsx`
- `components/practice/essential-words/WeakFormCard.tsx`
- `components/practice/essential-words/DictationCard.tsx`
- `components/practice/essential-words/SpeakReviewCard.tsx`
- `hooks/useEssentialWordsSession.ts` — solo si el bug de `done` vive aquí.
- Tests correspondientes en `components/practice/essential-words/__tests__/*`
  y `EssentialWordsSession.test.tsx`.

## Fuera de alcance

- No se toca `RecognizeOptionGrid` (su coloreado se mantiene tal cual).
- No se toca el contenido de `AnswerDiff` ni `QuietSpeakFeedback` — solo se
  les antepone el banner `InlineFeedback`.
- No se rediseña `SessionDone.tsx` en sí — solo se arregla que se alcance.
- No se toca la fase `study` (`WordStudyCard`) más allá de nada — ya usa el
  chrome correcto.

## Testing

- Actualizar snapshots/expectativas de cada card afectada: presencia del
  banner `InlineFeedback`, botón `Continuar` interno reemplazando el externo.
- Actualizar `EssentialWordsSession.test.tsx`: ya no debe existir el botón
  externo; verificar que se pasa `onContinue` a cada card.
- Test de regresión para el bug de `done`, una vez identificada la causa raíz.
