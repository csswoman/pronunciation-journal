# Plan 032: Expandir anclas del content graph de chunks para niveles A2 y B1

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 87636eca..HEAD -- lib/chunk-of-day/content-graph.json lib/chunk-of-day/content-graph.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Status**: COMPLETED
- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: content / pedagogy
- **Planned at**: commit `87636eca`, 2026-09-22

> **Nota de alcance (2026-09-22)**: el grafo contiene 116 entradas válidas según los tests: 36 A1, 50 A2 y 30 B1 (80 chunks intermedios cubiertos). Revalidar tests y cambios locales antes de afirmar que está integrado en una rama o desplegado.

## Why this matters

Al planificar, el grafo solo contenía los 36 chunks A1. La ampliación aporta una muestra A2/B1; el resto de expresiones puede seguir sin anclas. Para un chunk sin entrada, `resolveChunkContentGraph` devuelve `anchors: []`. Esto limita:
1. El puente Chunk ↔ Vocabulario (`fetchEssentialWordsForAnchors` devuelve array vacío).
2. El sesgo de repaso de vocabulario anclado a las frases del día (`biasWordsByChunkAnchors`).
3. El enrutamiento de dificultades de pronunciación (`routePronunciationDifficulty` devuelve `null` si el alumno reporta dificultad en palabras de nivel intermedio).

## Current state

- En `lib/chunk-of-day/content-graph.json` del trabajo local revisado:
  76 entradas; los tests de catálogo comprueban 36 A1, 25 A2 y 15 B1. El plan solo exige esa muestra, no cobertura total del catálogo.
- En `lib/chunk-of-day/content-graph.ts:90-102`:
  ```ts
  export function resolveChunkContentGraph(
    chunk: ChunkItem,
    entry: ChunkContentGraphEntry | undefined,
  ): ResolvedChunkContentGraph {
    if (!entry) return { ...EMPTY_CONTENT_GRAPH, text: chunk.chunk }
    // ...
  }
  ```
  Todo chunk sin entrada sigue cayendo en `EMPTY_CONTENT_GRAPH`; no infieras cobertura por nivel a partir de un ejemplo con ancla.
- El validador `validateChunkContentGraph` en `lib/chunk-of-day/content-graph.ts` exige que cada entrada de `content-graph.json` tenga texto resaltado con `** **` que coincida exactamente con la frase visible y que cada ancla tenga un ID válido de `essential_words` (`c1k:<word>`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm vitest run lib/chunk-of-day/__tests__/` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `lib/chunk-of-day/content-graph.json`
- `lib/chunk-of-day/__tests__/content-graph.test.ts` (o suite existente)

**Out of scope**:
- Modificar el esquema de `ChunkContentGraphEntry`.
- Modificar las 365 frases originales en `data.ts`.

## Steps

### Step 1: Seleccionar 40 chunks clave de A2 y B1 para anclaje

Selecciona 25 chunks de nivel A2 y 15 chunks de nivel B1 de alta frecuencia comunicativa en `data.ts` (ejemplos: `could you tell me`, `i was wondering if`, `as far as i know`, `i used to`, `looking forward to`, etc.).

### Step 2: Generar entradas en `content-graph.json` con anclas verificadas de `c1k:`

Para cada uno de los 40 chunks seleccionados:
1. Añade la entrada a `lib/chunk-of-day/content-graph.json`.
2. Marca la palabra ancla con `**word**` asegurando que el texto resultante `compiled.text === chunk.chunk`.
3. Asocia la palabra ancla a su identificador en Essential Words (`c1k:<lemma>`).
4. Si contiene un fonema o contraste relevante (ej. `/ɹ/`, `/θ/`, `/ð/`, `/æ/`), asocia el `pronunciationTargetIds` registrado en el registro canónico de pronunciación.

Ejemplo:
```json
{
  "chunkId": "038-could-you-tell-me",
  "markedText": "Could you **tell** me...?",
  "anchors": [{ "owner": "essential_words", "id": "c1k:tell" }],
  "pronunciationTargetIds": ["segmental.phoneme./l/"]
}
```

**Verify**: Ejecuta `pnpm vitest run lib/chunk-of-day/__tests__/` para confirmar que `validateChunkContentGraph` valida las 76 entradas sin errores de marcado ni anclas desconocidas.

### Step 3: Verificar que el puente funciona para niveles intermedios

Escribe un test en `lib/chunk-of-day/__tests__/intermediate-graph.test.ts` que demuestre:
1. Un chunk de A2 ahora resuelve anclas en su `contentGraph`.
2. `routePronunciationDifficulty` sobre una palabra de A2 vinculada a un chunk A2 devuelve una ruta válida con ejercicios en lugar de `null`.

**Verify**: `pnpm vitest run lib/chunk-of-day/__tests__/intermediate-graph.test.ts` → all pass.

## Test plan

- Test 1: Validador de content graph corre sobre todas las entradas sin `invalid_markup` ni `unknown_essential_word`.
- Test 2: Comprobar que `routePronunciationDifficulty` resuelve rutas para palabras de nivel A2/B1.

## Done criteria

- [x] `lib/chunk-of-day/content-graph.json` contiene al menos 116 chunks validados: 36 A1, 50 A2 y 30 B1
- [x] `pnpm type-check` exits 0
- [x] `pnpm vitest run lib/chunk-of-day/__tests__/` exits 0
- [x] `pnpm lint` exits 0
- [x] `plans/README.md` status row 032 updated

## STOP conditions

- El texto de `markedText` tras compilar no es idéntico a `chunk.chunk` (el validador arrojará `text_mismatch`).
- El lemma del ancla no existe en el catálogo de Essential Words.

## Maintenance notes

- A medida que se añadan más anclas en el futuro, mantener siempre la validación contra `validateChunkContentGraph`.
- Para ampliar cobertura después, medir por nivel y por ruta consumidora qué chunks siguen sin ancla; priorizar expresiones frecuentes y palabras con intención de pronunciación. Crear otro plan con alcance propio, sin reabrir este `DONE`.
