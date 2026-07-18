# Plan 054: Entregar la experiencia Journal y conectarla con Daily

## Status

- **Priority**: P1 product
- **Effort**: M
- **Risk**: MED
- **Depends on**: 052, 053
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Los planes anteriores dejan datos y corrección sin superficie usable. Este plan entrega prompt diario, editor, feedback, historial y entrada desde Daily sin mezclar lógica de negocio en páginas.

## Current state and decision

- Las páginas App Router son compositores finos; queries viven bajo `lib/<domain>`.
- Daily ya soporta pasos `concept` con `href`. No crear `DailyStepKind='journal'` en v1: reutilizar un paso concept evita duplicar render/session/checklist para una navegación externa.
- Prompts diarios deben ser deterministas y offline; Gemini solo corrige.

## Scope

**In scope**: `lib/journal/prompts.ts`, hooks de Journal, página `/journal`, componentes ≤250 líneas, navegación, opt-in de palabras y paso concept opcional en Daily, tests/a11y.

**Out of scope**: weekly retention T59, múltiples entradas por día, editor rich text, generación Gemini de prompts, auto-guardar palabras.

## Steps

1. Implementar pool local tipado de prompts y selección determinista por fecha local + interés rotado. Mismo usuario/fecha produce el mismo prompt offline.
2. Crear página server fina y componentes: `JournalPromptCard`, `JournalEditor`, `JournalFeedbackView`, `JournalHistoryList`; separar orquestación en hook.
3. Autosave debounced a Dexie mediante el repositorio de Plan 052; mostrar saved/pending/error sin prometer sincronización remota.
4. Permitir Submit solo con contenido válido; online solicita corrección, offline conserva submitted/pending y ofrece corregir al reconectar.
5. Renderizar diff accesible y errores expandibles. Para cada `newWord`, checkbox opt-in que llama `quickAddWord`; fallo individual no revierte la corrección.
6. Añadir acceso de navegación. En Daily, insertar como máximo un paso `concept` con `href:'/journal'`, `estMinutes:5`, en cadencia documentada y sin desplazar el mínimo de ejercicios evaluados.
7. Probar rotación por fecha/interés, autosave, offline→online, selección de palabras, historial y Daily.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/journal components/journal components/daily` | tests verdes |
| `pnpm type-check && pnpm lint && pnpm lint:design-tokens` | exit 0 |
| `pnpm test:a11y` | sin regresiones |

## Done criteria

- [ ] Draft sobrevive reload offline y muestra estado real.
- [ ] Reconexión permite corregir sin duplicar entry.
- [ ] Guardar palabras es explícito e independiente por candidato.
- [ ] Daily enlaza a Journal sin reducir la garantía de práctica evaluada.
- [ ] Componentes respetan 250 líneas, tokens y query-layer.

## STOP conditions

- Daily necesita marcar Journal completo sin una señal durable verificable; no simular completitud.
- Los cambios locales actuales en Profile/UI se solapan con navegación compartida; reconciliar antes de editar esos archivos.

## Git workflow and maintenance

- Branch: `codex/054-journal-ui`; commit: `feat(journal): ship daily writing loop`.
- Si se añade más de una entrada diaria, revisar primero unique diario, selección de prompt y semántica de completitud de Daily.
