# Plan 079: Unificar la gestión de vocabulario en una superficie coherente ("Mi Léxico")

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- app/(authenticated)/words app/(authenticated)/tracking components/words components/tracking components/vocabulary components/theme/sidebar/navConfig.ts`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/077-dictionary-domain-profile.md
- **Category**: tech-debt, direction, ux
- **Planned at**: commit `a63525d0`, 2026-09-02
- **Verdict**: **REJECTED (2026-09-02)**
  > [!IMPORTANT]
  > **Decisión del usuario (2026-09-02)**: `/tracking` no debe fusionarse ni ocultarse dentro de `/words`. En Tracking el usuario guarda contenido heterogéneo (palabras, frases y lecciones completas), por lo que anidarlo dentro del Diccionario escondería esas entidades y reduciría la descubribilidad. Se preserva como destino autónomo de primer nivel en la barra lateral (`/tracking`), alineado con [`docs/superpowers/specs/2026-08-26-saved-sidebar-restore-design.md`](../docs/superpowers/specs/2026-08-26-saved-sidebar-restore-design.md).

## Why this matters

Actualmente el usuario tiene tres superficies desconectadas para gestionar vocabulario:
1. `/words` (el catálogo estático o Diccionario por categorías CEFR).
2. `/tracking` (las palabras, frases y lecciones que el usuario guarda manualmente o desde lecturas).
3. `/practice/decks` (la sección de "Tus mazos" donde puede organizar grupos de palabras).
Además, existen 3 rutas obsoletas que solo hacen `redirect()` (`/saved`, `/vocabulary`, `/lexicon`).

Esta fragmentación genera fricción y desorientación: un usuario no comprende por qué una palabra guardada desde un Reader va a "Guardadas" (`/tracking`), mientras que si busca una palabra técnica debe ir a "Diccionario" (`/words`) y para agrupar palabras debe ir a "Mazos" (`/practice/decks`). Este plan unifica la experiencia en un solo hub de vocabulario bajo `/words` ("Mi Léxico" / "Vocabulario"), integrando pestañas para palabras guardadas, exploración por categorías y mazos personales, redireccionando `/tracking` a `/words?tab=saved`.

## Current state

- `app/(authenticated)/words/page.tsx:11-58`: Renderiza `WordsClient` con las categorías estáticas del lexicon.
- `app/(authenticated)/tracking/page.tsx:1-6`: Renderiza `TrackingClient` con palabras, frases y lecciones guardadas del usuario.
- `components/vocabulary/decks/UserDecksRuntime.tsx`: Componente aislado de mazos personales del usuario incrustado al pie de `/practice/decks`.
- `components/theme/sidebar/navConfig.ts:40-47`:
  ```ts
  export const consultNav: NavSectionType = {
    label: "Consultar",
    items: [
      { name: "Diccionario", href: "/words", icon: LibraryBig },
      { name: "Guardadas", href: "/tracking", icon: Bookmark },
    ],
  };
  ```
- `app/(authenticated)/saved/page.tsx` y `app/(authenticated)/vocabulary/page.tsx`: Redirigen a `/tracking`.
- `app/(authenticated)/lexicon/page.tsx`: Redirige a `/words`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm test -- tracking`  | all pass            |
| Tests     | `pnpm test -- words`     | all pass            |
| Lint      | `pnpm lint`              | exit 0              |
| Audit     | `pnpm audit:hard-rules`  | exit 0              |

## Scope

**In scope**:
- `app/(authenticated)/words/page.tsx`
- `app/(authenticated)/tracking/page.tsx`
- `components/words/WordsClient.tsx`
- `components/words/VocabularyHubClient.tsx` (nuevo orquestador de tabs)
- `components/theme/sidebar/navConfig.ts`
- Rutas de redirección legacy (`/saved`, `/vocabulary`, `/lexicon`, `/tracking`)

**Out of scope**:
- Cambios en el esquema de base de datos (`word_bank` y `tracked_items` conservan sus tablas e identidades canónicas).
- Cambios en las rutinas de sincronización de `lib/sync/` o `lib/tracking/queries.ts`.
- Alteraciones en la lógica del algoritmo SRS (`lib/word-bank/srs.ts`).

## Steps

### Step 1: Diseñar el componente unificado `VocabularyHubClient`
- Crear `components/words/VocabularyHubClient.tsx` (≤250 líneas) con navegación por pestañas (`tabs`):
  1. `"saved"`: Renderiza `TrackingClient` (en modo embebido `embed={true}`, ya soportado en `TrackingClient.tsx:30-42`).
  2. `"categories"`: Renderiza la vista de categorías del diccionario (`WordsClient`).
  3. `"decks"`: Renderiza la vista de mazos personales (`UserDecksRuntime`).
- Sincronizar la pestaña activa mediante `useSearchParams` (`?tab=saved | categories | decks`) envuelta en `<Suspense>`.

### Step 2: Adaptar `app/(authenticated)/words/page.tsx`
- Leer el search param `tab` (por defecto `"saved"` si el usuario tiene palabras en su banco, o `"categories"` si es nuevo).
- Renderizar `VocabularyHubClient`.

### Step 3: Redirigir `/tracking` a `/words?tab=saved`
- Modificar `app/(authenticated)/tracking/page.tsx` para hacer `redirect('/words?tab=saved')`.
- Actualizar `app/(authenticated)/saved/page.tsx` y `app/(authenticated)/vocabulary/page.tsx` para redirigir directamente a `/words?tab=saved`.

### Step 4: Actualizar la navegación global en `navConfig.ts`
- En `components/theme/sidebar/navConfig.ts`:
  Unificar los dos ítems de `consultNav`:
  ```ts
  export const consultNav: NavSectionType = {
    label: "Consultar",
    items: [
      { name: "Vocabulario", href: "/words", icon: LibraryBig },
    ],
  };
  ```

### Step 5: Verificación
- Correr `pnpm type-check` y confirmar que no hay errores de tipo.
- Correr `pnpm test -- tracking` y `pnpm test -- words`.
- Correr `pnpm audit:hard-rules` y `pnpm lint`.

## STOP conditions
- Si el bundle del cliente en `/words` excede las cuotas de tamaño o genera advertencias severas de dynamic import en producción, detenerse y usar `next/dynamic` para diferir `UserDecksRuntime` y `TrackingClient`.
- Si algún test existente de `tracking` asume que la URL en el navegador debe ser estrictamente `/tracking`, actualizar los tests correspondientes para reflejar el tab unificado.
