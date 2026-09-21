# 16 · Ritmo adaptativo del plan diario (Modo Foco)

> 🟠 **Importante** · Impacto medio-alto · Estado: 📋 Propuesto (2026-09-20)
>
> Auditoría de `app/(authenticated)/focus/*` + `lib/practice/daily-plan/*`.
> El motor de selección diaria ya es sólido (SM-2 real, error-recurrence
> separado, puente fonema↔vocabulario, reserva de slots para no ahogar
> contenido nuevo). Este brief ataca 3 puntos donde el motor sigue tratando
> a todos los alumnos igual, con constantes fijas en vez de señales del
> propio alumno.

## Contexto (lo que ya funciona, no tocar)

- `lib/practice/grade.ts` ya convierte respuesta → grade SM-2 real, con
  reglas propias para `speak_word`/`written_production`/`spoken_production`
  y para reintentos (`firstTryFailed`).
- `lib/practice/error-recurrence.ts` programa el regreso de un *patrón* de
  error a 1/3/7 días, satisfecho por cualquier ejercicio que lo entrene —
  no repite el mismo ítem.
- `lib/practice/daily-plan/policy.ts` reserva slots para material nuevo
  (`RESERVED_CHUNK_NEW_SLOTS`) y topea el repaso (`MAX_DUE_STEPS`) para que
  un backlog no se coma la sesión completa.
- `lib/practice/daily-plan/diagnostic-prescription.ts` avanza la
  prescripción por sesión completada, no por calendario.

Ninguno de los 3 briefs de abajo reemplaza esta arquitectura: la extienden
inyectando una señal por-alumno donde hoy hay una constante global.

---

## Brief A — Umbrales de tiempo por tipo de ejercicio ⚡

**Problema:** `lib/practice/grade.ts:6-7,41-43` usa `FAST_THRESHOLD_MS = 5000`
y `NORMAL_THRESHOLD_MS = 15000` para **todo** slug sin score explícito. El
propio código ya lo marca como deuda (`grade.ts:4-5`, TODO). Un
`reorder_words` tarda naturalmente más que un `speak_word`; con el umbral
único, una respuesta correcta pero de un tipo de ejercicio lento recibe
grade 3 ("normal") en vez de 4-5, empeorando su intervalo SM-2 sin que el
alumno haya hecho nada mal.

**Objetivo:** Reemplazar las dos constantes globales por un mapa
`slug → { fastMs, normalMs }` con fallback a los valores actuales para
slugs no mapeados. Sin cambio de comportamiento para slugs no listados.

**Alcance mínimo (quick win, bajo riesgo):**
1. Mapa de umbrales por slug en `grade.ts` (o archivo hermano
   `grade-thresholds.ts` si crece), arrancando con los slugs de mayor
   volumen: `reorder_words`, `match_pairs`, `sentence_dictation`.
2. `answerToGrade` busca el umbral por `answer.slug`, cae a los defaults
   actuales si no hay entrada.
3. Ajustar `lib/practice/__tests__/grade.test.ts` con casos por slug
   mapeado, preservando los tests existentes (fallback) sin modificarlos.

**Criterios de aceptación:**
- [ ] Un slug sin entrada en el mapa se comporta exactamente igual que hoy
      (mismos umbrales 5000/15000).
- [ ] `reorder_words` (o el slug que se mapee primero) con tiempo de
      respuesta "lento para el promedio de la app pero normal para su tipo"
      recibe grade 4-5, no 3.
- [ ] `pnpm test` y `pnpm type-check` verdes.

**Riesgo:** bajo. Cambio aislado a una función pura, ya cubierta por tests.

---

## Brief B — Cadencia de misiones orales sensible a evitación 🟠

**Problema:** `lib/practice/daily-plan/mission-cadence.ts:11-19` fija
`MISSION_DAYS_OF_WEEK = [1, 3, 5]` (L/M/V): la misión oral aparece el mismo
día de la semana para todos los alumnos, sin importar si el alumno la
completa, la abandona a medio camino, o sistemáticamente la evita. Un
alumno con ansiedad de producción oral recibe la misma dosis fija que uno
que ya domina su sonido objetivo — ni se protege al primero de la
sobrecarga, ni se le da más repetición real cuando la necesita.

**Objetivo:** Condicionar `shouldOfferMission` a una señal de
completado/abandono reciente de misiones, además del día fijo, sin perder
la garantía de que el alumno **nunca** pase semanas sin una (la razón por
la que la cadencia fija existe hoy — ver comentario en
`mission-cadence.ts:1-8`).

**Señal necesaria (a definir en implementación):**
- Tasa de completado de las últimas N misiones ofrecidas (ya hay
  `markDiagnosticPrescriptionSessionComplete`-style tracking para
  prescripción; buscar si existe equivalente para `missionLaunch` o si hay
  que añadir un registro mínimo en Dexie).
- Regla propuesta: si el alumno abandonó las últimas 2 misiones antes de
  completarlas, la siguiente misión se ofrece en su forma más corta/con
  scaffolding adicional en vez de saltarse un ciclo — mantener la garantía
  de exposición, bajar la fricción.

**Criterios de aceptación:**
- [ ] Un alumno que completa sus misiones con normalidad no nota cambio de
      cadencia (paridad con el comportamiento actual).
- [ ] Un alumno que abandona 2 misiones seguidas recibe la siguiente con
      menor fricción (duración/objetivo reducido), no una misión idéntica
      repetida sin ajuste.
- [ ] La garantía "nunca sin misión por semanas" se preserva — no se debe
      poder llegar a `shouldOfferMission` devolviendo `false` indefinidamente
      para un mismo alumno.

**Riesgo:** medio. Requiere decidir dónde vive la señal de
completado/abandono (Dexie nuevo campo vs. derivarlo de `answer_history`) y
tocar `composer.ts:229` (`missionAllowedToday`). Diseñar como spec aparte
antes de implementar si el tracking de abandono no existe todavía.

---

## Brief C — Prioridad de selección diaria dependiente del alumno 🟠

**Problema:** `lib/practice/daily-plan/policy.ts:7-26`
(`REASON_PRIORITY`) es un ranking estático idéntico para todo alumno:
`due` > `chunk_new`/`grammar_slot` > `word_new`/`recent_error`/`weak_target`
> `route_next` > `saved_intent` > `variety`. Un alumno avanzado con alta
tasa de aciertos reciente se beneficiaría de más `variety`/producción
libre antes que repaso mecánico; un alumno con ansiedad de producción se
beneficiaría de más `variety` (bajo riesgo) antes de forzar `word_new`.
Hoy ambos reciben el mismo orden.

**Objetivo:** Mover `REASON_PRIORITY` de constante a una función que reciba
el nivel efectivo del alumno (ya disponible vía
`getEffectiveLearnerLevel`, usado en `composer.ts:102`) y/o una métrica de
aciertos recientes, y devuelva un ranking ajustado — sin cambiar la
interfaz pública de `selectDailyCandidates` (sigue siendo priorización
pura, determinista, testeable).

**Alcance mínimo:**
1. Extraer `REASON_PRIORITY` a una función `reasonPriorityFor(context)`
   con el mapa actual como caso base/default.
2. Definir 1-2 reglas de ajuste iniciales, no todo el espacio de
   variación: ej. nivel C1/C2 baja la prioridad relativa de `word_new`
   frente a `variety`/producción.
3. `composer.ts` pasa el contexto (nivel, ratio de aciertos si existe) al
   construir los candidatos.

**Criterios de aceptación:**
- [ ] Sin contexto adicional (caso default), el orden es idéntico al
      `REASON_PRIORITY` actual — no rompe ningún test existente de
      `policy.ts`/`composer.ts`.
- [ ] Con nivel avanzado (C1/C2), la selección resultante prioriza
      `variety` por encima de `word_new` en al menos un caso de prueba
      explícito.
- [ ] `pnpm test` y `pnpm type-check` verdes.

**Riesgo:** medio-alto. Toca el núcleo del composer (`composer.ts:240-252`
donde se construyen los `candidate()`); requiere cuidado para no romper la
reserva de slots (`RESERVED_CHUNK_NEW_SLOTS`) ni el tope de `due`
(`MAX_DUE_STEPS`), que dependen del orden estable actual.

---

## Orden recomendado de ejecución

1. **A** (umbrales por slug) — aislado, bajo riesgo, ya identificado como
   deuda en el propio código.
2. **C** (prioridad por alumno) — mayor impacto pedagógico, pero requiere
   diseñar los 1-2 casos de ajuste inicial con cuidado para no
   desestabilizar la reserva de slots.
3. **B** (cadencia de misiones) — depende de decidir primero dónde vive el
   tracking de abandono; conviene resolverlo después de tener más datos de
   uso real de misiones (`missionLaunch`) para saber si el abandono es un
   problema real o hipotético.

## Notas de arquitectura

- Ninguno de los 3 briefs introduce un sistema nuevo: extienden
  `grade.ts`, `mission-cadence.ts` y `policy.ts` respectivamente, cada uno
  ya diseñado como módulo puro y testeado en aislamiento.
- Grading IA no aplica aquí — estos son ajustes de lógica pura de
  selección/scheduling, no prompts nuevos.
- Antes de implementar B o C, escribir spec en
  `docs/superpowers/specs/` si el diseño de la señal (abandono, ratio de
  aciertos) no es obvio en una sesión — ambos dependen de una fuente de
  datos que hoy puede no existir todavía.
