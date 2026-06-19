# Reader de Comprehensible Input — Design

> Plan pedagógico [07](../../pedagogy-plans/07-comprehensible-input-reader.md). Depende del SRS cerrado en plan 01 (✅ hecho).
> Alcance: plan completo (5 tareas) incluyendo TTS bajo demanda y cache offline. Dos entradas: step en daily-plan + sección "Reading" en home.

## Problema y objetivo

No hay input de más de una oración (Comprehensible Input / Krashen i+1 ausente). El reader genera párrafos cortos i+1 que reciclan el vocabulario reciente del alumno (estado SRS `learning`/`review`), con comprensión ligera (1-2 preguntas). El reader es **input, no test**: nunca penaliza, y su señal no contamina el recall activo del Word Bank.

## Arquitectura general

```
Selección (online)           Persistencia            Consumo (offline OK)
──────────────────────       ───────────────────     ──────────────────────
selectReaderTargets()  ──►   reader_passages     ──► ReaderExercise
  (SRS learning/review)        (Supabase + RLS)        texto + TTS on-demand
       │                       espejo Dexie             + multiple_choice
       ▼                                                       │
/api/gemini/generate-reader                          recordReaderExposure()
  prompt i+1 (JSON, zod)                               → señal de exposición
```

Capas: `lib/practice/reader/` (selección, queries, exposición), `lib/ai-prompts.ts` (prompt), `app/api/gemini/generate-reader/route.ts` (generación), `components/practice/.../ReaderExercise.tsx` (UI), `lib/practice/daily-plan/async-step-builders.ts` (`buildReaderStep`), ruta `/practice/reader` (entrada home).

## Componentes

1. **`selectReaderTargets()`** — lee del SRS los ítems `learning`/`review` que vencen pronto (reusa `topic-srs-queries` + `orderFragmentsByDue`). Devuelve 5-8 targets; `null` si hay <3.
2. **Prompt + ruta `generate-reader`** — clonada del patrón `grade-production`: `requireUser` + `rateLimit` + `validateBody` (zod) + `FALLBACK_MODELS` (flash-lite→flash→latest), `responseMimeType: 'application/json'`. Párrafo 60-90 palabras, i+1, incrusta los targets, 1-2 preguntas MC. Respuesta validada con zod **+ refinement de palabras objetivo** (ver Data flow §refinement).
3. **`reader_passages`** — Supabase (RLS) + espejo Dexie para relectura offline.
4. **Tipo `reader`** — nuevo `ExerciseSlug 'reader'`, sin FK a `exercise_types` (como `multiple_choice`/`sentence_context`): **no escribe `answer_history`**, coherente con su naturaleza de input. Registro en taxonomy/design (sin condicionales en el renderer).
5. **`recordReaderExposure()`** — registra exposición pasiva en un campo separado del SM-2 de recall (ver Data flow §SM-2).

## Data flow (sesión diaria)

1. `buildReaderStep()` corre async en la composición del plan. Llama `selectReaderTargets()`; con <3 targets devuelve `null` (sin reader ese día).
2. Calcula `targetHash` (hash estable del conjunto ordenado de targets) y busca el passage más reciente en Dexie / Supabase por `(user_id, target_hash)`.
3. **Política de frescura — stale-while-revalidate.** Decisión cerrada:
   - **Sin cache + red:** genera síncrono, persiste, construye el step.
   - **Cache fresco (<7 días):** sirve directo (offline OK).
   - **Cache stale (≥7 días) + red:** sirve el stale **inmediato** y dispara regeneración en background (no bloquea la composición del plan). El step se construye con el stale; el passage nuevo queda listo para la próxima sesión. *Justificación: el reader nunca debe bloquear el plan por latencia de IA, y un párrafo de input 8 días viejo sigue siendo input válido.*
   - **Sin red y sin cache:** `null` (el step no aparece; el resto del plan sigue intacto).
4. La regeneración en background que falla **no produce error**: se conserva el stale y se reintenta la próxima sesión.

### Refinement de palabras objetivo (validación zod en la ruta)

Decisión cerrada: **matching por word-boundary sobre formas base, sin substring y sin stemmer en el route handler.**

- **Por qué no substring:** `includes()` da falsos positivos (`cat` ∈ `category`). Se usa `\b<target>\b` (regex word-boundary), case-insensitive.
- **Por qué no stemmer:** aceptar inflexiones es pedagógicamente correcto (Krashen), pero un lematizador real (p. ej. `wink`/`natural` + WordNet, o `snowball`) añade peso y datos al bundle del route handler para una ganancia marginal. En su lugar, **el contrato se desplaza al prompt**: el prompt instruye a la IA a incluir cada target en una **forma reconocible y, cuando sea natural, en su forma de citación (lemma)**. El refinement valida contra un set de variantes generadas determinísticamente por reglas morfológicas ligeras (sufijos regulares), no por stemming inverso.
- **Variantes aceptadas por target** (generación determinística, sin librería): forma exacta + plurales/3ª persona regulares (`+s`, `+es`, `y→ies`), pasado/participio regular (`+ed`, `+d`, `y→ied`, duplicación de consonante final como `stop→stopped`), gerundio (`+ing`, drop-`e`). Las formas irregulares no se generan: si el target es irregular y la IA usa una forma irregular, no matchea — aceptable, porque el prompt pide preferir la forma base.
- **Umbral:** ≥60% de los targets deben aparecer (≥1 variante cada uno). Bajo el umbral → se rechaza y se intenta el siguiente modelo de la fallback chain.

**Algoritmo del refinement (el test debe reflejarlo paso a paso):**
1. **Normalizar** el párrafo: `toLowerCase()`, NFC, colapsar whitespace.
2. **Expandir** cada target a su set de variantes por las reglas morfológicas anteriores (también lowercased).
3. **Tokenizar/match:** para cada target, `true` si **alguna** variante matchea `\bvariant\b` en el párrafo normalizado.
4. **Contar** targets con match.
5. **Umbral:** `matched / total >= 0.6` → válido; si no, rechazar.

### Interacción con SM-2 — exposición vs. recall activo

Decisión cerrada: **arquitectura (A) — el acierto en reader NO dispara grade SM-2; registra exposición en un campo separado.**

- **Por qué:** el MC tiene ~25% de acierto por azar (4 opciones). Si el reader tocara el mismo `interval/easeFactor/repetitions` que el Word Bank usa para programar repaso, la adivinanza empujaría el ítem hacia adelante sin recall real, contaminando la señal de mastery. El reader es input pasivo, no recall activo. *(A) sobre (B) porque incluso un grade "suave" en tabla separada implicaría reintroducir esa señal en el scheduler; (A) mantiene los dos números totalmente desacoplados.*
- **Esquema:** el estado de exposición vive **junto al SM-2 existente en Dexie `srsData`** (mismo registro keyed por el id namespaced del ítem — `c1k:`/`fragment:`/topic), en campos nuevos **que `updateSRS` no toca**:
  - `lastExposedAt: number` (epoch ms) — timestamp de la última exposición vía reader.
  - `exposureCount: number` — contador acumulado.
  No se crea tabla nueva en Supabase: la exposición es señal client-side, igual que el SM-2 de fragments/Core 1000 (offline-first).
- **Cómo lo combina el scheduler:** el scheduler de repaso **ignora** `lastExposedAt`/`exposureCount` al elegir qué repasar — el orden de vencimiento sigue saliendo solo de `interval/dueDate`. La exposición es metadato observable (analítica, futura UI "lo viste en una lectura"), nunca entra en el cálculo de `due`. *Esto preserva la naturaleza de input del reader: exposición y recall activo nunca se mezclan en el mismo número.*
- **Acierto vs. fallo:** ambos registran exposición (incrementan `exposureCount`, actualizan `lastExposedAt`). El fallo **no** penaliza el SM-2. No hay asimetría porque ninguno toca el recall.

## Manejo de errores

- **Generación IA falla** (toda la fallback chain): `buildReaderStep` captura y devuelve `null` (patrón `buildSentenceBuilderStep`). Nunca rompe la sesión.
- **JSON malformado / refinement bajo umbral:** se rechaza y se intenta el siguiente modelo; si todos fallan, `null`.
- **Regeneración background falla:** se conserva el stale, sin error visible (ver Data flow §3).
- **TTS no disponible offline:** botón "escuchar" deshabilitado con tooltip; el texto se lee igual. TTS **bajo demanda, nunca guardado** (hard rule CLAUDE.md).
- **Comprensión fallida:** sin penalización SM-2; solo registra exposición.

## Testing

- `select-targets.test.ts` — targets correctos por estado SRS; `null` con <3.
- **`refinement.test.ts`** — refleja el algoritmo paso a paso: rechaza substring (`cat` no matchea en `category`); acepta variantes regulares (`stop`→`stopped`/`stopping`, `city`→`cities`); rechaza párrafo bajo el 60%; no acepta irregulares no generadas.
- Ruta `generate-reader` — guards (auth/rate-limit), fallback de modelos, rechazo por refinement. Espejo de `grade-production`.
- `recordReaderExposure` — incrementa `exposureCount`/`lastExposedAt`; **no** muta `interval/easeFactor/repetitions` (assert sobre el registro `srsData`); acierto y fallo ambos registran exposición.
- `scheduler` — confirma que el orden de `due` es invariante ante `lastExposedAt`/`exposureCount`.
- `buildReaderStep` — `null` offline/sin targets; usa cache fresco; stale-while-revalidate sirve stale y no bloquea; regeneración fallida conserva stale.
- `ReaderExercise` — render párrafo + MC; botón TTS deshabilitado offline.

## Migración

Tabla `reader_passages` (Supabase, RLS `user_id = auth.uid()` en select/insert):

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK auth.users |
| `target_items` | text[] | targets reciclados |
| `target_hash` | text | hash estable del set ordenado — **columna en Supabase, no solo Dexie** |
| `topic` | text | concepto dominante |
| `passage` | text | párrafo 60-90 palabras |
| `questions` | jsonb | 1-2 preguntas MC |
| `level` | text | CEFR (i+1) |
| `created_at` | timestamptz | default now() |

- **`target_hash` en Supabase (no solo Dexie):** decisión cerrada — la query de cache busca el passage más reciente por conjunto de targets, y debe resolverse server-side para alimentar la entrada "Reading" de home (que puede no tener Dexie poblado). Justifica replicar el hash en ambos lados.
- **Índice `(user_id, created_at)`** sobre `reader_passages` — soporta la query de cache ("passage más reciente del usuario") y la futura paginación de la sección Reading.
- **Espejo Dexie `readerPassages`** — relectura offline; mismas columnas, keyed por `id`, con índice por `target_hash`.
- Estado de exposición SM-2: **sin migración Supabase** — campos `lastExposedAt`/`exposureCount` se añaden al tipo de `srsData` en Dexie (offline-first), no a una tabla nueva.
