# Plan 006: Progreso no presenta cobertura ni volumen como dominio

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente paso. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- components/progress/LevelConceptsProgressCard.tsx components/progress/LevelConceptsList.tsx lib/progress/can-say-now.ts components/progress/CanSayNowCard.tsx lib/progress/domain-queries.ts lib/progress/topic-progress.ts`
> Ante cualquier discrepancia con "Current state", STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

`docs/architecture/integrated-learning-loop.md` ("Modelo de Progreso") prohíbe
usar completion o volumen como sustituto de aprendizaje, y
`docs/architecture/chunk-first-learning.md:138` exige que etiquetas como "ya
puedes usar esta frase" tengan evidencia "definida y repetida". Dos tarjetas
de `/progress` incumplen eso: "Dominio por temas" pone como cifra principal el
porcentaje de lecciones recorridas (cobertura), y "Can say now" llama
"dominada" a una estructura con dos aciertos que pueden haber ocurrido en la
misma sesión. Además el umbral de dominio de temas está duplicado en dos
archivos. El resultado: un alumno que hizo clic en todos los mazos sin
responder ve "100%" bajo "Dominio".

## Current state

### A. `components/progress/LevelConceptsProgressCard.tsx`

Líneas 76-84:

```tsx
const completedRouteCount = allLessons.filter((l) => l.isRouteCompleted).length;
const total = allLessons.length;
const routePct = total > 0 ? Math.round((completedRouteCount / total) * 100) : 0;
...
const metricIndicators = [
  { count: completedRouteCount, label: "ruta completada", dotClass: "bg-success" },
  { count: mastered.length, label: "retenidos", dotClass: "bg-primary" },
  { count: inReview.length, label: "en aprendizaje", dotClass: "bg-warning" },
];
```

Líneas 92-93: kicker `Dominio por temas`, título `Gramática y Conceptos`.
Líneas ~118-135: la cifra grande es `{completedRouteCount}/{total} completadas ({routePct}%)`
y la barra usa `routePct` con `aria-label="Porcentaje de lecciones completadas..."`.

`lib/progress/topic-progress.ts:27-30` documenta la intención correcta:
"Route completion is intentionally excluded: finishing content is coverage,
not evidence that the underlying concept was retained."

`components/progress/LevelConceptsList.tsx:91`:
```tsx
{item.isRouteCompleted || item.status === "mastered" ? "Repasar" : "Iniciar"}
```
(esto es aceptable: "Repasar" aplica a ambos; no cambiar).

### B. `lib/progress/can-say-now.ts`

```ts
const WINDOW_DAYS = 30            // línea 12
const MASTERY_THRESHOLD = 2       // línea 14
...
for (const attempt of input.attempts) {          // 44-50: solo filtra por recencia
  const at = Date.parse(attempt.answeredAt)
  if (Number.isNaN(at) || at < cutoff) continue
...
if (correct.length >= MASTERY_THRESHOLD) mastered.push(entry)   // línea 71
```

Consumido por `components/progress/CanSayNowCard.tsx:63-65` (lista `data.mastered`).
Test existente: `lib/progress/__tests__/can-say-now.test.ts`.

### C. Duplicación del umbral de dominio

`lib/progress/topic-progress.ts:11-22` (`classifyTopicProgress`) y
`lib/progress/domain-queries.ts:79-89` contienen el mismo par de filtros
(`srsStatus === 'mastered' || (repetitions >= 3 && intervalDays >= 7)`).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/progress components/progress` | all pass |

## Scope

**In scope**:
- `components/progress/LevelConceptsProgressCard.tsx` y `components/progress/__tests__/LevelConceptsProgressCard.test.tsx`
- `lib/progress/can-say-now.ts`, `lib/progress/__tests__/can-say-now.test.ts`, `components/progress/CanSayNowCard.tsx`
- `lib/progress/domain-queries.ts` (solo sustituir el bloque duplicado por la importación)

**Out of scope**:
- `lib/progress/topic-progress.ts` — es la fuente correcta; no cambiar el umbral.
- `lib/progress/projections.ts`, `skill-matrix.ts`, `fluency-scores.ts` — auditados y correctos.
- Cualquier cambio en cómo se escribe `topic_srs` o `answer_history`.

## Git workflow

- Rama: `advisor/006-honest-mastery-claims` desde `dev`.
- Commits convencionales, ej. `fix(progress): unify practice progress sources`.
- No push ni PR sin instrucción.

## Steps

### Step 1: "Dominio por temas" muestra retención como cifra principal

1. En `LevelConceptsProgressCard.tsx`:
   - Kicker: `Dominio por temas` → `Cobertura y retención`.
   - Calcula `masteredPct = total > 0 ? Math.round((mastered.length / total) * 100) : 0`.
   - La cifra grande y la barra pasan a usar `mastered.length` / `masteredPct`,
     con texto `{mastered.length}/{total} retenidos ({masteredPct}%)` y
     `aria-label="Porcentaje de conceptos retenidos en nivel ..."`.
   - Conserva `completedRouteCount` como indicador secundario con label
     `lecciones recorridas` (no "completadas").
2. Actualiza `LevelConceptsProgressCard.test.tsx`: con 10 lecciones, 10
   `isRouteCompleted` y 0 `mastered`, la cifra principal debe ser `0/10`, y
   el texto `10` debe aparecer junto a `lecciones recorridas`.

**Verify**: `pnpm vitest run components/progress/__tests__/LevelConceptsProgressCard.test.tsx` → all pass.
**Verify**: `grep -n "Dominio por temas" components/progress` → sin resultados.

### Step 2: "Can say now" exige aciertos espaciados

1. En `can-say-now.ts` añade `const MIN_SPACING_MS = 24 * 3_600_000` con
   comentario: "dos aciertos en la misma sesión son volumen, no retención".
2. Al calcular `mastered`, ordena los aciertos por fecha y exige que entre el
   primero y el último haya al menos `MIN_SPACING_MS`:
   ```ts
   const sorted = [...correct].sort((a, b) => Date.parse(a.answeredAt) - Date.parse(b.answeredAt))
   const spaced = Date.parse(sorted.at(-1)!.answeredAt) - Date.parse(sorted[0]!.answeredAt) >= MIN_SPACING_MS
   if (correct.length >= MASTERY_THRESHOLD && spaced) mastered.push(entry) else inProgress.push(entry)
   ```
3. En `can-say-now.test.ts` añade: dos aciertos con 5 minutos de diferencia →
   `inProgress`; dos aciertos con 2 días de diferencia → `mastered`.
4. En `CanSayNowCard.tsx`, donde se describe la lista `mastered`, ajusta el
   copy a algo que refleje el criterio, p. ej. "Producidas correctamente en
   días distintos". Localiza el texto actual del encabezado de esa sección y
   sustitúyelo; no cambies la estructura del componente.

**Verify**: `pnpm vitest run lib/progress/__tests__/can-say-now.test.ts` → all pass, incluidos los 2 nuevos.

### Step 3: Un solo umbral de dominio de temas

1. En `lib/progress/domain-queries.ts:79-89` sustituye los dos filtros por
   `const { learningTopics, masteredTopics } = classifyTopicProgress(topics)`
   importando desde `./topic-progress`. Comprueba que `topic-progress.ts`
   importa el tipo `TopicProgressRow` desde `./domain-queries` (import de solo
   tipo; no crea ciclo en runtime). Si `domain-queries.ts` ya importa algo
   de `topic-progress.ts` en runtime y surge un ciclo, mueve
   `classifyTopicProgress` a un archivo nuevo `lib/progress/topic-classify.ts`
   y re-expórtalo desde `topic-progress.ts`.

**Verify**: `pnpm vitest run lib/progress` → all pass.
**Verify**: `grep -c "intervalDays ?? 0) >= 7" lib/progress/*.ts` → exactamente 1 archivo.

### Step 4: Cierre

**Verify**: `pnpm type-check` y `pnpm lint` → exit 0.

## Test plan

- `LevelConceptsProgressCard.test.tsx`: cifra principal = retenidos; recorridas es secundario.
- `can-say-now.test.ts`: espaciado mínimo (2 casos nuevos).
- `domain-queries.test.ts` existente sigue pasando (misma semántica).

## Done criteria

- [ ] `pnpm type-check` exit 0, `pnpm lint` exit 0
- [ ] `pnpm vitest run lib/progress components/progress` all pass
- [ ] `grep -rn "Dominio por temas" components` → 0
- [ ] Solo un archivo en `lib/progress` contiene el umbral `>= 7` de `intervalDays`
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden con el código.
- La importación de `classifyTopicProgress` produce un ciclo que rompe tests
  y el archivo nuevo no lo resuelve.
- Algún otro componente lee `routePct` como prop de esta tarjeta (grep
  `routePct` en `components/`): repórtalo antes de cambiar la semántica.

## Maintenance notes

- Si en el futuro se añade una tarjeta de "cobertura" separada, esa es la
  casa natural de `completedRouteCount`.
- Revisor: comprobar que ningún texto de `/progress` use "dominio",
  "dominada" o "retenida" sobre un dato que provenga de `lesson_completions`
  o de conteos de sesiones.
