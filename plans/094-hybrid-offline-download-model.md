# Plan 094: Modelo Híbrido de Descarga de Lecciones Bajo Demanda

> **Executor instructions**: Este plan documenta la transición al modelo híbrido de contenido sin conexión, donde la aplicación opera cloud-first y ligera por defecto, permitiendo al usuario descargar lecciones bajo demanda para uso offline.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: architecture, offline, pwa, dexie
- **Planned at**: 2026-09-04

## Why this matters

Inicialmente la aplicación adoptaba una estrategia *offline-first* pesada con sincronización bidireccional continua en segundo plano y pre-caché de assets. Para hacer la app mucho más ligera sin perder la capacidad de estudiar sin internet, se implementó el **modelo híbrido bajo demanda**:
1. **Online por defecto**: La aplicación no descarga masivamente lecciones o audios innecesarios, minimizando el consumo de red y almacenamiento local.
2. **Descarga selectiva**: El usuario elige exactamente qué lecciones desea guardar mediante un botón de descarga en la ruta de cursos (`/courses`) y en la vista de estudio.
3. **Persistencia local**: La lección se guarda en una tabla de Dexie (`downloadedLessons`), y los audios fonéticos se almacenan en `CacheStorage`.
4. **Hub Offline resiliente**: Cuando el usuario está sin conexión, `/offline` detecta y lista sus lecciones descargadas, permitiéndole estudiar y responder el quiz de inmediato.
5. **Sincronización diferida de resultados**: Al completar una lección offline, el progreso se escribe en `completedLessons` y se encola en `syncOutbox`, sincronizándose con Supabase al recuperar internet.

## Componentes y Archivos Afectados

### 1. Capa de Base de Datos Local
- **`lib/db/index.ts`**:
  - Dexie sube a la versión 35 (`v35`).
  - Nueva tabla: `downloadedLessons: 'id, trackId, lessonNumber, slug, downloadedAt, [trackId+lessonNumber]'`.
  - Tipo `DownloadedLessonRecord`.
  - Helpers de acceso: `getDownloadedLesson`, `saveDownloadedLesson`, `deleteDownloadedLesson`, `listDownloadedLessons`, `isLessonDownloaded`.

### 2. Gestor de Descargas y Caché
- **`lib/offline/download-manager.ts`**:
  - `downloadLesson`: realiza el fetch de `/grammar-decks/${slug}.json`, extrae los audios fonéticos (`/sounds/*.ogg`) y los precachea en `caches.open('offline-lessons-media')`.
  - `removeDownloadedLesson`: elimina el registro de Dexie y limpia la caché de audio.
  - `useLessonDownload`: hook reactivo para consultar y mutar el estado de descarga de una lección.
  - `useAllDownloadedLessons`: hook reactivo para listar lecciones disponibles offline.

### 3. Superficies de UI
- **`components/icons/index.ts`**: Incorpora el icono `Download`.
- **`components/courses/LessonDownloadButton.tsx`**: Botón con feedback visual (descargando, descargada, confirmación de borrado) en variantes `icon-only` y `badge`.
- **`components/courses/CoursePathLessonRow.tsx`**: Botón de descarga integrado en cada fila de lección de la ruta.
- **`components/courses/grammar-deck/GrammarDeckHeader.tsx`**: Badge de descarga/estado offline en la cabecera del mazo.
- **`components/offline/DownloadedLessonCard.tsx`**: Tarjeta de lección guardada con botón para estudiar y eliminar.
- **`components/offline/OfflineHubClient.tsx`**: Interfaz de navegación sin conexión con reproductor `GrammarStudyDeck` integrado.
- **`app/offline/page.tsx`**: Página raíz offline conectada al cliente interactivo.

## Verificación

| Propósito | Comando | Resultado |
|---|---|---|
| Tests unitarios | `pnpm vitest run lib/offline/__tests__/download-manager.test.ts` | 3 passed (18ms) |
| Chequeo de tipos | `pnpm type-check` | Exit 0 |
| Linter y reglas duras | `pnpm lint` | Exit 0 |
