# Plan 049: Añadir un perfil de intereses transversal y seguro

> Los intereses se leen server-side para prompts. No confíes en una lista enviada por el cliente a rutas Gemini.

## Status

- **Priority**: P1 product
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction / migration
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Reader y AI Coach generan contenido genérico. Un perfil de hasta diez intereses permite tematizar la práctica sin crear currículos paralelos y será reutilizable por Journal.

## Current state

- `user_profiles` guarda identidad y CEFR, con RLS por `id = auth.uid()`.
- `lib/users/queries.ts` es el query layer cliente; no existe `lib/users/server-queries.ts`.
- `/profile` compone `ProfileSettings`; el archivo ya tiene cambios locales al planificar, por lo que el ejecutor debe hacer drift check antes de tocarlo.
- `buildGenerateReaderUserPrompt` y `buildSentenceReorderUserPrompt` no reciben intereses.
- `practicePrefs` es el store Dexie k/v adecuado para cache local.

## Scope

**In scope**: migración `user_profiles.interests`, tipos Supabase, queries cliente/servidor, cache en `practicePrefs`, `components/profile/InterestsEditor.tsx`, integración en Profile, helper de prompts e integración server-side en Reader y AI Coach.

**Out of scope**: recomendar intereses con Gemini, más de diez valores, cambiar `targetHash` de Reader, Journal (planes 052–054), nuevos lexicons.

## Steps

1. Migrar `interests jsonb NOT NULL DEFAULT '[]'` con checks de array, máximo 10 strings y longitud razonable; conservar las RLS existentes.
2. Regenerar `lib/supabase/types.ts`. Crear normalizador puro: trim, lowercase English slug/label, dedupe, allowlist curada; rechazar texto libre no permitido en v1.
3. Extender `UserPreferences`, añadir `updateInterests`, cachear el último valor válido en `practicePrefs` por usuario y crear tests de fallback offline.
4. Crear `InterestsEditor` accesible con chips bilingües, máximo 10, estados saving/error; integrarlo sin ampliar `ProfileSettings` por encima de 250 líneas.
5. Crear `interestsClause(interests)` en `lib/ai-prompts.ts`. Añadir parámetros opcionales a builders sin cambiar output cuando la lista esté vacía.
6. Crear query server-side con cliente autenticado/user-scoped y conectar Reader/AI Coach. El servidor obtiene los intereses del usuario autenticado; el cliente no controla los intereses enviados al modelo.
7. Documentar que `targetHash` no incluye intereses: solo pasajes nuevos reflejan cambios.

## Verification

| Command | Expected |
|---|---|
| `pnpm check:migrations && pnpm audit:rls` | exit 0 |
| `pnpm test -- lib/users lib/ai-prompts components/profile app/api/gemini/generate-reader` | tests verdes |
| `pnpm type-check && pnpm lint` | exit 0 |

## Done criteria

- [ ] El usuario puede guardar 0–10 intereses propios y otro usuario no puede leerlos.
- [ ] Reader y AI Coach se tematizan desde datos leídos en servidor.
- [ ] Builders sin intereses conservan su salida anterior.
- [ ] El cache local no mezcla usuarios.
- [ ] Ningún prompt nuevo vive en componentes.

## STOP conditions

- El cambio requiere enviar intereses confiables desde el body del cliente.
- `ProfileSettings.tsx` cambió semánticamente desde el drift check; reconciliar con el propietario antes de editar.
- Las políticas consolidadas actuales no permiten actualizar la nueva columna con sesión autenticada.

## Git workflow and maintenance

- Branch: `codex/049-interest-profile`; commit: `feat(profile): personalize practice by interests`.
- Toda ruta Gemini futura debe obtener intereses desde una sesión user-scoped; revisar allowlist y límite al ampliar chips.
