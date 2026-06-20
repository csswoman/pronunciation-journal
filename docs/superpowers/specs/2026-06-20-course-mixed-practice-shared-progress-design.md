# Sesión mixta de práctica en cursos con progreso compartido

**Fecha:** 2026-06-20
**Estado:** Diseño aprobado, pendiente de plan de implementación

## Problema

Al terminar una lección de curso (grammar-deck), el botón "Practica esta lección" solo
generaba ejercicios de oraciones (`reorder_words`) y a menudo mostraba "No hay ejercicios
disponibles" cuando la lección tenía pocas/ninguna frase inglesa usable.

Además, el progreso de práctica en cursos vive aislado: practicar "house" en una lección
no cuenta para Essential Words (Core 1000), aunque sea la misma palabra.

## Objetivos

1. Que el botón lance **una sola sesión mixta** que combine tres fuentes de ejercicios:
   frases de la lección, vocabulario (Core 1000 por nivel) y sonidos (si la lección tiene).
2. Que el **progreso de vocabulario sea compartido**: practicar una palabra en cursos
   crea/actualiza la misma entrada SRS que Essential Words (`c1k:<word>`).
3. Que el progreso de sonidos se guarde en el sistema de fonemas existente (Supabase).

## No-objetivos (YAGNI)

- No se hacen **repasos** (palabras SRS due) en cursos. Cursos solo *introduce* vocabulario
  nuevo; el repaso es responsabilidad exclusiva de `/practice/review`.
- No se rediseña `PracticeSession` ni el sistema de fonemas.
- No se migra el sistema de fonemas a Dexie/offline (sigue siendo online-only).

## Arquitectura

El botón "Practica esta lección" (en `DeckDoneScreen`) lanza el overlay `PracticeSession`
existente con `context: 'courses'`, alimentado por un nuevo armador de sesión:

```
buildCoursePracticeSession(lesson, level) → PracticeExercise[]
  ├── frases de la lección   → reorder / dictado / fill-blank   (mixed-from-fragments, ya existe)
  ├── vocabulario Core 1000  → fill-blank / dictado por palabra  (nivel CEFR, solo palabras nuevas)
  └── sonidos (si deck.sounds) → pick_word / minimal pairs        (phoneme-practice, online)
```

Cada `PracticeExercise` ya lleva `sourceRef.source`, que actúa como discriminador para
enrutar el guardado de progreso al sistema correcto.

**Principio central de progreso compartido:** no se inventa identidad nueva. Un ejercicio
de vocabulario sobre "house" usa `wordId = core1000WordId("house") = "c1k:house"`, la misma
clave SRS que Essential Words. Graduarlo desde cualquier lado mueve la misma entrada.

## Componentes / unidades

### 1. `buildCoursePracticeSession` (cliente)
- **Qué hace:** ensambla la lista de `PracticeExercise` mezclando las 3 fuentes, intercalando
  tipos para variedad, con tamaño objetivo ~8–10 ejercicios.
- **Dónde:** nuevo módulo, p. ej. `lib/courses/practice/build-session.ts`.
- **Dependencias:** `mixed-from-fragments` (frases), nuevo selector de vocab, generadores de
  fonemas existentes.
- **Reglas:**
  - Omite cualquier fuente vacía y rellena con las otras.
  - Si todas están vacías → devuelve `[]` (el botón no se muestra).
  - Corre en cliente (el SRS de Core 1000 está en Dexie).

### 2. Selector de vocabulario nuevo por nivel
- **Qué hace:** dado el nivel CEFR de la lección, devuelve ~3–5 `CoreWord` **sin entrada
  SRS** (`c1k:<word>` inexistente), en orden de `rank` (frecuencia).
- **Excluye explícitamente** palabras due/existentes (eso es repaso, no cursos).
- Genera 1 ejercicio por palabra (fill-blank usando `example_sentence`, o dictado).
- Si no quedan palabras nuevas del nivel, devuelve `[]` (se omite la parte de vocab).

### 3. Ejercicios de sonido embebidos
- **Qué hace:** si `deck.sounds` no está vacío, genera ejercicios con `phoneme-practice`
  (`generatePickWord`, minimal pairs) filtrados a esos sonidos.
- **Online-only (excepción consciente a offline):** si no hay conexión o la generación falla,
  se omiten los ejercicios de sonido; la sesión continúa con frases + vocab. Nunca rompe
  la sesión completa.

### 4. Dispatcher de progreso por origen
- **Dónde:** dentro de `handleSubmit` en `components/practice/session/useSessionState.ts`,
  justo donde ya se llama a `savePracticeAnswer` (answer_history).
- **Qué añade** (aditivo, según `current.sourceRef.source`):
  - `core1k`  → `gradeCore1000Word(word, quality)` → SRS `c1k:<word>` compartido.
  - phoneme/contrast → grade del sistema de fonemas.
  - `text_fragments` y demás → comportamiento actual (solo answer_history).
- **Quality (SM-2 0–5):** derivada de `isCorrect`/`score` del resultado del ejercicio
  (correcto → 4, incorrecto → 2; si hay `score` 0–100, se mapea con la conversión existente
  accuracy→quality).
- El ruteo se decide por `sourceRef.source`, no por contexto, por lo que es seguro para
  todos los flujos.

### 5. UI en `DeckDoneScreen`
- Botón único "Practica esta lección" (ya existe; ajustar copy ya hecho).
- Se **elimina** el enlace separado "Practica estos sonidos → Sound Lab" (ahora embebido).
- Se mantiene "Continúa con" (lecciones relacionadas).
- Si `buildCoursePracticeSession` devuelve `[]`, no renderizar el botón (en vez del error).

## Flujo de datos

1. Usuario termina la lección → `DeckDoneScreen`.
2. Click "Practica esta lección" → cliente arma la sesión (`buildCoursePracticeSession`).
3. `PracticeSession` corre los ejercicios mezclados.
4. Por cada respuesta, `handleSubmit`:
   - guarda en `answer_history` (como hoy),
   - **además** rutea al SRS correcto según el origen (vocab → Core 1000, sonido → fonemas).
5. El progreso de vocab queda visible inmediatamente en Essential Words (misma entrada SRS).

## Manejo de errores / degradación

- Sin conexión: se omiten sonidos; frases + vocab funcionan offline.
- Sin frases inglesas usables: la sesión usa vocab + sonidos.
- Sin palabras nuevas del nivel: la sesión usa frases + sonidos.
- Todas vacías: no se muestra el botón.
- Fallo al guardar SRS/answer_history: best-effort, nunca rompe el flujo de la sesión
  (igual que el patrón actual en `gradeCore1000Word`).

## Testing

- **Unit — selector de vocab:** excluye palabras con SRS existente; respeta orden por rank;
  devuelve `[]` cuando no hay nuevas.
- **Unit — buildCoursePracticeSession:** omite fuentes vacías; intercala tipos; respeta
  tamaño objetivo; devuelve `[]` cuando todo está vacío.
- **Unit — dispatcher de progreso:** `core1k` invoca `gradeCore1000Word` con la quality
  correcta; `text_fragments` no lo invoca; sonido rutea a fonemas.
- **Integración (ligera):** una palabra nueva practicada en cursos crea la entrada
  `c1k:<word>` y aparece como "vista" para Essential Words.

## Reglas del proyecto afectadas

- **Offline:** se introduce una excepción consciente para los ejercicios de sonido dentro de
  cursos (online-only), consistente con la excepción ya documentada de `/practice/sounds`.
  Vocab y frases permanecen offline.
- **No duplicar estado Dexie/Zustand:** no se crea estado nuevo; se reutilizan los SRS
  existentes (Core 1000 en Dexie, fonemas en Supabase).
