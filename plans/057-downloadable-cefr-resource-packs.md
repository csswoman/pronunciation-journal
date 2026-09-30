# Plan 057: Descargar un paquete offline del nivel real del usuario

> **Executor instructions**: Ejecuta después de Plan 056. Sigue las fases en
> orden y no marques DONE sin la aceptación offline de navegador. Actualiza la
> fila en `plans/series-7-light-client-and-level-packs.md` al terminar.
>
> **Drift check (run first)**:
> `git diff --stat 26c05b4f..HEAD -- lib/offline lib/db/index.ts lib/essential-words scripts/essential-words scripts/generate-content-index.ts public/essential-words components/offline components/courses hooks/useUserPreferences.ts lib/learner-level next.config.mjs app/sw.ts docs/architecture/offline-sync.md`
> Si cambió el esquema Dexie, la resolución canónica de nivel, el formato de
> grammar decks o la estrategia Serwist, STOP y reconcilia el plan.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plan 056
- **Category**: direction / perf
- **Planned at**: commit `26c05b4f`, 2026-09-28

## Why this matters

La app ya puede guardar lecciones individuales y hasta 100 ejercicios del Coach,
pero no existe un paquete coherente del nivel del alumno. Essential Words suma
aproximadamente 24 MB de JSON completo y sus chunks por rango mezclan niveles:
A1 y A2 aparecen en los 28 chunks. Descargar los chunks actuales “del nivel”
terminaría bajando casi todo. Este plan genera recursos CEFR separados y crea un
gestor con recibos durables que puede decir qué funciona offline, cuánto ocupa y
qué necesita internet.

## Current state

- `public/essential-words/level-index.json` contiene 2.800 pares
  `[word, cefr_level]`: A1 740, A2 645, B1 524, B2 754, C1 137. Tres palabras
  aparecen dos veces con el mismo nivel, tanto en el índice como en los chunks
  (`difficulty` B1, `purchase` B2, `fortunate` B2): hay **2.797 palabras
  únicas**. Únicas por nivel: A1 740, A2 645, B1 523, B2 752, C1 137.
- No existe contenido C2, aunque `CEFRLevel` (`lib/exercises/cefr.ts`) incluye
  `'C2'`.
- `public/essential-words/catalog-index.json` indica el chunk por palabra, pero
  A1 y A2 están repartidos por los 28 chunks; no sirve como pack selectivo.
- `lib/essential-words/client.ts` ya sabe descargar y cachear chunks HTTP, y
  evita Zod en cliente. Reutiliza su validación manual.
- `lib/offline/download-manager.ts:58-103` guarda una lección y su deck en
  `downloadedLessons`; `:137-181` descarga/elimina ejercicios Coach por nivel.
- `components/offline/OfflineHubClient.tsx` (161 líneas) compone el hub y ya no
  resuelve nivel. Tras Plan 056, el set Coach vive en
  `components/offline/OfflineCoachPack.tsx`, que obtiene `coachLevel` con
  `getCoachBankLevel(userId)` (`lib/content-bank/queries.ts`), no con la
  resolución canónica. Ninguno dispone de un recibo de paquete completo.
- `contentBankCache` (Dexie) indexa por `id, level, topic_id, kind` y no guarda
  `user_id` ni origen: el banco Coach es contenido compartido, y
  `removeCoachExercisesOffline(level)` borra todas las filas del nivel sin
  distinguir si vinieron del set Coach suelto o de un pack.
- `next.config.mjs` usa Serwist, que precachea `public/` por defecto hasta
  `maximumFileSizeToCacheInBytes` (5 MB). `exclude` solo cubre rutas Gemini,
  auth y `/practice/sounds/`. Sin exclusión, los packs pequeños (C1 ≈ 1 MB) y
  el manifiesto se precachearían para todos los usuarios.
- `hooks/useUserPreferences.ts` consume
  `getEffectiveLearnerLevelForViewer`; esa resolución canónica debe decidir el
  nivel sugerido. Un fallo de lectura no autoriza inventar A1.
- `DownloadedLessonRecord` vive en Dexie v35. La versión viva de Dexie puede ser
  mayor al ejecutar; usar la siguiente versión libre, nunca reutilizar una.

## Product contract

El primer alcance descargable por nivel incluye:

1. Essential Words del nivel exacto, con campos completos para sus ejercicios.
2. Grammar decks pertenecientes a la ruta CEFR seleccionada.
3. Audios referenciados por esos decks.
4. Hasta 100 ejercicios pregenerados del Coach para el mismo nivel, si la cuenta
   y el banco remoto están disponibles.

**Política C2**: no hay pack C2. Si el nivel canónico es C2, el CTA sugiere el
pack C1 con etiqueta visible ("Tu nivel es C2; el paquete más alto disponible es
C1"). Nunca se presenta como pack C2.

**Propiedad del contenido Coach**: las filas de `contentBankCache` son
compartidas entre el set Coach suelto y los packs. Quitar un pack **no** borra
filas Coach si el set Coach suelto de ese nivel sigue descargado; el recibo del
pack registra `coachCount` solo como información.

No incluye Gemini, transcripción remota, auth, sincronización Supabase ni nueva
generación. Esas funciones siguen conectadas. El progreso evaluado se registra
localmente por los escritores existentes y entra al outbox; no se crea otro
modelo de progreso.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate packs | `pnpm offline-packs:generate` | manifiesto y packs A1-C1 escritos |
| Validate packs | `pnpm validate:offline-packs` | 0 errores y conteos esperados |
| Focused tests | `pnpm vitest run lib/offline lib/essential-words/__tests__/catalog-index.test.ts components/offline` | pass |
| Dexie guardrails | `pnpm audit:hard-rules` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Suggested executor toolkit

- Usa `next-dev-loop` para la aceptación online/offline/reload/reconnect.
- Usa `vercel-react-best-practices` para mantener el gestor y UI fuera del
  bundle inicial hasta abrir la superficie.
- Para UI, relee `PRODUCT.md`, `DESIGN.md`, `THEME_SYSTEM.md`,
  `docs/design/visual-language.md` y `docs/design/primitives.md` si cambiaron.

## Scope

**In scope**:

- `scripts/offline-packs/generate.mjs` (create)
- `scripts/offline-packs/validate.mjs` (create)
- `public/offline-packs/manifest.json` (generated)
- `public/offline-packs/<version>/<level>/essential-words.json` (generated)
- `package.json`
- `lib/offline/pack-types.ts` (create)
- `lib/offline/pack-manifest.ts` (create)
- `lib/offline/resource-pack-manager.ts` (create)
- `lib/offline/__tests__/resource-pack-manager.test.ts` (create)
- `lib/db/index.ts` (schema/table helpers only)
- `next.config.mjs` (solo excluir `/offline-packs/` del precache de Serwist)
- `lib/essential-words/client.ts` (solo el punto de fallback offline)
- `components/offline/OfflineHubClient.tsx` (solo compone la sección nueva)
- `components/offline/OfflineCoachPack.tsx` (nivel canónico + regla de propiedad
  Coach)
- componentes nuevos de paquete bajo `components/offline/`
- tests bajo `components/offline/__tests__/`
- `docs/architecture/offline-sync.md`
- `docs/architecture/performance.md`
- `docs/README.md`

**Out of scope**:

- Descargar modelos Gemini, Whisper, Kokoro o CMUdict.
- Convertir autenticación o sync remoto en funciones offline.
- Cambiar cómo se acredita progreso, mastery, SRS o nivel.
- Borrar automáticamente packs de niveles anteriores.
- Descargar todos los niveles por defecto.
- Crear una tabla Supabase nueva; los recibos son por dispositivo en Dexie.

## Git workflow

- Rama opcional: `codex/057-cefr-offline-packs` desde `dev`.
- No commit ni push sin instrucción explícita.
- Commit sugerido: `feat(offline): add downloadable CEFR resource packs`.

## Steps

### Step 1: Definir el manifiesto y generar Essential Words por nivel

Crea tipos discriminados para recursos estáticos, decks, audio y contenido
remoto opcional. Cada manifiesto debe incluir `schemaVersion`, `contentVersion`,
`level`, `estimatedBytes`, recursos requeridos y opcionales.

El generador debe leer los 28 archivos canónicos `words-NNN.json`, filtrar por
`cefr_level` y escribir un archivo por A1, A2, B1, B2 y C1. No uses
`words-all.json` como fuente. Conserva todos los campos de `EssentialWord`.
Deduplica por `word`: si las dos entradas repetidas son idénticas conserva una;
si difieren en cualquier campo, falla con error y STOP.

Deriva los grammar deck slugs desde la ruta curricular canónica
(`lib/courses/curriculumIndex.ts` / `lib/courses/buildCurriculum.ts`); no
infieras por prefijo del nombre. Los decks viven en `public/grammar-decks/`;
`lib/courses/grammar-deck/decks.ts` es `server-only`, así que el generador lee
los JSON directamente. Añade sus URLs y los audios extraídos de los decks al
manifiesto. Deduplica URLs y calcula bytes desde archivos locales existentes.

El validador debe comprobar:

- conteos únicos exactos A1 740, A2 645, B1 523, B2 752 y C1 137;
- ninguna palabra aparece dos veces, ni dentro de un pack ni entre packs;
- todo slug y asset requerido existe;
- suma de todos los packs = 2.797 palabras únicas;
- manifest y archivos comparten `contentVersion`.

Añade `/offline-packs/` a `exclude` de Serwist en `next.config.mjs`: los packs
solo entran a CacheStorage por descarga explícita.

**Verify**: `pnpm offline-packs:generate && pnpm validate:offline-packs` → exit 0;
tras `pnpm build`, `public/sw.js` no contiene ninguna URL `/offline-packs/`.

### Step 2: Añadir recibos durables sin duplicar progreso

Añade una tabla Dexie `offlineResourcePacks` en la siguiente versión libre con:
`id`, `level`, `contentVersion`, `status`, `cacheName`, `resourceCount`,
`estimatedBytes`, `downloadedAt`, `lastVerifiedAt` y error público opcional.

`status` solo puede ser `downloading`, `ready`, `stale` o `failed`. Solo un
recibo `ready` permite prometer disponibilidad offline. No guardes el catálogo
de palabras dos veces en Dexie; el payload queda en CacheStorage y el recibo en
Dexie.

**Verify**: test con `fake-indexeddb` que migra desde la versión anterior y
lee/escribe recibos sin afectar tablas de progreso.

### Step 3: Implementar descarga, verificación, reparación y eliminación

`resource-pack-manager.ts` debe:

1. leer/validar el manifiesto;
2. consultar `navigator.storage.estimate()` cuando exista;
3. rechazar antes de descargar si la cuota conocida es insuficiente;
4. crear un cache con nombre versionado por nivel;
5. descargar recursos requeridos con concurrencia acotada;
6. verificar respuesta, conteo y presencia de cada URL;
7. descargar Coach por nivel como recurso opcional y registrar su conteo aparte;
8. escribir el recibo `ready` solo al final;
9. eliminar el cache parcial y marcar `failed` si falla un recurso requerido;
10. conservar el pack listo anterior hasta que la versión nueva quede `ready`.

Cada nivel usa su propio namespace de CacheStorage para evitar borrar audios
compartidos por lecciones individuales. Eliminar un pack borra únicamente su
cache y su recibo, nunca `downloadedLessons` ni progreso. Las filas Coach del
nivel se borran solo si el set Coach suelto de ese nivel no está descargado
(ver "Propiedad del contenido Coach").

Al iniciar el hub, repara recibos huérfanos: si falta una URL requerida, marca
`stale`; no muestres “disponible offline”.

**Verify**: tests de éxito, fallo intermedio, cuota insuficiente, retry,
actualización versionada, eliminación, recibo huérfano, y quitar un pack con el
set Coach suelto descargado (las filas Coach permanecen).

### Step 4: Consumir Essential Words desde el pack cuando no hay red

Añade un adapter bajo `lib/offline/` que lea el JSON CEFR del cache listo.
Intégralo en `lib/essential-words/client.ts` (`fetchChunks` /
`fetchEssentialWords`), importándolo de forma diferida, mediante una preferencia
explícita: red/cache HTTP normal cuando está disponible; pack listo como
fallback offline. No cambies IDs ni tipos y no mezcles palabras de otro nivel.

Si el pack está ausente, devuelve el estado “no descargado”; no sustituyas con
A1 ni con datos parciales sin etiqueta.

**Verify**: tests con fetch rechazado muestran que el nivel descargado carga y
otro nivel no aparece.

### Step 5: Construir una superficie honesta de descargas por nivel

Crea la sección como componente nuevo bajo `components/offline/`, con sus
subcomponentes declarados en comentario antes de implementar.
`OfflineHubClient` solo la compone; no le añadas lógica. En
`OfflineCoachPack`, sustituye `getCoachBankLevel` por la resolución canónica
(`getEffectiveLearnerLevelForViewer`, vía `useUserPreferences`) para que el
Coach y el pack sugieran el mismo nivel. Usa `Card`, `Button`/`PillButton` y `Badge`
vigentes, tokens semánticos, español y estados accesibles.

Comportamiento:

- Si la resolución canónica tiene nivel confiable: CTA “Descargar mi nivel A2”.
- Si el nivel está `unknown` o la lectura falló: pedir seleccionar un nivel;
  no preseleccionar A1 silenciosamente.
- Si el nivel es C2: sugerir el pack C1 con la etiqueta de la política C2.
- Mostrar tamaño estimado antes de descargar.
- Progreso por recursos, cancelar/reintentar, actualizar y quitar.
- Mostrar packs de otros niveles ya guardados sin borrarlos.
- Explicar por capacidad: “Disponible sin conexión”, “Disponible si lo
  descargaste” y “Necesita internet”.
- No prometer voz sintética offline: depende del navegador y no forma parte del pack.

La descarga requiere internet; estudiar el pack listo no. La interfaz debe
seguir funcionando en claro, oscuro y con un hue alternativo.

**Verify**: tests de estados unknown/C2/ready/stale/failed/quota y navegación por
teclado; `pnpm lint:design-tokens` → exit 0.

### Step 6: Aceptación real online, offline, reload y reconexión

Con navegador autenticado autorizado:

1. resolver el nivel real;
2. descargar solo ese nivel;
3. confirmar las URLs y bytes del manifiesto;
4. pasar offline y recargar `/offline`;
5. abrir una lección, Essential Words y práctica Coach cacheada;
6. completar una respuesta y confirmar outbox local;
7. reconectar y verificar flush sin duplicar efectos;
8. cambiar el nivel del perfil y confirmar que el pack anterior permanece pero
   el CTA sugiere el nivel nuevo;
9. eliminar el pack nuevo y confirmar que una lección descargada individualmente
   sigue disponible.

**Verify**: adjuntar evidencia de requests, CacheStorage, recibo Dexie y outbox.

### Step 7: Documentar la matriz conectada/offline

Actualiza `docs/architecture/offline-sync.md` y `docs/architecture/performance.md`
con la matriz real y la política de versiones. Registra qué recursos son
requeridos/opcionales y cómo se invalida un pack.

**Verify**: `pnpm type-check && pnpm lint && pnpm audit:hard-rules` → exit 0.

## Test plan

- Generadores: conteos, ownership CEFR, archivos ausentes y manifest estable.
- Manager: descarga completa, parcial, retry, cuota, update y remove.
- Adapter: fallback offline exacto por nivel.
- UI: nivel conocido/desconocido, estados, tamaño y acciones.
- Browser: online → offline → reload → respuesta → reconnect → sync.
- Usa `lib/offline/__tests__/download-manager.test.ts` como patrón de Dexie y
  CacheStorage; no ejecutes toda la suite salvo petición explícita.

## Done criteria

- [ ] Se generan packs A1-C1 con 2.797 palabras únicas y sin duplicados.
- [ ] `public/sw.js` no precachea ninguna URL `/offline-packs/`.
- [ ] La descarga sugerida usa el nivel canónico, sugiere C1 etiquetado para C2
      o pide selección si es unknown.
- [ ] Quitar un pack no borra el set Coach suelto descargado.
- [ ] Solo `ready` se presenta como disponible offline.
- [ ] Un fallo parcial no reemplaza un pack listo anterior.
- [ ] Eliminar un pack no elimina lecciones individuales ni progreso.
- [ ] Gemini, auth, sync y descarga nueva están etiquetados como conectados.
- [ ] Essential Words, decks/audios y Coach cacheado funcionan tras reload offline.
- [ ] El progreso offline entra al outbox y se sincroniza una vez al reconectar.
- [ ] Tests focalizados, type-check, lint y hard-rules pasan.
- [ ] Aceptación en claro/oscuro/hue alternativo y navegador offline registrada.

## STOP conditions

- Las entradas repetidas de Essential Words difieren entre sí, o los conteos
  únicos no coinciden con los de "Current state".
- Un deck de la ruta canónica no tiene archivo o referencia assets remotos sin
  CORS/cache compatible.
- Respetar la regla de propiedad Coach exige cambiar el esquema de
  `contentBankCache` o el formato del banco remoto.
- CacheStorage no permite verificar de forma fiable los recursos requeridos.
- La implementación necesita duplicar estado de progreso en la tabla de packs.
- La aceptación offline revela que el service worker no sirve el runtime diferido.

## Maintenance notes

Subir `contentVersion` cuando cambie un recurso requerido. Nunca borres un pack
viejo antes de completar el nuevo. Nuevos tipos de contenido se añaden como un
provider del manifiesto, no con condicionales repartidos por la UI.
