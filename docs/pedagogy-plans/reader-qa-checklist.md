# QA manual — Reader en el daily plan

Checklist para validar el paso `reader` cableado en `buildDailyPlan` (T50).

## Precondiciones

- Usuario autenticado con **≥3 palabras** en `word_bank` en estado `review` o `new` con `next_review_at` vencido.
- Conexión online para la primera generación del párrafo.

## Checklist

### 1. Aparición en el plan

- [ ] Abrir `/daily` y confirmar que uno de los pasos es **Lectura** (`kind: reader`).
- [ ] El paso es clickeable aunque tenga `0 exercises` (badge `reading` en subtítulo).
- [ ] Si el word bank está vacío (solo Core-1000 fallback), el paso reader **no** aparece.

### 2. Sesión de lectura

- [ ] Al iniciar el paso se muestra el párrafo y preguntas de comprensión.
- [ ] Completar con acierto o error marca el paso como done y vuelve al checklist.
- [ ] `answer_history` registra contexto `daily` con `contentId` del passage.

### 3. Hilo entre pasos

- [ ] Si una palabra del reader ya apareció en Intro/Review/Context, se muestra hint `· from Intro` (etc.).

### 4. Exposure tracking

- [ ] Tras completar, en Dexie `srsData` para `wb:<id>` el sub-objeto `exposure.count` incrementa.
- [ ] SM-2 recall (`interval`, `repetitions`) **no** cambia solo por leer.

### 5. Offline / caché

- [ ] Con el mismo `targetHash`, desconectar red y reabrir `/practice/reader` — carga desde Dexie sin error.
- [ ] Repetir en daily plan si el paso reader sigue en el plan cacheado del día.

### 6. Límite de 5 pasos

- [ ] Con plan lleno (5 pasos de fonema + vocab), verificar si reader queda fuera del slice — documentar si ocurre (comportamiento conocido).

## Rutas de referencia

- Composer: `lib/practice/daily-plan/composer.ts`
- UI sesión: `components/daily/DailyReaderStep.tsx`
- Standalone: `/practice/reader` → `ReaderEntry.tsx`
