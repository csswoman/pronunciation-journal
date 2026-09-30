# Plan 052: Ampliar /practice/games con 5 juegos (oído, chunks y vocabulario)

## Estado y base
- Estado: DONE. Fases 0–6 completadas con tests de motor, enrutado y registro en el hub.
- Prioridad: P2 (producto). Esfuerzo total: L (~6–8 días de una persona). Riesgo: bajo–medio.
- Base inspeccionada: `84ad3b64`, 2026-09-27, D:/proyectos/english-journal (rama dev, con cambios sin commit en word-search).
- Dependencias: ninguna bloqueante. Fase 0 antes que cualquier juego. Coordinar `components/practice/games/*` con quien esté tocando word-search.
- Fuente: sesión 2026-09-27 — el usuario tiene 2 juegos (Sopa de letras, Lluvia de palabras) y pidió ideas desarrolladas.

## Problema y evidencia
- `lib/practice/practice-games.ts:23` solo registra `word-search` y `word-rain`: ambos entrenan **ortografía y vocabulario**. Ningún juego entrena el oído, los chunks ni el connected speech, que son las carencias típicas de hispanohablantes.
- `UPCOMING_GAMES` (`practice-games.ts:44`) anuncia Word Chain, Chunk Duel y Phoneme Invaders sin implementación.
- `components/practice/games/GameBannerCard.tsx:34` decide el copy con `isWordSearch` → viola la regla «muchas variantes → registry». Con 7 juegos esto se vuelve una cadena de `if`.
- `lib/progress/game-activity.ts:5` limita `GameActivitySource` a 3 valores; `ACTIVITY_SOURCE_LABELS` (`activity-types.ts:27`) no conoce juegos nuevos. `activity_sessions.source` es `text` libre (`supabase/migrations/20260616130000_activity_sessions.sql:6`) → **no hace falta migración**.
- Contenido ya disponible y reutilizable:
  - Pares mínimos: tabla Supabase `minimal_pairs` (`lib/phoneme-practice/queries.ts:125`). **No está en Dexie** → hay que empaquetarlos para offline.
  - Weak forms: `WEAK_FORM_WHITELIST` (`lib/essential-words/weak-forms.ts:5`) + 10 frases `weak-forms` en `lib/pronunciation/connected-speech-data.ts` (25 frases en total).
  - Chunks: 354 entradas en `lib/chunk-of-day/data.ts` (`ChunkItem`: `chunk`, `meaning`, `example`, `category`).
  - Falsos amigos: banco validado con Zod en `public/false-friends/pairs-00{1..4}.json`, cargador `lib/false-friends/data.ts` (`loadAllFalseFriends`, `filterByLevel`, `rotateByDay`).
  - Vocabulario: `loadWordRainWords` (`lib/exercises/word-rain/word-loader.ts:111`) y `applyFlashcardRating` (`lib/word-bank/srs-queries.ts:50`).
  - TTS: `speak()` en `lib/phoneme-practice/tts.ts:22` (Web Speech, funciona offline con voces locales).
  - Calificación tolerante: `matchAnswer` + `expandContractions` (`lib/exercises/answer-match.ts`).

Resultado esperado: 5 juegos jugables en `/practice/games`, todos **sin Gemini y funcionales offline**, cada uno registra actividad con su propio `source`, y el hub se alimenta solo del registry.

## Preflight obligatorio
1. Leer CLAUDE.md, ENGINEERING_STANDARDS.md, docs/design-system/RULES.md y este plan completo.
2. `git status --short` y `git diff 84ad3b64..HEAD -- lib/practice/practice-games.ts lib/progress/game-activity.ts lib/progress/activity-types.ts components/practice/games/`. Si hay drift, revalidar antes de editar.
3. Trabajar en dev. No commit, push ni despliegue sin instrucción. No revertir el trabajo de word-search en curso.
4. Baseline: `pnpm test -- components/practice/games lib/progress/__tests__/game-activity.test.ts` en verde antes de empezar.
5. Cada juego se ejecuta como **entrega independiente**: antes de cada fase, el ejecutor escribe su plan TDD detallado (superpowers:writing-plans) usando el contrato de esa fase como spec.

## Alcance
Permitido:
- `lib/practice/practice-games.ts`, `lib/practice/practice-modes.ts`, `lib/learning-loop/content-manifest.ts`
- `lib/progress/game-activity.ts`, `lib/progress/activity-types.ts`
- `components/practice/games/*` (solo para quitar condicionales y leer del registry)
- Nuevos: `lib/games/<juego>/`, `components/practice/<juego>/`, `app/(authenticated)/practice/<juego>/page.tsx`, `public/games/<juego>/*.json`, `scripts/export-minimal-pairs.ts`
- Tests junto al código en `__tests__/`.

Fuera de alcance: Word Chain (queda en `UPCOMING_GAMES`), multijugador, leaderboards, cualquier llamada a Gemini, tablas Supabase nuevas, cambios al motor SRS, rediseño del hub.

## Reglas comunes a los 5 juegos
Todas las fases deben cumplirlas; se verifican en el cierre de cada una.

| Regla | Cómo |
|---|---|
| Lógica fuera de componentes | Motor puro en `lib/games/<juego>/engine.ts` (estado → acción → estado). Sin React, sin timers. 100 % testeable. |
| Timers | Un hook `hooks/games/use<Juego>Loop.ts` orquesta `requestAnimationFrame`/`setTimeout` y llama al motor. |
| Página | `app/.../page.tsx` solo compone: `<PageLayout archetype="catalog"><XSession /></PageLayout>` (patrón de `practice/word-rain/page.tsx`). |
| Componentes | ≤250 líneas, ≤8 props, bloque «Planned structure» al inicio. |
| Offline | Contenido en `public/games/**` o `lib/**` estático; TTS con `speak()`. Sin fetch a Supabase durante la partida. |
| Actividad | Al terminar: `recordGameActivity(userId, '<source>', ms, gameId)`. Invitado (sin userId) → no registrar. |
| Estado | Partida = `useReducer` local. Nada en Zustand ni Dexie salvo lo indicado. |
| Estilos | Tokens; color de dominio: pronunciación → `--c-pronunciacion`, vocabulario → el token de vocabulario existente. Sin `oklch()` literal. |
| Accesibilidad | Todo jugable con teclado; `prefers-reduced-motion` → velocidad constante sin animación de caída; `aria-live="polite"` para acierto/fallo. |
| Resultados | Pantalla final con: aciertos, precisión, racha máxima, y **lista de fallos con la respuesta correcta** (lo que convierte el juego en aprendizaje). |

## Fases

### Fase 0 — Infraestructura común (≈0,5 día)
Objetivo: añadir un juego = añadir una entrada al registry.

1. Extender `PracticeGame` en `practice-games.ts` con `skill: 'vocabulary' | 'listening' | 'pronunciation' | 'grammar'`, `bannerDescription: string` e `illustration` (clave existente de ilustraciones). Mover el copy de `GameBannerCard.tsx:34` al registry y borrar `isWordSearch`.
2. Nuevo tipo `GameActivitySource` en `activity-types.ts`: añadir `'phoneme_invaders' | 'weak_form_catcher' | 'chunk_duel' | 'memory_match' | 'false_friends_swipe'` a `ActivitySource` y sus etiquetas en `ACTIVITY_SOURCE_LABELS`.
3. `recordGameActivity` recibe `skillTags` desde el registry en vez de fijar `['vocabulary']` (los juegos de oído cuentan como `listening`/`pronunciation`).
4. `content-manifest.ts:37`: mapear cada nuevo modo a `['games']`.
5. Helper puro compartido `lib/games/shared/scoring.ts`: `applyHit(state)`, `applyMiss(state)`, `comboMultiplier(streak)` (1× → 2× a los 5 → 3× a los 10). Lo usan los 5 juegos.

Tests:
- `practice-games.test.ts`: todo juego tiene `href` único, `modeId` presente en `practice-modes`, `skill` válido.
- `game-activity.test.ts`: `skillTags` del registry llegan a `recordActivitySession`.
- `scoring.test.ts`: racha 0/4/5/10 → multiplicador 1/1/2/3; fallo resetea racha y no baja de 0 puntos.

Verificación: `pnpm test -- lib/practice lib/progress/__tests__/game-activity.test.ts lib/games/shared` exit 0; `pnpm type-check`; el hub renderiza igual que antes.

---

### Fase 1 — Phoneme Invaders (≈1,5 días) · skill: listening/pronunciation
**Qué entrena:** discriminar sonidos que el español fusiona (/iː/–/ɪ/ ship/sheep, /æ/–/ʌ/ cat/cut, /b/–/v/, /s/–/z/, /ʃ/–/tʃ/).

**Mecánica**
- Bajan naves en 2–4 carriles; cada nave lleva una palabra de un mismo par mínimo (p. ej. `ship` y `sheep`).
- Suena por TTS una de ellas. El jugador dispara a la correcta (clic, o teclas `1`–`4` por carril).
- Acierto: explota + combo. Fallo o nave que llega abajo: pierde 1 de 3 escudos.
- Tras un fallo se muestra 1,5 s: «Sonó **sheep** /iː/ — tú elegiste ship /ɪ/» con botón 🔊 para compararlas.
- Oleadas: cada 10 aciertos aumenta velocidad y número de carriles (2 → 3 → 4). Botón «Repetir audio» cuesta 0 puntos pero rompe el combo.

**Datos (offline)**
- Nuevo `scripts/export-minimal-pairs.ts`: exporta `minimal_pairs` a `public/games/phoneme-invaders/pairs.json` con `{ wordA, wordB, ipaA, ipaB, contrast: "iː|ɪ" }`. Se valida con Zod (`lib/games/phoneme-invaders/schema.ts`), igual que `lib/false-friends/schema.ts`.
- Selección: si el usuario tiene progreso de contrastes (`getAllContrastProgress`, leído **antes** de la partida y opcional), priorizar sus 3 contrastes más débiles; si no, mezcla por dificultad. Sin red → mezcla.

**Contrato del motor** (`lib/games/phoneme-invaders/engine.ts`)
```ts
type Ship = { id: string; lane: number; word: string; ipa: string; y: number }
type InvadersState = { ships: Ship[]; target: string | null; shields: number; wave: number; streak: number; score: number; misses: MissRecord[] }
type InvadersAction =
  | { type: 'spawn'; pair: MinimalPairItem; targetSide: 'a' | 'b'; lanes: number[] }
  | { type: 'tick'; dy: number }
  | { type: 'shoot'; shipId: string }
function invadersReducer(s: InvadersState, a: InvadersAction): InvadersState
```
Tests clave: disparar la nave objetivo suma y limpia la oleada; disparar la otra resta escudo y añade `MissRecord{heard, chosen}`; nave objetivo que pasa `y ≥ 100` resta escudo; 0 escudos → `status: 'game_over'`; wave sube cada 10 aciertos.

**Componentes:** `PhonemeInvadersSession`, `InvadersArena`, `InvaderShip`, `InvadersHud`, `InvadersMissFlash`, `InvadersResults` (resultados agrupados por contraste: «/iː/–/ɪ/: 6/9»).

---

### Fase 2 — Weak Form Catcher (≈1 día + curación de contenido) · skill: listening
**Qué entrena:** entender inglés rápido real («whaddya», «gonna», «kinda», /tə/ en vez de /tuː/).

**Mecánica**
- Se reproduce una frase a velocidad natural (TTS rate 1.1). Visualmente: la transcripción reducida («whaddya want?») cae lentamente.
- El jugador escribe la **forma completa** («what do you want») antes de que toque el suelo.
- Calificación con `matchAnswer` + `expandContractions` → «what do you want», «What d'you want?» y errores de tecleo de 1 letra se aceptan.
- 2 ayudas por partida: «🐢 Lento» (repite a rate 0.7) y «Ver primera palabra».
- Tras cada frase: tarjeta de 2 s con la regla (`explanationEs`), p. ej. «*do you* → /dʒə/ cuando va tras *what*».

**Datos**
- Nuevo banco `public/games/weak-forms/phrases-001.json` (~60 frases), esquema:
  `{ id, reduced: "whaddya want", full: "what do you want", accept?: string[], ipa, ruleEs, cefr }`.
- Semilla: las 10 frases `category: "weak-forms"` de `connected-speech-data.ts` + 50 nuevas escritas a mano (gonna, wanna, gotta, lemme, dunno, kinda, "cup of tea" /kʌpə/, "fish and chips" /ən/…).
- Validador (test): cada palabra reducida debe estar en `WEAK_FORM_WHITELIST` **o** en una lista cerrada de reducciones coloquiales (`gonna|wanna|gotta|lemme|dunno|kinda|sorta|whaddya|didja|gimme`). Esto impide inventar reducciones.
- Contenido redactado por una persona, no por Gemini. Revisar pronunciación GA (ver memoria de migración GA).

**Contrato del motor**: `weakFormReducer` con acciones `start`, `tick`, `submit(text)`, `useHint(kind)`. Tests: respuesta con contracción aceptada; respuesta con la forma reducida («gonna») **rechazada** con mensaje «Escribe la forma completa»; tiempo agotado = fallo con la respuesta correcta en `misses`; límite de 2 ayudas.

**Componentes:** `WeakFormSession`, `WeakFormStage` (frase cayendo), `WeakFormInput`, `WeakFormRuleCard`, `WeakFormResults`.

---

### Fase 3 — Chunk Duel (≈1 día) · skill: grammar/vocabulary
**Qué entrena:** producir bloques frecuentes completos en el orden correcto (colocaciones y estructuras fijas).

**Mecánica**
- Aparece el significado en español («¿Cómo te va?») y los bloques del chunk desordenados + 1–2 distractores: `[how's] [it] [going] [are] [?]`.
- El jugador toca los bloques en orden (o los teclea: el primer bloque que empieza con las letras escritas se selecciona).
- Duelo contra un «rival fantasma»: una barra que se llena a velocidad fija según nivel. Si terminas antes, ganas la ronda. 10 rondas por partida.
- Acierto → suena el chunk por TTS y se muestra el `example` en contexto.
- Error → el bloque tiembla, −1 s; no se pierde la ronda, se pierde el bonus de velocidad.

**Datos**: `LEARNING_CHUNKS` de `lib/chunk-of-day/catalog.ts` (354, ya en el bundle → offline). Filtrar chunks de 3–7 tokens. Distractores: tokens de otros chunks de la misma `category`, nunca un token que haga válida otra respuesta.

**Contrato puro** (`lib/games/chunk-duel/`)
- `tokenizeChunk("Hey, how's it going?") → ["Hey,", "how's", "it", "going?"]` (puntuación pegada, contracciones como un bloque).
- `buildRound(chunk, pool, rng) → { tiles, solution }` determinista con `rng` inyectado.
- `duelReducer` con `pick(tileId)`, `tick(ms)`, `nextRound`.
Tests: tokenización de contracciones y signos; los distractores no están en la solución; `pick` fuera de orden no avanza; ganar ronda si `solved` antes de que el fantasma llegue a 100 %.

**Componentes:** `ChunkDuelSession`, `ChunkDuelPrompt`, `ChunkTileTray`, `ChunkGhostBar`, `ChunkDuelResults` (lista de chunks falladas con significado y ejemplo; botón «Estudiar en Chunks»).

---

### Fase 4 — Memory Match (≈0,5–1 día) · skill: vocabulary
**Qué entrena:** recuperación de significado y reconocimiento auditivo; el más relajado de los 5 (sin tiempo límite obligatorio).

**Mecánica**
- Cuadrícula 4×3 (6 parejas) → 4×4 (8) → 5×4 (10) según nivel.
- Tres modos elegibles en el setup: **Palabra ↔ Significado**, **Audio ↔ Palabra** (la carta de audio muestra 🔊 y suena al girarla), **Palabra ↔ IPA** (avanzado).
- Al girar la segunda carta: si coinciden se quedan boca arriba; si no, se voltean tras 900 ms.
- Puntuación por intentos (estrellas: ≤ parejas+2 → ★★★). Cronómetro visible solo como dato.

**Datos**: `loadWordRainWords` (Core 1000, por nivel CEFR, offline) y opción «Mis palabras» desde el word bank en Dexie (misma fuente que el panel «Mis palabras» de word-search). Palabras sin `meaningEs` se excluyen del modo Significado.

**SRS**: solo en «Mis palabras», al terminar: pareja encontrada al primer intento → `applyFlashcardRating(..., 'good')`; con ≥2 fallos → `'hard'`. Nunca `'again'` (un juego de memoria no prueba olvido). Llamada vía el mismo camino que word-search (`recordWordSearchRepetition` en `lib/word-bank/domain-queries.ts:29` como referencia), encolada si offline.

**Contrato del motor**: `memoryReducer` con `flip(cardId)`, `resolve()`. Tests: no se puede girar una tercera carta mientras hay 2 abiertas; pareja coincidente queda `matched`; `resolve` cierra no coincidentes; `ratingsFor(state)` devuelve good/hard según intentos por pareja.

**Componentes:** `MemoryMatchSession`, `MemoryMatchSetup`, `MemoryBoard`, `MemoryCard`, `MemoryResults`.

---

### Fase 5 — Falsos Amigos «¿Trampa?» (≈1 día) · skill: vocabulary
**Qué entrena:** desactivar las traducciones falsas más dañinas para hispanohablantes (embarrassed, actually, sensible, carpet, assist…).

**Mecánica**
- Tarjeta: «**actually** = actualmente». El jugador desliza → (verdad) o ← (trampa); teclado ←/→. 20 tarjetas por partida, 5 s por tarjeta, velocidad sube cada 5.
- Mezcla ~60 % trampas y ~40 % traducciones correctas (actually = en realidad), para que no se pueda responder siempre «trampa».
- Tras cada respuesta, 1 línea: «*actually* = en realidad. *Actualmente* = currently».
- Ronda final «Rescate»: las 3 tarjetas falladas vuelven como hueco del banco existente (`prompt.sentence` con `___` y `options`).

**Datos**: banco existente `public/false-friends/*.json` vía `loadAllFalseFriends` + `filterByLevel`. Cada `FalseFriend` (`lib/false-friends/types.ts`) da dos tarjetas posibles: «verdad» = `word` + `actualMeaning` (actually = en realidad) y «trampa» = `word` + `looksLike` (actually = actualmente). La línea de explicación usa `correctWord` (actualmente → currently).

**Contrato puro**: `buildSwipeDeck(entries, rng, { size: 20, trapRatio: 0.6 }) → SwipeCard[]` y `swipeReducer` con `answer('true'|'trap')`, `timeout`. Tests: proporción de trampas ±1; ninguna palabra repetida en el mazo; timeout cuenta como fallo; los fallos alimentan la ronda de rescate con su `prompt`.

**Componentes:** `FalseFriendsSwipeSession`, `SwipeCardStack`, `SwipeCard` (gesto con pointer events + teclado), `SwipeVerdictLine`, `SwipeRescueRound`, `SwipeResults`.

---

### Fase 6 — Registro en el hub y cierre (≈0,5 día)
1. Añadir los 5 juegos a `PRACTICE_GAMES` con `href`, `modeId`, `skill`, `bannerDescription`. Quitar `chunk-duel` y `phoneme-invaders` de `UPCOMING_GAMES`; dejar `word-chain`.
2. Añadir los 5 modos a `practice-modes.ts` (patrón de la entrada `word-search`, línea 86).
3. Hub (`GamesSection.tsx`, `GamesSidebar.tsx`): agrupar por `skill` con un encabezado por grupo («Oído», «Vocabulario», «Chunks») cuando haya ≥5 juegos.
4. Actualizar `docs/README.md` con enlace a `docs/architecture/games.md` (contrato: motor puro + hook de loop + registry).

## Orden recomendado
**0 → 1 → 2 → 3 → 5 → 4 → 6.**
Oído primero (mayor impacto pedagógico, ningún juego actual lo cubre). Memory Match al final porque es el de menor valor nuevo. La fase 6 puede hacerse de forma incremental: registrar cada juego al terminar su fase.

## Verificación por fase
- `pnpm test -- lib/games/<juego> components/practice/<juego>` exit 0.
- `pnpm type-check`, `pnpm lint`, `npm run lint:design` exit 0.
- Navegador: partida completa en `/practice/<juego>` con DevTools en **Offline** después de la primera carga; teclado solo; `prefers-reduced-motion` emulado.
- Comprobar en Supabase (o en el outbox local) una fila `activity_sessions` con el `source` nuevo al terminar como usuario logueado.
- Ningún archivo >250 líneas; ningún `fetch` a Supabase ni `/api/gemini` en `lib/games/**` (`git grep -n "supabase\|/api/gemini" lib/games` vacío).

## Riesgos y matices
- **Voces TTS**: la calidad de /iː/ vs /ɪ/ depende de la voz del sistema. Si `getEnglishVoices()` está vacío, Phoneme Invaders y Weak Form Catcher muestran «Tu navegador no tiene voz en inglés» en el setup en vez de iniciar. Evaluar después usar el audio Kokoro de plan 038 si llega.
- **Pares mínimos offline**: el JSON exportado es una instantánea; re-ejecutar `scripts/export-minimal-pairs.ts` cuando cambie la tabla. Revisar la migración GA antes de exportar (memoria «Content Audit / GA Migration»).
- **Contenido de weak forms**: es la única pieza que requiere redacción nueva (~50 frases). Si no hay tiempo, lanzar con las 10 existentes + 20 nuevas y marcarlo como beta.
- **Falsos amigos `partial-overlap`** (assist/asistir): a veces la «trampa» es correcta. Excluir `kind: 'partial-overlap'` del modo swipe; solo usarlos en la ronda de rescate con frase.
- **Carga de juegos**: no añadir más de 5; 7 juegos en el hub ya requiere la agrupación de la fase 6.

## Descartado
- Word Chain: entretenido, pero encadenar por último sonido enseña poco frente a los 5 elegidos. Queda en «En camino».
- Juegos con Gemini (generar frases al vuelo): gastan cuota del free tier (plan 035) y rompen offline.
- Juegos de hablar (reconocimiento de voz): ya cubiertos por Connected Speech y Sound Lab; aquí el foco es ritmo rápido y bajo coste.

## Cierre
Estados por fase: TODO / IN PROGRESS / DONE / BLOCKED con evidencia (salida de tests + captura de partida offline). Actualizar la fila de este plan en `plans/README.md`.
