# 077 — Diccionario: limpieza de rutas, perfil de dominio y split receptivo/productivo

**Estado:** propuesto · **Rama:** `dev` · **Fecha:** 2026-08-28

## Contexto

`/dictionary` no es una feature: es un alias de 7 líneas sobre `/words` y `/lexicon`.
La sustancia vive en tres capas con nombres solapados:

| Capa | Qué es | Dónde |
|---|---|---|
| Lexicon (catálogo) | 10 JSON estáticos, ~695 términos curados por dominio | `public/lexicon/` + `lib/lexicon/` |
| Word bank (tus palabras) | Tabla Supabase con SRS real | `lib/word-bank/` |
| Ruta `/dictionary` | Alias de vanidad | 4 archivos, 7 líneas |

Hallazgos que motivan el plan:

1. Cada `WordEntry` ya tiene `exampleSentence` — el catálogo **ya es** un corpus de
   chunks, no de palabras sueltas.
2. El catálogo estático solo genera `sentence_context` y solo si el usuario entra a
   `/lexicon/[id]/practice`. El word_bank sí está integrado al daily plan
   (`sound-word-bridge`, `reader-targets`, `grammar-focus`).
3. El AI Coach **no sabe nada** del léxico: cero referencias a lexicon/word_bank en
   `lib/ai-coach/`. No sabe que el usuario trabaja en backend.
4. `personal-interview` (79 términos) es vocabulario de **producción**, no
   técnico-referencial. Mezclarlo con `backend-infra` en el mismo modo de estudio es
   el error de fondo.

## Decisiones tomadas

- **URL canónica: `/words`.** Se borran los alias. El label visible sigue siendo "Diccionario".
- **Split por categoría, automático.** Sin fricción por término, sin columna nueva.
- **Perfil derivado del word_bank.** Sin UI de ajustes, sin verdad declarada que diverja.

## Restricción de esquema (verificada)

`word_bank` **no tiene columna `category`**. Tiene `source` (`"lexicon"` | `"manual"` | …)
y `source_ref` (el `WordEntry.id` del catálogo, ver `lib/word-bank/queries.ts:200-201`).
Como los word-ids son únicos entre catálogos, `source_ref → categoría → dominio` se
resuelve en memoria contra `public/lexicon/`. **Este plan no requiere migración SQL.**

---

## Fase 1 — Limpieza de rutas

**Objetivo:** un solo nombre de URL para el diccionario.

### 1.1 Actualizar los 3 call-sites

- `components/theme/sidebar/navConfig.ts:40` → `href: "/words"` (deja `name: "Diccionario"`)
- `components/practice/hub/ReferenceSection.tsx` → `href="/words"`
  (mantener `setLastPracticeMode('dictionary')` — es una clave de estado, no una ruta;
  verificar contra `lib/db` que no se use como path)
- `components/ai-coach/page-context.ts:18` → `pathname.startsWith("/words")`

### 1.2 Borrar los alias

```
app/(authenticated)/dictionary/layout.tsx
app/(authenticated)/dictionary/page.tsx
app/(authenticated)/dictionary/[id]/page.tsx
app/(authenticated)/dictionary/[id]/practice/page.tsx
app/api/dictionary/[id]/route.ts
```

**Precaución:** `app/(authenticated)/dictionary/layout.tsx` existe — leerlo antes de
borrar por si aporta algo que `words/` no tiene.

### 1.3 Redirect de cortesía

Añadir a `next.config.ts` un redirect permanente `/dictionary/:path*` → `/words/:path*`
para no romper enlaces guardados ni el historial del navegador.

### 1.4 Verificación

- `grep -rn "/dictionary" app components lib hooks store` → solo el redirect
- `lib/navigation/__tests__/is-nav-active.test.ts` y
  `components/layout/__tests__/Sidebar.test.tsx` mencionan dictionary: actualizar
- `pnpm test && pnpm type-check && pnpm lint`

---

## Fase 2 — Perfil de dominio → AI Coach

**Objetivo:** que el coach y los generadores sepan en qué áreas trabaja el usuario.

### 2.1 Derivador de dominio

Nuevo `lib/lexicon/domain-profile.ts`:

```ts
export interface DomainProfile {
  /** Dominios ordenados por nº de palabras guardadas, desc. */
  domains: Array<{ id: LexiconDomainId; label: string; wordCount: number }>;
  /** Categorías concretas, para prompts que quieran más grano. */
  categories: Array<{ id: string; name: string; wordCount: number }>;
}

export function deriveDomainProfile(
  entries: Array<{ source: string | null; source_ref: string | null }>,
): DomainProfile
```

Reglas:
- Solo cuenta entradas con `source === "lexicon"` y `source_ref` no nulo.
- Resuelve `source_ref` → categoría vía índice invertido construido desde
  `public/lexicon/` (reusar el cache de `lib/lexicon/categories.ts`).
- Categoría → dominio vía `domainForCategory` (ya existe en `lib/lexicon/domains.ts`).
- Ignora dominios con `wordCount === 0`. Devuelve perfil vacío sin lanzar.

**Nota de entorno:** `lib/lexicon/categories.ts` usa `fs` y es **server-only**. El
derivador debe vivir del lado servidor, o recibir el índice ya resuelto por parámetro
si se necesita en cliente. Decidir en implementación según dónde se llame.

### 2.2 Extender `UserLearningState`

En `lib/ai-practice/learning-state.ts`, añadir a la interfaz:

```ts
/** Áreas de interés derivadas del word_bank. Vacío = sin señal. */
domainProfile?: DomainProfile | null;
```

Poblarlo en `buildUserLearningState` (`lib/ai-practice/load-state.ts:53`) sumando una
promesa al `Promise.allSettled` existente. Mantener el patrón: si falla, perfil vacío,
nunca romper la carga.

### 2.3 Inyectar en el prompt

En `compactState()` (`learning-state.ts:70`), añadir una línea antes de "Recently covered":

```
Works in: backend & infra, design systems — prefer examples from these areas
```

Solo si `domains.length > 0`. Máximo 2-3 dominios para no inflar el prompt.

### 2.4 Extender `LearnerContext`

`lib/ai-coach/learner-context.ts` ya es el snapshot del coach y hoy devuelve
`weakTargets: []` fijo. Añadir `domains: string[]` y poblarlo desde el mismo derivador.

### 2.5 Verificación

- Test unitario de `deriveDomainProfile`: entradas mixtas (lexicon + manual + nulls),
  perfil vacío, orden por conteo.
- Test de `compactState` con y sin `domainProfile`.
- **Comprobación manual:** guardar 3 palabras de `backend-infra`, abrir el coach,
  confirmar que el prompt incluye la línea de dominio.

---

## Fase 3 — Split receptivo / productivo

**Objetivo:** que el modo de estudio dependa de la naturaleza del vocabulario.

### 3.1 Clasificar los dominios

Nuevo campo en `lib/lexicon/domains.ts`:

```ts
export type StudyMode = "receptive" | "productive";
```

| Dominio | Categorías | Modo | Razón |
|---|---|---|---|
| `engineering` | AI, backend-infra, data-science, frontend-dev | `receptive` | Vocabulario técnico-referencial: el valor está en el reconocimiento a velocidad de lectura, no en la colocación. |
| `design` | ux-design, design-systems | `receptive` | Idem. `ux-design` es limítrofe — revisar tras la Fase 3. |
| `professional` | professional, technical-writing, personal-interview | `productive` | Lenguaje de producción: entrevistas y escritura exigen recuperación activa. |
| `leisure` | (vacío) | `productive` | Cuando se pueble, será conversacional. |

**Decisión abierta señalada:** `ux-design` tiene términos de ambos tipos
("affordance" es referencial; "walk me through your process" es producción). Se deja
`receptive` por defecto; si en uso resulta incorrecto, es el primer candidato a un
override por término (que este plan deliberadamente NO implementa).

### 3.2 Aplicar el modo

- **Receptivo:** el ciclo actual (`sentence_context`, reconocimiento) con intervalos
  SRS más largos. **Sin producción oral.**
- **Productivo:** `exampleSentence` se convierte en chunk practicable — elegible para
  los pasos de producción hablada que ya existen
  (`lib/practice/daily-plan/step-builders.ts`).

Punto de integración: `generateSentenceContextExercises` en `lib/lexicon/exercises.ts`
recibe hoy palabras sin distinguir modo. Añadir el filtro por `StudyMode` en los
selectores del daily plan (`lib/practice/daily-plan/selectors.ts`), no dentro del
generador — mantener el generador puro.

### 3.3 Reflejarlo en la UI

En `/words`, la tarjeta de categoría debe decir qué tipo de estudio implica.
Un badge discreto: "Reconocer" vs "Producir". Sin rediseño — solo la señal.
Tokens de diseño, sin colores hardcodeados.

### 3.4 Verificación

- Test: un término de `backend-infra` no aparece en pasos de producción oral.
- Test: un término de `personal-interview` sí es elegible.
- `pnpm test && pnpm type-check && pnpm lint`
- **Comprobación manual en navegador** del daily plan completo.

---

## Orden de ejecución

Las fases son secuenciales por dependencia:
Fase 1 es independiente y de riesgo casi nulo — hacerla primero y commitear sola.
Fase 2 introduce el derivador que la Fase 3 reutiliza para clasificar.

## Fuera de alcance (deliberado)

- Override de modo por término (añade columna + UI; esperar a que el default falle)
- Poblar el dominio `leisure`
- Migración SQL — no hace falta, `source_ref` basta
- Rediseño de `/words`
- Convertir términos en chunks artificiales: los `exampleSentence` ya existen y son
  reales; no rellenar plantillas alrededor de palabras

## Riesgos

- **Fase 1:** `setLastPracticeMode('dictionary')` podría usarse como ruta en algún
  sitio. Verificar en `lib/db` antes de tocar.
- **Fase 2:** `lib/lexicon/categories.ts` es server-only (`fs`). Si el perfil se
  necesita en cliente, hay que resolver el índice en servidor y pasarlo.
- **Fase 3:** cambiar el modo de estudio altera qué ejercicios ve el usuario a diario.
  Es el cambio de mayor impacto percibido — verificar en navegador, no solo en tests.
