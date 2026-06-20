# Session Arc — Apertura + Cierre (Pedagogy Plan 08)

**Fecha:** 2026-06-19
**Estado:** Diseño aprobado, pendiente de plan de implementación
**Tipo:** 🟠 Eslabón pedagógico — cohesión narrativa de la sesión diaria

## Problema

La auditoría pedagógica del 2026-06-19 diagnosticó: *"Sistema coherente en el motor,
percibido como colección por el alumno."* La sesión diaria es una lista plana de pasos
correctos pero **sin marco narrativo**: empieza en el paso 1 y termina en el último sin
un "esto es lo de hoy" al abrir ni un "esto lograste" al cerrar.

El usuario confirmó que la soltura percibida es: **contenido sin contexto**, **falta de
hilo entre pasos**, y **falta de cierre/repaso**. Faltan los átomos (ejercicios) agrupados
en una molécula (sesión con arco).

Hoy `DailyChecklist` ya tiene una vista `done` con un mensaje genérico hardcodeado
("Daily complete! You completed all N steps") y dispara `celebrate()` (confetti), pero
no recapitula nada de lo aprendido.

## Objetivo

Envolver el checklist diario existente con dos momentos narrativos que **reusan datos que
el plan ya calcula**. Cero APIs externas nuevas, cero tipos de ejercicio nuevos.

Alcance de este plan (decidido con el usuario): **apertura + cierre**. El "hilo entre
pasos" (marcar que una palabra reaparece) queda diferido a un plan 09 posterior.

## Decisiones de diseño (acordadas con el usuario)

1. **Alcance:** apertura + cierre primero; hilo entre pasos diferido.
2. **Contenido del cierre:** las 4 piezas — palabras consolidadas hoy, qué vuelve mañana,
   avance Core 1000 + racha, tema dominante del día.
3. **Ubicación de la apertura:** banner persistente sobre el checklist (no card a pantalla
   completa). Cero taps extra; encuadra sin estorbar.
4. **Offline:** la query "qué vuelve mañana" degrada con gracia — si falla (offline), la
   card de cierre omite esa línea y muestra las otras 3. No rompe el modo offline
   (hard rule de CLAUDE.md).

## Arquitectura

```
// Estructura (DailyChecklist es el <DailyView> real):
// <DailyChecklist>
//   <SessionOpeningBanner />   ← NUEVO: tema del día + Core 1000 (en el <header> del checklist)
//   <DailyStepList />          ← existente, sin cambios
//   <SessionRecapCard />       ← NUEVO: reemplaza el bloque view.mode === 'done' actual
// </DailyChecklist>
```

Dos mount points **ya existen** en `components/daily/DailyChecklist.tsx`:
- El `<header>` del checklist (líneas ~179-193) → ahí se inserta el banner.
- El bloque `if (view.mode === 'done')` (líneas ~146-174) → se reemplaza por `<SessionRecapCard>`.

### Cambio de tipo: `DailyPlan.arc`

Se añade un campo opcional `arc` a `DailyPlan` (`lib/practice/types.ts`), poblado en
`buildDailyPlan`:

```ts
export type SessionArc = {
  /** Tema gramatical dominante de la sesión, vía dominantTopicLabel(). null si no aplica. */
  topicLabel: string | null
  /** IPA del sonido primario del día (del primarySound). null si no hay foco fonético. */
  soundIpa: string | null
  /** Avance Core 1000 antes de la sesión: { current, total }. */
  coreProgress: { current: number; total: number } | null
  /** Palabras tocadas en la sesión (de word_intro/word_review/context_practice). */
  sessionWords: string[]
}

export type DailyPlan = {
  steps: DailyStep[]
  totalExercises: number
  isNewUser: boolean
  arc?: SessionArc   // ← NUEVO
}
```

`arc` es opcional para no romper consumidores existentes ni los snapshots cacheados en
localStorage de planes generados antes de este cambio (degradan a sin-banner).

### Pieza 1 — `SessionOpeningBanner`

- **Responsabilidad única:** mostrar el encuadre del día. Componente de presentación puro.
- Texto ejemplo: *"Hoy: pasado simple · sonido /ɪ/ · 742/1000 palabras"*.
- Props: `arc: SessionArc` (≤ 8 props, una sola).
- Datos: `topicLabel` vía `dominantTopicLabel()` (ya existe, commit `e938f25`), `soundIpa`
  del `primarySound` que `buildDailyPlan` ya calcula, `coreProgress` del conteo Core 1000.
- Si todos los campos relevantes son null (usuario nuevo sin datos), el banner no se renderiza
  (devuelve null) — no mostramos un encuadre vacío.
- Estilo: Tailwind v4 + tokens. Sin inline styles salvo runtime-computed. Reusa el patrón
  visual del `<header>` existente.

### Pieza 2 — `SessionRecapCard`

Reemplaza el bloque `view.mode === 'done'` actual. Muestra las 4 piezas:

1. **Tema dominante** — `arc.topicLabel` + `arc.soundIpa`. Cierra el círculo con la apertura.
2. **Palabras consolidadas hoy** — `arc.sessionWords`.
3. **Qué vuelve mañana** — única pieza con costo de datos. Nueva query en
   `lib/review/client-queries.ts`: cuenta items SM-2 (word_bank + sounds) con `due_date`
   dentro de las próximas 24h. **Degrada con gracia:** try/catch; si falla, la línea se omite.
4. **Core 1000 + racha** — `arc.coreProgress` (antes→después) y la racha de días (fuente de
   racha existente; reusar la que ya alimenta la home).

- Conserva los CTAs actuales del bloque `done` ("Go back home", "Free practice") y el
  `celebrate()` (confetti) que ya se dispara.
- Props: ≤ 8. Probable shape: `{ arc, stepCount, dueTomorrow }` donde `dueTomorrow` es
  `number | null` (null = no disponible / offline).
- ≤ 250 líneas. Si crece, dividir la lista de "palabras consolidadas" en un sub-componente.

### Flujo de datos

```
buildDailyPlan()
  → calcula primarySound, reviewWords, dominantTopicLabel, coreProgress (ya lo hace)
  → empaqueta DailyPlan.arc { topicLabel, soundIpa, coreProgress, sessionWords }
        ↓
useDailyPlan expone plan.arc + allDone (ya existentes)
        ↓
DailyChecklist:
  - SessionOpeningBanner lee plan.arc (al montar checklist)
  - al pasar allDone → true:
      fetchDueTomorrowCount(userId)  // nueva query, degrada a null si falla
      render <SessionRecapCard arc dueTomorrow stepCount />
```

## Capas y reglas (CLAUDE.md / ENGINEERING_STANDARDS.md)

- Nueva query SM-2 → `lib/review/client-queries.ts` (no fetch desde UI).
- Sin prompts (no hay IA en este plan).
- `SessionArc` es metadata derivada; no se persiste como fuente de verdad (se recalcula con
  el plan). El cache de plan en localStorage la incluye pero degrada si falta.
- Componentes ≤ 250 líneas, ≤ 8 props, una responsabilidad. Server Components no aplican
  (estos viven dentro del flujo cliente de `DailyChecklist`).
- Tailwind v4 + tokens, `cn()` para clases condicionales, sin inline styles salvo runtime.

## Testing

- **Unit (lib):** `buildDailyPlan` puebla `arc` con topic/sound/coreProgress/sessionWords
  esperados dado un plan conocido. `fetchDueTomorrowCount` devuelve el conteo correcto y
  devuelve null (no lanza) cuando la query falla.
- **Component:** `SessionOpeningBanner` renderiza el texto esperado y devuelve null cuando
  el arc está vacío. `SessionRecapCard` muestra las 4 secciones, y omite "qué vuelve mañana"
  cuando `dueTomorrow` es null.
- **No regression:** `pnpm test` verde (hoy 624 tests). Los snapshots de planes cacheados
  sin `arc` siguen renderizando (sin banner, recap genérico mínimo).

## Fuera de alcance (YAGNI)

- Hilo entre pasos ("← esta palabra de hace 2 pasos") → plan 09.
- Card de bienvenida a pantalla completa (paso 0) → descartado; banner es suficiente.
- Lectura de due-dates desde Dexie para offline 100% → descartado; degradación con gracia.
- Cualquier API externa nueva.

## Criterios de aceptación

1. Al abrir `/daily`, un banner sobre el checklist declara el tema del día y el avance
   Core 1000 (cuando hay datos).
2. Al completar todos los pasos, la card de cierre muestra: tema dominante, palabras
   consolidadas hoy, avance Core 1000 + racha, y (online) cuántos items vuelven mañana.
3. Offline, la card de cierre omite "qué vuelve mañana" sin romperse.
4. `pnpm test` verde y `pnpm type-check` limpio.
