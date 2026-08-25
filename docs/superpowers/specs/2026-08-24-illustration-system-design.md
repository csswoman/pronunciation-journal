# Sistema mantenible de ilustraciones (empty states) — Diseño

Fecha: 2026-08-24

## Contexto

La app se ve visualmente vacía. El usuario quiere ilustrarla con iconos hand-drawn
de Koboyo (búsqueda vía MCP server, ya conectado en config local del proyecto)
para reforzar la identidad de "app de palabras" y ayudar a la memoria visual.

El proyecto ya tiene los cimientos de un sistema de ilustraciones, pero sin
terminar de cablear:

- `components/illustrations/*.svg` — 8 SVGs ya creados (`empty-vocabulario`,
  `empty-diario`, `empty-lecciones`, `empty-pronunciacion`, `empty-ruta`,
  `empty-conversacion`, `onboarding-bienvenida`, `state-completado`).
  Solo **1 de 8** (`empty-vocabulario`) está conectado a un componente real
  (`WordsEmptyState.tsx`).
- `illustrations/` (raíz) — 18 SVGs sueltos, estilo editorial/decorativo, sin
  consumidores en el código todavía. Fuera de alcance de este diseño.
- `components/EmptyState.tsx` — componente genérico ya existente
  (`illustration: ReactNode`, `title`, `description`, `action`). Es el
  contrato que ya funciona; no se toca su interfaz.
- SVGR (`@svgr/webpack`) ya configurado — un `.svg` importado se usa
  directamente como componente React.

## Objetivo

1. Cablear los 7 SVGs de `components/illustrations/` que no están conectados
   a sus empty states reales, usando siempre `EmptyState` como wrapper.
2. Introducir un registro central (`lib/illustrations/registry.ts`) que
   mapee una clave semántica de sección → componente SVG, para que agregar
   ilustraciones nuevas (vía Koboyo u otra fuente) en el futuro sea un cambio
   de una sola línea en un solo archivo, no imports dispersos por todo el
   código.

No incluye: traer iconos nuevos de Koboyo todavía, ilustrar vocabulario
palabra-por-palabra, ni tocar `illustrations/` (raíz).

## Registro central

`lib/illustrations/registry.ts`:

```ts
import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import EmptyDiario from "@/components/illustrations/empty-diario.svg";
import EmptyLecciones from "@/components/illustrations/empty-lecciones.svg";
import EmptyPronunciacion from "@/components/illustrations/empty-pronunciacion.svg";
import EmptyRuta from "@/components/illustrations/empty-ruta.svg";
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
  emptyJournal: EmptyDiario,
  emptyLecciones: EmptyLecciones,
  emptyPronunciacion: EmptyPronunciacion,
  emptyTracking: EmptyRuta,
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

**Regla hacia adelante:** cualquier ilustración nueva (de Koboyo o cualquier
fuente) se agrega como archivo en `components/illustrations/` + una entrada
nueva en este registry. Nunca se importa un `.svg` directamente en un
componente de feature — siempre se pasa por el registry. Esto es lo que
hace el sistema auditable cuando crezca a decenas/cientos de iconos.

## Mapeo sección → clave (Fase 1)

| Clave | SVG existente | Componente destino | Estado |
|---|---|---|---|
| `emptyVocabulario` | `empty-vocabulario.svg` | `WordsEmptyState.tsx` | Ya conectado — migrar a leer del registry en vez de import directo (consistencia) |
| `emptyJournal` | `empty-diario.svg` | Empty state de journal (a ubicar/crear en `components/journal/`) | Por conectar |
| `emptyLecciones` | `empty-lecciones.svg` | Empty state de `/courses` (a ubicar/crear en `components/courses/`) | Por conectar |
| `emptyPronunciacion` | `empty-pronunciacion.svg` | Empty state de pronunciación (a ubicar/crear en `components/pronunciation/`) | Por conectar |
| `emptyTracking` | `empty-ruta.svg` | `TrackingEmptyState.tsx` | Por conectar (reescribir con `EmptyState` en vez de markup custom) |
| `emptyConversacion` | `empty-conversacion.svg` | `ChatEmptyState.tsx` (AI coach) | Por conectar — usar solo si aplica sin pelear con el hero del `LiquidOrb` ya existente; si el layout actual no tiene un slot de "vacío" tradicional, se deja documentado y se omite sin bloquear el resto |
| `onboardingBienvenida` | `onboarding-bienvenida.svg` | Primer login / onboarding (a localizar) | Por conectar |
| `stateCompletado` | `state-completado.svg` | `StudyEmptyStates.tsx` (fase `"done"`, reemplaza el emoji 🎉 actual) | Por conectar |

**Nota de implementación:** para las filas marcadas "a ubicar/crear", el
plan de implementación debe primero confirmar si ya existe un empty state
real en journal/courses/pronunciation (puede estar inline dentro de otro
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

## Testing

- No se requiere test nuevo para el registry en sí (es un mapa estático,
  TypeScript ya verifica exhaustividad).
- Para cada empty state migrado a usar `EmptyState` + registry, verificar
  visualmente (no hay regla de snapshot testing establecida en el proyecto
  para esto) y correr `pnpm type-check` + `pnpm lint`.

## Fase 2 (fuera de este plan, futuro)

Con el sistema base funcionando, se usa Koboyo MCP para buscar iconos
nuevos por palabra clave, guardarlos en `components/illustrations/`, y
agregar la entrada correspondiente al registry — sin tocar el runtime de
producción ni la arquitectura ya establecida aquí.
