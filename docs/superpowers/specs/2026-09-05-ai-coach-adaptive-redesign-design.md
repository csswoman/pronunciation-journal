# AI Coach — corrección implícita, starters adaptativos y guardado unificado

**Fecha:** 2026-09-05
**Estado:** Diseño aprobado, pendiente de plan de implementación
**Rama:** dev

## Problema

El AI Coach hoy es "una IA que habla en inglés". Cuatro problemas concretos:

1. **La corrección es un modo, no un hábito.** Solo el starter `sentenceCorrection` pide
   corregir. En los otros tres el usuario puede escribir mal durante toda la conversación
   sin recibir feedback. `parseCorrection` intenta rescatar correcciones del texto libre
   con regex (`~~x~~ → **y**`), pero `BASE_TUTOR_PROMPT` nunca pide ese formato, así que
   falla a menudo.
2. **Las conversaciones son idénticas.** `AI_COACH_EMPTY_STATE_PROMPTS` son 8 constantes
   `as const`. Mismo texto → misma apertura, siempre.
3. **Los prompts ignoran el estado del alumno.** Existe `compactState()` con nivel CEFR,
   gramática débil, sonidos débiles y dominios de interés, pero solo se inyecta en el
   system prompt. Los starters son ciegos. `personalizedPractice` incluso *pregunta* al
   usuario su objetivo cuando la app ya lo sabe.
4. **Los intereses declarados del perfil no llegan al coach.** `getUserInterests` ya
   alimenta `generate-reader`, `journal-correct` y el generador de oraciones. El coach es
   el único consumidor que falta.

Además hay un silo: lo que el usuario guarda desde el chat va a `db.aiWords`
(`lib/db/ai`), una tabla Dexie **sin sync a Supabase e invisible en `/tracking`**.

## Decisiones tomadas

| Decisión | Elección | Razón |
| - | - | - |
| Intensidad de corrección | Solo cuando hay algo que decir | Silencio = "estuvo bien". Felicitar cada turno diluye la señal. |
| Cierre de sesión | Botón "Terminar" manual | El usuario decide; no gasta cuota Gemini sin querer. |
| Eje de los starters | Repasar / Aprender / Tu mundo + libre | Cubre las tres intenciones sin solaparse. |
| Guardado | Chips propuestos por la IA + selección manual | Lo rápido sin fricción, lo específico bajo control. |
| Ubicación en Guardadas | Filtro "Del coach", misma tienda | Hereda el SRS y el repaso existentes. |
| Transporte del feedback | Tool call `annotate_turn` | Datos tipados, una sola llamada Gemini, reutiliza el registry. |
| `db.aiWords` | Descartar, sin migrar | Silo local de pruebas; migrarlo no compensa. |

### Alternativas descartadas

- **Bloque JSON al final del texto** (` ```coach-meta {...}``` `): vuelve a ser parsing de
  strings y el bloque se ve a medio escribir durante el streaming.
- **Segunda pasada con flash-lite** para extraer anotaciones: duplica las llamadas a
  Gemini. La cuota ya es un problema real (existe `QuotaExhaustedCard`).
- **Sección visual propia "Coach"** dentro de Guardadas: quedaría fuera del SRS salvo
  duplicando el motor de repaso.

## Arquitectura

### 1. `annotate_turn` — canal estructurado de feedback

Nuevo tool de tipo *action* en `lib/ai-practice/tools/registry.ts`:

```ts
export type AnnotateTurnArgs = {
  correction?: {
    original: string;
    corrected: string;
    rule: string;
    kind: "error" | "unnatural";
  };
  saveables?: Array<{
    type: "word" | "phrase";
    text: string;
    meaning: string;    // en español
    example?: string;
    ipa?: string;
  }>;
};
```

El coach lo llama en el mismo turno que su prosa; el stream ya soporta partes de texto y
`functionCall` mezcladas (`state.parts` en `stream-processor.ts`). `correction` se omite
cuando no hay nada que decir.

`save_word` queda **deprecado** y absorbido por `saveables`. Hoy `stream-processor.ts:67`
lo conecta a `openSaveWordModal`, que escribe en el silo.

`TOOL_DECLARATIONS` se extrae a `lib/ai-practice/tools/declarations.ts` — `registry.ts`
está en 355 líneas y ESLint avisa a 300.

### 2. `lib/ai-practice/starters/` — registry de starters

Patrón registry + type guard, según `ENGINEERING_STANDARDS.md`:

```
starters/
  types.ts      → CoachStarter { id, kind, isAvailable(state), build(ctx) }
  registry.ts   → review | learn | world | free
  select.ts     → (state, interests, seed, recentIds) => CoachStarter[]  — puro
```

`select.ts` no depende de React ni Dexie: se testea directo.

### 3. `lib/ai-coach/saveables/persist.ts` — puente a Guardadas

Una función `persistSaveable(userId, saveable)` que enruta por tipo:

- `word` → `word_bank` vía las queries existentes, con `is_favorite` y `source: "ai_coach"`
- `phrase` → `saveTrackedItem({ kind: "phrase", payload: { source: "ai_coach", ... } })`

Sin tabla nueva y sin migración de RLS. `tracked_items` ya sincroniza por el outbox.

### Flujo de datos

```
ChatEmptyState ──selectStarters(state, interests)──> 4 botones
      │ click
      ▼
sendMessage(prompt oculto) ──> /api/gemini ──> buildSystemPrompt({...interests})
      ▼
stream ──┬── text parts ─────────> prosa
         └── annotate_turn ──────┬─> CorrectionCard (tipada)
                                 └─> SaveChips ──click──> persistSaveable()
                                                               │
                                                  word_bank / tracked_items
                                                               │
                                                       Guardadas [Del coach]
```

## Prompts

### `FEEDBACK DISCIPLINE` — añadido a `BASE_TUTOR_PROMPT`

```
FEEDBACK DISCIPLINE (applies to EVERY user turn, in every mode):
Before replying, scan the student's message for ONE thing worth flagging:
  1. A grammar or vocabulary error, OR
  2. Phrasing that is correct but a native speaker would not say.
If you find one, call annotate_turn with `correction` — ONE only, the most
useful one. Set kind:"error" or kind:"unnatural".
If the message is fine, DO NOT call annotate_turn with a correction and DO NOT
say "that's correct" or "good job" — just continue the conversation naturally.
Never let the correction take over the reply: your prose stays conversational
and moves the conversation forward. The card carries the correction.
Never correct the same rule twice in a row — if they repeat it, let it pass
once and raise it later.
```

### Saveables

```
When you use a word or expression the student likely does not know — or you
teach one on purpose — call annotate_turn with `saveables`. Max 2 per turn.
Give `meaning` in SPANISH (the student's language), and an `example` using the
word in the context you were just discussing, not a generic one.
Prefer vocabulary from the student's declared interest areas.
```

### Intereses — añadido al system prompt

```
The student's declared interests: {interests}.
Ground your examples, scenarios and vocabulary in these areas whenever it fits
naturally. Do NOT force every message into them, and do NOT announce that you
are using their interests.
```

Aplica a **todos** los modos, no solo al starter `world`.

### Los 4 starters como funciones

`AI_COACH_EMPTY_STATE_PROMPTS` se sustituye por builders en `lib/ai-prompts.ts`.

| Starter | Aparece cuando | Inyecta |
| - | - | - |
| `review` | `errorRecurrence` vencido o `weakTopics` con errorRate > 0.4 | El patrón, cuántas veces falló, cuándo |
| `learn` | siempre | `cefrEstimate`, `lastSessions` a excluir, ángulo por seed |
| `world` | hay `interests` o `domainProfile` | El interés elegido, palabras ya conocidas a evitar |
| `free` | siempre (rellena huecos) | Nada |

Prompt de `free` — cambia la filosofía, el usuario inicia:

```
The student picked "free conversation" — THEY choose the topic, not you.
Greet them in ONE short sentence and ask what they feel like talking about.
Do NOT propose a topic. Do NOT ask a warm-up question about their day.
Wait for them to set the direction, then follow it.
The FEEDBACK DISCIPLINE above still applies to every turn.
```

### Cómo se rompe el determinismo

Cuatro mecanismos, de mayor a menor peso:

1. **Rotación de intereses.** 12 opciones declaradas; `world` rota entre ellas por semilla.
2. **El estado del alumno.** `compactState()` varía por usuario y por día; se inyecta ahora
   también en el prompt del starter, no solo en el system prompt.
3. **Ángulo por semilla.** Cada builder tiene un pool de 5–6 ángulos; se elige uno
   excluyendo los 3 últimos usados.
4. **Anti-repetición explícita.** Se le pasa al modelo la lista de aperturas recientes con
   instrucción de no reusarlas.

El historial (`coachStarterHistory`, últimos 10) se persiste en **Dexie**, no en Zustand
— Zustand es solo UI efímera (`CLAUDE.md`).

## Intereses del perfil

Ya existe todo lo necesario:

- `INTEREST_OPTIONS` (`lib/users/interests.ts`): `technology, travel, work, food, music,
  films, books, sports, health, science, business, gaming`
- `getUserInterests(userId)` server-side (`lib/users/server-queries.ts`)
- `interestsClause()` (`lib/ai-prompts.ts:81`)
- `cacheUserInterests` / `getCachedUserInterests` en Dexie → funciona offline

En `app/api/gemini/route.ts`, que ya tiene `user.id`:

```ts
const [learningState, interests] = await Promise.all([
  fetchServerLearningState(user.id, accessToken),
  getUserInterests(user.id).catch(() => []),   // nunca bloquea el chat
]);
const systemPrompt = buildSystemPrompt(learningState, {
  lastTopic, voiceScored, missionId, interests,
});
```

`buildSystemPrompt` ya tiene 4 parámetros posicionales: **pasa a objeto de opciones** en
esta fase, antes de llegar a 5.

### Dos señales, un starter

| Señal | Qué es | Papel |
| - | - | - |
| `interests` (perfil) | Lo que el usuario **dice** que le interesa | Define el ámbito. Manda. |
| `domainProfile` (word_bank) | Lo que **realmente** estudia | Afina dentro del ámbito |

Si hay intereses declarados, `world` rota entre ellos y usa `domainProfile` para evitar
palabras ya dominadas. Sin intereses declarados, cae a `domainProfile`. Sin ninguno de los
dos, `world` no aparece y su hueco lo ocupa `free`.

## UI

Presupuesto: `AICoachPanel.tsx` está en 249 líneas y `AICoachPanelParts.tsx` en 246, ambos
al borde del límite de 250. Nada nuevo entra ahí.

### `ChatEmptyState` se descompone

```tsx
// Planned structure:
// <ChatEmptyState>
//   <CoachGreeting />      — orbe + saludo
//   <CoachStarterList />   — los 4 dinámicos, recibe CoachStarter[]
//   <CoachShortcutRail />  — los chips estáticos actuales
// </ChatEmptyState>
```

`ChatEmptyState` queda como composición pura (~50 líneas) y **no conoce el learning
state**: recibe `starters: CoachStarter[]` por props. Los resuelve `useCoachStarters()`,
que lee Dexie con `useLiveQuery` y llama a `selectStarters()`.

Cada starter muestra `title` + subtítulo con el dato que lo justifica ("Pasado simple ·
fallaste 3 veces"). Se reutiliza la fila actual: `layout-card-pad-compact`, icono en
cuadro de color, `ArrowUpRight`.

**Estados:**
- Cargando → los 4 starters estáticos actuales como esqueleto, sin subtítulo. Nunca vacío.
- Usuario nuevo sin datos → `learn` + `free` + los dos atajos estáticos. Nada que prometa
  repasos inexistentes.

### `SaveChips`

Hermano de `SuggestionChips` (44 líneas, mismo patrón de píldoras). Se pinta bajo la prosa
cuando `annotate_turn` trae `saveables`.

Guardado optimista al tocar: el chip pasa a `✓ Guardada` y se deshabilita. Sin modal. Si
falla (offline no cuenta: Dexie + outbox lo absorben), vuelve al estado inicial con
`· reintentar`, como `HomeWordOfDayCard`.

`SaveWordModal` sobrevive solo para la **selección manual** de texto, redirigido a
`persistSaveable`.

### Botón "Terminar"

Sale a `CoachSessionEndButton.tsx` (no cabe en `AICoachPanelParts`). Visible solo con ≥3
turnos de usuario.

Al pulsar envía un mensaje oculto pidiendo el resumen; el coach responde con
`render_session_summary` (tool de tipo *render*) que pinta `SessionSummaryCard` con tres
bloques — *Corregimos / Aprendiste / Repasar* — y un botón "Guardar todo".

El bloque "Mañana repasamos X" **se muestra pero no se persiste como plan programado** en
esta fase (ver Fuera de alcance).

### Guardadas — el filtro

Quinto chip **"Del coach"** en `TrackingToolbar` (125 líneas, hay margen). Los cuatro
actuales filtran por `TrackedKind`; este filtra por *origen*:

```ts
type TrackingFilter = "all" | TrackedKind | "ai_coach";
```

`TrackingCard` gana un badge `✦ coach` cuando el origen es `ai_coach`, reutilizando
`Badge`.

## Deudas que este trabajo paga

| Qué | Por qué ahora |
| - | - |
| `conversation-title.ts` mapea el **texto exacto** del prompt a un título (líneas 5-14) | Los prompts dinámicos rompen el mapa. Migrar a `starterId`. |
| `db.aiWords` es un silo sin sync | Dejarlo vivo duplica estado (prohibido por `CLAUDE.md`) |
| `TOOL_DECLARATIONS` dentro de `registry.ts` (355 líneas) | ESLint avisa a 300 |
| `parseCorrection` como vía principal | Pasa a fallback |
| `buildSystemPrompt` con 4 parámetros posicionales | El quinto lo hace ilegible |

## Fases

### Fase 1 — Corrección implícita + intereses
Sin dependencias. Entrega el núcleo del valor con los starters actuales sin tocar.

- Tool `annotate_turn` + declaración Gemini
- `TOOL_DECLARATIONS` → `tools/declarations.ts`
- `FEEDBACK DISCIPLINE` en `BASE_TUTOR_PROMPT`
- `buildSystemPrompt` a objeto de opciones, recibe `interests`
- `getUserInterests` en paralelo en `/api/gemini`
- `stream-processor` emite `correction` tipada; `CorrectionCard` la consume
- `parseCorrection` degradado a fallback

### Fase 2 — Guardado unificado
Depende de los `saveables` de la fase 1.

- `lib/ai-coach/saveables/persist.ts`
- `SaveChips` con guardado optimista
- Selección manual → `persistSaveable`
- Filtro "Del coach" + badge en `TrackingCard`
- **Borrado de `db.aiWords`** y de las funciones `saveAIWord`/`getAIWords`/`deleteAIWord`
  de `lib/db/ai`
- `useSavedWords` se reduce a estado de modal (`wordToSave`, abrir/cerrar) y delega el
  guardado en `persistSaveable`. Desaparecen `savedWords`, `loadSavedWords` y
  `deleteSavedWord`: esa lista ahora la sirve `/tracking`.

### Fase 3 — Starters dinámicos
Independiente de 1 y 2. La más grande.

- `lib/ai-practice/starters/` (types, registry, select)
- Builders de prompt reemplazando las constantes
- `useCoachStarters()` + tabla Dexie `coachStarterHistory`
- `ChatEmptyState` partido en tres
- `conversation-title.ts` migrado a `starterId` — **obligatorio aquí**

### Fase 4 — Cierre de sesión
Depende de 1 y 2.

- `CoachSessionEndButton` (≥3 turnos)
- Tool `render_session_summary` + `SessionSummaryCard`
- "Guardar todo" reutilizando `persistSaveable`

## Fuera de alcance

| Qué | Por qué |
| - | - |
| Planes con `dueAt` ("mañana repasamos X" persistido) | Arrastra scheduling, notificaciones y vista de agenda. El starter `review` se alimenta de `errorRecurrence`, que ya calcula scheduling. |
| Migrar `db.aiWords` | Decidido: se descarta. |
| Sección visual propia "Coach" en Guardadas | Quedaría fuera del SRS |
| Corrección de pronunciación en el chat | `VOICE_TURN_INSTRUCTION` ya lo acota |

## Riesgo principal

Que Gemini flash-lite no llame a `annotate_turn` de forma consistente **mientras también
escribe prosa**. Todo el diseño se apoya en ese supuesto.

**Mitigación:** la fase 1 empieza por un test de integración contra la cadena real de
modelos con ~10 turnos de ejemplo, antes de tocar UI. Si flash-lite falla, la respuesta es
subir ese caso a flash — no rediseñar. `parseCorrection` queda como segunda red.

## Pruebas

| Unidad | Qué se verifica |
| - | - |
| `selectStarters()` | Usuario nuevo, con errores, sin intereses, anti-repetición |
| Builders de prompt | Inyectan estado e intereses; excluyen aperturas recientes |
| `persistSaveable()` | word → word_bank, phrase → tracked_items, encola en outbox |
| `annotate_turn` en stream-processor | Correction tipada, saveables emitidos, args inválidos ignorados |
| `CoachStarterList` | Render con datos, estado de carga, usuario sin datos |
| `SaveChips` | Optimista, deshabilitado tras guardar, reintento en fallo |
| Integración Gemini | flash-lite llama a `annotate_turn` con prosa en el mismo turno |
| Filtro Guardadas | "Del coach" filtra por origen sobre tipos mezclados |

Modo offline debe seguir funcionando en todas las fases: los starters leen Dexie, el
guardado pasa por el outbox.
