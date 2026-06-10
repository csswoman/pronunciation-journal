# Práctica de fonemas más pedagógica, permisiva y entretenida

**Fecha:** 2026-06-02
**Estado:** Diseño aprobado — pendiente plan de implementación

## Problema

La práctica de fonemas actual (`/practice/sounds`) es de **alto riesgo y baja variedad**: siempre el
mismo molde de ejercicios (2 pick_word + 2 pick_sound + 2 minimal_pair + 2 dictation barajados),
con feedback de "Incorrecto → Continuar" y un mastery estricto. Para un principiante, esto:

- No educa bien el **oído** para distinguir pares confusos (/iː/ vs /ɪ/, /æ/ vs /e/, etc.).
- Se siente **monótono**, así que no se repite lo suficiente para que el oído aprenda.
- Penaliza el error en vez de convertirlo en enseñanza.
- **No funciona en móvil**: las opciones reproducen audio en `onMouseEnter` (hover), que no
  existe en pantallas táctiles.

## Objetivo

Hacer la práctica más **pedagógica** (entender antes de practicar, contexto en cada ejercicio),
más **permisiva** (pistas escalonadas + reintento, sin penalización), y más **entretenida/efectiva**
para la **discriminación auditiva**, reutilizando el contenido que ya existe (`IPA_EXTRA`) sin
inventar datos ni llamar a Gemini.

## Principios

- **La pista es un andamio, no un castigo.** Pedir pista no afecta score, mastery ni racha. Se
  registra internamente (sin efecto visible) por si más adelante se quiere mostrar "uso de pistas
  bajando" como señal de progreso.
- **Discriminación auditiva al centro.** La mayoría de los ejercicios de cada sesión entrenan el
  oído para separar sonidos confusos.
- **Sin contenido nuevo inventado.** Todo el material pedagógico sale de `IPA_EXTRA`
  (`lib/pronunciation/ipa-data.ts`): `spanishTip`, `articulation`, `minimalPairs`, `difficulty`.
- **Idioma:** explicaciones en **español**, palabras y sonidos de ejemplo en **inglés**.
- **Offline-safe.** `IPA_EXTRA` es local; la lección y las pistas funcionan sin red.
- **Respeta CLAUDE.md:** generadores/lógica en `lib/`, componentes < 250 líneas y una sola
  responsabilidad, sin estilos inline (salvo runtime), tokens de diseño, estado efímero en Zustand
  / estado persistente en Dexie.

## Alcance (4 + 1 piezas)

### 1. Lección previa saltable

- Es el **paso 0** de la sesión en `/practice/sounds/sound/{id}`, antes del primer ejercicio.
  No es página nueva ni cambia la grilla; vive dentro del flujo de `PracticeSession`.
- Componente nuevo `components/phoneme-practice/PhonemeLessonIntro.tsx` (< 150 líneas).
- Contenido desde `IPA_EXTRA[ipa]`:
  - El sonido grande (`/ɪ/`) + botón 🔊 (sonido aislado y en palabra de ejemplo).
  - `spanishTip` — explicación principal en español.
  - `articulationEs` — posición de boca/lengua, en español (ver "Datos" abajo).
  - Ejemplos en inglés (palabras de `minimalPairs`), cada una con 🔊.
- Botón **"Entendí, a practicar →"** y link discreto **"Saltar"**.
- **Saltable e inteligente:** Dexie recuerda que el usuario ya vio la lección de ese sonido; en
  sesiones futuras del mismo sonido se salta por defecto, pero queda accesible.

### 2. Contexto en cada ejercicio

- Enriquecer el `eyebrow` de `lib/phoneme-practice/exercise-labels.ts` con el **contraste** que se
  practica, derivado de `IPA_EXTRA`. Ejemplos:
  - minimal_pair / intruso: *"Distingue /ɪ/ (corto) de /iː/ (largo)"*
  - intruso: *"Una de estas NO tiene el sonido /ɪ/. Encuéntrala."*
  - ABX: *"Escucha A y B. ¿La palabra X suena como A o como B?"*
- No es pantalla nueva: es texto en el header del ejercicio que ya se renderiza
  (`PhonemeExercisePrompt`).

### 3. Pistas escalonadas + reintento

- El re-encolado al fallar **ya existe** en `hooks/usePracticeSession.ts` (re-inserta 3 posiciones
  adelante, hasta `MAX_FAILURES = 4`). Esta pieza añade pistas en el momento del fallo + separar
  seleccionar de confirmar.
- **Flujo al fallar:**
  1. Feedback "No exactamente" + botón **"💡 Ver pista"** (en vez de saltar directo).
  2. Cada clic revela un nivel más, escalonado:
     - **Nivel 1 — Escucha de nuevo, más lento:** reproduce los audios contrastados lado a lado a
       velocidad reducida.
     - **Nivel 2 — Resalta la letra:** marca la(s) letra(s) del sonido objetivo dentro de la
       palabra (p. ej. la **ee** de "sh**ee**p").
     - **Nivel 3 — Cómo se forma:** tip de boca/lengua desde `IPA_EXTRA` (`spanishTip` /
       `articulationEs`).
  3. Botón **"Reintentar"** rehabilita las opciones. Avanza solo al acertar o al elegir "Continuar".
- **Sin penalización:** pedir pista no cuenta como fallo ni afecta mastery/racha. Solo se registra
  que se usó pista (campo interno).
- Pistas = **estado de UI efímero** → estado local del componente o Zustand, nunca Dexie.
- Componente nuevo `components/phoneme-practice/ExerciseHints.tsx` (< 120 líneas); recibe `ipa`,
  palabras y el contraste como props.

### 4. Ejercicios nuevos de discriminación

Tipos nuevos en `lib/phoneme-practice/types.ts`: `ExerciseType` += `'odd_one_out' | 'abx'`.

**El intruso (`odd_one_out`):**
- 3-4 palabras suenan; todas tienen el sonido objetivo **menos una** (la intrusa = respuesta).
- Generador `generateOddOneOut(...)` en `exercises.ts`: 3 palabras con el sonido objetivo + 1
  distractora de un sonido **confusable** (reusa `getConfusableSounds` / `pickConfusableIpas`).
- Componente `components/phoneme-practice/OddOneOutExercise.tsx` (< 150 líneas).

**ABX (`abx`):**
- Oyes **A** y **B** (los dos sonidos contrastados, etiquetados), luego **X** (tercera palabra).
  ¿X suena como A o como B?
- Generador `generateABX(targetSound, pairs)`: A y B = miembros de un minimal pair (DB o
  `IPA_EXTRA` fallback); X = palabra que contiene uno de los dos sonidos. Respuesta = el sonido que
  comparte.
- Componente `components/phoneme-practice/ABXExercise.tsx` (< 150 líneas).

**Mezcla por sesión** (~8-10 ejercicios), en `lib/phoneme-practice/mixed-session.ts`:
- 2 El intruso
- 2 ABX
- 2 minimal_pair
- 1 pick_sound
- 1 dictation
- + match_pairs / reorder_words si hay datos suficientes

(Discriminación auditiva = 6 de ~8 ejercicios centrales.)

### 5. Soporte táctil / móvil (corrección transversal)

- Hoy las opciones reproducen audio en `onMouseEnter` y hacen submit en el primer clic. Esto no
  funciona en táctil.
- **Patrón nuevo (todos los ejercicios de selección):**
  - **Tocar una opción la reproduce** (cuantas veces se quiera) **y la marca como seleccionada**
    (resaltada), pero **no confirma**.
  - **Botón "Confirmar" abajo** envía la respuesta seleccionada.
- Esto separa *seleccionar* de *confirmar*, lo que además habilita el reintento con pistas de la
  pieza 3 (seleccionar → pista → cambiar selección → confirmar).
- Afecta: `MinimalPairExercise`, `PickWordExercise`, `PickSoundExercise`, y los nuevos
  `OddOneOutExercise` y `ABXExercise`.

## Datos

- Añadir campo **`articulationEs: string[]`** a `PhonemeExtra` en `lib/pronunciation/ipa-data.ts`
  (traducción al español del `articulation` existente). **No reemplazar** el `articulation` en
  inglés, para no romper usos actuales.
- No se crean tablas nuevas en Supabase. La marca de "lección vista por sonido" vive en Dexie
  (estado de usuario local).

## Componentes nuevos (resumen)

```
components/phoneme-practice/
  PhonemeLessonIntro.tsx     // lección paso-0, < 150 líneas
  ExerciseHints.tsx          // pistas escalonadas, < 120 líneas
  OddOneOutExercise.tsx      // intruso, < 150 líneas
  ABXExercise.tsx            // ABX, < 150 líneas
```

```
lib/phoneme-practice/
  exercises.ts               // + generateOddOneOut, generateABX
  mixed-session.ts           // nueva mezcla
  exercise-labels.ts         // eyebrows con contraste
  types.ts                   // ExerciseType += odd_one_out | abx
  lesson.ts (nuevo)          // lee IPA_EXTRA para la lección + estado "vista"

lib/pronunciation/ipa-data.ts // + articulationEs por fonema
```

## Fuera de alcance (YAGNI)

- Ejercicio Same/Different (A-B): ya cubierto en esencia por `minimal_pair`.
- Lección como tarjeta en la grilla o página dedicada con URL: descartado; la lección es paso-0 de
  la sesión.
- Generación de contenido pedagógico vía Gemini: innecesario, `IPA_EXTRA` ya lo tiene.
- Tablas nuevas en Supabase / cambios de mastery: el mastery actual se mantiene.

## Fases de implementación sugeridas

1. **Soporte táctil + separar seleccionar/confirmar** (pieza 5) — base para todo lo demás.
2. **Pistas escalonadas + reintento** (pieza 3) sobre el nuevo patrón de confirmar.
3. **Lección previa + `articulationEs` + contexto en eyebrows** (piezas 1 y 2).
4. **Ejercicios nuevos** intruso y ABX + nueva mezcla de sesión (pieza 4).
```
