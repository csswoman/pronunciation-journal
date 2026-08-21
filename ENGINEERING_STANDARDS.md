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

`ai-coach`, `ai-practice`, `api`, `auth`, `chunk-of-day`, `content`, `courses`,
`daily`, `db`, `decks`, `degradation`, `essential-words`, `exercises`,
`false-friends`, `gemini`, `home`, `images`, `immersion`, `ipa`, `journal`,
`learning-focus`, `learning-loop`, `lexicon`, `navigation`, `phoneme-practice`,
`practice`, `preferences`, `progress`, `pronunciation`, `review`, `search`,
`security`, `sound-lab`, `sounds`, `speech`, `srs`, `stores`, `supabase`, `sync`,
`theme`, `tracking`, `ui-sounds`, `users`, `vocabulary`, `word-bank`, `word-of-day`.

---

## Query layer — inventario

Módulos activos (`lib/*/queries.ts`):

```text
ai-practice/    courses/        decks/          essential-words/
home/           journal/        learning-focus/ phoneme-practice/
practice/       progress/       sounds/         tracking/
users/          word-bank/
```

`lib/word-bank/` tiene además `server-queries.ts` (server-side) y `srs-queries.ts`;
ambos cuentan como query layer para la regla D de ESLint (`lib/**/*queries*.ts`).

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
  hints.ts                  pistas por tipo de ejercicio
  UnsupportedExercise.tsx   fallback cuando no hay entrada en el registry

lib/exercises/eligibility.ts   assessWordBankEntry — contrato único lemma/contexto/pool
lib/exercises/generation.ts      GenerationResult<T> + SkippedEntry (fill-blank hoy)

components/practice/session/
  ExerciseRenderer.tsx      router (~40 líneas)
  GenericExerciseView.tsx
  PhonemeExerciseView.tsx
```

Al añadir un tipo: entrada en registry + adapter en `lib/practice/adapters.ts` si aplica. **No** condicionales en `ExerciseRenderer`.

Antes de filtrar filas en un generador nuevo, usar `assessWordBankEntry(entry, mode)` — no duplicar reglas de lemma, contexto o pool en el generador. Gates CI: `pnpm validate:essential-words` (contenido) y `pnpm validate:essential-words-generators` (generabilidad por modo).

### Daily plan

Núcleo del módulo (`lib/practice/daily-plan/` tiene más archivos de apoyo):

```text
composer.ts             buildDailyPlan — orquesta
fetchers.ts             delega al query layer
step-builders.ts        ensamblaje puro
async-step-builders.ts  ensamblaje con I/O
selectors.ts            selección pura
policy.ts               reglas de composición del plan
step-completion.ts      estado de avance por paso
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
| `no-restricted-imports` | `lib/**` | error | `@/lib/supabase/client`, `@supabase/*` (type-only imports allowed) |
| `max-lines` | `*.{ts,tsx,js,mjs}` | warn | >300 líneas |

`import type` desde `@/lib/supabase/types` sigue permitido en hooks y components. En `lib/**`, la regla `@supabase/*` permite imports de solo-tipo (`allowTypeImports`) — pasar un `SupabaseClient` como parámetro está bien; construir/importar el browser client fuera del query layer no.

### Excepciones documentadas

Actualizar **este doc**, el header de `eslint.config.mjs` y la allowlist en el mismo PR.

| Archivo | Regla relajada | Motivo |
|---------|----------------|--------|
| `components/auth/AuthProvider.tsx` | Supabase client permitido | Infra auth |
| `lib/db/lessons.ts` | Supabase client permitido | TODO: mover a un módulo `queries.ts` |
| `lib/exercises/generators/reorder-from-fragments.ts` | Supabase client permitido | TODO: mover a un módulo `queries.ts` |
| `lib/ai-practice/load-state.ts` | Supabase client permitido | TODO: mover a un módulo `queries.ts` |
| `lib/api/guards.ts` | Supabase client permitido | Infra de auth de requests server-side (construye su propio admin/token client) |
| `lib/**/*queries*.ts`, `lib/**/realtime.ts`, `lib/auth/**`, `lib/sync/**`, `lib/supabase/**`, `lib/decks/study-source.ts`, `lib/review/build-failed-exercises.ts` | Regla `lib/**` no aplica | Query layer / infra sancionada |

Excepciones de `max-lines` → sección **Tamaño de archivos** más abajo.

### Solo convención (review, no ESLint)

- Lógica de negocio en `app/**/page.tsx`
- Límite soft de 250 líneas en components (`CLAUDE.md`; ESLint avisa a 300)
- Boundaries entre dominios de `lib/` (fuera de la regla Supabase de arriba)

---

## Auditorías automáticas de reglas duras

Complementan ESLint donde una regla no es expresable como lint rule (glob de directorio + texto libre). Todas viven en `scripts/`; `pnpm audit:hard-rules` las corre en orden.

| Script | Comando | Bloquea CI | Qué revisa |
|--------|---------|------------|------------|
| `audit-ai-prompts.mjs` | `pnpm audit:ai-prompts` | Sí | `@google/genai` / `generateContent()` / `systemInstruction:` fuera de `lib/ai-prompts.ts`, `lib/gemini/**`, `lib/word-bank/gemini.ts`, `app/api/gemini/**`, `scripts/**`. También emite **warnings** (no bloquean) por strings tipo instrucción (`You are a...`, `Return ONLY`) en `components/**`/`hooks/**` — posible prompt inlineado. |
| `audit-rls.mjs` | `pnpm audit:rls` | Sí (RLS) / warning (cobertura) | Toda tabla nueva en `supabase/migrations/*.sql` tiene `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` (bloqueante). Advierte (no bloquea) si la tabla no tiene un caso en `scripts/rls-integration.mjs`. |
| `lint:design-tokens` (`lint-design-tokens.mjs`) | `pnpm lint:design-tokens` | Sí (reglas 1-5) / warning (regla 6) | Valores Tailwind arbitrarios (hex, text-size, spacing fuera de grid 4px, radius) + **raw-color** (hex/rgb/hsl/oklch literal fuera de brackets Tailwind y fuera de `RAW_COLOR_ALLOWLIST`, bloqueante). Regla 6 (`style={{...}}` que parece literal puro) es heurística y solo advierte — un regex no puede distinguir con certeza "computado en runtime" de "hardcodeado" sin parsear JS de verdad. |
| `audit-state-duplication.mjs` | `pnpm audit:state-duplication` | No (siempre exit 0) | Heurística: stores en `lib/stores/*.ts` con `persist()` (fuera de `PERSIST_ALLOWLIST`) o cuyos campos de estado coinciden con nombres de tabla Dexie (`lib/db/index.ts`) — posible duplicación de dominio entre Dexie y Zustand. |

Los scripts bloqueantes usan allowlists explícitas al tope del archivo (`RAW_COLOR_ALLOWLIST`, `GENAI_ALLOWLIST_PREFIXES`, `ALLOWED_LEGACY_FILES`) — añadir una excepción real requiere editar la allowlist con una razón, no silenciar el script.

---

## Tamaño de archivos — allowlist ESLint

Fuente de verdad: `MAX_LINES_ALLOWLIST` en `eslint.config.mjs`. No dupliques la
lista aquí — churnea con cada split y se desincroniza.

Categorías de exención (todas requieren justificación al añadir):

| Categoría | Ejemplos | Justificación |
|---|---|---|
| Generados | `lib/supabase/types.ts` | Salida de tooling, no se edita a mano |
| Datasets estáticos | `lib/pronunciation/ipa-data.ts`, `lib/courses/curriculum.ts`, `lib/sounds/minimal-pairs.ts` | Datos, no lógica; dividir no aporta |
| Registries | `lib/ai-practice/tools/registry.ts`, `lib/pronunciation/targets/registry.ts` | Crecen por entrada; la longitud es la señal correcta |
| Scripts | `scripts/**` | No se despliegan |
| Tests | `lib/**/__tests__/*.test.ts` | Cobertura exhaustiva por caso |
| Deuda pendiente de split | `lib/db/index.ts`, `lib/phoneme-practice/exercises.ts`, `lib/practice/daily-plan/composer.ts`, `lib/sync/sync-manager.ts` | Módulos cohesivos a la espera de extracción |

La última categoría es deuda real, no una exención permanente: al tocar uno de esos
archivos, considera extraer antes de añadir.

---

## Mantenimiento

Al cambiar reglas arquitectónicas:

| Cambio | Actualizar |
|--------|------------|
| Regla dura / styling / componentes | `CLAUDE.md` |
| Flujo de trabajo del agente / contrato de diseño | `AGENTS.md` |
| Patrón, inventario, ESLint | este doc + `eslint.config.mjs` |
| Nueva excepción ESLint | los tres |

Los inventarios de este doc (feature folders, query layer) se desincronizan con
facilidad. Al añadir una carpeta en `lib/` o un `queries.ts`, actualízalos en el
mismo PR — o verifícalos con `ls lib/` y `ls lib/*/queries.ts`.

Última revisión: 2026-08-21 — sincronización de inventarios con el código
(`core-1000` → `essential-words`, query layer 9 → 14 módulos, allowlist `max-lines`
delegada a `eslint.config.mjs`).
