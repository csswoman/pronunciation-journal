# Plan 058: Extraer "My Words" a Tracking (palabras + frases + lecciones)

## Status

- **Priority**: P2 product
- **Effort**: L
- **Risk**: MED
- **Depends on**: 055 (tap-to-save comparte el patrón de captura; no bloqueante) — ninguna dependencia dura
- **Category**: direction
- **Planned at**: commit HEAD `0c78202f`, 2026-07-18

## Why this matters

Hoy `/words?tab=my-words` solo guarda palabras. El usuario quiere una única
sección **Tracking** para guardar y seguir practicando contenido heterogéneo:
palabras, frases y lecciones marcadas como favoritas. Extraer la colección a su
propia ruta libera `/words` para el léxico/referencia y da un hogar claro al
"contenido guardado para practicar".

## Current state

- `/words` = `app/(authenticated)/words/page.tsx` → `components/words/WordsClient.tsx`
  con dos tabs: `lexicon` y `my-words` (`TAB_IDS = ["lexicon", "my-words"]`).
- `my-words` = `components/words/tabs/MyWordsTabRuntime.tsx`, usa el hook `useWords()`
  sobre `word_bank` (ya tiene `is_favorite` + `toggleFavorite` en
  `lib/word-bank/queries.ts`), SRS de palabras, enrichment y decks.
- **Palabras** viven en `word_bank` (Supabase ⇄ Dexie vía outbox `lib/sync`).
  `POST /api/words` **encola `word_enrichment_jobs`** (restaurado en prod el
  2026-07-18); ese flujo es solo para palabras.
- **Frases**: existe `text_fragments` (oraciones del usuario) con **límite de 10
  por usuario** vía `text_fragments_within_limit()` (`SECURITY DEFINER`) y RLS
  `user_id = auth.uid()`. Sirve para generar ejercicios de oración; no es un store
  general de "frases favoritas".
- **Lecciones**: son JSON en `public/lessons/*` + `public/mini-lessons/*`
  (no viven en la DB). No existe mecanismo de favorito para lecciones.
- **DB**: local y prod quedaron **100% sincronizadas** (`supabase db diff --linked`
  → "No schema changes found"); ver `docs/database/schema-drift-and-state.md`.
- `lib/supabase/types.ts` es generado pero está algo desactualizado.

## Data model decision (confirmar antes de codear)

**Recomendado (v1):** no migrar `word_bank` ni duplicar SRS. Cada tipo se queda en
su hogar natural y Tracking los **compone** en una vista unificada:

- **Palabras** → siguen en `word_bank` (SRS/enrichment/favorito ya existentes).
- **Frases y lecciones (tipos nuevos)** → nueva tabla `tracked_items`:
  `id uuid pk, user_id uuid not null, kind text check (kind in ('phrase','lesson')),
  ref text not null, title text, payload jsonb, created_at, updated_at`.
  - `phrase`: `ref` = hash/uuid, `payload` = { text, context? }.
  - `lesson`: `ref` = slug de la lección/mini-lección (referencia, no contenido).
  - Único por `(user_id, kind, ref)`. RLS `user_id = auth.uid()`.
  - Si se necesita un tope por usuario, usar una función `SECURITY DEFINER`
    (patrón `text_fragments_within_limit`), **nunca** un `count(*)`
    auto-referencial en `WITH CHECK` (causa la recursión que arreglamos).

**Alternativas a evaluar en el plan (con tradeoffs):** (a) tabla polimórfica única
que incluya también palabras (requiere migración de `word_bank` y doble fuente de
verdad del favorito — descartar salvo justificación fuerte); (b) columnas/tabla de
favorito separadas por tipo + capa de lectura que las una.

**Práctica de lo guardado (decisión confirmada — híbrido por fases):** el favorito
es una **señal de prioridad**, no un scheduler nuevo. No se duplica SM-2 ni se tocan
los intervalos existentes.

- **v1 — "Repasar" a demanda dentro de Tracking (in scope):** una acción que arranca
  una sesión de repaso con los ítems del filtro activo (todo / palabras / frases /
  un tema o lección). Resuelve directamente "repasar ciertos temas fácil", funciona
  offline (lectura) y **no arriesga el SRS**. Para lecciones/temas encaja con
  `topic_srs` (y con el plan 048, que convierte `topic_srs` en repaso accionable):
  favoritar un tema = acceso a un clic.
- **v2 — Boost suave en el Daily (follow-up, out of scope aquí):** los favoritos
  entran al Daily como una **cuota pequeña y acotada** (p. ej. 1–2 ítems/día) vía
  `lib/practice/daily-plan/composer.ts`, usada como **prioridad/desempate**,
  **sin modificar los intervalos SM-2** ni saturar el plan. Se especifica en un plan
  aparte cuando v1 esté estable.

## Scope

**In scope**: migración `tracked_items` con RLS; capa Dexie + mapeo en el outbox
`lib/sync`; binding reactivo en `store/`; `lib/tracking/queries.ts`; nueva ruta
`app/(authenticated)/tracking/page.tsx` + `components/tracking/*` con filtro por
tipo (Todo/Palabras/Frases/Lecciones) usando **registry + type guard** para
renderizar cada `kind`; acción "guardar en Tracking" para lecciones/mini-lecciones
y frases; **acción "Repasar" a demanda** que arranca una sesión con los ítems del
filtro activo (v1 del híbrido); redirect `/words?tab=my-words` → `/tracking`;
actualización de navegación (`AppShell`); tests.

**Out of scope**: **boost de favoritos en el Daily** (v2 del híbrido — plan aparte);
SRS propio para frases/lecciones que duplique SM-2; migrar `word_bank`; cambiar el
enrichment de palabras o `/api/words`; rediseñar el léxico; guardar contenido de
lección en la DB (solo se guarda el slug).

## Steps

1. **Migración nueva** `tracked_items` (create + índice `(user_id, kind)` + único
   `(user_id, kind, ref)` + `enable row level security` + policies por
   `user_id = auth.uid()`). Habilitar RLS antes de mergear. Correr
   `supabase db diff --linked --schema public` y confirmar diff vacío.
2. **Tipos**: añadir `tracked_items` a `lib/supabase/types.ts` (a mano o regenerando
   con cuidado — regenerar completo mete ruido de tablas no relacionadas).
3. **Offline-first**: tabla Dexie espejo de `tracked_items`, mapeo en
   `lib/sync` (outbox: create/delete idempotentes), y binding `store/` con
   `useLiveQuery`. Sin fetch a Supabase desde UI; todo por `lib/tracking/queries.ts`.
4. **Queries** `lib/tracking/queries.ts`: `saveTrackedItem`, `removeTrackedItem`,
   `listTrackedItems`; y un `useTracking()` que **une** `word_bank` (palabras) +
   `tracked_items` (frases/lecciones) en un modelo de vista con `kind` y filtro.
5. **Ruta y navegación**: `app/(authenticated)/tracking/page.tsx` (solo compone;
   sin lógica de negocio) + `components/tracking/` (contenedor ≤250 líneas, una
   responsabilidad; sub-componentes listados primero). Registry por `kind` para el
   render de tarjeta/acciones.
6. **Migrar la experiencia my-words**: reutilizar `WordsTab`/`useWords` dentro del
   filtro "Palabras"; conservar quick-add, favoritos, selección y creación de deck.
7. **Redirect y limpieza de `/words`**: `/words?tab=my-words` → `/tracking`
   (preservando deep links); `/words` queda con `lexicon`. Actualizar `AppShell` y
   cualquier enlace a la tab.
8. **Guardar contenido nuevo**: acción "Guardar en Tracking" en detalle de
   lección/mini-lección (guarda slug) y en frases (desde donde aplique).
9. **Repasar a demanda (v1 del híbrido)**: acción "Repasar" en `/tracking` que toma
   los ítems del filtro activo y arranca una sesión reutilizando el engine de
   práctica existente (`lib/practice/`), sin crear un scheduler nuevo ni tocar los
   intervalos SM-2. Palabras → sesión de palabras; frases → práctica de oración;
   lección/tema → abrir lección o repaso vía `topic_srs`.
10. **Tests**: RLS de `tracked_items` (incluir en `scripts/rls-integration.mjs`),
    sync/outbox (create/delete + offline), queries de unión, redirect, la acción
    "Repasar" (arranca sesión con el filtro activo, no altera intervalos), y
    componentes (registry por kind, filtro, accesibilidad).

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- lib/tracking lib/sync components/tracking app/api` | tests verdes |
| `pnpm type-check && pnpm lint` | exit 0 |
| `pnpm exec supabase db diff --linked --schema public` | "No schema changes found" |
| checklist manual | guardar 1 palabra, 1 frase y 1 lección; aparecen en `/tracking`, sobreviven a recarga y funcionan offline (lectura) |

## Done criteria

- [ ] `/tracking` muestra palabras + frases + lecciones con filtro por tipo.
- [ ] La acción "Repasar" arranca una sesión con los ítems del filtro activo y
      **no modifica los intervalos SM-2** existentes.
- [ ] `/words?tab=my-words` redirige a `/tracking` sin romper deep links.
- [ ] `tracked_items` tiene RLS y el `db diff --linked` queda limpio.
- [ ] La feature funciona offline (lecturas reactivas; escrituras vía outbox) y no
      rompe `/api/words` ni el enrichment de palabras.
- [ ] Ningún componente supera 250 líneas; el render por tipo usa registry, no `if/switch`.

## STOP conditions

- El **modelo de datos** (sección arriba) no está confirmado con el owner.
- Cualquier cambio requiere **editar una migración ya aplicada** o deja el
  `db diff --linked` no vacío → detente y reconcilia.
- Se necesita un tope por usuario que tiente a un `count(*)` en `WITH CHECK`
  (usar `SECURITY DEFINER`, no recursión).
- La unión palabras+frases+lecciones exige migrar `word_bank` → separar esa decisión.

## Git workflow and maintenance

- Branch: `feat/058-tracking-saved-content`; commit: `feat(tracking): saved words, phrases and lessons`.
- Mantener el invariante de DB: migraciones nuevas (nunca editar aplicadas), RLS
  antes de mergear, `db diff --linked` vacío tras cada cambio de esquema, y
  `get_advisors` (security) tras DDL. Ver `docs/database/schema-drift-and-state.md`.
