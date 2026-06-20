# 01 · Cerrar el loop SRS de vocabulario/gramática

> 🔴 **Crítico** · Estado: 🟡 **Mayormente hecho — queda `text_fragments` + verificación**
>
> **REQUIRED SUB-SKILL:** usa `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar task-by-task. Pasos con checkbox (`- [ ]`).

## Hallazgo de la investigación (2026-06-19)

El brief original se basaba en `docs/architecture/exercises.md:347` ("los ejercicios genéricos no actualizan SM-2 todavía"). **Esa documentación está obsoleta.** El código real ya cierra el loop para dos de las tres fuentes:

| Fuente | SRS | Evidencia |
|--------|-----|-----------|
| `word_bank` | ✅ Cerrado | `lib/practice/queries.ts:100-103` → `enqueueWordBankSRSUpdate`; SM-2 en `lib/word-bank/srs-queries.ts:217` |
| `topic` (conceptos) | ✅ Cerrado | `queries.ts:105-108` → `enqueueTopicSRSUpdate`; plan topic-srs mergeado el 18-jun |
| `text_fragments` | 🔴 **Abierto** | `queries.ts` no tiene rama para `sourceRef.source === 'text_fragments'` |

`sourceRef` y `topic` **sí llegan poblados** a la respuesta (`useSessionState.ts:136-137`), así que el cableado existente no es código muerto.

**Conclusión:** el grueso del plan 01 ya está implementado. Lo que queda es (A) dar SRS a `text_fragments`, (B) verificar el loop end-to-end, (C) corregir la documentación obsoleta.

---

## Decisión de diseño: `text_fragments` → Dexie `srsData`, no Supabase

Los `text_fragments` que entran a práctica son **system sentences** (`user_id = null`, `reorder-from-fragments.ts:40`), no contenido del usuario. Por tanto su progreso SRS es **estado del usuario sobre contenido del sistema** → vive local, por usuario, offline-first.

Reusar el patrón que **Core 1000 ya usa** sobre `db.srsData` (`lib/db/index.ts:248-277`): una tabla `srsData` con clave string `wordId` y prefijo de namespace. Core 1000 usa `core1000:<word>`; aquí usamos `fragment:<fragmentId>`.

Esto:
- No requiere migración Supabase ni RLS.
- Es offline-first por construcción (Dexie).
- Reusa `lib/srs.ts` (SM-2 genérico para Dexie) y los helpers `getSRSData`/`saveSRSData`.

---

## Task 1: Helper SRS para fragmentos en Dexie

**Files:**
- Modify: `lib/db/index.ts` (añadir `FRAGMENT_SRS_PREFIX` + `upsertFragmentSrs`)
- Test: `lib/db/__tests__/fragment-srs.test.ts` (crear)

- [ ] **Step 1 — Test que falla.** Dado un `fragmentId` y un `grade`, `upsertFragmentSrs` crea una fila `srsData` con clave `fragment:<id>` y `nextReview` futuro; una segunda llamada actualiza la misma fila (no duplica).
- [ ] **Step 2 — Implementar.** Mirror de `archiveCore1000Word`/`getCore1000SrsEntries`: prefijo `const FRAGMENT_SRS_PREFIX = 'fragment:'`, `upsertFragmentSrs(fragmentId, grade)` que lee `db.srsData.get(key)`, computa SM-2 con `lib/srs.ts`, y `put`.
- [ ] **Step 3 — `pnpm test fragment-srs`** → PASS.

## Task 2: Enganchar en `savePracticeAnswer`

**Files:**
- Modify: `lib/practice/queries.ts:100-108`
- Test: `lib/practice/__tests__/queries.test.ts` (extender)

- [ ] **Step 1 — Test que falla.** Una respuesta con `sourceRef.source === 'text_fragments'` llama a `upsertFragmentSrs(id, grade)`. Una con `word_bank` NO lo llama (sigue yendo por su rama). Sin sourceRef → ninguna.
- [ ] **Step 2 — Implementar.** Añadir tras el bloque word_bank:
  ```ts
  } else if (answer.sourceRef?.source === 'text_fragments') {
    await upsertFragmentSrs(answer.sourceRef.id, grade)
  }
  ```
  (Dexie es local, no pasa por el outbox — el `await` directo es correcto y offline-safe.)
- [ ] **Step 3 — `pnpm test queries`** → PASS.

## Task 3: Re-entrega de fragmentos vencidos

**Files:**
- Investigar: `lib/practice/daily-plan/*` (cómo se seleccionan los fragmentos hoy) + `lib/review/*`
- Modify: el selector que alimenta `generateReorderFromFragments` para priorizar fragmentos vencidos

- [ ] **Step 1 — Localizar** el punto donde se eligen los `text_fragments` para la sesión (probablemente `async-step-builders.ts`).
- [ ] **Step 2 — Test que falla.** Dada una lista de fragmentos y su estado `srsData`, los vencidos (`nextReview <= now`) se priorizan; los no vistos entran después; los no-vencidos se excluyen/despriorizan.
- [ ] **Step 3 — Implementar** el sesgo de selección reusando `getSRSData`/`getCore1000SrsEntries` como referencia de patrón.
- [ ] **Step 4 — `pnpm test`** → PASS.

> Nota: si el review hub debe **listar** fragmentos vencidos como dominio propio, es alcance extra — decidir al ejecutar. El mínimo es que la **sesión de práctica** los recicle.

## Task 4: Verificación end-to-end del loop completo

- [ ] **Step 1 — Test de integración** (o manual con `pnpm dev`): fallar un `reorder_words` de fuente `text_fragments` → existe fila `srsData` con clave `fragment:<id>` y `nextReview` futuro.
- [ ] **Step 2 — Regresión guard:** confirmar que word_bank y topic **siguen** disparando su SRS (no romper las ramas existentes). Cuidado con el bug histórico de UUID compuesto (obs. 666/673): `text_fragments.id` es UUID; aquí va a clave string de Dexie, no a columna UUID, así que ese riesgo no aplica — confirmarlo.
- [ ] **Step 3 — `pnpm type-check && pnpm test`** verde, sin regresiones.

## Task 5: Corregir documentación obsoleta

**Files:**
- Modify: `docs/architecture/exercises.md` (sección "Spaced Repetition", ~línea 347 y "Extensión futura" ~356)
- Modify: `docs/pedagogy-plans/README.md` (marcar 01 como hecho)

- [ ] **Step 1.** Reemplazar la afirmación "no actualizan SM-2 todavía" por el estado real: word_bank y topic cierran SM-2 vía `savePracticeAnswer`; text_fragments vía Dexie `srsData` (este plan).
- [ ] **Step 2.** Actualizar el README de pedagogy-plans (estado de 01 → ✅).
- [ ] **Step 3 — Commit** del plan completo.

---

## Criterios de aceptación (del plan completo)

- [ ] Fallar un ejercicio de cualquiera de las 3 fuentes (`word_bank`, `topic`, `text_fragments`) agenda su reaparición SRS.
- [ ] Los fragmentos vencidos se priorizan en la sesión de práctica.
- [ ] `docs/architecture/exercises.md` refleja el estado real (no más "todavía no").
- [ ] `pnpm type-check && pnpm test` verde; sin regresiones en word_bank/topic.
- [ ] Modo offline intacto (text_fragments SRS es Dexie-local por diseño).

## Riesgos / decisiones abiertas

- **¿Review hub debe mostrar fragmentos como 4º dominio?** El mínimo (este plan) los recicla en la sesión; exponerlos en el hub es extensión opcional — decidir en Task 3.
- **Mapeo grade:** reusar `answerToGrade` (`lib/practice/grade.ts`) ya usado por las otras dos ramas, para consistencia.
