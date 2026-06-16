# Plan 017 — Contrato unificado de elegibilidad para ejercicios

**Written:** 2026-06-16  
**Status:** IN PROGRESS (Fase 1 en curso)  
**Effort:** M (3–4 PRs pequeños)  
**Priority:** P1  
**Depends on:** — (conviene tener suite verde; ver Plan 001)

---

## Problema

El contenido (Core 1000), los generadores de ejercicios y los tests usan reglas distintas para decidir si una palabra + frase ejemplo es “usable”. Eso produce:

1. **Falsos positivos en CI de contenido** — el dataset valida frases con flexión (`works`, `offered`) pero `blankWord()` exige el lemma exacto (`\bwork\b`).
2. **Fallos silenciosos en generación** — `generateFillBlankFromWordBank` devuelve `[]` cuando el pool no alcanza para 3 distractores, sin explicar por qué.
3. **Tests frágiles** — cuatro copias de `makeEntry()` con defaults distintos; fixtures que no cumplen `hasEnoughContext` ni el mínimo de pool.
4. **Cobertura incompleta** — `match-pairs`, `lib/exercises/utils.ts` y `lib/lexicon/exercises.ts` sin tests dedicados.
5. **Doc desactualizada** — el spec de Core 1000 daily fallback asume que todas las palabras “funcionan con todos los generadores sin modificación”.

**Síntoma real:** un usuario con fallback Core 1000 puede recibir menos ejercicios fill-blank de los esperados aunque el dataset pase `validate:core1000`.

---

## Arquitectura objetivo

```
CoreWord / WordBankEntry
        ↓
lib/exercises/eligibility.ts     ← única fuente de verdad
  assessWordBankEntry(entry, mode)
  sentenceContainsLemma(...)
  hasEnoughContext(...)
        ↓
┌─────────────────────────────────────────────────────┐
│ validate-core (dataset CI)                          │
│ fill-blank · reorder · dictation · match-pairs      │
│ sentence_context (lexicon)                          │
│ step-builders (daily plan)                          │
└─────────────────────────────────────────────────────┘
        ↓
GenerationResult<T>  { exercises, skipped[] }
        ↓
Tests: fixtures compartidos + invariantes + gate CI
```

**Principio:** una palabra “válida para fill-blank” debe significar lo mismo en validación de contenido, generador y test.

---

## Fases

### Fase 1 — Módulo de elegibilidad (PR 1)

| # | Tarea | Archivos |
|---|-------|----------|
| 1.1 | Crear `lib/exercises/eligibility.ts` con tipos `ExerciseMode`, `EligibilityReason`, `EligibilityResult` | nuevo |
| 1.2 | Mover `sentenceContainsWord` desde `validate-core.ts` → `eligibility.ts` (renombrar a `sentenceContainsLemma` o re-exportar alias) | `eligibility.ts`, `validate-core.ts` |
| 1.3 | Mover `hasEnoughContext` desde `utils.ts` → `eligibility.ts` (re-export en `utils.ts` para no romper imports de golpe) | `utils.ts`, `eligibility.ts` |
| 1.4 | Implementar `assessWordBankEntry(entry, mode)` que compone: ejemplo presente, lemma en frase, contexto, longitud mínima, pool de distractores | `eligibility.ts` |
| 1.5 | Implementar `blankLemma(sentence, word)` que usa `sentenceContainsLemma` + reemplazo de la forma encontrada en la frase | `eligibility.ts` o `utils.ts` |
| 1.6 | Actualizar `validate-core.ts` para importar desde `eligibility.ts` | `validate-core.ts` |
| 1.7 | Tests unitarios de elegibilidad (inflexiones, `be`→`are`, `night`→`tonight`, rechazos) | `lib/exercises/__tests__/eligibility.test.ts` |

**Constantes a centralizar:**

| Constante | Valor actual | Usado en |
|-----------|--------------|----------|
| `MIN_CONTENT_WORDS_AFTER_BLANK` | 2 | fill-blank, sentence_context |
| `MIN_REORDER_TOKENS` | 4 | reorder-words, reorder-from-fragments |
| `DISTRACTOR_COUNT` | 3 | fill-blank, sentence_context, match-pairs |
| `MIN_POOL_FOR_FILL_BLANK` | `DISTRACTOR_COUNT + 1` | fill-blank |

**Criterios de done Fase 1:**

- [x] `pnpm test lib/exercises/__tests__/eligibility.test.ts` verde.
- [x] `pnpm test lib/core-1000/__tests__/validate-core.test.ts` verde (sin regresiones).
- [x] `validate-core.ts` no duplica lógica morfológica; solo orquesta `assess` / `sentenceContainsLemma`.
- [x] `blankLemma("She works at a hospital.", "work")` devuelve frase con `___`.

**STOP:** si `blankLemma` no puede localizar de forma determinista qué token reemplazar en casos ambiguos (p. ej. dos formas de la misma palabra en una frase), documentar el límite y limitar el reemplazo a la **primera** ocurrencia — igual que `blankWord` hoy.

---

### Fase 2 — Generadores con resultado explícito (PR 2)

| # | Tarea | Archivos |
|---|-------|----------|
| 2.1 | Definir `GenerationResult<T>` y `SkippedEntry` en `lib/exercises/types.ts` o `eligibility.ts` | tipos |
| 2.2 | Refactor `generateFillBlankFromWordBank` → devuelve `GenerationResult<FillBlankExercise>` | `fill-blank.ts` |
| 2.3 | Usar `assessWordBankEntry` + `blankLemma` en el filtro usable | `fill-blank.ts` |
| 2.4 | Adaptar callers: `step-builders.ts`, `daily-plan` tests | `step-builders.ts` |
| 2.5 | Wrapper retrocompatible opcional: `generateFillBlankFromWordBank(...).exercises` o destructuring en call sites | callers |
| 2.6 | Log dev-only o `console.debug` cuando `skipped.length > 0` y `exercises.length < count` | `step-builders.ts` |

**Criterios de done Fase 2:**

- [x] Ningún caller ignora `skipped` en tests de integración del daily plan.
- [x] Con un chunk representativo de Core 1000 (p. ej. ranks 60–80), fill-blank genera **más** ejercicios que antes (medir en test).
- [x] `pnpm test` completo verde.

**STOP:** no propagar `GenerationResult` a todos los generadores en este PR — solo fill-blank. Los demás en Fase 4.

---

### Fase 3 — Fixtures compartidos para tests (PR 2 o 3)

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Crear `lib/exercises/__tests__/fixtures/word-bank-entry.ts` | nuevo |
| 3.2 | `makeWordBankEntry(overrides)` — base mínima | fixture |
| 3.3 | `makeFillBlankEligibleEntry(text, overrides?)` — frase con lemma/flexión + ≥2 content words tras blank | fixture |
| 3.4 | `makeFillBlankPool(count)` — N entradas únicas que pasan `assess(..., 'fill_blank')` | fixture |
| 3.5 | Migrar tests: `fill-blank`, `reorder-words`, `sentence-dictation`, `daily-plan` | tests |

**Criterios de done Fase 3:**

- [x] No queda `makeEntry` duplicado en más de un archivo de tests de ejercicios.
- [x] Cada test de generador importa fixtures compartidos.
- [x] Comentario en fixture explica **por qué** la frase ejemplo cumple el contrato (1 línea).

---

### Fase 4 — Tests de contrato e integración (PR 3)

| # | Tarea | Archivos |
|---|-------|----------|
| 4.1 | `assertFillBlankInvariant(ex)` — 4 opciones, answer único, `___` presente, lemma no visible | `lib/exercises/__tests__/invariants.ts` |
| 4.2 | Aplicar invariantes en loop de cada resultado de generador | tests existentes |
| 4.3 | Test integración: `buildWordReviewStep(coreWords.slice(0, 20))` produce ≥ N ejercicios | `lib/practice/__tests__/step-builders.test.ts` o extender `daily-plan.test.ts` |
| 4.4 | Test: palabra con frase flexionada del dataset real (fixture de `work`, `offer`, `night`) genera fill-blank | `fill-blank.test.ts` |
| 4.5 | Tests para `generateMatchPairsFromWordBank` (mínimo pool, dedupe de texto, sourceRef) | `match-pairs.test.ts` |
| 4.6 | Tests para `generateSentenceContextExercises` + aplicar `hasEnoughContext` si aún no lo hace | `lexicon/exercises.ts`, tests |

**Criterios de done Fase 4:**

- [x] `match-pairs` tiene al menos 5 casos (pool insuficiente, count, sourceRef, dedupe).
- [x] Test de integración Core 1000 → daily step documenta el % mínimo esperado de generabilidad.
- [x] `pnpm test` verde.

---

### Fase 5 — Gate CI de generabilidad (PR 4)

| # | Tarea | Archivos |
|---|-------|----------|
| 5.1 | Test Vitest `lib/core-1000/__tests__/generatability.test.ts` | nuevo |
| 5.2 | Para cada palabra del dataset (o muestra estratificada por chunk): `assessWordBankEntry(coreWordToWordBankEntry(w), mode)` | test |
| 5.3 | Umbrales iniciales sugeridos: fill-blank ≥ 85%, reorder ≥ 95%, dictation ≥ 98% | test + comentario |
| 5.4 | Añadir script `validate:core1000-generators` en `package.json` | `package.json` |
| 5.5 | Opcional: ejecutar en CI junto a `validate:core1000` | workflow |

**Criterios de done Fase 5:**

- [x] `pnpm validate:core1000-generators` pasa con el dataset actual.
- [x] Si una palabra nueva rompe el umbral, el reporte indica rank, word, mode, reasons[].
- [x] Umbrales documentados en este plan (ajustar tras primera corrida real).

**STOP:** si el umbral fill-blank real es < 70% por frases flexionadas + contexto corto, **no** bajar el umbral a ciegas — priorizar Fase 2 (`blankLemma`) antes de fijar el gate.

---

### Fase 6 — Documentación y alineación de producto (PR 4 o follow-up)

| # | Tarea | Archivos |
|---|-------|----------|
| 6.1 | Actualizar spec Core 1000 daily fallback: elegibilidad por generador, no compatibilidad automática | `docs/superpowers/specs/2026-06-14-core1000-daily-fallback-design.md` |
| 6.2 | Añadir sección “Eligibility contract” en `docs/architecture/exercises.md` | architecture doc |
| 6.3 | Mencionar `assessWordBankEntry` en `ENGINEERING_STANDARDS.md` bajo Exercise registry | estándares |

**Criterios de done Fase 6:**

- [ ] Ningún doc promete “funciona con todos los generadores sin modificación”.
- [ ] Tabla mode → reglas → archivos en architecture doc.

---

## Orden de ejecución recomendado

```
Fase 1 (eligibility) ──► Fase 2 (fill-blank + GenerationResult)
         │                        │
         └──────────┬─────────────┘
                    ▼
              Fase 3 (fixtures)
                    ▼
              Fase 4 (contratos + match-pairs)
                    ▼
              Fase 5 (CI gate)
                    ▼
              Fase 6 (docs)
```

**Paralelizable:** Fase 3 puede empezar en cuanto exista `assessWordBankEntry` (mitad de Fase 1). Fase 6 puede ir en el mismo PR que Fase 5.

---

## Métricas de éxito (producto)

| Métrica | Antes (estimado) | Objetivo |
|---------|------------------|----------|
| Palabras Core 1000 que generan fill-blank | Bajo (lemma exacto) | ≥ 85% del dataset |
| Pasos `word_review` vacíos con fallback Core 1000 | Ocultos (step `null`) | Raro; `skipped` explicado en dev |
| Tests con fixtures inválidos | Sí (fill-blank corregido a mano) | 0 — fixtures factory garantizan elegibilidad |
| Generadores sin tests | match-pairs, utils, lexicon | Cubiertos en Fase 4 |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `sentenceContainsLemma` acepta falsos positivos (`be` en `because`) | Mantener lista de irregulars acotada; no usar `includes` para lemmas &lt; 4 chars |
| `blankLemma` reemplaza token incorrecto en frases raras | Primera ocurrencia + test con frases del dataset real |
| Gate CI demasiado estricto bloquea merges de contenido | Umbrales por mode; reporte accionable; excepciones solo con justificación en PR |
| Refactor grande en un solo PR | 4 PRs acotados según fases |

---

## Checklist global (plan completo)

- [x] Fase 1 — `lib/exercises/eligibility.ts` + tests ✅ (implementado 2026-06-16)
- [x] Fase 2 — `GenerationResult` en fill-blank + callers ✅ (implementado 2026-06-16)
- [x] Fase 3 — fixtures compartidos ✅ (implementado 2026-06-16)
- [x] Fase 4 — invariantes + match-pairs + integración Core 1000 ✅ (implementado 2026-06-16)
- [x] Fase 5 — `validate:core1000-generators` en CI ✅ (implementado 2026-06-16)
- [ ] Fase 6 — docs actualizados

---

## Referencias

- Fix previo (tests): commit `c73be30` — `sentenceContainsWord`, ipa-exceptions, fixtures fill-blank
- Spec a corregir: `docs/superpowers/specs/2026-06-14-core1000-daily-fallback-design.md`
- Generadores: `lib/exercises/generators/*`, `lib/lexicon/exercises.ts`
- Orquestación: `lib/practice/daily-plan/step-builders.ts`
- Validación contenido: `lib/core-1000/validate-core.ts`, `scripts/core-1000/data/ipa-exceptions.json`
