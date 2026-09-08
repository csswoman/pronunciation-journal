# AI Coach — Exercise Layout & Automatic Coach Feedback Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Single-flow execution.

**Goal:** Resolver la colisión visual del título largo con la píldora de progreso en la cabecera de ejercicios, y hacer que el feedback del coach sea automático al terminar el ejercicio sin respuesta vacía ni clics innecesarios.

**Architecture:**
1. Reestructurar `SessionHeader` en `PracticeSession.tsx` a un contenedor flex vertical de dos filas (píldora arriba, título completo abajo con `line-clamp-2`).
2. Automatizar `onComplete` en `PracticeSession.tsx` mediante un `useEffect` protegido por `completeSentRef`, eliminando el botón "Continuar con el Coach" y sus estados asociados mientras se preserva la tarjeta de resumen.
3. Actualizar la copia del mensaje enviado al completar el ejercicio en `AICoachPanelViews.tsx` y `MissionWorkspace.tsx` para evitar términos (`exercise`, `practice`, etc.) que fuerzan `exercise_request` y causan respuestas vacías.
4. Pruebas unitarias de layout, auto-disparo de `onComplete` y detección de intención como conversación.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Vitest · Tailwind v4

---

### Task 1: Actualizar la copia del mensaje de finalización en `AICoachPanelViews.tsx` y `MissionWorkspace.tsx`
- **Archivos:**
  - Modificar: `components/ai-coach/AICoachPanelViews.tsx:157`
  - Modificar: `components/ai-coach/missions/MissionWorkspace.tsx:268`
  - Test: `lib/ai-practice/__tests__/intent-detection.test.ts`
- **Cambio:**
  - Cambiar el texto a: `` `I just finished — ${s.correct} of ${s.total} right. How did I do?` ``
  - Agregar test de regresión en `intent-detection.test.ts` asegurando que esta frase resuelva a `conversation`.

### Task 2: Reestructurar `SessionHeader` a dos filas en `PracticeSession.tsx`
- **Archivos:**
  - Modificar: `components/ai-coach/PracticeSession.tsx:35-44`
  - Test: `components/ai-coach/__tests__/PracticeSession.test.tsx`
- **Cambio:**
  - Quitar `relative` del contenedor y `absolute right-4 ...` de la píldora.
  - Usar layout vertical `flex-col items-center gap-1.5 px-4 py-2.5 text-center` con `EJERCICIO X DE Y` en la primera fila y el título con `line-clamp-2` en la segunda.
  - Agregar test verificando que títulos largos se rendericen junto con la píldora sin colisión.

### Task 3: Auto-disparo de `onComplete` y eliminación del botón en `PracticeSession.tsx`
- **Archivos:**
  - Modificar: `components/ai-coach/PracticeSession.tsx`
  - Test: `components/ai-coach/__tests__/PracticeSession.test.tsx`
- **Cambio:**
  - Agregar `completeSentRef = useRef(false)`.
  - Disparar `onComplete?.({ total, correct: correctCount })` en `useEffect` cuando `isFinished` es `true` y `!completeSentRef.current`.
  - Eliminar el estado `completedSent`, la función `handleContinue`, y el botón "Continuar con el Coach". Limpiar imports no utilizados (`Button`, `Check`).
  - Actualizar los tests de `PracticeSession.test.tsx` para verificar que `onComplete` se invoque automáticamente y que el botón ya no exista.

### Task 4: Verificación integral
- Ejecutar test específicos de `PracticeSession.test.tsx` e `intent-detection.test.ts`.
- Ejecutar `pnpm type-check` y `pnpm lint`.
- Actualizar `docs/plans/task.md`.
