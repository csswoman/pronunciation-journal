# QA manual — Reader en el daily plan

Checklist para validar el paso `reader` cableado en `buildDailyPlan` (T50).

Estado 2026-07-17: cobertura automatizada completada. Los puntos marcados
`MANUAL` requieren una sesión autenticada contra un entorno no productivo,
Gemini real y manipulación del estado online; no se consideran validados por
tests con mocks. El intento de ejecución del 2026-07-17 quedó bloqueado porque
Docker/Supabase local no está disponible y no hay staging aislado configurado;
no se trasladó esta validación a producción.

## Precondiciones

- Usuario autenticado con **≥3 palabras** en `word_bank` en estado `review` o `new` con `next_review_at` vencido.
- Conexión online para la primera generación del párrafo.

## Checklist

### 1. Aparición en el plan

- [x] El compositor reserva uno de los cinco pasos para **Lectura** cuando genera un passage.
- [x] El paso admite `0 exercises`; la sesión se identifica mediante `kind: reader` y `readerPassage`.
- [x] Si el word bank está vacío (solo Core-1000 fallback), el paso reader **no** aparece.
- [ ] **MANUAL:** abrir `/daily` y confirmar navegación, badge y apertura visual del paso.

### 2. Sesión de lectura

- [x] `DailyReaderStep` muestra el passage y completa mediante `completeReader(..., context: 'daily')`.
- [x] `completeReader` persiste primero la respuesta, después la actividad y finalmente drena el outbox.
- [ ] **MANUAL:** confirmar que el checklist se marca done y que `answer_history` remoto guarda `context=daily` y el `contentId` del passage.

### 3. Hilo entre pasos

- [x] Una palabra repetida renderiza el hint del paso anterior; cubierto en `DailyReaderStep.test.tsx`.

### 4. Exposure tracking

- [x] `exposure.count` se crea o incrementa en Dexie.
- [x] SM-2 recall (`interval`, `repetitions`, `nextReview`) no cambia solo por leer.

### 5. Offline / caché

- [x] El mismo `targetHash` reutiliza el passage fresco y el modo offline devuelve cache sin generar.
- [ ] **MANUAL:** desconectar red y reabrir `/practice/reader` y el daily plan cacheado en un navegador real.

### 6. Límite de 5 pasos

- [x] Con el plan lleno, Reader reemplaza el último candidato y permanece dentro del límite de cinco pasos.

## Rutas de referencia

- Composer: `lib/practice/daily-plan/composer.ts`
- UI sesión: `components/daily/DailyReaderStep.tsx`
- Standalone: `/practice/reader` → `ReaderEntry.tsx`

## Evidencia automatizada

- `lib/practice/__tests__/daily-plan.test.ts`
- `components/daily/__tests__/DailyReaderStep.test.tsx`
- `components/practice/reader/__tests__/ReaderEntry.test.tsx`
- `components/practice/reader/__tests__/ReaderExercise.test.tsx`
- `lib/practice/reader/__tests__/complete-reader.test.ts`
- `lib/practice/reader/__tests__/exposure.test.ts`
- `lib/practice/reader/__tests__/get-passage.test.ts`
- `lib/practice/reader/__tests__/target-hash.test.ts`
