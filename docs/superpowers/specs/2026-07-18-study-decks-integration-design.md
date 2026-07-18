# Study-decks integration — design

**Fecha:** 2026-07-18
**Estado:** aprobado (brainstorming), pendiente de plan de implementación

## Contexto y problema

La app tiene dos conceptos distintos que se llaman "deck", en rutas distintas, lo que confunde a los usuarios:

1. **Grammar study decks** — 147 JSON de solo lectura (`lib/courses/grammar-deck`, `public/grammar-decks/`), las tarjetas de aprendizaje de la ruta A1–C1 + temas. Se muestran en `/practice/decks`, página titulada "Decks".
2. **Decks SRS del usuario** — mazos de vocabulario creados por el usuario (tablas Supabase `decks`/`word_bank_decks`, SM-2). Se crean y gestionan en una **pestaña dentro de `/words`** (`components/words/tabs/DecksTabRuntime.tsx`).

Es decir: la página que se llama "Decks" **no** es donde creas tus decks; esos viven bajo "Words". Además, el contenido de teoría de la ruta no se ofrece como hábito diario: el plan diario tiene un paso `concept` (mini-lección rotativa en inglés) pero nada ligado al progreso del usuario en la ruta.

**Resultado buscado:** (A) una IA de "decks" clara y unificada, y (B) una estrategia para estudiar teoría a diario ligada al progreso de la ruta.

## Enfoque elegido

**Hub unificado (co-ubicar, no fusionar).** Los dos modelos de datos permanecen separados (JSON estático de solo lectura vs. filas Supabase con SRS); solo cambia dónde aparece cada cosa en la navegación. Se descartó la fusión real de modelos (migración grande, toca RLS/SRS/offline, alto riesgo) y el enganche-diario-solo (no resuelve la duda de IA).

## Sección 1 — Hub "Decks" unificado

`/practice/decks` se convierte en el hub único con dos secciones apiladas:

- **"Aprende"** — los 147 study decks del sistema por nivel/tema (lo que ya renderiza `DecksIndexClient`) + el enlace a Essential Words que ya está ahí.
- **"Tus mazos"** — los decks SRS del usuario, con el botón **Crear mazo**. Se reubica aquí la lógica de `DecksTabRuntime` (crear/editar/estudiar/gestionar/borrar), reutilizándola tal cual.

`/words` **deja de tener la pestaña "Decks"** y queda enfocado en su rol de fuente de vocabulario: "Mis palabras" (word bank) + léxico por categorías. El flujo "añadir palabra a un mazo" (`CreateDeckFromWordsModal`) se mantiene y apunta a mazos que ahora gestionas en Decks.

**Sin cambios de modelo de datos ni de RLS.** Los ítems de navegación "Decks" y "Words" ya existen; no cambian.

## Sección 2 — Paso diario "Estudia teoría"

Nuevo `DailyStepKind = 'study_deck'`, un paso de estudio (análogo a `concept`).

**Selección del deck (todo cliente, el plan diario ya corre en el navegador):**
lee `db.completedLessons` (Dexie) → `deriveLevelView` sobre el nivel activo → toma la lección **"current"** (primera esencial pendiente) → enlaza a `studyLessonPath(nivel, número)` = `/courses/study/{n}?level={nivel}`. Reutiliza `deriveLevelView`, `lessonProgressKey` y `studyLessonPath`; no hay lógica de selección nueva.

- **Nivel activo:** el que ya usa la Ruta (`CoursePathAutoLevelSync` / preferencias). Usuario nuevo sin progreso → primera lección de su nivel de colocación (o A1).
- **Nivel completado:** avanza a la primera pendiente del siguiente nivel; si completó todo, cae a un deck "Extra/opcional" no visto. Nunca queda vacío; si aun así no hay candidato, el slot lo recupera la práctica.

**Decisión (b): `study_deck` es un paso ADICIONAL**, convive con `concept`. No lo reemplaza.

**El paso lleva a su visor completo, que conserva los ejercicios/quiz del final de la lectura.** Requisito explícito del usuario: no se elimina la ejercitación que cada contenido trae al terminar de leer.
- `concept` → `/mini-lessons/{slug}`, que incluye su quiz (`MiniLessonQuiz`).
- `study_deck` → `/courses/study/{n}`, cuyo visor `GrammarStudyDeck` ya recorre `cards → quiz → done → practice` (muestra el quiz del deck si existe y genera una sesión de práctica). El paso diario **no** hace `exercises: []` pasivo: enlaza al visor que mantiene esas fases.

**El paso diario no completa la lección de la ruta.** Marcar el step como hecho (vía `markDone`: localStorage + `recordDailyStepCompletion`) refuerza el hábito, pero completar la lección sigue requiriendo sus ejercicios. Se mantienen separados "estudié hoy" y "completé la lección".

## Sección 3 — Presupuesto de pasos, archivos y pruebas

**Presupuesto de pasos (consecuencia de (b)):** con `concept` + `study_deck` presentes, la teoría ocupa 2 de los 5 slots y la práctica baja a 3. Para que no compitan de forma frágil, el composer **reserva los 2 últimos slots para teoría** (`concept`, `study_deck`) y llena los **3 primeros con práctica**. El plan queda estable: 3 práctica + mini-lección + estudia-teoría = 5. Si no hay candidato de `study_deck`, ese slot lo recupera la práctica.

**Archivos afectados (reutilizar, no reescribir):**

- IA hub:
  - `app/(authenticated)/practice/decks/page.tsx` — añade la sección "Tus mazos".
  - Extraer la lógica de `components/words/tabs/DecksTabRuntime.tsx` a un componente compartido bajo `components/vocabulary/decks/` consumido por el hub.
  - `components/words/WordsClient.tsx` y `components/words/WordsHero.tsx` — quitar la pestaña "Decks".
  - Navegación: sin cambios.
- Paso diario:
  - `lib/practice/types.ts` — `+'study_deck'` en `DailyStepKind`.
  - `lib/practice/daily-plan/step-builders.ts` (o `async-step-builders.ts`) — builder nuevo con `deriveLevelView`/`studyLessonPath`.
  - `lib/practice/daily-plan/composer.ts` — reservar los 2 slots de teoría al final.
  - `components/daily/DailyStepList.tsx` — rama de render tipo `concept` (lectura con href), reutilizada para `study_deck`.

**Pruebas:**

- Unit (Vitest, extendiendo `lib/practice/__tests__/daily-plan.test.ts`): el builder de `study_deck` elige la lección "current" dado un set de `completedLessons`; fallback cuando el nivel está completo; el composer siempre entrega 5 pasos con los 2 de teoría al final; cuando no hay candidato, práctica recupera el slot.
- Integridad IA: test que verifique que Words ya no expone la pestaña Decks y que el hub lista study decks + mazos de usuario.
- Verificación manual: plan diario con usuario nuevo (A1 lección 1) y con progreso parcial; crear un mazo desde el hub; confirmar que al abrir el paso `study_deck` el visor muestra cards → quiz → práctica.

## Fuera de alcance (YAGNI)

- No se fusionan los modelos de datos de decks.
- No se tocan RLS ni el algoritmo SRS.
- No se auto-completa la lección de la ruta al hacer el paso diario.
- No se re-etiqueta el core-1000 (trabajo separado, pausado).
