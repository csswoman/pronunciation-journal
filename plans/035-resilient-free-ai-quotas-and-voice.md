# Plan 035: Aprovechar la IA gratuita sin agotar el servicio

> **Executor instructions**: Sigue el plan por fases (A → B → C) y paso a paso. Ejecuta cada
> verificación antes de avanzar. Si ocurre algo de "STOP conditions", detente y reporta; no
> improvises. Mantén el modo gratuito como contrato: no añadas modelos de pago, Batch ni servicios
> de voz con costo. Al terminar cada fase, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- lib/gemini app/api/gemini lib/ai-prompts.ts scripts/enrich-mini-lessons.ts`
> y `git status --short -- lib/gemini app/api/gemini`. Este plan se escribió con cambios sin
> commitear en `app/api/gemini/{route,generate-reader,grade-production,journal-correct}` y
> `lib/ai-prompts.ts`. Compara los extractos de "Estado actual" con el código vivo; si no coinciden,
> es STOP.

## Estado

- **Priority**: P1
- **Effort**: M (fase A: ~1 día · fase B: 1–2 días · fase C: 1 día)
- **Risk**: MED
- **Depends on**: — (036, 037 y 038 dependen de la fase A de este plan)
- **Category**: IA / resiliencia / costo
- **Planned at**: commit `866979df`, 2026-09-23 (revisado el mismo día: fases reordenadas, alcance recortado)
- **Implementation state (2026-09-25)**: fases A–C implementadas. Las dos migraciones originales están aplicadas y `pnpm ai:usage-report` consulta datos reales. Se añadió una migración pendiente para latencia/errores; quedan la prueba atómica explícita de la RPC y la prueba manual sin `GEMINI_API_KEY`.

## Por qué importa

La app es personal y con pocos usuarios (la dueña y algunas amistades). El límite que manda es
**RPD** (requests por día, por proyecto de Google, se reinicia a medianoche del Pacífico); TPM casi
nunca se alcanza a esta escala. Hoy las rutas más frecuentes empiezan por el modelo con menos cuota
diaria, la cadena de fallback puede gastar hasta 7 requests en una sola respuesta fallida y no hay
cooldown tras un `429`. Con dos modelos Flash Lite (~500 RPD cada uno según el panel del proyecto;
verificar) hay ~1000 RPD: al 80% son ~160 requests diarias por persona con 5 usuarios, suficiente si
el tráfico frecuente va a los modelos Lite y los fallos no se multiplican.

## Estado actual

- `lib/gemini/fallback.ts:1-24` — dos cadenas de 7 modelos. La de calidad empieza con Flash:
  ```ts
  export const QUALITY_FALLBACK_MODELS = [
    'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.7-flash',
    'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite',
  ] as const
  ```
- Rutas frecuentes que usan `QUALITY_FALLBACK_MODELS`: `app/api/gemini/grade-production/route.ts:88`,
  `app/api/gemini/generate-reader/route.ts:98`, `app/api/gemini/journal-correct/route.ts` y el chat
  de misiones en `app/api/gemini/route.ts:103` (`body.missionId ? QUALITY_FALLBACK_MODELS : undefined`).
- `lib/gemini/client.ts` — `callWithFallback` recorre `models` en orden; tras cualquier error que
  `shouldTryNextModel` acepte (404/408/409/425/429/5xx) intenta el siguiente. No recuerda qué modelo
  dio 429: la siguiente request vuelve a empezar por el modelo agotado.
- `lib/gemini/chat-route.ts` — `streamWithFallback` y `sendMessageWithFallback` repiten el mismo
  bucle para el AI Coach.
- Otros bucles propios: `app/api/gemini/transcribe/route.ts:75`, `lib/word-bank/gemini.ts:112`.
- `lib/gemini/audio.ts` — `AUDIO_MODELS = ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"]`.
  El panel muestra límites de ~3 RPM en TTS.
- `scripts/enrich-mini-lessons.ts:115` usa `model: "gemini-2.5-flash"` (fuera del router y con
  cuota muy baja). El panel mostró 23/20 en un modelo 2.5; no está atribuido a ninguna ruta.
- Caché de respuestas: existe en `word-of-day`, `deck-suggest`, `generate-sentences`, `reader-audio`,
  `mission-audio`, `transcribe*`. No existe en `translate`, `word-search` ni `generate-reader`.
- Rate limit por usuario: `checkLayeredRateLimit` en `lib/api/guards.ts` (ventana de 60 s). No existe
  presupuesto diario por modelo.

Convenciones: acceso a Supabase solo desde `lib/*/queries.ts` o helpers de servidor en `lib/`;
migraciones en `supabase/migrations/` con RLS obligatorio; tests Vitest junto al código o en
`__tests__/` (ejemplo: `lib/gemini/__tests__/fallback.test.ts`).

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests focalizados | `pnpm test -- lib/gemini app/api/gemini` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Alcance

**Dentro**: `lib/gemini/**`, `app/api/gemini/**/route.ts` (solo selección de modelo, caché y
presupuesto), `scripts/enrich-mini-lessons.ts`, una migración nueva en `supabase/migrations/`,
`lib/ai-usage/` (crear), tests correspondientes. Además, los documentos listados en el paso de documentación de este plan.

**Fuera** (no tocar): texto de prompts (Plan 036), flujo del AI Coach y ejercicios (Plan 037),
evaluación de pronunciación (Plan 038), UI de componentes, Live API, embeddings, Gemma, selector de
voz, generación de imagen/video/música (ver "Diferido").

## Fase A — Quick wins (sin infraestructura nueva)

### A1. Verificar el inventario de modelos
Crea `docs/ai/model-inventory.md` con una tabla: ID exacto de API → tier gratuito sí/no → RPM/RPD
observados en el panel del proyecto → rutas que lo usan. Fuentes: [límites](https://ai.google.dev/gemini-api/docs/rate-limits),
[precios](https://ai.google.dev/gemini-api/docs/pricing) y el panel de AI Studio del proyecto.
Si un ID de `fallback.ts` o `audio.ts` no aparece como gratuito, es STOP.
**Verify**: el archivo existe y cada ID de `BASE_MODELS`, `QUALITY_FALLBACK_MODELS` y `AUDIO_MODELS` tiene fila.

### A2. Reordenar y acortar las cadenas
En `lib/gemini/fallback.ts`:
- `BASE_MODELS` → `['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']`
  (máximo 3; los Flash salen de la cadena por defecto).
- `QUALITY_FALLBACK_MODELS` → Flash Lite primero y **un solo** Flash al final:
  `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']`.
- Añade `PREMIUM_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite']` para usos de bajo volumen
  y alto valor (hoy ninguno; lo usará el Plan 036 tras medir calidad).
Ajusta `lib/gemini/__tests__/fallback.test.ts` para fijar el orden y la longitud máxima (≤3).
**Verify**: `pnpm test -- lib/gemini` → pasa.

### A3. Cooldown por modelo tras 429
Crea `lib/gemini/cooldown.ts` con un `Map<string, number>` en memoria (modelo → timestamp hasta el
cual se salta), `markCooldown(model, retryAfterMs?)` (por defecto 60 s; si el error trae
`Retry-After` o `retryDelay`, úsalo) y `filterAvailable(models)` que devuelve los modelos fuera de
cooldown (si todos están en cooldown, devuelve la lista original para no bloquear). Úsalo en
`callWithFallback`, `streamWithFallback`, `sendMessageWithFallback`, `transcribe/route.ts` y
`lib/word-bank/gemini.ts`: filtra antes del bucle y marca cooldown cuando el status es 429.
Es un cooldown por instancia; la protección entre instancias llega en la fase B.
**Verify**: nuevo test `lib/gemini/__tests__/cooldown.test.ts` (429 → el modelo se salta en la
siguiente llamada; expira tras el tiempo; todos en cooldown → lista original) → pasa.

### A4. Sacar el script del presupuesto compartido
En `scripts/enrich-mini-lessons.ts:115` sustituye `"gemini-2.5-flash"` por el primer modelo de
`BASE_MODELS` importado de `lib/gemini/fallback.ts`, y añade una espera de ≥4 s entre llamadas y un
tope `--max=<n>` (por defecto 50). Documenta en la cabecera que solo se ejecuta a mano.
**Verify**: `grep -rn "gemini-2.5-flash\"" scripts lib app` → sin resultados.

## Fase B — Presupuesto diario y telemetría mínima

### B1. Tabla de uso y RPC atómica
Migración `supabase/migrations/<timestamp>_ai_usage_daily.sql`:
- Tabla `ai_usage_daily(day date, model text, feature text, requests int, failures int, cache_hits int, primary key(day, model, feature))`.
- RLS habilitado **sin políticas para `anon`/`authenticated`** (solo el servidor escribe con service role).
- Función `ai_usage_try_reserve(p_model text, p_feature text, p_limit int) returns boolean` con
  `security definer` que hace `insert ... on conflict do update set requests = requests + 1` solo si el
  total del día para ese modelo es `< p_limit`. El día se calcula en `America/Los_Angeles`.
**Verify**: aplica la migración en local o en la rama de Supabase y comprueba `select ai_usage_try_reserve('x','test',1)` → `true`, segunda llamada → `false`.

### B2. Presupuesto en el router
Crea `lib/ai-usage/budget.ts` (servidor) con `DAILY_BUDGET: Record<model, number>` = 80% del RPD del
inventario A1, y `reserveModel(model, feature)`. En `callWithFallback` y en los bucles del chat,
antes de llamar a un modelo pide la reserva; si devuelve `false`, pasa al siguiente sin llamar a la
API. Si Supabase no responde, **no bloquees**: registra el error y continúa (el cooldown de A3 sigue activo).
Añade el campo `feature` a `CallWithFallbackOptions` y pásalo desde cada ruta (usa el nombre de la ruta).
**Verify**: tests con la RPC simulada: presupuesto agotado → no hay llamada a `generateContent` para ese modelo.

### B3. Límite diario por usuario
En `checkLayeredRateLimit` o junto a él, añade un tope diario por usuario para rutas de IA: 150
requests/día para cuentas permanentes y **15/día para cuentas anónimas** (invitados; detectar con
`isAnonymousUser` de `lib/auth/is-anonymous.ts`, que ya re-exporta `lib/api/guards.ts`). Ambos
configurables por env. Al superarlo, responde 429 con el mensaje de
`lib/degradation/messages.ts` y la hora de reinicio.
**Verify**: test de la ruta `grade-production` con el tope simulado → 429 con mensaje.

### B4. Panel mínimo
Script `scripts/ai-usage-report.ts` que imprime el uso de hoy y de los últimos 7 días por modelo y
feature. Sin UI.
**Verify**: `pnpm tsx scripts/ai-usage-report.ts` imprime una tabla (vacía es válido).

## Fase C — Caché y TTS

### C1. Caché compartida de respuestas deterministas
Para `translate` y `word-search`: caché en Supabase (tabla `ai_response_cache(key text primary key, feature text, payload jsonb, created_at)`,
RLS sin políticas públicas) con clave `sha256(feature + versión de prompt + entrada normalizada)`.
Lectura antes de llamar a Gemini; escritura tras parsear con éxito. Nunca guardes texto del diario
ni transcripciones personales. `generate-reader` queda para el Plan 037.
**Verify**: test: segunda llamada idéntica → cero llamadas al SDK y `cache_hits` incrementa.

### C2. Cola TTS y papel de Gemini TTS
Con el Plan 039, el audio corto y bajo demanda (palabras, pares mínimos, líneas sin audio grabado) pasa a
Kokoro en el navegador o a `speechSynthesis`. Gemini TTS queda para **audio largo pregenerado y cacheado**
(pasajes de Reader, líneas de misión guionizadas). Orden para cualquier audio: asset grabado → caché →
voz local (Kokoro si está activa, si no navegador) → Gemini TTS solo desde `reader-audio` y `mission-audio`.
En `lib/gemini/audio.ts`, serializa las llamadas de síntesis por instancia (una a la vez, espacio
mínimo de 20 s por modelo) y consulta `reserveModel` antes de cada una. La clave de caché de audio
debe incluir voz, modelo y versión; si hoy no la incluye, corrígelo antes de cualquier selector de voz.
**Verify**: test con reloj falso: 3 solicitudes concurrentes → 3 llamadas espaciadas, sin paralelas.

## Paso final — Documentación (al cerrar cada fase)

Actualiza solo lo que la fase cambió; no documentes fases no ejecutadas.

| Archivo | Qué escribir |
|---|---|
| `docs/ai/model-inventory.md` | Creado en A1; mantenlo al día con los IDs, límites y rutas finales |
| `docs/architecture/ai-quota-and-fallback.md` (crear) | Cadenas de modelos y por qué, cooldown tras 429, presupuesto diario (tabla + RPC), límite por usuario, caché compartida, orden de fuentes de audio (C2) |
| `CLAUDE.md` → "Hard rules" | Sustituye "Fallback chain: flash-lite → flash → latest" por la política nueva (Lite primero, ≤3 modelos, presupuesto con `reserveModel`) |
| `ENGINEERING_STANDARDS.md` → "Rutas Gemini" | Toda llamada nueva pasa `feature`, respeta `filterAvailable` y `reserveModel` |
| `README.md` → "Tech stack" (fila AI) y "Architecture highlights" (Security) | Menciona el presupuesto diario por modelo y usuario |
| `.env.example` y `docs/deployment/environments.md` | Variables nuevas (p. ej. el tope diario por usuario), con valor por defecto |
| `docs/README.md` → tabla "Arquitectura" | Enlaces a `ai-quota-and-fallback.md` y `docs/ai/model-inventory.md` |

**Verify**: `grep -n "flash-lite → flash → latest" CLAUDE.md` → sin resultados; `grep -n "ai-quota-and-fallback" docs/README.md` → 1 resultado.

## Criterios de aceptación

- [x] `docs/ai/model-inventory.md` existe y cubre todos los IDs usados.
- [x] Ninguna cadena tiene más de 3 modelos; `grep -rn "gemini-2.5-flash\"" scripts lib app` vacío.
- [x] Tests de cooldown, presupuesto, límite por usuario, caché y cola TTS pasan.
- [x] `pnpm type-check` y `pnpm lint` en exit 0.
- [x] Las migraciones tienen RLS habilitado y ninguna política para `anon`/`authenticated` (auditoría estática).
- [x] Aplicar las migraciones originales y ejecutar `pnpm ai:usage-report` contra la base de datos.
- [x] Verificar explícitamente la RPC de reserva (`true`, luego `false`) — confirmado 2026-09-26 vía
  REST API (`/rest/v1/rpc/ai_usage_try_reserve`) con el JWT de `service_role`: primera llamada
  `true`, segunda (mismo modelo/feature, límite 1) `false`. El SQL Editor del dashboard y el MCP de
  Supabase no sirven para esto (corren como rol `postgres`, no `service_role`; la función lo rechaza
  con `ERROR: 42501: service role required` por diseño). Registro de prueba limpiado de
  `ai_usage_daily` tras la verificación.
- [x] Aplicar `20260925120000_ai_usage_outcomes.sql` para latencia y último error — confirmado
  aplicada en remoto (2026-09-26, como `ai_usage_outcomes`).
- [ ] Guardar el diario y los ejercicios funciona sin IA (prueba manual con `GEMINI_API_KEY` vacía).
- [x] Documentación del "Paso final" actualizada para las fases ejecutadas.

## STOP conditions

- Un ID de modelo no figura como gratuito en la documentación o en el panel del proyecto.
- El proyecto de Google tiene billing activo y no está claro qué otros servicios dependen de él.
- La RPC de reserva no puede ser atómica en la versión de Postgres del proyecto.
- Un cambio exige tocar el texto de un prompt o la UI (es de 036/037/038).

## Diferido (no planificar ahora)

Live API, Transcribe Live, embeddings, Gemma, selector de voz, generación de imagen/video/música y
reservas de TPM. Cada uno añade riesgo de costo sin resolver la cuota diaria; se reevalúan cuando el
reporte B4 muestre margen sostenido.

## Notas de mantenimiento

- Al añadir un modelo: fila en el inventario, entrada en `DAILY_BUDGET` y test del orden.
- Revisar en PR: que ningún bucle nuevo de modelos se salte `filterAvailable` y `reserveModel`.
- Tras 2 semanas, ajustar el 80% según `scripts/ai-usage-report.ts`.
