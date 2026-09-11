# Rediseño del feedback del turno del learner en misiones guionadas

**Fecha:** 2026-09-08
**Estado:** aprobado (pendiente review del usuario)
**Rama:** dev

## Problema

Tras hablar una línea en una misión guionada, el estado de resultado de
`LearnerLine` apila cuatro bloques sin jerarquía visual:

1. Línea coloreada palabra por palabra (`SpokenLineFeedback`).
2. Headline de score (`96% · Muy bien`) en gris pequeño, casi invisible.
3. Tarjeta de remediación fonética (`SyllableRemediation`): pista visual + 3
   pasos articulatorios + párrafo largo de `spanishTip` + chips de pares
   mínimos, todo en `text-body-sm text-fg-muted` — una pared de texto gris.
4. Barra de comparación de audio (`SelfPlaybackAudioBar`) con su propio header.

Dos fallos de fondo:

- **Sin jerarquía.** Todo pesa lo mismo. El dato accionable (¿acerté?, ¿qué
  corrijo?) no destaca; la teoría opcional ocupa el mismo espacio visual.
- **El "por qué" está roto.** En el caso real del screenshot, "goes" aparece en
  ámbar (status `missing`, "no se te oyó") y aun así se muestra una tarjeta
  entera del sonido `/z/`. Nunca se dice *"la «s» final de «goes» suena /z/, y es
  lo que falló"*. Un principiante piensa: "yo dije goes bien, ¿de dónde sale la
  z?". La tarjeta enseña el fonema en abstracto, desconectado de la palabra.

## Objetivo

Rediseñar **el estado de resultado del turno del learner** (no el de grabación)
para que:

- Tenga jerarquía visual en tres pesos: veredicto → el fix → material de estudio.
- Explique *por qué* falló, anclando el sonido a la grafía de la palabra
  concreta ("en «goes» la -s final suena /z/").
- Reduzca la carga de lectura: la teoría articulatoria queda colapsable.
- Fusione las dos tarjetas de audio (pares mínimos + Nativo/Mi voz) en una.

Fuera de alcance: algoritmo de alignment/sílabas, estado de grabación,
`ScriptedResult` / pantalla final de misión, ampliar la tabla de patrones más
allá de los ~10 fallos más frecuentes de hispanohablantes.

## Arquitectura de componentes

```
// Estado `attempt` de <LearnerLine> (rediseñado):
// <LineResult>
//   <ScoreVerdict />          — score grande + 1 frase de qué pasó
//   <SpokenLineFeedback />    — línea coloreada (se mantiene, más compacta)
//   <PhonemeFix />            — "en «goes» la -s suena /z/" + botón oír /z/
//     <SoundHowTo />          — colapsable: hookEs + 3 pasos + spanishTip corto
//   <ListenPanel />           — fusiona pares mínimos + Nativo/Mi voz
//   <RetryAndContinue />      — se mantiene
// </LineResult>
```

- **`LineResult.tsx`** (nuevo, `components/ai-coach/missions/scripted/`):
  recibe el resultado ya calculado y compone los sub-bloques. `LearnerLine`
  queda como orquestador de captura + scoring y delega todo el bloque de
  resultado a `LineResult`.
- **`ScoreVerdict.tsx`** (nuevo): score grande con color por tramo + frase de
  estado. ~30 líneas.
- **`PhonemeFix.tsx`** (nuevo, `components/pronunciation-feedback/`): la frase
  del "por qué" con la grafía y el IPA subrayados, `contrastEs`, botón de audio
  del fonema aislado, y `SoundHowTo` colapsable dentro. ~90 líneas.
- **`SoundHowTo.tsx`** (nuevo, `components/pronunciation-feedback/`): título
  `hookEs`, `articulationEs` en `<ul>`, `spanishTip` corto. ~40 líneas.
- **`ListenPanel.tsx`** (nuevo, `components/pronunciation-feedback/`): una sola
  tarjeta con fila de chips de pares mínimos + fila de botones Nativo/Mi voz.
  Reutiliza la lógica de reproducción de `SelfPlaybackAudioBar` (extraída a un
  hook `useDualPlayback` si hace falta, o el componente se mantiene y
  `ListenPanel` lo envuelve). ~90 líneas.
- **`SyllableRemediation.tsx`** se **retira de misiones** (`LearnerLine` deja de
  importarlo). Verificado: hoy **solo** lo usa `LearnerLine`. Se elimina el
  componente y su test junto con el refactor.

Todos los archivos nuevos < 120 líneas, una responsabilidad cada uno. Solo
utilidades Tailwind + tokens de `globals.css`; `cn()` para condicionales; sin
`style={{}}`; orden de clases layout → spacing → typography → color → state →
responsive; dark mode vía tokens.

## Helper del "por qué": `lib/pronunciation/phoneme-in-word.ts`

Módulo puro, nuevo.

```ts
type ExplanationSegment = { text: string; emphasis?: 'grapheme' | 'ipa' }

interface PhonemeInWordExplanation {
  segments: ExplanationSegment[]   // frase troceada; la UI resalta los emphasis
  plainEs: string                  // misma frase en texto plano (aria-label, tests)
  contrastEs: string | null        // "dijiste /s/ (sin voz)" | "ese sonido no se te oyó" | null
}

function describePhonemeInWord(
  syllableText: string,
  culprit: PhonemeAlignment,
): PhonemeInWordExplanation | null
```

- **Entrada:** texto de la sílaba fallada (`"goes"`) + el `PhonemeAlignment`
  culpable (`phoneme` ARPAbet, `ipa`, `status`, `got`, `gotIpa`).
- **`segments` / `plainEs`:** frase corta que ancla el sonido a la grafía real,
  resuelta con una tabla de patrones IPA→grafía por posición. El helper
  devuelve la frase ya troceada en segmentos con `emphasis` marcado, de modo
  que `PhonemeFix` solo mapea segmentos a `<span>` — sin parseo de HTML ni de
  strings en la UI. Cubre los ~10 fallos más frecuentes de hispanohablantes:
  - `/z/` final tras vocal o consonante sonora → "la «s» final de «{palabra}»
    suena /z/ (con voz), no /s/"
  - `/ɪ/` vs `/iː/` → "la «i» de «{palabra}» es corta /ɪ/, no larga /iː/"
  - vocales largas `/iː/ /uː/ /ɑː/ /ɔː/ /ɜː/` acortadas
  - `/θ/` y `/ð/` (grafía "th")
  - `-ed` final → `/t/`, `/d/`, `/ɪd/`
  - `/v/` pronunciada como `/b/`
  - `/h/` muda añadida u omitida
  - schwa `/ə/` en sílaba átona
  - `/ŋ/` final ("ng")
  - `/j/` inicial ("y")
- **`contrastEs`:**
  - `status === 'missing'` → "ese sonido no se te oyó".
  - `got`/`gotIpa` presente y distinto → "dijiste {gotIpa}" con matiz de sonoridad
    cuando aplica (p. ej. "(sin voz)" para `/s/` frente a `/z/`).
  - En otro caso → `null`.
- **Fallback:** si el patrón no está en la tabla → frase genérica
  "el sonido {ipa} en «{syllableText}»" (con el `{ipa}` como segmento
  `emphasis: 'ipa'`), `contrastEs` derivado solo de `status`/`got`. Nunca
  devuelve algo incorrecto; en el peor caso es genérico pero cierto.
- Devuelve `null` solo si `culprit.ipa` y el mapeo ARPAbet→IPA fallan (no hay
  símbolo que nombrar).

La tabla de patrones vive en el mismo archivo, tipada
(`Array<{ match: (c: PhonemeAlignment, syl: string) => boolean; build: (...) => ExplanationSegment[] }>`),
fácil de ampliar.

### Selector `pickPrimaryFix`

Nuevo, puro. En `lib/pronunciation/phoneme-in-word.ts` o archivo hermano.

```ts
function pickPrimaryFix(
  wordResults: WordResult[],
  syllableMap: Map<string, SyllableResult[]>,
): { syllableText: string; culprit: PhonemeAlignment } | null
```

Elige **un** fallo a explicar, con prioridad:

1. `culprit` de vocal (`nucleus`) en una sílaba fallada del `syllableMap`.
2. `culprit` de consonante en una sílaba fallada.
3. Primer `PhonemeAlignment` con `status !== 'correct'` en el `alignment` de la
   primera palabra `incorrect` (sin sílaba fiable) — `syllableText` = la palabra
   entera.
4. Ninguno → `null`.

## Cambios de copy en los datos

`lib/pronunciation/ipa-data.ts` (`IPA_EXTRA`) y `articulation-guide-data.ts`.

- **Nuevo campo `hookEs`** (opcional, `string`, ≤ 40 chars): frase memorable
  para el título de `SoundHowTo`. `/z/` → `"El zumbido de la abeja"`. Se añade
  para los ~15 sonidos que hoy tienen `spanishTip`; ausente ⇒ `SoundHowTo` usa
  el símbolo IPA como título.
- **`spanishTip` se acorta** a 1–2 frases accionables. `/z/` pasa de 3 frases +
  lista de ejemplos + dato rice/rise a:
  *"No existe en español. Pon los dedos en la garganta: al pasar de «sss» a
  «zzz» notas la vibración."*
- **Salvaguarda:** 6 vistas de estudio profundo renderizan `spanishTip`
  completo hoy (`SoundLabDetailDialog`, `SentenceErrorDetailPanel`,
  `ExerciseHints`, `SpanishSpeakersGrid`, `SoundDetail`, `PhonemeIntroTray`). El
  texto largo original se mueve a un campo nuevo **`spanishTipLongEs`**; esas
  vistas pasan a `spanishTipLongEs ?? spanishTip`. Así misiones usa la versión
  corta y las vistas de estudio conservan el detalle. (Cambio mecánico de una
  línea por vista; se incluye en el plan.)
- **No** se tocan campos en inglés, `minimalPairs`, `finalConsonantPairs`,
  `difficulty`, `articulationEs` (los pasos de `/z/` ya son acciones cortas;
  solo se revisan los sonidos cuyos pasos superen ~12 palabras).

## Layout y estilos del turno de resultado

Contenedor: se mantiene la burbuja alineada a la derecha (`rounded-tr-sm`,
`border-border-subtle`, `bg-surface-raised/95`, `shadow-xs`). Jerarquía en tres
pesos:

### 1 · Veredicto (`ScoreVerdict`) — lo más prominente

- Score grande: `text-h3 font-semibold`, color por tramo:
  `var(--success)` ≥ 90, `var(--warning)` 70–89, `var(--error)` < 70.
- Al lado, la frase `feedbackHeadline(score)` en `text-body-sm text-fg-muted`.
- Debajo, `SpokenLineFeedback` con `gap` más compacto (sin cambios internos).

### 2 · El fix (`PhonemeFix`) — bloque destacado, no gris

- `bg-surface-sunken`, `rounded-lg`, `border-l-2` con
  `border-[var(--warning)]` (o `border-[var(--error)]` si el `culprit.status`
  era `incorrect`).
- Frase renderizada mapeando `segments` a `<span>`: `emphasis: 'grapheme'` →
  `font-semibold`; `emphasis: 'ipa'` → `font-semibold text-fg` +
  `underline decoration-[var(--warning)] decoration-2 underline-offset-2`;
  texto plano el resto. `aria-label` del bloque = `plainEs`.
- `contrastEs` en línea aparte, `text-caption text-fg-muted`.
- Botón inline "🔊 {ipa}" — `text-caption`, reproduce el fonema aislado vía
  `speak`. Mismo patrón try/catch que hoy; si TTS falla no rompe.
- `SoundHowTo` colapsable dentro: `<button>` "Cómo se hace →"
  (`text-caption text-fg-subtle`). Al abrir: `hookEs` como título +
  `articulationEs` en `<ul>` con bullets reales + `spanishTip` corto.
  **Abierto por defecto si `score < 70`; cerrado si `score >= 70`.**

### 3 · Escucha (`ListenPanel`) — fusiona las dos tarjetas actuales

- Una sola tarjeta `rounded-xl border border-border-default bg-surface-raised
  p-3.5`.
- Fila 1: label "ESCUCHA LA DIFERENCIA" (`font-caption text-xs uppercase
  tracking-wider text-fg-muted`) + chips de pares mínimos (`zoo` / `sue` …),
  estilo actual de `SyllableRemediation` (botón `rounded-md border
  border-border-default px-2 py-1 text-body-sm`).
- Fila 2: botones "Nativo" / "Mi voz" (lógica de `SelfPlaybackAudioBar`).
- Se elimina el header duplicado "COMPARACIÓN DE AUDIO / Escucha la diferencia".

## Flujo de datos

Sin cambios en captura ni scoring.

1. `LearnerLine` evalúa el intento → `attempt.wordResults` + `syllableMap`
   (`useSyllableFeedback`), igual que hoy.
2. `pickPrimaryFix(wordResults, syllableMap)` → `{ syllableText, culprit }` o
   `null`.
3. `describePhonemeInWord(syllableText, culprit)` → `{ segments, plainEs,
   contrastEs }`.
4. `buildRemediation(culprit)` (ya existe) → `hookEs`, `spanishTip` corto,
   `articulationEs`, `minimalPairs`.
5. `LearnerLine` renderiza `<LineResult>` con: `score`, `wordResults`,
   `syllableMap`, `fix` (segments + contrast) o `null`, `remediation` o `null`,
   `userAudioUrl`, `targetText`, callbacks `onRetry` / `onContinue`.

## Errores y casos borde

- **Sin fallo detectable** (`pickPrimaryFix` → `null`): no se renderiza
  `PhonemeFix` ni `SoundHowTo`. Sí el veredicto, la línea coloreada y
  `ListenPanel` (Nativo/Mi voz; sin fila de chips si no hay pares mínimos).
- **`buildRemediation` → `null`** (fonema sin datos): `PhonemeFix` muestra solo
  la frase genérica; sin "Cómo se hace"; `ListenPanel` sin chips.
- **`hookEs` ausente**: `SoundHowTo` usa el IPA como título.
- **TTS del fonema aislado falla**: el botón no rompe (try/catch, como hoy).
- **Sin `userAudioUrl`** (se saltó la grabación): "Mi voz" deshabilitado, igual
  que ahora.
- **Offline**: todo funciona; `speak` / TTS ya degradan solos.
- **Score `null`/`undefined`**: se trata como 0 (ya lo hace `LearnerLine`).

## Tests (Vitest, junto a cada fuente)

- `phoneme-in-word.test.ts`: un caso por patrón de la tabla (≥ 10) + fallback
  genérico + caso `status === 'missing'` + caso `got`/`gotIpa` distinto +
  `culprit` sin IPA → `null`; verifica `emphasis` de los segmentos y `plainEs`.
- `pick-primary-fix.test.ts`: prioridad vocal > consonante > alignment; sin
  fallos → `null`; palabra `incorrect` sin sílaba fiable → usa palabra entera.
- `LineResult.test.tsx`: veredicto con color por tramo (3 tramos); `SoundHowTo`
  abierto si `score < 70`, cerrado si `>= 70`; oculta `PhonemeFix` si `fix` es
  `null`; `ListenPanel` sin fila de chips si no hay pares.
- `PhonemeFix.test.tsx`: IPA renderizado con subrayado; botón de audio llama a
  `speak` con el fonema; muestra `contrastEs` cuando existe, lo omite cuando es
  `null`.
- `ListenPanel.test.tsx`: renderiza chips de pares; botones Nativo/Mi voz;
  "Mi voz" deshabilitado sin `userAudioUrl`.
- Ajustar tests existentes de `LearnerLine` al nuevo árbol (el mock de
  `ScrollingWaveform` ya está en su sitio).
- Eliminar `SyllableRemediation.test.tsx` junto con el componente.
- `pnpm type-check`, `pnpm lint`, `pnpm test` en verde antes de cerrar.

## Riesgos

- **`spanishTipLongEs` en 6 vistas**: cambio mecánico pero hay que tocarlas
  todas en el mismo PR para no dejar tips truncados en Sound Lab.
- **Cobertura de la tabla de patrones**: 10 patrones no cubren todo el inglés;
  el fallback genérico garantiza que nunca se muestra algo falso, solo menos
  específico.
- **Reutilización de `SelfPlaybackAudioBar`**: si extraer `useDualPlayback`
  resulta invasivo, `ListenPanel` puede envolver el componente actual y solo
  añadir la fila de chips encima; se decide en el plan.
