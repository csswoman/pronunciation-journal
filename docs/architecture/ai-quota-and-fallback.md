# Cuotas gratuitas, fallback y uso diario de IA

La app usa modelos Gemini del Free Tier confirmados en el inventario del
proyecto ([inventario](../ai/model-inventory.md)). Las cuotas de Google son por
proyecto; los límites pueden cambiar según la cuenta y Google los puede ajustar.

## Selección y recuperación de modelos

Las rutas comunes recorren `BASE_MODELS` y las tareas que necesitan más calidad
usan `QUALITY_FALLBACK_MODELS`. Ambas cadenas tienen como máximo tres modelos:
Flash Lite primero y, solo en la cadena de calidad, un Gemini Flash de último
recurso. `PREMIUM_MODELS` está reservado para tareas futuras de bajo volumen.
No se activa un modelo si no aparece en el presupuesto gratuito permitido.

`filterAvailable` omite durante 60 segundos un modelo que respondió `429` (o
durante el `Retry-After`/`retryDelay` que devolvió Google). Si todos están en
cooldown, se intenta la cadena original para evitar un bloqueo permanente en
memoria.

## Reserva diaria por modelo

`ai_usage_daily` agrega solicitudes, fallos y aciertos de caché por día del
Pacífico, modelo y feature. La RPC `ai_usage_try_reserve` serializa por modelo y
día con un lock transaccional antes de comprobar el total; por eso dos features
concurrentes no reservan la misma última solicitud. Solo el service role tiene
acceso. No hay políticas para `anon` ni `authenticated`.

`reserveModel` detiene el fallback antes de la llamada al SDK cuando el límite
interno se agotó. Los techos son el 80% de los RPD observados: 400 para cada
Flash Lite de 500 RPD, 16 para los modelos con 20 RPD y 8 para cada modelo TTS
con 10 RPD. Los valores fuente están en el inventario.
Si la reserva falla por una caída de Supabase, la app registra el problema y
permite continuar para no tumbar la función de IA; un ID fuera del allowlist se
rechaza.

## Tope diario por persona

El guard comparte un máximo de 150 solicitudes de IA al día para una cuenta
registrada y 15 para una cuenta anónima. Se aplica a rutas Gemini y a la
transcripción del checkpoint oral. Se configura con
`GEMINI_DAILY_LIMIT_PER_USER` y `GEMINI_DAILY_LIMIT_ANONYMOUS`. La clave usa la
fecha de `America/Los_Angeles`, por lo que se renueva a medianoche del Pacífico.
El 429 lleva `code: AI_DAILY_LIMIT`, `resetAt`, `Retry-After` y un mensaje que
indica la hora de reinicio. Otras rutas, como `/api/words/preview`, no consumen
este límite.

## Informe

`pnpm ai:usage-report` imprime la fecha actual y los últimos siete días por
modelo y feature (`requests`, `failures`, `cache_hits`). Requiere la migración
aplicada y `SUPABASE_SERVICE_ROLE_KEY`; si no hay configuración, muestra tablas
vacías e indica que la consulta no pudo conectarse.

## Caché compartida de respuestas

`/api/gemini/translate` y `/api/gemini/word-search` buscan primero en
`ai_response_cache`. La clave SHA-256 incluye feature, versión de prompt y
entrada normalizada; la tabla guarda solo la clave, el feature y el resultado
validado, nunca la entrada. El Diario y las transcripciones no usan esta caché.
Los aciertos se registran con el modelo sintético `cache` para que el informe no
los confunda con solicitudes a Gemini.

## Síntesis de voz

Los assets grabados de las líneas guionizadas se resuelven antes de pedir voz al
servidor. Reader y Mission revisan Storage antes de sintetizar; las rutas usan
Gemini TTS solo para audio largo y guionizado. Las líneas sin asset reproducible
conservan `speechSynthesis` como salida del cliente mientras la precarga está
pendiente o falla. `lib/gemini/audio.ts` serializa síntesis por instancia y deja
al menos 20 segundos entre inicios del mismo modelo. Cada intento pide reserva
con su feature.

La clave de cada WAV incluye feature, versión `tts-v2`, texto normalizado, voz y
modelo exacto que lo generó. Cambiar prompt, voz o modelo produce otro objeto,
por lo que no se devuelve audio de una voz anterior. El script de pregeneración
de misiones usa las mismas claves y el mismo serializador. Las voces locales de
Kokoro se incorporarán con el Plan 039; las superficies de palabras y pares
mínimos conservan sus voces locales y no llaman a Gemini.
