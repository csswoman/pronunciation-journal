# 02 · Paso de presentación / noticing antes de testear

> 🔴 **Crítico** · Impacto alto · Estado: 🟢 **Plan ejecutable listo**
>
> **REQUIRED SUB-SKILL:** `superpowers:subagent-driven-development` o `superpowers:executing-plans`. Pasos con checkbox.

## Hallazgo de la investigación (2026-06-19)

El brief original ("reusar `WordStudyCard`") resultó inexacto al revisar el código:

- **`WordStudyCard` está acoplada a `CoreWord`** (`components/practice/core-1000/WordStudyCard.tsx`): usa `ipa_strong`, `ipa_weak`, `sentence_ipa`, `rank` — campos exclusivos de Core 1000. No sirve para `WordBankEntry` sin reescribirla.
- **El flujo Core 1000 (`EssentialWordsSession`) YA tiene presentación→test** (fase `study` = `WordStudyCard`). Ese flujo no tiene el problema.
- **El hueco real está en el daily-plan general**: `buildWordReviewStep` (`lib/practice/daily-plan/step-builders.ts:20`) lanza `fill_blank`/`dictation`/etc. **sin presentar** la palabra primero.

**Decisión (Opción 3 — generalizar primero):** extraer una `StudyCard` agnóstica de fuente y un modelo de vista común, unificando la presentación entre Core 1000 y daily-plan. Paga la deuda de duplicación y habilita la presentación en ambos flujos desde una sola pieza.

## Modelo común: `StudyCardModel`

Las dos fuentes comparten una intersección suficiente para presentar. Lo específico de Core 1000 es **opcional**:

| Campo del modelo | `CoreWord` | `WordBankEntry` | Obligatorio |
|---|---|---|---|
| `word` | `word` | `text` | ✅ |
| `ipa` | `ipa_strong` | `ipa` | opcional |
| `meaning` | — | `meaning` | opcional |
| `translation` | — | `translation` | opcional |
| `sentence` | `example_sentence` | `example` | opcional |
| `sentenceIpa` | `sentence_ipa` | — | opcional |
| `weakForm` `{ ipa, phrase }` | `ipa_weak` + frase | — | opcional |
| `chips` (rank/pos/cefr) | sí | difficulty/pos sueltos | opcional |
| `speak()` | TTS palabra | `audio_url` ?? TTS | ✅ (callback) |

`StudyCard` renderiza cada sección **solo si el campo existe** — composición condicional por presencia de dato, no `if (source === 'core1000')`.

---

## Task 1: Modelo + adaptadores (puro, testeable sin React)

**Files:**
- Create: `lib/practice/study-card/model.ts` — `StudyCardModel` + `coreWordToStudyCard` + `wordBankEntryToStudyCard`
- Test: `lib/practice/study-card/__tests__/model.test.ts`

- [ ] **Step 1 — Test que falla.**
  - `coreWordToStudyCard(coreWord)` mapea `word`/`ipa_strong`/`example_sentence`; incluye `weakForm` solo si `ipa_weak` existe; incluye `sentenceIpa` si existe; chips `[#rank, pos, cefr]`.
  - `wordBankEntryToStudyCard(entry)` mapea `text→word`, `ipa`/`meaning`/`translation`/`example`; sin `weakForm`; sin `sentenceIpa`; chips vacíos o solo los disponibles.
  - Campos nulos de `WordBankEntry` (`ipa: null`, `example: null`) → propiedades ausentes en el modelo (no `null` colado).
- [ ] **Step 2 — Implementar.** El modelo es un tipo plano de vista; los adaptadores son funciones puras. Reusar `hasReduction`/`weakFormPhrase` (mover `weakFormPhrase` de `WordStudyCard.tsx` a un util compartido si se reusa).
- [ ] **Step 3 — `pnpm test study-card/model`** → PASS.

## Task 2: Componente `StudyCard` agnóstico

**Files:**
- Create: `components/practice/study-card/StudyCard.tsx` (≤250 líneas; sub-componentes `Chip`, `PronRow`, `SentenceBlock` extraídos)
- Test: `components/practice/study-card/__tests__/StudyCard.test.tsx`

- [ ] **Step 1 — Planned structure** como comment block (regla CLAUDE.md), luego implementar.
- [ ] **Step 2 — Test (RTL).**
  - Renderiza `word` siempre.
  - Renderiza `meaning`/`translation`/`ipa`/`sentence` solo cuando están en el modelo.
  - Renderiza `weakForm` PronRow solo cuando existe.
  - `onContinue`/`onArchive` (este último opcional) disparan callbacks.
  - Usa tokens de diseño, sin estilos inline (regla CLAUDE.md).
- [ ] **Step 3 — `pnpm test StudyCard`** → PASS.

## Task 3: Migrar `WordStudyCard` (Core 1000) a `StudyCard`

**Files:**
- Modify: `components/practice/core-1000/WordStudyCard.tsx` → thin wrapper que hace `coreWordToStudyCard(entry)` y renderiza `<StudyCard … />`
- Verify: `EssentialWordsSession` y sus tests siguen pasando sin cambios

- [ ] **Step 1 — Reemplazar el cuerpo** de `WordStudyCard` por el adaptador + `StudyCard`, preservando props (`entry`, `onContinue`, `onArchive`) para no romper llamadas.
- [ ] **Step 2 — `pnpm test EssentialWordsSession WordStudyCard`** → PASS (sin regresión visual de contenido).
- [ ] **Step 3 — Borrar** el `Chip`/`PronRow`/`SentenceBlock` duplicados de `WordStudyCard.tsx` (ahora viven en `StudyCard`).

## Task 4: Paso de presentación en el daily-plan

**Files:**
- Modify: `lib/practice/types.ts` — añadir `'word_intro'` a `DailyStepKind` y un campo opcional `studyCards?: StudyCardModel[]` a `DailyStep` (paralelo a cómo `'concept'` usa `exercises: []`)
- Modify: `lib/practice/daily-plan/step-builders.ts` — nuevo `buildWordIntroStep(words, context)`
- Modify: el ensamblador del plan diario para insertar `word_intro` **antes** de `word_review`
- Test: `lib/practice/daily-plan/__tests__/step-builders.test.ts` (extender)

- [ ] **Step 1 — Test que falla.**
  - `buildWordIntroStep` con palabras nuevas → step `kind: 'word_intro'`, `exercises: []`, `studyCards` poblado con el modelo de cada palabra nueva.
  - Sin palabras nuevas → `null` (no se inserta paso vacío).
  - Tope de N palabras nuevas por sesión (carga cognitiva — constante en `constants.ts`, sugerido 5).
- [ ] **Step 2 — Implementar** `buildWordIntroStep` usando `wordBankEntryToStudyCard`. "Nueva" = sin estado SRS o `srs_status === 'new'` (reusar el dato SRS que ya viaja con `WordBankEntry`).
- [ ] **Step 3 — Insertar** el paso antes de `word_review` en el ensamblador del plan.
- [ ] **Step 4 — `pnpm test step-builders`** → PASS.

## Task 5: Render del paso en la sesión diaria

**Files:**
- Modify: el componente de sesión del daily-plan que itera `DailyStep` (localizar: probablemente `components/practice/session/*` o la página de `/practice` diaria)
- Test: el del componente de sesión

- [ ] **Step 1 — Localizar** dónde se renderiza un `DailyStep` y cómo maneja hoy `kind: 'concept'` (exercises vacío) — seguir ese mismo patrón.
- [ ] **Step 2 — Renderizar** `word_intro` como un carrusel/secuencia de `<StudyCard>` (avanzar con "Practicar", opción "Ya la sé" → archivar/skip). No escribe `answer_history` (es presentación, no test).
- [ ] **Step 3 — Test**: el step `word_intro` muestra las cards y al terminar avanza a `word_review`.
- [ ] **Step 4 — `pnpm test`** del componente → PASS.

## Task 6: Verificación + estado

- [ ] **Step 1 — `pnpm type-check && pnpm lint && pnpm test`** → todo verde, sin regresiones.
- [ ] **Step 2 — Smoke manual** (`pnpm dev`): en la práctica diaria, una palabra nueva muestra `StudyCard` antes de su primer `fill_blank`; una palabra ya conocida no repite presentación.
- [ ] **Step 3 — Actualizar** `docs/architecture/exercises.md` (nuevo `word_intro` step) y el README de pedagogy-plans (02 → ✅).
- [ ] **Step 4 — Commit.**

---

## Criterios de aceptación

- [ ] Una sola `StudyCard` sirve a Core 1000 y a vocabulario general (sin duplicación de UI).
- [ ] `EssentialWordsSession` (Core 1000) sigue funcionando idéntico tras la migración.
- [ ] En la práctica diaria, una palabra `new` se presenta antes de su primer test.
- [ ] Una palabra ya conocida NO repite presentación.
- [ ] El paso de presentación no registra `answer_history`.
- [ ] Tope de palabras nuevas por sesión respetado (carga cognitiva).
- [ ] `type-check`/`lint`/`test` verdes; componentes ≤250 líneas; tokens de diseño.

## Riesgos / decisiones abiertas

- **`WordBankEntry` carece de `meaning`/`example` a veces** (nullable). La `StudyCard` debe verse bien con solo `word` + `ipa`. Cubrir en Task 2.
- **¿`word_intro` cuenta como primera repetición SM-2?** Decidir en Task 4: recomendado que presentar **no** dispare SM-2 (es exposición); el primer grade llega en `word_review`. Coordinar con el loop del plan 01.
- **Localizar el render del daily-plan** (Task 5) es el punto de mayor incertidumbre — hacer la exploración antes de implementar.
- **`weakFormPhrase`** vive hoy dentro de `WordStudyCard.tsx`; moverla a un util compartido si Task 1/2 la reusan.
