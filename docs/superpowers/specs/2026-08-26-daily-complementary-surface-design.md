# /daily como superficie complementaria + limpieza de "Mr. Salas" + placeholder de ilustraciones

Fecha: 2026-08-26
Rama: dev

## Contexto

`/daily` nació como "la sesión diaria" pero el core del repaso (plan de pasos SRS)
ya vive en Home. Hoy `/daily` repite ese framing: muestra un `RoutinePresetSelector`
denso con 3 tarjetas apretadas, un toggle "Modo Silencioso", y una tarjeta redundante
"Tu plan de pasos está en Inicio / Ver plan del día". El header también repite ese
texto. Resultado: superficie confusa que compite con Home en vez de complementarla.

Además:
- El nombre inventado **"Mr. Salas"** aparece como marca del método
  (`RoutinePresetSelector.tsx:31`, `ImmersionLogCard.tsx:39`, y el id interno
  `salas-60`). Se quiere reemplazar por lenguaje descriptivo, sin persona.
- `TrackingEmptyState` revienta en render con
  *"Element type is invalid... got: object"* porque la regla `@svgr/webpack` de
  `next.config.mjs` está declarada **solo** bajo `turbopack.rules`; fuera de ese
  pipeline `import X from "*.svg"` devuelve un objeto, no un componente.
- Se abandona unDraw. Las ilustraciones se agregarán de a poco; mientras tanto los
  estados vacíos deben usar un placeholder genérico.

## Objetivos

1. Reencuadrar `/daily` como superficie **opcional y complementaria**: la lección
   del día es la sección principal; inmersión y práctica extra son secundarias.
   Todo suma al progreso del estudiante, nada es obligatorio.
2. Eliminar toda referencia a "Mr. Salas" (texto visible e id interno).
3. Arreglar el crash de render de ilustraciones y montar un sistema de placeholder
   para estados vacíos sin arte propio.

## No-objetivos

- No se toca el plan de pasos de Home ni `useDailyPlan` (salvo añadir un campo a
  `ConceptLesson`).
- No se genera contenido nuevo con IA. No se crean tablas ni migraciones.
- No se porta la UI completa de `/mini-lessons/[slug]` dentro de `/daily`.
- No se rediseña `ImmersionLogCard` ni `RecommendedPracticeCard` (solo cambios de
  copy puntuales).
- No se re-colorean ni re-descargan los SVGs existentes (ya usan `currentColor`).

---

## Pieza 1 — Rediseño de `/daily`

### Layout final (de arriba a abajo)

| # | Bloque | Cambio |
|---|--------|--------|
| 1 | `PageHeader` "Sesión diaria" | Subtítulo nuevo: **"La lección de hoy y práctica extra opcional"**. Nunca menciona "Inicio"/"Home". Se eliminan las 3 ramas de subtítulo según `status` (queda uno fijo). |
| 2 | `SessionOpeningBanner` | Sin cambios. |
| 3 | **`DailyLessonCard`** (NUEVA — sección principal) | Ver detalle abajo. |
| 4 | **`StudyTipDisclosure`** (NUEVA — `<details>` colapsable, cerrado por defecto) | "¿Cómo estudiar hoy?" → texto de sugerencia de rutina. Sin selección, sin estado, sin "Modo Silencioso". |
| 5 | `ImmersionLogCard` | Copy: `"Krashen & Salas"` → **`"Krashen"`** (`ImmersionLogCard.tsx:39`). |
| 6 | `RecommendedPracticeCard` (envuelto) | Kicker: `"Después del plan"` → **`"Ejercicios extra de hoy"`** (`DailyChecklist.tsx:216`). |
| 7 | Link "¿Práctica libre? Elige qué trabajar" → `/practice` | Sin cambios. |

### Se elimina

- La tarjeta "Tu plan de pasos está en Inicio / Ver plan del día"
  (`DailyChecklist.tsx:187-197`).
- El componente `RoutinePresetSelector` (`components/daily/RoutinePresetSelector.tsx`)
  **completo**, incluida la exportación del tipo `DailyRoutinePreset`.
- El estado `routinePreset` / `setRoutinePreset` y `silentPeriod` / `setSilentPeriod`
  en `DailyChecklist.tsx` (líneas 74-75) y su render (líneas 180-185).
- El test `components/daily/__tests__/DailyRoutinePresets.test.tsx` (el componente
  que prueba deja de existir).
- El toggle "Modo Silencioso (Solo Escucha)".

### `DailyChecklist.tsx` — qué queda

`DailyChecklist` sigue siendo el orquestador de vistas (`checklist` / `step` /
`done`). Solo cambia la rama `view.mode === 'checklist'` (el "hub"):

- Quita imports y estado del selector.
- El bloque `status === 'ready'` renderiza, en orden: `SessionOpeningBanner`,
  `<DailyLessonCard {...lessonProps} />`, `<StudyTipDisclosure />`.
- `status === 'error'` mantiene su tarjeta de reintento actual.
- Debajo (cualquier status): `ImmersionLogCard`, bloque de "Ejercicios extra de hoy"
  con `RecommendedPracticeCard`, link a práctica libre.
- El archivo debe quedar por debajo de 250 líneas. Si no, extraer la rama del hub
  a un `DailyHub.tsx` propio.

### `DailyLessonCard` (nueva)

**Ubicación:** `components/daily/DailyLessonCard.tsx`

**Responsabilidad:** mostrar la mini-lección del día inline (sin navegar) y ofrecer
tres acciones: ver la lección completa, guardarla, y preguntarle al coach.

**Estructura planificada:**

```tsx
// <DailyLessonCard>            // presentacional; recibe la lección por props
//   <LessonBody />             // ReactMarkdown del body corto
//   <LessonActions />          // 'use client' — usa useAICoachStore + TrackingSaveButton
```

**Props:**

```ts
interface DailyLessonCardProps {
  lesson: {
    slug: string
    title: string
    subtitle: string
    body: string   // markdown corto (MiniLesson.body)
  } | null
}
```

**Render:**

- Si `lesson === null`: estado vacío usando `<EmptyState>` con la ilustración
  placeholder (ver Pieza 3), título "Hoy no hay lección nueva", descripción breve.
- Si hay lección:
  - Encabezado: `lesson.title` (`font-heading` / `text-body` según tokens del
    archivo), `lesson.subtitle` como línea secundaria `text-fg-muted`.
  - `<LessonBody>`: `<ReactMarkdown>{lesson.body}</ReactMarkdown>` dentro de un
    contenedor con las clases de prosa que ya usa el repo (revisar
    `/mini-lessons/[slug]`; reutilizar la misma clase, p. ej. `mini-lessons__prose`
    o equivalente Tailwind). Sin ejercicios ni quiz.
  - `<LessonActions>` (client):
    - **"Ver lección completa"** → `next/link` a `/mini-lessons/${lesson.slug}`.
    - **"Guardar"** → `<TrackingSaveButton kind="lesson" reference={lesson.slug}
      title={lesson.title} />` (ya persiste vía `lib/tracking/queries` y aparece en
      `/dictionary?mode=saved`).
    - **"Pregúntale al coach"** → `useAICoachStore.getState().openCoach({ tab:
      'chat', prefill: \`Explícame más sobre "\${lesson.title}"\` })`. Usar el hook
      `useAICoachStore(s => s.openCoach)` dentro del componente client.

**Límites:** ≤120 líneas el archivo; ≤8 props (tiene 1).

### `StudyTipDisclosure` (nueva)

**Ubicación:** `components/daily/StudyTipDisclosure.tsx`

**Responsabilidad:** sugerencia estática de cómo estructurar el estudio. NO es un
selector: sin `onSelect`, sin estado, sin persistencia.

**Render:** un `<details>` nativo (cerrado por defecto) con `<summary>` "¿Cómo
estudiar hoy?" y contenido:

> Una rutina de referencia — no es obligatoria:
> - ~15 min de repaso espaciado (tu plan del día)
> - ~15 min de lectura y *shadowing*
> - ~30 min de inmersión (video, podcast, serie) — regístrala abajo
>
> El enfoque es **adquisición natural**: comprensión primero, sin forzar el habla
> temprana.

Estilos: tokens existentes, sin `style={{}}`, `cn()` para variantes de estado
open/closed si hace falta. ≤80 líneas.

### `page.tsx` (`app/(authenticated)/daily/page.tsx`)

- `getTodaysMiniLesson()` ya devuelve un `MiniLesson` completo y `MiniLessonSchema`
  incluye `body: z.string()` (verificado en `lib/content/schemas.ts:40`). Por tanto
  **no** hace falta una segunda lectura de disco: `page.tsx` usa `lesson.body`
  directo al construir el objeto `ConceptLesson`.
- `ConceptLesson` (en `hooks/useDailyPlan.ts`) gana `body: string`. Actualizar el
  objeto que arma `page.tsx` y los sitios que construyen `ConceptLesson` de prueba
  (`components/daily/__tests__/DailyChecklist.test.tsx`, y cualquier otro que
  aparezca en grep de `ConceptLesson`).
- El campo `body` es solo para `DailyLessonCard`; `applyPlan` en `useDailyPlan` no
  lo usa (el paso `concept` sigue igual).

### Layout / tokens

- Respetar `PageLayout archetype="session"` y el patrón de `PageHeader variant="compact"`.
- Espaciado entre secciones con las CSS custom props ya usadas
  (`--layout-section-gap`, `--layout-card-pad`, etc.). Sin hardcode.
- La `DailyLessonCard` es visualmente la más prominente (sección principal):
  puede usar `bg-surface-raised` + `shadow-sm` + más padding; las secundarias
  (`StudyTipDisclosure`, links) más discretas.

---

## Pieza 2 — Quitar "Mr. Salas"

| Ubicación | Antes | Después |
|---|---|---|
| `components/daily/RoutinePresetSelector.tsx` completo | "Método Mr. Salas (Adquisición)", id `salas-60`, tipo `DailyRoutinePreset` | **Archivo eliminado.** El concepto "adquisición natural" sobrevive como texto en `StudyTipDisclosure`. |
| `components/daily/__tests__/DailyRoutinePresets.test.tsx` | testea `/Método Mr\. Salas/i` | **Archivo eliminado.** |
| `components/daily/ImmersionLogCard.tsx:39` | `Krashen & Salas` | `Krashen` |
| `components/daily/DailyChecklist.tsx` | importa `RoutinePresetSelector` + `DailyRoutinePreset`, estado `routinePreset='salas-60'` / `silentPeriod` | imports y estado eliminados |

Verificación final: `grep -ri "salas" components app lib` no devuelve nada (fuera de
`.claude/worktrees`).

---

## Pieza 3 — Placeholder de ilustraciones + fix del crash

### Causa del crash

`next.config.mjs` declara la regla `@svgr/webpack` **solo** dentro de
`turbopack.rules`. Cuando un módulo `*.svg` se resuelve fuera de ese pipeline, el
import trae un objeto (`{ default, ... }` o metadata de `next/image`), y
`<Illustration />` lanza *"Element type is invalid... got: object"*
(`components/tracking/TrackingEmptyState.tsx:26`).

### Cambios

1. **`PlaceholderIllustration`** — `components/illustrations/PlaceholderIllustration.tsx`
   - Componente React con SVG **inline** (no import de archivo): marco redondeado
     + glifo simple, `fill`/`stroke` con `currentColor`, `aria-hidden`.
   - Firma: `React.FC<React.SVGProps<SVGSVGElement>>` (acepta `className`, `width`,
     etc.), para ser intercambiable con las entradas del registry.
   - Respeta tema por `currentColor` (hereda del contenedor). Sin dependencia de
     SVGR.

2. **`lib/illustrations/registry.ts`**
   - `ILLUSTRATIONS` pasa a `Record<IllustrationKey, React.FC<...> | null>`; una
     entrada `null` significa "aún sin arte".
   - Nueva key `accountantLaptop` → `import` de
     `components/illustrations/accountant-laptop.svg` (ya usa `currentColor`;
     sirve de ejemplo del patrón nuevo con SVGR arreglado).
   - Las keys unDraw actuales (`emptyVocabulario`, `emptyTracking`,
     `stateCompletado`) se dejan registradas por ahora **pero** se añade el helper:
     ```ts
     export function getIllustration(
       key: IllustrationKey,
     ): React.FC<React.SVGProps<SVGSVGElement>> {
       return ILLUSTRATIONS[key] ?? PlaceholderIllustration
     }
     ```
   - Si algún import unDraw sigue reventando tras el fix del bundler, poner esa
     entrada en `null` (cae al placeholder) en vez de pelear con el SVG.

3. **`components/EmptyState.tsx`**
   - Si `illustration` no se pasa (`undefined`), renderizar `<PlaceholderIllustration />`
     por defecto. Prop sigue siendo opcional; llamadas existentes no cambian.

4. **`components/tracking/TrackingEmptyState.tsx`**
   - `const Illustration = ILLUSTRATIONS.emptyTracking` →
     `const Illustration = getIllustration("emptyTracking")`.
   - Con esto el crash desaparece aunque `emptyTracking` sea `null` o falle.

5. **`next.config.mjs`** — añadir bloque `webpack(config)` paralelo a `turbopack`:
   ```js
   webpack(config) {
     config.module.rules.push({
       test: /\.svg$/,
       use: [{
         loader: "@svgr/webpack",
         options: {
           titleProp: false,
           replaceAttrValues: { "#17B8A6": "currentColor" },
         },
       }],
     });
     return config;
   }
   ```
   Mantiene ambos bundlers tratando `*.svg` igual; previene la reaparición del bug
   en los SVGs que sí se registren (p. ej. `accountant-laptop`).

### Estados vacíos que pasan a placeholder ahora

- `TrackingEmptyState` (filtros `all` / `word` / `phrase` / `lesson`).
- `DailyLessonCard` cuando `lesson === null` (vía `<EmptyState>` sin `illustration`).

---

## Archivos afectados (resumen)

**Nuevos:**
- `components/daily/DailyLessonCard.tsx`
- `components/daily/StudyTipDisclosure.tsx`
- `components/illustrations/PlaceholderIllustration.tsx`
- (posible) `components/daily/DailyHub.tsx` si `DailyChecklist` supera 250 líneas

**Modificados:**
- `app/(authenticated)/daily/page.tsx` — carga `body`, pasa lección a `DailyChecklist`
- `components/daily/DailyChecklist.tsx` — quita selector/estado, monta lección + tip
- `components/daily/ImmersionLogCard.tsx` — copy "Krashen"
- `hooks/useDailyPlan.ts` — `ConceptLesson.body: string`
- `lib/illustrations/registry.ts` — `| null`, `getIllustration`, `accountantLaptop`
- `components/EmptyState.tsx` — placeholder por defecto
- `components/tracking/TrackingEmptyState.tsx` — usa `getIllustration`
- `next.config.mjs` — bloque `webpack()` con SVGR
- `components/daily/__tests__/DailyChecklist.test.tsx` — `ConceptLesson` mocks con `body`

**Eliminados:**
- `components/daily/RoutinePresetSelector.tsx`
- `components/daily/__tests__/DailyRoutinePresets.test.tsx`

---

## Testing

- **`DailyLessonCard`**: nuevo test — renderiza título/subtítulo/body; el estado
  `lesson={null}` muestra el placeholder; "Ver lección completa" apunta a
  `/mini-lessons/<slug>`; el botón de coach llama `openCoach` con `tab: 'chat'` y el
  `prefill` esperado (mock del store).
- **`StudyTipDisclosure`**: render básico, `<details>` cerrado por defecto, el texto
  "adquisición natural" presente, **sin** "Salas".
- **`DailyChecklist`**: actualizar mocks de `ConceptLesson` con `body`. Afirmar que
  ya **no** aparece "Estructura de tu Sesión de Hoy" ni "Modo Silencioso" ni "Tu
  plan de pasos está en Inicio". El hub muestra la `DailyLessonCard`.
- **`TrackingEmptyState`**: render de los 4 filtros sin lanzar; el placeholder está
  presente cuando la entrada del registry es `null`.
- Regresión: `grep -ri "salas"` limpio; `pnpm type-check`, `pnpm lint`, `pnpm test`
  en verde; `pnpm build` sin el error de "Element type is invalid".

## Riesgos

- **`MiniLesson.body` largo**: si el body de algunas mini-lecciones es extenso, la
  sección principal se alarga. Mitigación: `line-clamp` o `max-h` con fade + "Ver
  lección completa" ya visible. Decidir al implementar según el contenido real.
- **Segunda lectura de disco** en `page.tsx` (`getMiniLessonBySlug` tras
  `getTodaysMiniLesson`): despreciable (filesystem, `force-dynamic` ya). Evitarla si
  `getTodaysMiniLesson` ya trae `body`.
- **Otros `import *.svg`** en el repo que hoy funcionan solo por turbopack: el
  bloque `webpack()` los cubre, pero revisar que las opciones SVGR no rompan algún
  SVG que dependa de comportamiento distinto (poco probable; todos usan
  `currentColor`).
