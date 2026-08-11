# Plan 051: Añadir `conjugation_blank` local y offline

## Status

- **Priority**: P1 pedagogical
- **Effort**: M
- **Risk**: MED
- **Depends on**: 046, 048
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17
- **Current status**: REJECTED / deferred (2026-08-11 via Plan 075 — no existe
  catálogo autorado de plantillas; el contrato histórico permanece compatible)

## Why this matters

Los bloques `conjugation` y `verb-table` presentan formas verbales, pero no exigen producirlas. Un ejercicio de blank textual añade recuperación activa offline sin sobrecargar el fill-blank de opciones.

## Current state

- `GrammarCardBlock` expone filas de conjugación y tablas de cuatro columnas.
- No existe una relación universal entre cada fila y una oración completa; el plan original asume plantillas que deben ser explícitas y testeadas.
- ID propuesto 21; el 20 queda reservado para Plan 056.

## Scope

**In scope**: migración ID 21, unión/slugs/adapters/registry, modelo de plantilla local, generador, normalizador, componente propio, topic-review y tests/docs.

**Out of scope**: generar oraciones con Gemini, convertir todas las tablas históricas automáticamente, modificar `FillBlankExercise`.

## Steps

1. Añadir migración segura ID 21↔slug y actualizar mapas exhaustivos.
2. Definir `{ sentence, lemma, answer, topic, hint?, acceptedAnswers? }`; `sentence` debe contener exactamente un `___`.
3. Crear un catálogo tipado de plantillas por topic/deck para v1. Usar filas de conjugación solo cuando una plantilla declara cómo insertar pronombre, lemma y forma; omitir contenido ambiguo.
4. Implementar grading case-insensitive con normalización de apóstrofes y `acceptedAnswers` explícitas para contracciones; no aceptar heurísticas globales `'s = is/has` sin contexto.
5. Crear UI textual siguiendo el layout de FillBlank y el input de SentenceDictation, con feedback `form_error`.
6. Integrar en topic-review como formato adicional cuando haya plantilla; conservar quiz fallback.
7. Tests: schema, una plantilla regular, irregular, contracción explícita, dato ambiguo omitido, IDs/topic y registry.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/exercises/generators components/exercises lib/review` | tests verdes |
| `pnpm check:migrations && pnpm type-check && pnpm lint` | exit 0 |
| `pnpm audit:course-content` | contenido existente sigue válido |

## Done criteria

- [ ] El generador nunca inventa una oración si falta plantilla.
- [ ] Respuestas aceptadas se declaran por ejercicio y no mediante una equivalencia global insegura.
- [ ] El tipo persiste con ID 21 y topic.
- [ ] Funciona offline con contenido ya disponible.

## Deferred decision (Plan 075)

La capacidad no se ofrece ni se selecciona en producto. Se conservan slug, ID
21, schema, adapter, evaluator, renderer y test-gallery para leer y renderizar
historial. El gate para retomarla es un catálogo tipado de plantillas autoradas
que declare oraciones, respuestas aceptadas y fixtures; no se inferirá semántica
desde tablas de conjugación ni se generará contenido con IA.

## STOP conditions

- ID 21 o slug ocupado.
- Para lograr cobertura útil habría que inferir semántica de columnas no tipadas; presentar inventario y ampliar schema en otro plan.

## Git workflow and maintenance

- Branch: `codex/051-conjugation-blank`; commit: `feat(grammar): add conjugation blank exercises`.
- Las nuevas plantillas deben declarar accepted answers y tener fixture; no ampliar heurísticas globales silenciosamente.
