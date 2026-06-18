# Phoneme Feedback Table (estilo ELSA) — Diseño

**Fecha:** 2026-06-16
**Estado:** Aprobado
**Alcance:** Fase 1 — solo flujo Core-1000 (`SpeakReviewCard`)

## Resumen

Añadir una tabla de feedback fonético estilo ELSA Speak al flujo de práctica
de pronunciación de Core-1000. Tras grabar una oración, el usuario ve un
desglose sonido-por-sonido (columna SONIDO vs. DIJISTE) con una explicación
articulatoria en español para cada fonema mal pronunciado.

**Principio clave:** la comparación **no usa IA**. El motor de scoring local
(`scorePronunciation` → `analyzePhonemes`) ya produce el alineamiento
fonema-por-fonema. La única llamada a IA del flujo sigue siendo la
transcripción de voz (Gemini), que es inevitable porque el audio cambia en
cada intento. Las explicaciones articulatorias son texto fijo en código.

## Motivación

El usuario quiere replicar el feedback de ELSA Speak: ver exactamente qué
sonido esperaba la app, qué sonido dijo, y cómo corregirlo. La inquietud
original era "guardar lo que espera la IA para no volver a preguntarle". La
realidad del codebase es mejor de lo esperado:

- Lo "esperado" (fonemas objetivo + cómo articularlos) es **fijo por
  palabra/sonido** y se puede precalcular o escribir como constante.
- La comparación ya es **100% local** (`lib/pronunciation/scoring.ts`,
  `lib/pronunciation/phonemes.ts`), con caché en memoria.

Por tanto la tabla estilo ELSA cuesta **cero llamadas extra de IA**.

## Límite técnico conocido (aceptado)

La app compara **texto transcrito**, no audio. Detecta errores cuando la mala
pronunciación cambia la palabra reconocida por el motor de voz (p.ej. "staff"
reconocido como "stuff"), pero **no** detecta matices sutiles dentro del mismo
sonido reconocido. Es una aproximación buena, no idéntica a ELSA (que analiza
audio). El análisis de audio real queda fuera de alcance (posible fase futura).

## Arquitectura

```
SpeakReviewCard (ya transcribe vía useSpeechInput → Gemini/WebSpeech)
  └─ scored.wordResults   ← ya producido por scorePronunciation → analyzePhonemes
       ├─ <PronunciationFeedback />          (resumen existente: %, mensaje, XP — sin cambios)
       └─ <PhonemeFeedbackTable wordResults={...} />   ← NUEVO
            └─ por cada fonema con status ≠ "correct":
                 getArticulation(ipa)        ← NUEVO (constante, sin IA)
```

### Piezas nuevas (2 archivos)

**1. `lib/pronunciation/articulation.ts`** (nuevo)

Constante con descripciones articulatorias en español, indexada por símbolo
IPA limpio (el mismo formato que produce `ARPABET_TO_IPA` en `phonemes.ts`).
Una entrada por cada fonema del inglés (~44, los presentes en `ARPABET_TO_IPA`).

```ts
export const ARTICULATION: Record<string, string> = {
  t: "Presiona la lengua contra las encías superiores, detrás de los dientes, y luego suéltala con un golpe de aire.",
  s: "Deja que el aire fluya suavemente entre la lengua y el paladar, sin detenerlo.",
  æ: "Abre bien la boca y mantén la lengua baja, como en 'cat'.",
  // … resto de fonemas
}

export function getArticulation(ipa: string): string | null {
  return ARTICULATION[ipa] ?? null
}
```

Pura data + un helper. Sin lógica de scoring. Versionado en git.

**2. `components/lesson/PhonemeFeedbackTable.tsx`** (nuevo)

Componente de presentación puro. Responsabilidad única: renderizar el desglose
fonético. Sin estado, sin scoring, sin IA.

```tsx
// Planned structure:
// <PhonemeFeedbackTable>
//   <PhonemeRow />   — un fonema: SONIDO | DIJISTE/¡Excelente! + articulación
// </PhonemeFeedbackTable>

interface Props {
  wordResults: WordResult[]
}
```

### Datos de entrada (ya existentes)

`WordResult.phonemes.alignment` (de `lib/types.ts`, producido por
`buildAlignment` en `phonemes.ts:95-148`) ya contiene exactamente lo necesario:

```ts
{ phoneme: "t", ipa: "t", status: "incorrect", got: "d", gotIpa: "d" }  // error
{ phoneme: "f", ipa: "f", status: "correct" }                            // ok
{ phoneme: "l", ipa: "l", status: "missing" }                            // faltó
```

## Comportamiento por estado de fonema

| `status`    | Columna SONIDO | Columna DIJISTE                          |
|-------------|----------------|------------------------------------------|
| `correct`   | IPA esperado   | "¡Excelente!" (verde, sin texto largo)   |
| `incorrect` | IPA esperado   | `gotIpa` (rojo) + `getArticulation(ipa)` |
| `missing`   | IPA esperado   | "—" + `getArticulation(ipa)`             |

El detalle articulatorio solo aparece en errores (`incorrect`/`missing`), como
en ELSA. Los fonemas correctos solo muestran el reconocimiento positivo.

## Layout

Tabla de dos columnas SONIDO / DIJISTE (validada vía mockup — opción A). Cada
fila: el IPA esperado a la izquierda; a la derecha el IPA dicho (en error) o
"¡Excelente!" (correcto), seguido de la explicación articulatoria cuando aplica.

Usa tokens de diseño existentes (`--error`, `--text-primary`,
`--text-secondary`, `--text-tertiary`, etc.) y clases Tailwind, respetando las
reglas de estilo del proyecto (sin inline styles salvo runtime-computed, sin
colores hardcodeados). Componente < 250 líneas.

## Integración en `SpeakReviewCard`

El bloque de resultado actual (`components/practice/core-1000/SpeakReviewCard.tsx`,
~líneas 207-232) renderiza `<PronunciationFeedback>` con el resumen. El plan
**mantiene** ese resumen y **añade** la tabla detallada debajo:

```tsx
<PronunciationFeedback ... />                              {/* resumen — se queda */}
<PhonemeFeedbackTable wordResults={scored.wordResults} />  {/* NUEVO */}
```

`scored.wordResults` ya existe en el estado del componente. No se toca la
lógica de transcripción ni de scoring.

## Manejo de errores / casos borde

- `wordResults` vacío → `PhonemeFeedbackTable` retorna `null` (no renderiza).
  El resumen sigue mostrándose.
- Palabra sin datos de fonemas (no está en el diccionario CMU) → esa palabra
  se omite de la tabla; las demás se muestran.
- Fonema sin entrada en `ARTICULATION` → fila con IPA + color, sin texto
  articulatorio (degradación elegante, nunca rompe).

## Testing (Vitest)

**`lib/pronunciation/__tests__/articulation.test.ts`**
- `getArticulation` devuelve string para fonemas conocidos.
- `getArticulation` devuelve `null` para símbolos desconocidos.
- Cobertura: todo símbolo en `ARPABET_TO_IPA` tiene entrada en `ARTICULATION`
  (previene huecos al añadir fonemas nuevos).

**`components/lesson/__tests__/PhonemeFeedbackTable.test.tsx`**
- Dado `wordResults` con mix `correct`/`incorrect`/`missing`:
  renderiza "¡Excelente!" para correctos y la articulación para errores.
- `wordResults` vacío → no rompe (retorna null).
- Fonema sin articulación → renderiza fila sin texto, sin error.

## Fuera de alcance (fases futuras, specs propios)

- **Fase 2:** migrar el flujo `sounds` / `SpeakExercise` a transcripción de voz
  (hoy solo mide duración) para reusar `PhonemeFeedbackTable` ahí.
- Análisis de audio real (feedback fonético por señal, no por texto).
- Descripciones articulatorias generadas por IA / cacheadas en Supabase.

## Archivos

| Archivo | Acción |
|---------|--------|
| `lib/pronunciation/articulation.ts` | Crear — constante + helper |
| `components/lesson/PhonemeFeedbackTable.tsx` | Crear — componente de tabla |
| `components/practice/core-1000/SpeakReviewCard.tsx` | Editar — añadir la tabla bajo el resumen |
| `lib/pronunciation/__tests__/articulation.test.ts` | Crear — tests |
| `components/lesson/__tests__/PhonemeFeedbackTable.test.tsx` | Crear — tests |
