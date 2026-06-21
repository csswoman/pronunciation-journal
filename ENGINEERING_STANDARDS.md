# Engineering Standards

Complemento operativo de `CLAUDE.md`.  
**Reglas duras, styling, componentes, state model y checklist** → `CLAUDE.md`.  
**Este doc** → dónde colocar código en `lib/`, enforcement ESLint, inventarios y rutas de referencia.

---

## `lib/` — primitivos vs dominio

`lib/` root = primitivos compartidos. Todo lo demás → `lib/<feature>/`.

### Va en root solo si

- Función o tipo puro, sin conocimiento de dominio.
- Sin I/O (Supabase, Dexie, `fetch`, Gemini).
- Reutilizable sin arrastrar conceptos de otra feature.

### Va en `lib/<feature>/` si

- Toca un dominio (decks, fonemas, word bank…).
- Hace I/O o llama APIs externas.
- Necesita subcarpetas (`modes/`, `tools/`, `__tests__/`).

### Checklist para un archivo nuevo

1. ¿Puro, sin dominio, sin I/O? → `lib/<name>.ts`
2. ¿No? → `lib/<feature>/<name>.ts` (reutilizar carpeta existente)
3. Nunca dominio ni I/O en root.

### Excepción de path fijo

`lib/ai-prompts.ts` — mandato de `CLAUDE.md`, no es primitivo.

### Feature folders (inventario)

`admin`, `ai-coach`, `ai-practice`, `api`, `auth`, `content`, `core-1000`, `courses`,
`daily`, `db`, `decks`, `exercises`, `home`, `images`, `ipa`, `lexicon`, `notion`,
`phoneme-practice`, `practice`, `progress`, `pronunciation`, `sound-lab`, `sounds`,
`speech`, `srs`, `stores`, `supabase`, `sync`, `theory-lessons`, `users`, `word-bank`.

---

## Query layer — inventario

Módulos activos (`lib/*/queries.ts`):

```text
users/          decks/          sounds/         word-bank/
progress/       home/           practice/       phoneme-practice/
theory-lessons/ ai-practice/
```

Excepciones de infra (no son query modules de dominio):

| Archivo | Rol |
|---------|-----|
| `components/auth/AuthProvider.tsx` | Sesión auth — único componente con Supabase client |
| `lib/auth/session.ts` | `getAccessToken()` |
| `lib/supabase/client.ts` | Factory browser — solo query layer + auth |
| `lib/supabase/server.ts` | Server-side (API routes, RSC) |

---

## Referencias de implementación

Patrones descritos en `CLAUDE.md` → aquí las rutas concretas a copiar.

### Realtime + optimistic UI

```text
lib/word-bank/realtime.ts
lib/word-bank/change-events.ts
lib/word-bank/apply-word-bank-change.ts   ← función pura, testeada
hooks/useWords.ts                         ← solo orquestación
```

### Exercise registry

```text
lib/practice/exercise-renderer/
  guards.ts                 isPhonemeExercise / isGenericExercise
  generic-registry.tsx      clave: GenericExercise.type
  phoneme-registry.tsx      clave: ExerciseType
  legacy-bridge.ts          único cast fonema → Exercise legacy

lib/exercises/eligibility.ts   assessWordBankEntry — contrato único lemma/contexto/pool
lib/exercises/generation.ts      GenerationResult<T> + SkippedEntry (fill-blank hoy)

components/practice/session/
  ExerciseRenderer.tsx      router (~40 líneas)
  GenericExerciseView.tsx
  PhonemeExerciseView.tsx
```

Al añadir un tipo: entrada en registry + adapter en `lib/practice/adapters.ts` si aplica. **No** condicionales en `ExerciseRenderer`.

Antes de filtrar filas en un generador nuevo, usar `assessWordBankEntry(entry, mode)` — no duplicar reglas de lemma, contexto o pool en el generador. Gates CI: `pnpm validate:core1000` (contenido) y `pnpm validate:core1000-generators` (generabilidad por modo).

### Daily plan

```text
lib/practice/daily-plan/
  composer.ts       buildDailyPlan
  fetchers.ts       delega al query layer
  step-builders.ts  ensamblaje puro
  selectors.ts      selección pura
```

### AI tools registry

```text
lib/ai-practice/tools/registry.ts
```

### Rutas Gemini

- Las rutas `/api/gemini/*` usan `lib/gemini/fallback.ts` para el orden de
  modelos y la clasificación de reintentos.
- Los prompts viven en `lib/ai-prompts.ts`, no inline en las rutas.
- Los límites de frecuencia permanecen en cada endpoint salvo que exista una
  decisión explícita para compartirlos.

---

## ESLint guardrails

Fuente: `eslint.config.mjs`. Ejecutar `pnpm lint` en cada PR.

### Reglas enforced

| Regla | Ámbito | Nivel | Bloquea |
|-------|--------|-------|---------|
| `no-restricted-imports` | `hooks/**` | error | `@/lib/supabase/client` |
| `no-restricted-imports` | `hooks/**` | error | `@supabase/*` |
| `no-restricted-imports` | `components/**` | error | `@/lib/supabase/client` |
| `max-lines` | `*.{ts,tsx,js,mjs}` | warn | >300 líneas |

`import type` desde `@/lib/supabase/types` sigue permitido en hooks y components.

### Excepciones documentadas

Actualizar **este doc**, el header de `eslint.config.mjs` y la allowlist en el mismo PR.

| Archivo | Regla relajada | Motivo |
|---------|----------------|--------|
| `components/auth/AuthProvider.tsx` | Supabase client permitido | Infra auth |
| `lib/supabase/types.ts` | max-lines off | Generado |
| `lib/pronunciation/ipa-data.ts` | max-lines off | Dataset estático |
| `lib/courses/curriculum.ts` | max-lines off | Dataset estático |

### Solo convención (review, no ESLint)

- Prompts inline en components
- Lógica de negocio en `app/**/page.tsx`
- Límite soft de 250 líneas en components (`CLAUDE.md`; ESLint avisa a 300)
- Boundaries entre dominios de `lib/`

---

## Tamaño de archivos — allowlist ESLint

Archivos exentos del warning `max-lines` (300):

```text
lib/supabase/types.ts
lib/pronunciation/ipa-data.ts
lib/courses/curriculum.ts
```

Archivos actuales por encima del límite (warnings esperados hasta split):

- `lib/db/index.ts`
- `lib/phoneme-practice/exercises.ts`

---

## Mantenimiento

Al cambiar reglas arquitectónicas:

| Cambio | Actualizar |
|--------|------------|
| Regla dura / styling / componentes | `CLAUDE.md` |
| Patrón, inventario, ESLint | este doc + `eslint.config.mjs` |
| Nueva excepción ESLint | los tres |

Última revisión: 2026-06-16 — eligibility contract (`assessWordBankEntry`), gates `validate:core1000-generators`.
