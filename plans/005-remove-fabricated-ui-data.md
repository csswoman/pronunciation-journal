# Plan 005: Eliminar datos inventados que el usuario ve como reales

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente paso. Si ocurre algo de la sección "STOP conditions", detente y
> reporta; no improvises. Al terminar, actualiza la fila de este plan en
> `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- components/home/HomeImmersionCard.tsx components/journal/JournalPronunciationCard.tsx components/journal/JournalNotebookClient.tsx lib/immersion/external-log.ts components/progress/ActivityHistoryCard.tsx lib/home/queries.ts components/daily/DailyOverviewSummary.tsx components/daily/DailyChecklist.tsx lib/landing/content.ts components/practice/hub/PronunciationSection.tsx components/practice/hub/SoundQuizWidget.tsx components/practice/hub/ReferenceSection.tsx components/journal/NotebookPastGrid.tsx components/home/HomePageHeader.tsx`
> Si algún archivo cambió, compara los extractos de "Current state" con el
> código real antes de seguir; ante una discrepancia, es un STOP.

## Status

- **Priority**: P1
- **Effort**: M (nueve arreglos pequeños e independientes; ~medio día con tests)
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El contrato de producto (`docs/architecture/integrated-learning-loop.md`,
sección "Señales que no se deben confundir") exige que Progreso "interprete la
evidencia sin inventarla". Hoy hay nueve lugares donde la UI muestra números,
palabras o enlaces que no salen de ningún dato real: una racha de inmersión
fija de 4 días, cuatro palabras "guardadas" que el usuario nunca guardó, un
100% de precisión por ver Netflix, 90 segundos regalados por respuesta sin
tiempo, un denominador de 1000 palabras que no corresponde a ningún catálogo,
un badge "+2 XP" que no coincide con el XP otorgado, cifras de landing
infladas y cuatro enlaces que dan 404. La app está por publicarse y el
propietario no quiere que el usuario vea contenido falso. Este plan elimina
cada uno y deja un test que impide que vuelva.

## Current state

Convenciones del repo que aplican a todos los pasos:

- Tailwind v4 con tokens; nunca `style={{}}` salvo valores calculados.
- Sin llamadas Supabase fuera de `lib/*/queries.ts`.
- Componentes ≤250 líneas, `cn()` para clases condicionales.
- Tests: Vitest; los de componentes usan `// @vitest-environment jsdom` +
  Testing Library. Ejemplo de patrón: `components/home/__tests__/HomeImmersionCard.test.tsx`.

### A. Racha de inmersión inventada (`components/home/HomeImmersionCard.tsx:173-186`)

```tsx
{Array.from({ length: 7 }).map((_, idx) => (
  <span key={idx} className={cn("size-3 rounded-full transition-colors",
    idx < 4 ? "bg-mint" : "border border-dashed border-fg-muted/40 bg-transparent")} />
))}
...
<span className="font-sans text-caption font-medium text-fg-muted">4 días</span>
```

El componente no recibe props (`export default function HomeImmersionCard()`
en línea ~46) y solo lee `useAuthOptional()` y `useState`. Se renderiza sin
condiciones desde `components/home/HomeStatsRow.tsx:63`.

### B. Badge "+2 XP" (`components/home/HomeImmersionCard.tsx:90-93`)

Texto fijo `+2 XP`. El XP real lo calcula `lib/immersion/external-log.ts:31`:
`const xpEarned = Math.max(10, Math.round(minutes * 1))`. Con el default de
30 minutos (`useState(30)`, línea 50) se otorgan 30 XP.

### C. Palabras de ejemplo mostradas como guardadas (`components/journal/JournalPronunciationCard.tsx:21-27`)

```tsx
const DEFAULT_SAMPLE_WORDS = ['thoroughly', 'clothes', 'world', 'schedule']
...
const displayWords = savedWords.length > 0 ? savedWords : DEFAULT_SAMPLE_WORDS
```

Y el lector real nunca encuentra palabras por un desajuste de clave.
Escritor (`components/journal/JournalNotebookClient.tsx:30-36`) persiste
`wordOrPhrase` (coincide con `lib/journal/types.ts:14`):

```ts
const items = words.map((w) => ({ id: crypto.randomUUID(), wordOrPhrase: w, ... }))
```

Lector (`components/journal/JournalNotebookClient.tsx:100-112`) busca `item.word`:

```ts
const parsed = JSON.parse(entry.content) as { items?: Array<{ word?: string }> }
...
if (item.word && !savedPronunciationWords.includes(item.word)) {
```

Resultado: `savedWords` siempre es `[]` y todos los usuarios ven las cuatro
palabras de muestra como si fueran suyas.

### D. Inmersión externa registra 100% de precisión (`lib/immersion/external-log.ts:38-46`)

```ts
sessionResult: { results: [], accuracy: 100, totalTimeMs: durationMs, bySlug: {} ... }
```

`lib/progress/activity-hub.ts:137` persiste `accuracy_pct: Math.round(sessionResult.accuracy)`.
`components/progress/ActivityHistoryCard.tsx:114` muestra
`{session.exercisesTotal} ejercicios · {session.accuracyPct}% precisión` y
las líneas 65 y 78-80 promedian ese 100 en `overallAccuracy` y por categoría.
El test existente `lib/immersion/__tests__/external-log.test.ts` afirma
`accuracy: 100`; hay que actualizarlo.

### E. 90 s regalados por respuesta sin tiempo (`lib/home/queries.ts:33-34, 63`)

```ts
/** Fallback per answer when `time_ms` is missing (~90 s). */
const FALLBACK_ANSWER_MS = 90_000;
...
const ms = row.time_ms ?? FALLBACK_ANSWER_MS;
```

Se consume en `components/home/HomePageHeader.tsx` (`${week} min esta semana`)
y en `app/(authenticated)/page.tsx:145` como puerta `goal.minutesDone >= goal.goalMinutes`.

### F. Denominador 1000 (`components/daily/DailyOverviewSummary.tsx:17, 65, 128-135`)

```ts
const ESSENTIAL_WORD_TARGET = 1000
...
const progressPct = Math.min(100, (learned / ESSENTIAL_WORD_TARGET) * 100)
...
<span className="text-fg-muted"> / {ESSENTIAL_WORD_TARGET}</span>
```

El catálogo real tiene 2800 palabras repartidas por nivel
(`public/essential-words/level-index.json`). La tarjeta de Home ya recibe el
total correcto por nivel: `components/home/HomeEssentialWordsBody.tsx:14`
prop `totalLevelWords: number | null`. `DailyOverviewSummary` se monta desde
`components/daily/DailyChecklist.tsx:188`.

### G. Cifras de landing (`lib/landing/content.ts:30-35`)

```ts
{ value: "110", label: "sonidos del inglés con audio de referencia" },
...
{ value: "276", label: "mazos de patrones gramaticales" },
```

`public/sounds/` tiene 110 `.ogg`, pero es la tabla IPA completa (incluye
clicks, eyectivas, etc.); el inglés tiene ~44 fonemas. El inventario real de
sonidos de la app está en `lib/sounds/inventory.ts` (`CANONICAL_SOUNDS = PHONEMES`).
`public/grammar-decks/` tiene 314 archivos `.json`, no 276.

### H. Enlaces rotos

- `components/practice/hub/PronunciationSection.tsx:62` → `href="/practice/minimal-pairs"`
- `components/practice/hub/SoundQuizWidget.tsx:19` → `{ href: '/practice/minimal-pairs', ... }`
- `components/practice/hub/ReferenceSection.tsx:58` → `href="/chunks"`
- `components/journal/NotebookPastGrid.tsx:33` → `href="/journal/history"`

Rutas reales: `app/(authenticated)/practice/sounds/minimal-pairs/`,
`app/(authenticated)/practice/chunks/`. No existe `app/(authenticated)/journal/history/`
(sí existen `journal/[entryDate]/` y `journal/write/`).

### I. Copy muerto "palabras dominadas" (`components/home/HomePageHeader.tsx:32-42`)

`buildSubtitle(wordsMastered, ...)` emite `"${wordsMastered} palabras dominadas"`;
ningún caller pasa `wordsMastered` (default 0, línea 59). Es una afirmación
de dominio cableada a nada.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests de un archivo | `pnpm vitest run <ruta>` | all pass |
| Tokens de diseño | `pnpm lint:design-tokens` | exit 0 |

Nota: `pnpm test` completo tarda ~10 min y hoy tiene 3 archivos fallando por
causas ajenas a este plan (ver plan 013). Verifica por archivo.

## Scope

**In scope**:
- `components/home/HomeImmersionCard.tsx`
- `components/home/__tests__/HomeImmersionCard.test.tsx`
- `components/journal/JournalPronunciationCard.tsx`
- `components/journal/JournalNotebookClient.tsx`
- `components/journal/__tests__/` (crear `JournalPronunciationCard.test.tsx`)
- `lib/immersion/external-log.ts` y `lib/immersion/__tests__/external-log.test.ts`
- `components/progress/ActivityHistoryCard.tsx` y su test
- `lib/home/queries.ts` (solo `getTodayPracticeGoal`) y `lib/home/__tests__/` (crear `practice-goal.test.ts` si extraes la suma a función pura)
- `components/daily/DailyOverviewSummary.tsx`, `components/daily/DailyChecklist.tsx` y sus tests
- `lib/landing/content.ts`
- `components/practice/hub/PronunciationSection.tsx`, `SoundQuizWidget.tsx`, `ReferenceSection.tsx`
- `components/journal/NotebookPastGrid.tsx`
- `components/home/HomePageHeader.tsx` y su test

**Out of scope** (no tocar):
- `lib/progress/activity-hub.ts` — el contrato `buildSessionTelemetry` se usa en todas las superficies; el cambio de inmersión se hace en el productor y el consumidor, no en el hub.
- Cualquier migración SQL o backfill de `activity_sessions` existentes — se documenta como follow-up.
- `components/home/HomeEssentialWordsBody.tsx` — ya es correcto.
- El componente `PlaceholderIllustration` y `SAMPLE_FLASHCARDS` (arte decorativo, no datos).

## Git workflow

- Rama: `advisor/005-remove-fabricated-ui-data` desde `dev`.
- Commits convencionales, un commit por letra (A–I). Ejemplo del historial:
  `fix(practice): connect hub progress to real data`.
- No hacer push ni abrir PR salvo instrucción del operador.

## Steps

### Step 1 (A+B): HomeImmersionCard sin racha ni XP inventados

1. Elimina el bloque de los 7 círculos y el texto `4 días`
   (líneas 173-186). No lo sustituyas por una consulta: no existe hoy una
   query por día de inmersión y añadirla está fuera de alcance. Deja solo el
   botón de acción en esa fila.
2. Sustituye el texto fijo `+2 XP` por el valor calculado con la misma regla
   que `external-log.ts`: `+{Math.max(10, minutes)} XP`. Para no duplicar la
   regla, exporta desde `lib/immersion/external-log.ts` una función pura
   `export function immersionXpForMinutes(minutes: number): number { return Math.max(10, Math.round(minutes)) }`
   y úsala en ambos sitios.
3. En el test `HomeImmersionCard.test.tsx` añade:
   - `it('does not render a fabricated streak')` → `expect(screen.queryByText(/4 días/)).toBeNull()`.
   - `it('shows the xp that will actually be awarded')` → con el default de 30 min, `screen.getByText(/\+30 XP/)`.

**Verify**: `pnpm vitest run components/home/__tests__/HomeImmersionCard.test.tsx lib/immersion/__tests__/external-log.test.ts` → all pass.

### Step 2 (C): Diario de pronunciación muestra solo palabras reales

1. En `JournalNotebookClient.tsx:100-112` cambia el tipo y la lectura a
   `wordOrPhrase`:
   ```ts
   const parsed = JSON.parse(entry.content) as { items?: Array<{ wordOrPhrase?: string }> }
   ...
   if (item.wordOrPhrase && !savedPronunciationWords.includes(item.wordOrPhrase)) {
     savedPronunciationWords.push(item.wordOrPhrase)
   }
   ```
2. En `JournalPronunciationCard.tsx` elimina `DEFAULT_SAMPLE_WORDS` y
   `displayWords`. Si `savedWords.length === 0`, renderiza en el lugar de los
   chips un `<p className="font-caption text-fg-muted">Aún no has guardado palabras.</p>`.
3. Crea `components/journal/__tests__/JournalPronunciationCard.test.tsx`
   (patrón: `HomeImmersionCard.test.tsx`) con dos casos: sin palabras muestra el
   texto vacío y no muestra `thoroughly`; con `savedWords={['world']}` muestra `world`.

**Verify**: `pnpm vitest run components/journal` → all pass.
**Verify**: `grep -rn "DEFAULT_SAMPLE_WORDS" components lib` → sin resultados.

### Step 3 (D): Inmersión externa no reporta precisión

1. En `lib/immersion/external-log.ts` cambia `accuracy: 100` por `accuracy: 0`.
   Mantén `allowEmptySession: true` (línea 35) para que la sesión siga
   registrándose como actividad.
2. En `components/progress/ActivityHistoryCard.tsx`:
   - Línea 114: si `session.exercisesTotal === 0`, muestra solo
     `Sin ejercicios · actividad registrada` (sin porcentaje).
   - Líneas 60-82: excluye de `overallAccuracy` y de `accuracy` por categoría
     las sesiones con `exercisesTotal === 0`. Si tras excluir no queda ninguna,
     `overallAccuracy` debe ser `null` y no renderizarse (revisa cómo se pinta
     hoy y añade el guard).
3. Actualiza `lib/immersion/__tests__/external-log.test.ts` (`accuracy: 100` → `accuracy: 0`).
4. Añade a `components/progress/__tests__/ActivityHistoryCard.test.tsx` un
   caso con una sesión `{ exercisesTotal: 0, accuracyPct: 0, source: 'immersion' }`
   y otra `{ exercisesTotal: 10, accuracyPct: 80 }`: el promedio mostrado debe
   ser 80, no 40, y la fila de inmersión no debe contener `% precisión`.

**Verify**: `pnpm vitest run lib/immersion components/progress/__tests__/ActivityHistoryCard.test.tsx` → all pass.

### Step 4 (E): Minutos de práctica sin relleno

1. En `lib/home/queries.ts` elimina `FALLBACK_ANSWER_MS` y cambia la línea 63
   a `const ms = row.time_ms ?? 0;`.
2. Extrae el bucle de suma (líneas ~58-66) a una función pura exportada
   `sumPracticeMs(rows: Array<{ answered_at: string; time_ms: number | null }>, nowIso: string): { todayMs: number; weekMs: number }`
   en el mismo archivo, para poder testearla sin Supabase.
3. Crea `lib/home/__tests__/practice-goal.test.ts` (patrón: `lib/home/__tests__/placement-state.test.ts`)
   con: una fila con `time_ms: null` suma 0; una con `time_ms: 120000` suma 2 min.

**Verify**: `pnpm vitest run lib/home` → all pass.
**Verify**: `grep -n "FALLBACK_ANSWER_MS" lib/home/queries.ts` → sin resultados.

### Step 5 (F): Denominador real de palabras esenciales

1. Añade a `DailyOverviewSummary` una prop `essentialWordsTotal: number | null`
   y elimina `ESSENTIAL_WORD_TARGET`. Si es `null`, oculta la barra y el
   denominador (muestra solo `{learned} palabras`).
2. En `DailyChecklist.tsx:188` pasa el total. Localiza de dónde obtiene
   `learned` hoy (sigue la prop hacia arriba hasta el hook/query que la
   produce) y obtén el total del mismo origen que usa Home
   (`totalLevelWords` en `HomeStatsRow.tsx` → sigue su origen en
   `lib/home/queries.ts` o el hook de Essential Words). Si el origen no expone
   el total sin una llamada nueva a Supabase, pasa `null` y deja la barra
   oculta; anótalo en el commit.
3. Actualiza `components/daily/__tests__/DailyOverviewSummary.test.tsx`:
   no debe aparecer `/ 1000`; con `essentialWordsTotal={740}` aparece `/ 740`.

**Verify**: `pnpm vitest run components/daily` → all pass.
**Verify**: `grep -rn "ESSENTIAL_WORD_TARGET\|/ 1000" components` → sin resultados.

### Step 6 (G): Cifras de landing verificables

1. En `lib/landing/content.ts` cambia el label de sonidos a
   `"símbolos IPA con audio de referencia"` y conserva `110`, o bien calcula
   el número desde `CANONICAL_SOUNDS.length` (`lib/sounds/inventory.ts`) y
   deja el label "sonidos del inglés". Elige la segunda si `CANONICAL_SOUNDS`
   es importable sin arrastrar I/O (comprueba que `lib/sounds/inventory.ts`
   no importa Supabase ni Dexie); si no, la primera.
2. Cambia `"276"` por `"314"` y actualiza el comentario de cabecera
   (líneas 5-9) con los números y la fecha.
3. Crea `lib/landing/__tests__/content.test.ts` que lea `public/grammar-decks`
   con `fs.readdirSync` y compare con el valor de `LANDING_STATS`, y que
   compare el número de sonidos con la fuente elegida.

**Verify**: `pnpm vitest run lib/landing` → all pass.

### Step 7 (H): Enlaces rotos

1. `PronunciationSection.tsx:62` y `SoundQuizWidget.tsx:19`: `/practice/sounds/minimal-pairs`.
2. `ReferenceSection.tsx:58`: `/practice/chunks`.
3. `NotebookPastGrid.tsx:33`: elimina el `<Link>` "Ver todas" (no existe la
   ruta y construirla está fuera de alcance).
4. Crea `components/__tests__/internal-links.test.ts` (o dentro de
   `app/__tests__/`) que extraiga con regex todos los `href="/..."` y
   `href: '/...'` literales de `components/**/*.tsx` y verifique que cada uno
   corresponde a un `page.tsx` bajo `app/` (normaliza grupos `(authenticated)`
   y segmentos dinámicos `[x]`). Este test es la guardia contra futuros 404.

**Verify**: `pnpm vitest run internal-links` → pass, 0 enlaces rotos.

### Step 8 (I): Copy de dominio muerto

1. Elimina el parámetro `wordsMastered` de `buildSubtitle` y la prop de
   `HomePageHeader`. Ajusta `components/home/__tests__/HomePageHeader.test.tsx`.

**Verify**: `pnpm vitest run components/home/__tests__/HomePageHeader.test.tsx` → all pass.
**Verify**: `grep -rn "palabras dominadas" components/home` → sin resultados.

### Step 9: Cierre

**Verify**: `pnpm type-check` → exit 0. `pnpm lint` → exit 0. `pnpm lint:design-tokens` → exit 0.

## Test plan

- Nuevos: `JournalPronunciationCard.test.tsx`, `lib/home/__tests__/practice-goal.test.ts`,
  `lib/landing/__tests__/content.test.ts`, test de enlaces internos.
- Modificados: `HomeImmersionCard.test.tsx`, `external-log.test.ts`,
  `ActivityHistoryCard.test.tsx`, `DailyOverviewSummary.test.tsx`, `HomePageHeader.test.tsx`.
- Comando: `pnpm vitest run components/home components/journal components/progress components/daily lib/home lib/immersion lib/landing` → all pass.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm lint` exit 0
- [ ] Los tests listados arriba pasan
- [ ] `grep -rn "4 días\|DEFAULT_SAMPLE_WORDS\|FALLBACK_ANSWER_MS\|ESSENTIAL_WORD_TARGET\|palabras dominadas" components lib` → 0 resultados
- [ ] `grep -rn "accuracy: 100" lib/immersion` → 0 resultados
- [ ] `grep -rn '"/practice/minimal-pairs"\|"/chunks"\|"/journal/history"' components` → 0 resultados
- [ ] `git status` no muestra archivos fuera del scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- El código en "Current state" no coincide con los extractos.
- Para el paso 5, el total de palabras por nivel requiere una nueva query a
  Supabase: pasa `null`, oculta la barra y reporta; no añadas la query.
- El test de enlaces internos encuentra más de los 4 enlaces listados: repórtalos, no los arregles sin confirmar.
- Una verificación falla dos veces tras un intento razonable de arreglo.

## Maintenance notes

- Follow-up explícito: backfill de `activity_sessions.accuracy_pct = 100`
  para filas con `exercises_total = 0` y `source = 'immersion'` (migración SQL
  o filtro en `lib/progress/queries.ts:527`). Sin él, el historial previo
  sigue con 100%.
- Follow-up: si se quiere mostrar una racha de inmersión real, hace falta una
  query por día local sobre `activity_sessions where source='immersion'`,
  en `lib/home/queries.ts`, y pasarla como prop.
- Revisor: comprobar que ningún número en Home/Daily/Progreso proviene de una
  constante literal; el test de enlaces internos debe seguir en verde.
