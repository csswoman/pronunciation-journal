# Arquitectura de Juegos de Práctica — English Journal

Documentación del subsistema de juegos rápidos de práctica (`/practice/games` y rutas asociadas): diseño arquitectónico, contrato de motores puros, orquestación de loops, componentes compartidos y catálogo central.

La relación canónica con el ciclo de aprendizaje, telemetría y evidencia está definida en [`integrated-learning-loop.md`](integrated-learning-loop.md) y [`progress.md`](progress.md).

---

## 1. Principios arquitectónicos

Todos los juegos de práctica siguen un conjunto estricto de reglas de ingeniería:

1. **Lógica desacoplada (Motor puro)**:
   - Todo el estado y la lógica de negocio vive en un reducer puro en `lib/games/<juego>/engine.ts`.
   - Sin imports de React, sin timers (`setTimeout`, `requestAnimationFrame`), sin efectos secundarios, sin I/O.
   - 100 % determinista y testeable con Vitest.
2. **Orquestación en Hooks de ciclo**:
   - Cada juego cuenta con un hook dedicado en `hooks/games/use<Juego>Loop.ts`.
   - Maneja el reloj (RAF o ticks periódicos), llamadas TTS con `speak()`, y persistencia de telemetría de finalización con `recordGameActivity`.
3. **Puntuación y combos unificados**:
   - El módulo `lib/games/shared/scoring.ts` define la progresión estándar de puntuación (`applyHit`, `applyMiss`, `comboMultiplier`).
   - El multiplicador de combo arranca en 1×, sube a 2× con racha ≥ 5 y a 3× con racha ≥ 10. Un fallo reinicia la racha sin restar puntos por debajo de cero.
4. **Offline-first y cero cuota de IA**:
   - Todo el contenido de juego se empaqueta estáticamente en `public/games/<juego>/*.json` o catálogos en `lib/`.
   - Ningún juego realiza consultas a Supabase durante la partida ni invoca rutas de Gemini (`/api/gemini/*`).
   - La síntesis de voz utiliza `speak()` vía Web Speech API; su disponibilidad sin conexión depende de las voces instaladas en el navegador.
5. **Componentes visuales y contrato de tokens**:
   - Toda la interfaz consume tokens semánticos del sistema y `<PastelCard tone="...">`.
   - Componentes estándar para inicio (`GameIntroPanel`), barra de sesión (`GameSessionBar`), retroalimentación inmediata (`GameRoundFeedback`), resumen de fin de partida (`GameResultsPanel`) y repaso de errores (`GameReviewList`).
   - Ningún archivo supera las 250 líneas de código (`CLAUDE.md`).
6. **Telemetría no intrusiva**:
   - Al finalizar la partida, si el usuario está autenticado y no es invitado, cada uno de los siete juegos registra una sesión en `activity_sessions` por `recordGameActivity`.
   - Los juegos entregan `{ hits, misses, slug }`; el helper construye resultados resumidos para la actividad. Estas filas usan `exerciseTypeId: null`: no son respuestas individuales de `answer_history` ni crean por sí solas progreso SRS.
   - El `source` está tipado en `GameActivitySource` (`lib/progress/activity-types.ts`).

---

## 2. Catálogo de juegos (7 juegos disponibles)

| ID | Título | Habilidad (`skill`) | Mecánica | Fuente de datos | Ruta |
|---|---|---|---|---|---|
| `word-search` | Sopa de letras | `vocabulary` | Encontrar palabras en rejilla con pistas ortográficas y fonemas | Diccionarios locales, Core 1000 y Word Bank | `/practice/games` |
| `word-rain` | Lluvia de palabras | `vocabulary` | Mecanografía contra el suelo para retener vocabulario | `loadWordRainWords` (Core 1000) | `/practice/word-rain` |
| `phoneme-invaders` | Phoneme Invaders | `listening` | Arcade de discriminación auditiva de pares mínimos con naves | Export local de `minimal_pairs` en `public/games/phoneme-invaders/pairs.json` | `/practice/phoneme-invaders` |
| `weak-form-catcher` | Weak Form Catcher | `listening` | Oído de habla rápida: escribir la forma completa de frases reducidas | `public/games/weak-forms/phrases-001.json` | `/practice/weak-form-catcher` |
| `chunk-duel` | Chunk Duel | `grammar` | Ordenar piezas de colocaciones léxicas antes que el fantasma | `LEARNING_CHUNKS` (`lib/chunk-of-day/catalog.ts`) | `/practice/chunk-duel` |
| `false-friends-swipe` | ¿Trampa? Falsos Amigos | `vocabulary` | Decisión rápida (Verdad / Trampa) y ronda de rescate | `public/false-friends/*.json` | `/practice/false-friends-swipe` |
| `memory-match` | Memory Match | `vocabulary` | Emparejar cartas por significado, audio o transcripción IPA | Core 1000 / Mis palabras | `/practice/memory-match` |

---

## 3. Estructura de archivos

```text
lib/games/
├── shared/
│   ├── scoring.ts              # applyHit, applyMiss, comboMultiplier
│   └── __tests__/scoring.test.ts
├── phoneme-invaders/
│   ├── engine.ts               # invadersReducer, spawn, tick, shoot
│   ├── schema.ts               # Zod schema MinimalPairItem
│   ├── format.ts               # formateo IPA de contrastes
│   └── __tests__/engine.test.ts
├── weak-form-catcher/
│   ├── engine.ts               # weakFormReducer, submit, hints, rules
│   ├── schema.ts               # Zod schema WeakFormPhraseItem
│   └── __tests__/engine.test.ts
├── chunk-duel/
│   ├── engine.ts               # duelReducer, round progression
│   ├── schema.ts               # Zod schema ChunkDuelItem
│   ├── tokenizer.ts            # división limpia de tokens y contracciones
│   └── __tests__/engine.test.ts
├── false-friends-swipe/
│   ├── engine.ts               # swipeReducer, rescue round
│   ├── deck-builder.ts         # mezcla 60/40 de trampas y verdades
│   ├── schema.ts               # Zod schema SwipeCard
│   └── __tests__/engine.test.ts
└── memory-match/
    ├── engine.ts               # memoryReducer, flip, match resolution
    ├── schema.ts               # Zod schema MemoryWordItem
    └── __tests__/engine.test.ts

hooks/games/
├── usePhonemeInvadersLoop.ts
├── useWeakFormCatcherLoop.ts
├── useChunkDuelLoop.ts
├── useFalseFriendsSwipeLoop.ts
└── useMemoryMatchLoop.ts

components/practice/games/shared/
├── types.ts                    # GameIntroCopy, GameRule, GameStat
├── game-intro-copy.ts          # Textos y reglas estáticas de cada juego
├── GameIntroPanel.tsx          # Panel unificado de bienvenida con reglas
├── GameSessionBar.tsx          # Barra superior de puntos, racha y escudos
├── GameRoundFeedback.tsx       # Alertas visuales de acierto / fallo
├── GameResultsPanel.tsx        # Resumen final, estadísticas y botones de acción
├── GameReviewList.tsx          # Lista estructurada de errores cometidos
└── GameBackLink.tsx            # Enlace de retorno a /practice/games
```

---

## 4. Registro y Hub

- **`lib/practice/practice-games.ts`**: Contiene la lista inmutable `PRACTICE_GAMES` y `UPCOMING_GAMES` (`word-chain`). Cada juego define `id`, `title`, `englishTitle`, `description`, `bannerDescription`, `kicker`, `href`, `modeId`, `skill` y `tone`.
- **`lib/practice/practice-modes.ts`**: Registra los identificadores de modo para telemetría y navegación.
- **Hub (`components/practice/games/PracticeGamesHubClient.tsx`, `GamesSidebar.tsx`)**: Cuando hay ≥ 5 juegos, la barra lateral y las secciones del hub agrupan los juegos por habilidad: **Oído**, **Chunks y gramática** y **Vocabulario**.

### Resultados reales y SRS (Plan 054)

`recordGameActivity` acepta el resultado agregado `{ hits, misses, slug }` y
genera una fila resumida por acierto o fallo para la sesión. Los siete juegos
conectan sus contadores; Word Search reporta todas las palabras del tablero como
aciertos al completar la partida. Progreso muestra esos aciertos y fallos en
`activity_sessions`; no se crean observaciones `answer_history` ni se prueba
dominio general.

Phoneme Invaders tiene además una integración específica: conserva el contraste
de cada acierto y fallo y, al cerrar una partida autenticada, envía esos
resultados a `finishAttributedContrastSessions`. Así el SRS canónico de
contrastes recibe el resultado real de cada par; la sesión general de juego y
la evidencia especializada siguen siendo dos registros distintos.

### Contenido y guardado

- `scripts/export-minimal-pairs.ts` genera el asset local de Phoneme Invaders
  desde la tabla `minimal_pairs`; el juego no consulta Supabase para cargar el
  contenido de cada partida. Los fallos de carga de assets se registran con el
  juego y la ruta del archivo para facilitar el diagnóstico de despliegues.
- Word Rain diferencia los duplicados de los fallos reales al guardar una
  palabra en el banco. Si falla el guardado, la interfaz muestra el estado y
  permite reintentarlo; no presenta la palabra como guardada antes de confirmar
  la escritura.
