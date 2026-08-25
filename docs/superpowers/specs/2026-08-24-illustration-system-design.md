# Sistema mantenible de ilustraciones (empty states) — Diseño

Fecha: 2026-08-24 (revisado)

## Contexto

La app se ve visualmente vacía. El usuario quiere ilustrarla con iconos
hand-drawn de Koboyo (búsqueda vía MCP server, ya conectado en config local
del proyecto) para reforzar la identidad de "app de palabras" y ayudar a la
memoria visual.

**Decisión:** las ilustraciones vienen exclusivamente de Koboyo. Los 8 SVGs
que existían antes en `components/illustrations/` fueron borrados por el
usuario — no se reutilizan ni sirven de referencia. Se parte de la carpeta
vacía.

Lo que ya existe en el proyecto y sí se reutiliza:

- `components/EmptyState.tsx` — componente genérico ya existente
  (`illustration: ReactNode`, `title`, `description`, `action`). Es el
  contrato que ya funciona; no se toca su interfaz.
- SVGR (`@svgr/webpack`) ya configurado — un `.svg` importado se usa
  directamente como componente React.
- `illustrations/` (raíz) — 18 SVGs sueltos, estilo editorial/decorativo, sin
  consumidores en el código. Fuera de alcance de este diseño; no se tocan.

## Objetivo

1. Para cada sección de la app con un empty state relevante, buscar en
   Koboyo (vía MCP) una ilustración hand-drawn adecuada, guardarla en
   `components/illustrations/`, y cablearla usando siempre `EmptyState`
   como wrapper.
2. Introducir un registro central (`lib/illustrations/registry.ts`) que
   mapee una clave semántica de sección → componente SVG, para que agregar
   ilustraciones nuevas en el futuro sea un cambio de una sola línea en un
   solo archivo, no imports dispersos por todo el código.

No incluye: ilustrar vocabulario palabra-por-palabra (fase futura, fuera de
este diseño), ni tocar `illustrations/` (raíz).

## Flujo de trabajo por icono

Para cada clave del mapeo (ver abajo):

1. Buscar en Koboyo por palabra clave relacionada al concepto de la sección
   (ej. "empty notebook", "no results", "book stack", "microphone").
2. Elegir el resultado que mejor calce visualmente con el resto (estilo
   hand-drawn, línea simple — coherente entre sí).
3. Guardar el SVG en `components/illustrations/<nombre-semantico>.svg`.
4. Agregar la entrada correspondiente a `lib/illustrations/registry.ts`.
5. Cablear (o crear, si no existe) el empty state del componente destino
   usando `EmptyState` + la clave del registry.

Este flujo nunca toca el runtime de producción de forma directa — Koboyo
solo se usa como fuente de assets en tiempo de desarrollo. La app en
producción solo importa SVGs ya guardados en el repo.

## Registro central

`lib/illustrations/registry.ts`:

```ts
import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import EmptyJournal from "@/components/illustrations/empty-journal.svg";
import EmptyLecciones from "@/components/illustrations/empty-lecciones.svg";
import EmptyPronunciacion from "@/components/illustrations/empty-pronunciacion.svg";
import EmptyTracking from "@/components/illustrations/empty-tracking.svg";
import EmptyConversacion from "@/components/illustrations/empty-conversacion.svg";
import OnboardingBienvenida from "@/components/illustrations/onboarding-bienvenida.svg";
import StateCompletado from "@/components/illustrations/state-completado.svg";

export type IllustrationKey =
  | "emptyVocabulario"
  | "emptyJournal"
  | "emptyLecciones"
  | "emptyPronunciacion"
  | "emptyTracking"
  | "emptyConversacion"
  | "onboardingBienvenida"
  | "stateCompletado";

export const ILLUSTRATIONS: Record<IllustrationKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
  emptyJournal: EmptyJournal,
  emptyLecciones: EmptyLecciones,
  emptyPronunciacion: EmptyPronunciacion,
  emptyTracking: EmptyTracking,
  emptyConversacion: EmptyConversacion,
  onboardingBienvenida: OnboardingBienvenida,
  stateCompletado: StateCompletado,
};
```

Uso en un componente:

```tsx
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";

const Illustration = ILLUSTRATIONS.emptyJournal;

<EmptyState illustration={<Illustration />} title="..." description="..." />
```

Este patrón sigue la misma forma que `generic-registry.tsx`
(`lib/practice/exercise-renderer/`): objeto tipado, clave por dominio,
componente resuelto por lookup en vez de importado ad-hoc.

**Regla hacia adelante:** cualquier ilustración nueva se agrega como archivo
en `components/illustrations/` + una entrada nueva en este registry. Nunca
se importa un `.svg` directamente en un componente de feature — siempre se
pasa por el registry. Esto es lo que hace el sistema auditable cuando crezca
a decenas/cientos de iconos.

**Nota de implementación:** el `IllustrationKey` union arranca vacío o con
solo las claves que efectivamente se cablean en la primera pasada. No se
declaran claves para SVGs que aún no existen — TypeScript exige que el
`Record` esté completo, así que cada clave se agrega en el mismo cambio que
trae su SVG. El registry crece incrementalmente, icono por icono.

## Mapeo sección → clave (punto de partida)

| Clave | Concepto a buscar en Koboyo | Componente destino | Estado |
|---|---|---|---|
| `emptyVocabulario` | vocabulario / lista de palabras vacía | `WordsEmptyState.tsx` | Conectado (`WordsEmptyState.tsx`) |
| `emptyJournal` | notebook / diario vacío | Empty state de journal (a ubicar/crear en `components/journal/`) | Omitido — `JournalHistoryTimeline.tsx` retorna `null` a propósito para ≤1 entradas ("una sola página no necesita navegación lateral"), y `journal/page.tsx` siempre renderiza `JournalNotebookClient` (superficie de escritura), nunca un estado vacío. No hay punto de inserción natural. |
| `emptyLecciones` | libro / estantería / ruta de aprendizaje | Empty state de `/courses` (a ubicar/crear en `components/courses/`) | Omitido — `CoursePathPage.tsx` se alimenta de `COURSE_PATH_CURRICULUM.levels`, un objeto estático siempre poblado por diseño. No existe (ni tiene sentido) una rama de cero lecciones. |
| `emptyPronunciacion` | micrófono / ondas de sonido | Empty state de pronunciación (a ubicar/crear en `components/pronunciation/`) | Omitido — `app/(authenticated)/courses/pronunciation/page.tsx` es un redirect puro a `/practice/sounds`, no renderiza nada propio; no hay superficie donde colocar una ilustración. |
| `emptyTracking` | lista de seguimiento vacía | `TrackingEmptyState.tsx` | Conectado (`TrackingEmptyState.tsx`) |
| `emptyConversacion` | burbuja de chat / conversación | `ChatEmptyState.tsx` (AI coach) | Omitido — `ChatEmptyState.tsx` ya es el empty state completo de AI coach, construido alrededor del hero `LiquidOrb`. Agregar una segunda ilustración compite visualmente con el orb, que ya es el visual completo del estado vacío; se documenta como omitido según el edge case ya previsto en este spec. |
| `onboardingBienvenida` | bienvenida / saludo | Primer login / onboarding (a localizar) | Omitido — la única UI de primera sesión encontrada es `HomeFirstSessionHint.tsx`, un banner inline compacto y descartable (una línea de texto + botón de cerrar), no una pantalla de bienvenida ilustrada. Una ilustración Koboyo quedaría sobredimensionada ahí. No existe una pantalla de onboarding real donde insertarla. |
| `stateCompletado` | trofeo / check / celebración | `StudyEmptyStates.tsx` (fase `"done"`, reemplaza el emoji 🎉 actual) | Conectado (`StudyEmptyStates.tsx`) |

**Nota:** para las filas marcadas "a ubicar/crear", el plan de
implementación debe primero confirmar si ya existe un empty state real en
journal/courses/pronunciation (puede estar inline dentro de otro
componente) antes de crear uno nuevo. Si no existe ningún punto de
inserción natural, se documenta como omitido en vez de forzar un empty
state artificial.

## Errores / edge cases

- Si un componente que usaría `EmptyState` ya tiene un layout muy distinto
  (ej. `ChatEmptyState` con su propio hero de `LiquidOrb`), no se fuerza el
  wrapper genérico — se decide caso por caso si la ilustración encaja como
  acompañamiento visual o si esa superficie queda fuera de esta fase.
- El registry no valida en runtime que la clave exista (TypeScript ya lo
  garantiza vía `Record<IllustrationKey, ...>` — si falta una entrada, no
  compila).
- Consistencia visual entre iconos: como todos vienen de Koboyo, preferir
  el mismo estilo (ej. "Original" hand-drawn) para los ocho, en vez de
  mezclar estilos (Original / Cartoon / Solid) entre secciones distintas.

## Testing

- No se requiere test nuevo para el registry en sí (es un mapa estático,
  TypeScript ya verifica exhaustividad).
- Para cada empty state migrado a usar `EmptyState` + registry, verificar
  visualmente (no hay regla de snapshot testing establecida en el proyecto
  para esto) y correr `pnpm type-check` + `pnpm lint`.

## Fase 2 (fuera de este plan, futuro)

Con el sistema base funcionando, se repite el mismo flujo Koboyo →
`components/illustrations/` → registry para ilustrar vocabulario por
categoría semántica y otras superficies que se identifiquen más adelante.
