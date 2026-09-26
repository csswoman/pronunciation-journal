# Banco de contenido pregenerado (Content Bank)

Arquitectura del banco de ejercicios pregenerados con la cuota diaria de IA que sobra.

## Propósito

La cuota gratuita de Gemini (RPD) se reinicia a medianoche del Pacífico y lo que no se utiliza en el día se pierde.
El banco de contenido aprovecha esa cuota sobrante generando por la noche conjuntos de ejercicios pedagógicos por nivel CEFR y tema, almacenándolos en Supabase como contenido compartido del sistema.

Al pedir práctica en el AI Coach, la aplicación busca primero en este banco:
- **Respuesta instantánea**: sin latencia de inferencia en tiempo real.
- **0 requests a la API** en el momento de uso.
- **Disponibilidad offline**: ejercicios cacheados en el dispositivo.

## Ciclo de generación y reglas de cuota

1. **Cuándo corre el job**:
   - Programado mediante GitHub Actions (`.github/workflows/fill-content-bank.yml`) diariamente a las `0 6 * * *` (≈22:00–23:00 hora del Pacífico, justo antes del reseteo de medianoche).
   - Invoca el endpoint seguro `GET /api/jobs/fill-content-bank` mediante autenticación `Bearer $CRON_SECRET`.
2. **Regla de seguridad del 60%**:
   - Antes de generar cada lote, el job comprueba si el modelo principal (`gemini-3.1-flash-lite`) ya ha consumido el 60% de su `DAILY_BUDGET` para el día en curso (`ai_usage_daily`). Si la telemetría no está disponible, el job se detiene.
   - Cada set obtiene una reserva atómica con límite de 240 solicitudes (60% de 400). La llamada al proveedor usa solo el modelo reservado y no vuelve a reservar.
3. **Selección de objetivos**:
   - El job evalúa los pares `(level, topic_id)` para A1–C2. Prioriza los niveles efectivos de usuarios con actividad completada en los últimos 30 días y, dentro de esa prioridad, elige los temas con menos ítems existentes.
4. **Deduplicación por `stem_hash`**:
   - Cada ejercicio extrae su enunciado normalizado (`question`, `sentence` o `prompt`) y genera un hash SHA-256 (`stem_hash`).
   - La inserción en Supabase se realiza con `upsert(..., { onConflict: "stem_hash", ignoreDuplicates: true })`, evitando cualquier duplicado.

## Formato y validación

Los ejercicios pregenerados respetan exactamente la estructura esperada por el Coach:
- `render_multiple_choice`: opciones, índice correcto, explicación, hints y errores comunes.
- `render_fill_blank`: oración con hueco, respuesta esperada, alternativas aceptables y feedback pedagógico.
- `render_speaking`: prompt y texto objetivo a pronunciar.

Cada ejercicio pasa por `parseToolArgs` antes de guardarse; si la IA devuelve un formato defectuoso, se descarta limpiamente.

## Flujo de servicio (Banco primero → IA)

Cuando el usuario solicita práctica en el AI Coach (`useStreamingChat`):
1. `useCoachBankSet` verifica si hay ejercicios en la caché local Dexie (`contentBankCache`) o en Supabase (`content_bank_items`).
2. Ejecuta la función pura `pickBankSet(items, seenStems, weakTopics)`:
   - Excluye enunciados que el alumno ya ha visto (`coachSeenItems`).
   - Prioriza los temas con mayor debilidad detectada (`weakTopics`).
   - Garantiza variedad de formatos: máximo 2 ejercicios por cada `tool_name`.
3. Si se obtienen **5 ejercicios**, se inyectan directamente como un mensaje local del modelo con 5 `ToolCall` en estado `pending`, sin realizar ninguna llamada HTTP a `/api/gemini`.
4. Si hay **menos de 5 ejercicios**, el sistema continúa con el flujo habitual y consulta a Gemini en tiempo real.
5. Los enunciados mostrados se registran en `coachSeenItems` para evitar repetición futura.

## Resiliencia y modo offline

- Los ejercicios descargados se persisten en Dexie en la tabla `contentBankCache` (esquema v45); el último nivel efectivo del usuario se conserva en `coachBankLevelCache` (v47) para resolver la caché sin conexión.
- El gestor offline (`lib/offline/download-manager.ts`) permite descargar paquetes de hasta 100 ejercicios por nivel CEFR (`downloadCoachExercises`).
- Al volver online, el Coach reconcilia los IDs cacheados contra las filas visibles por RLS y retira los que ya no pasan `quality_flags < 3`; si esa consulta falla, no sirve el banco en esa sesión.
- Sin conexión a internet, el AI Coach recurre a la caché local que conserva `quality_flags < 3`; si contiene al menos 5 ejercicios no vistos, la sesión de práctica funciona sin requerir red.
