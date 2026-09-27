# Estado y maestría de sonidos (Plan 048)

Separación entre la estimación pura del desempeño (EMA cruda), la proyección para presentación al usuario y la persistencia transaccional con acumulación de deltas.

---

## 1. Problema resuelto

En el modelo anterior, `computeNextMasteryPct` multiplicaba la estimación por `repScale = sqrt(n / 10)` y devolvía el valor escalado (ej. 25% tras una sesión al 80%). En la siguiente sesión, el caller utilizaba ese 25% escalado como `oldMastery`, multiplicándolo nuevamente por `repScale` y provocando que dos sesiones consecutivas al 80% colapsaran la maestría mostrada de 25% a 13%.

Adicionalmente, `updateContrastProgress` leía el progreso local y calculaba totales absolutos (`current.total_attempts + sessionTotal`), haciendo un `upsert` que sobrescribía e invalidaba los intentos concurrentes de Essential Words (`apply_essential_word_contrast_observation`) y las sesiones de múltiples dispositivos offline.

---

## 2. Separación matemática: Algoritmo puro vs. Proyección

### A. Algoritmo puro (`computeNextRawEma`)

La estimación del desempeño (`raw_mastery` ∈ [0, 100]) evoluciona como una media móvil exponencial con decaimiento temporal:

$$\text{decayFactor} = \exp\left(-\frac{\Delta t}{\tau}\right)$$

Donde $\tau = 14$ días (parámetro histórico del sistema). La nueva estimación pura combina el estado anterior decaído con la precisión de la sesión:

$$\text{EMA}_{\text{new}} = \text{EMA}_{\text{old}} \cdot \text{decayFactor} + \text{accuracy} \cdot (1 - \text{decayFactor})$$

- Si `daysSince = 0` (sesión en el mismo instante o mismo día), `decayFactor ≈ 1` y la precisión conserva su estabilidad determinista.
- Si transcurre una pausa larga, el decaimiento temporal reduce el peso del histórico sin provocar `NaN` ni desbordes.
- Entradas anómalas (`NaN`, `Infinity`, fechas inválidas) se sanean a límites seguros en `[0, 100]`.

### B. Proyección de presentación (`projectMasteryPct`)

El factor de confianza por repetición (`repScale`) se aplica **una sola vez** al proyectar la métrica para el usuario:

$$\text{repScale} = \sqrt{\frac{\min(n, 10)}{10}}$$

$$\text{masteryPct} = \text{round}(\text{rawEma} \cdot \text{repScale})$$

Ejemplo con desempeño constante al 80%:
- Sesión 1: EMA cruda = 80, Presentación = 25%
- Sesión 2: EMA cruda = 80, Presentación = 36%
- Sesión 5: EMA cruda = 80, Presentación = 57%
- Sesión 10: EMA cruda = 80, Presentación = 80%

La métrica crece de forma monótona conforme se acumula evidencia, eliminando el colapso por reaplicación de escala.

---

## 3. Compatibilidad y persistencia

1. **`raw_mastery`**: Columna nueva en `public.user_contrast_progress` y propiedad en Dexie `cachedContrastProgress`. Almacena la EMA cruda.
2. **`raw_mastery_updated_at`**: Reloj exclusivo de evidencia de Sound Lab. Essential Words conserva sus observaciones sin mover este reloj.
3. **`mastery_session_count`**: Número explícito de sesiones de Sound Lab. La proyección de escritura y lectura usa el mismo contador; las filas nuevas no lo infieren desde `total_attempts`, porque una sesión puede tener cualquier tamaño. Solo el primer escritor (cliente y RPC) que actualiza una fila histórica sin contador conserva su confianza previa como fallback de compatibilidad.
4. **`mastery_pct`**: Conserva el valor de presentación escalado [0, 100] para no romper a los consumidores existentes (`isContrastMastered`, `getHomeDashboardData`, `getProgressPageData`).
5. **Registros legados**: Si `raw_mastery` es nulo, se toma `mastery_pct` como cota inferior conservadora sin aplicar divisiones artificiales que amplifiquen errores de redondeo. El fallback de `last_seen` solo sirve para filas históricas sin `raw_mastery_updated_at`; las nuevas escrituras usan el reloj dedicado.
   Una fila con observaciones de Essential Words pero sin sesiones explícitas de Sound Lab no usa su antiguo `mastery_pct` como EMA: esa señal tiene otra granularidad y no puede convertirse honestamente en maestría fonémica.
6. **Decaimiento en lectura**: `soundMasteryPct` decae `raw_mastery` en lectura y luego proyecta la presentación, evitando el doble decaimiento.

---

## 4. Concurrencia e idempotencia

1. **RPC `apply_contrast_session_result`**:
   - En lugar de enviar totales y maestría absolutas calculadas desde un snapshot posiblemente viejo, la sesión envía el delta (`p_session_total`, `p_session_correct`), precisión, resultado, identidad y `p_occurred_at`.
   - El servidor inserta primero el evento y bloquea la fila de progreso (`FOR UPDATE`); después acumula contadores y reduce EMA, proyección y SRS contra el estado ya actualizado.
   - Una sesión offline antigua usa su instante de ocurrencia acotado al reloj del servidor; no se convierte en una práctica nueva al sincronizar y no puede retroceder el SRS producido por una sesión más reciente.
   - Si llega después de una sesión más nueva, conserva su evidencia mediante un peso de promedio acumulado; no se descarta por un `Δt` cero, aunque el SRS mantenga el estado más reciente.
   - Los incrementos de Essential Words y de múltiples dispositivos sincronizados offline no sobrescriben la EMA ni los contadores.
2. **Idempotencia (`contrast_session_events`)**:
   - Deduplica por `(user_id, attempt_id, contrast_id)`. Si una sesión se reenvía por reintento de red o replay de sincronización, la operación es idempotente y no duplica los intentos.
3. **Proyección offline en Dexie**:
   - `updateContrastProgress` actualiza `db.cachedContrastProgress` y encola el RPC dentro de una única transacción Dexie. Si una mitad falla, ambas se revierten.

## 5. Orden de despliegue

`20260927020000_contrast_raw_mastery_and_events.sql` (incluidos RLS y las dos firmas RPC) debe aplicarse antes de publicar los lectores que seleccionan las columnas nuevas. Según confirmación del usuario, ya fue aplicada en Supabase; esta revisión no verificó la firma RPC, RLS, concurrencia, replay ni el flujo browser/outbox, por lo que esos gates siguen abiertos en el Plan 048.
