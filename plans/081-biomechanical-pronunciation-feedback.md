# Plan 081: Conectar guías biomecánicas al feedback de pronunciación en `speakEvaluator`

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- lib/exercises/evaluation/speakEvaluator.ts lib/sounds/articulation-guides.ts`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: pedagogy, product
- **Planned at**: commit `a63525d0`, 2026-09-02

## Why this matters

El archivo `lib/sounds/articulation-guides.ts` contiene un inventario pedagógico de alta precisión (`PHONEME_ARTICULATION_GUIDES`) que detalla colocación de lengua, labios, flujo de aire, advertencias de interferencia ("trampa hispana") y tips biomecánicos en español para los fonemas más difíciles del inglés. Sin embargo, el evaluador de voz (`lib/exercises/evaluation/speakEvaluator.ts`) **no está conectado** a este recurso: cuando un alumno falla la pronunciación de una palabra, el tip que recibe es un mensaje genérico: *"Concéntrate en el sonido /.../: escucha el modelo e inténtalo de nuevo"* o *"Separa la palabra en sílabas"*.

Al conectar `speakEvaluator.ts` con `PHONEME_ARTICULATION_GUIDES`, el usuario recibe de inmediato una instrucción motora accionable (ej. *"Tócate la garganta: NO debe haber ninguna vibración. El aire pasa continuamente entre los dientes y la lengua"* para `/θ/`), transformando un feedback pasivo en una corrección física efectiva.

## Current state

- `lib/sounds/articulation-guides.ts:20-60`: Define `PHONEME_ARTICULATION_GUIDES` con claves como `'/θ/'`, `'/ð/'`, `'/iː/'`, `'/ɪ/'`, `'/æ/'`, etc. Cada guía tiene `biomechanicsTip`, `spanishTrap`, `tonguePosition`, `lipsPosition`.
- `lib/exercises/evaluation/speakEvaluator.ts:62-67`:
  ```ts
  const phonemeTip = missedPhoneme
    ? `Concéntrate en el sonido /${missedPhoneme}/: escucha el modelo e inténtalo de nuevo.`
    : isEarlyLearner
      ? "Escucha la palabra y repítela despacio."
      : "Separa la palabra en sílabas y vuelve a grabarte.";
  ```
- `lib/exercises/evaluation/speakEvaluator.ts:18-32`: `firstMissedPhoneme(wordResults)` extrae el símbolo IPA o ARPAbet del primer fonema fallido.

## Commands you will need

| Purpose   | Command                                         | Expected on success |
|-----------|-------------------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                               | exit 0, no errors   |
| Tests     | `pnpm test -- speakEvaluator`                   | all pass            |
| Tests     | `pnpm test -- articulation-guides`              | all pass            |
| Lint      | `pnpm lint`                                     | exit 0              |

## Scope

**In scope**:
- `lib/exercises/evaluation/speakEvaluator.ts`
- `lib/sounds/articulation-guides.ts` (exportar helper de lookup tolerante a slashes o variaciones)
- `lib/exercises/evaluation/__tests__/speakEvaluator.test.ts` (pruebas con feedback enriquecido)

**Out of scope**:
- Modificar el algoritmo de alineación fonética de `lib/pronunciation/phonemes.ts`.
- Alterar la lógica de scoring acústico/STT.

## Steps

### Step 1: Añadir función helper de resolución en `lib/sounds/articulation-guides.ts`
- Exportar una función pura:
  ```ts
  export function findArticulationGuide(phoneme: string): ArticulationGuide | null
  ```
  que normalice el símbolo (remueva slashes `/`, espacios, diacríticos secundarios) y busque en `PHONEME_ARTICULATION_GUIDES`.

### Step 2: Enriquecer `feedbackForScore` en `lib/exercises/evaluation/speakEvaluator.ts`
- Importar `findArticulationGuide` en `speakEvaluator.ts`.
- Al detectar `missedPhoneme`, consultar la guía biomecánica correspondiente:
  ```ts
  const guide = missedPhoneme ? findArticulationGuide(missedPhoneme) : null;
  const phonemeTip = guide
    ? `${guide.biomechanicsTip} (Ojo: ${guide.spanishTrap})`
    : missedPhoneme
      ? `Concéntrate en el sonido /${missedPhoneme}/: escucha el modelo e inténtalo de nuevo.`
      : isEarlyLearner
        ? "Escucha la palabra y repítela despacio."
        : "Separa la palabra en sílabas y vuelve a grabarte.";
  ```
- Si la interfaz de feedback admite metadata opcional (`tipDetails`), adjuntar la guía completa para que la UI pueda renderizar el diagrama de articulación (`diagramType`).

### Step 3: Tests de caracterización
- En `lib/exercises/evaluation/__tests__/speakEvaluator.test.ts`, añadir tests que validen:
  1. Cuando un intento falla en un fonema con guía registrada (ej. `θ` en `think`), el feedback incluye el `biomechanicsTip`.
  2. Cuando el fonema fallido no tiene guía específica, se preserva el fallback amigable existente sin arrojar excepciones.

### Step 4: Verificación
- Correr `pnpm test -- speakEvaluator`.
- Correr `pnpm type-check` y `pnpm lint`.

## STOP conditions
- Si la inclusión de `PHONEME_ARTICULATION_GUIDES` en `speakEvaluator.ts` genera ciclos de importación entre `lib/exercises` y `lib/sounds`, mover los tipos o el helper a `lib/sounds/articulation-lookup.ts` para mantener la regla de imports unidireccionales de ESLint.
