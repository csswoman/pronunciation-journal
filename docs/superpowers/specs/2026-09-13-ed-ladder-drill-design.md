# Especificación de Diseño: Ed Ladder Drill (Entrenamiento de -ed y Clusters Finales)

**Fecha:** 2026-09-13  
**Estado:** Propuesta de diseño (Spec lista para revisión)  
**Dominio:** Pronunciación / Fonotáctica / Habla Conectada  
**Target:** Hispanohablantes (L1 Español → L2 Inglés)

---

## 1. Problema Fonético y Pedagógico

Para un hispanohablante, la terminación de pasado regular `-ed` es uno de los mayores obstáculos articulatorios y perceptivos en inglés:

1. **Inexistencia de clusters finales en español:** El español prácticamente no admite consonantes agrupadas al final de sílaba/palabra (salvo excepciones cultas como *vals* o *récord*). Grupos como `/vd/` (*achieved*), `/zd/` (*used*), `/kt/` (*walked*), `/st/` (*passed*) o `/pt/` (*stopped*) provocan dos errores sistemáticos:
   - **Elisión:** Se omite la consonante final (*"I achieve it"* en lugar de *"I achieved it"*).
   - **Epéntesis:** Se inserta una vocal espuria para crear una sílaba cómoda (*"achieve-de"* o *"walk-ed"* con vocal plena).
2. **Engaño de los modelos de lenguaje (ASR):** Las herramientas de reconocimiento de voz (Web Speech API) tienen un Language Model (LM) que predice lo que "debería" haber dicho el usuario por contexto sintáctico. Si la frase es *"Yesterday I walked to school"*, el ASR transcribirá *walked* incluso si el usuario dijo *walk*, falseando la evaluación.
3. **Falta de progresión por entorno acústico:** Muchas apps arrojan al estudiante directamente a pronunciar la palabra en oraciones complejas. En fonotáctica, la dificultad depende del entorno fonológico que sigue a la consonante:
   - Antes de vocal: se facilita mediante **resilabificación** (*linking*: /əˈtʃiːv‿dɪt/).
   - Antes de pausa: la consonante debe retenerse sin soltar una vocal parásita.
   - Antes de consonante: se forma un cluster de 3 o más consonantes (*achieved goals* /vd-ɡ/), donde los nativos a menudo no liberan la oclusión (*unreleased stop*).

---

## 2. Visión del Ejercicio: Las 3 Fases

El ejercicio se estructura en una progresión natural: **Oído → Boca (con muleta articulatoria) → Entornos de dificultad creciente**. Cada sesión dura 2–3 minutos y no se siente como un examen.

### Fase 1 — Discriminación Perceptiva (Oído Ciego)
- **Mecánica:** Se reproduce el audio de una oración. La pantalla no muestra texto hasta que el audio termine o el usuario pulse una opción.
- **Opciones:** Dos frases mínimas en pantalla:
  - Opción A: Presente / forma base (*"I walk to school"*)
  - Opción B: Pasado regular (*"I walked to school"*)
- **Invariante acústico-sintáctica obligatoria:** Ambas frases **deben ser 100% gramaticales y verosímiles en presente y pasado**. Se prohíben adverbios temporales (*yesterday*, *ago*, *last year*, *every day*) que permitan adivinar por gramática.
- **Objetivo:** Forzar al sistema auditivo del usuario a cazar la presencia/ausencia de la micro-explosión de la `/t/` o `/d/`.

### Fase 2 — Producción con Resilabificación (Boca con Enlace)
- **Mecánica:** Muestra el chunk verbal re-encadenado fonológicamente con la vocal siguiente:
  - Ortografía normal: `achieved it`
  - Resilabificación visual: `a-chie-vdit`
  - Transcripción IPA con ligadura de enlace: `/əˈtʃiːv‿dɪt/`
- **Mapeo tipográfico:** Uso de `font-mono` (Fragment Mono) y `font-ipa` (Andika) con resaltado visual del punto de unión (`‿`).
- **Grabación y ASR Honesto:**
  - El usuario graba *"I achieved it"*.
  - Como la frase es sintácticamente neutra, el ASR de Web Speech API no tiene sesgo gramatical y debe evaluar estrictamente la acústica.
  - Si transcribe `achieve it` → Fallo (se elidió la consonante).
  - Si transcribe `achieved it` → Acierto.

### Fase 3 — Escalera de Entornos (Transferencia Acústica)
Una vez dominado el enlace vocal (Nivel 1), el mismo verbo se enfrenta a los tres entornos fonotácticos:

| Nivel | Entorno Fonológico | Ejemplo | Mecánica Articulatoria | Tolerancia ASR |
|---|---|---|---|---|
| **Nivel 1** | **+ Vocal** (Enlace / Linking) | *I achieved it* (`/əˈtʃiːv‿dɪt/`) | La consonante final salta como inicio de la sílaba siguiente. Es la forma más fácil. | Estricta (debe detectar pasado) |
| **Nivel 2** | **+ Pausa** (Final de frase) | *That's what I achieved.* | La consonante cierra la frase. Debe sonar sin soltar una "e" de apoyo. | Estricta |
| **Nivel 3** | **+ Consonante** (Cluster duro) | *They achieved goals.* (`/vd-ɡ/`) | Choque de consonantes. Típicamente *unreleased /d/* en habla nativa. | Relajada (se acepta si el ASR reconoce el verbo en pasado) |

**Regla de desbloqueo:** El Nivel 3 solo se habilita cuando el usuario tiene un score de estabilidad ≥ 80% en los Niveles 1 y 2 para ese cluster.

---

## 3. Modelo de Datos y Esquema

### 3.1. Tipo de Ítem: `EdDrillItem`
Ubicación propuesta: `lib/pronunciation/ed-drills/types.ts`

```ts
export type EdAllophone = 't' | 'd' | 'id';

export type EdCluster =
  // Voiced (/d/)
  | 'vd'   // achieve -> achieved, live -> lived
  | 'zd'   // use -> used, close -> closed
  | 'bd'   // grab -> grabbed
  | 'gd'   // hug -> hugged
  | 'md'   // claim -> claimed
  | 'nd'   // clean -> cleaned
  | 'ld'   // call -> called
  // Voiceless (/t/)
  | 'kt'   // walk -> walked, look -> looked
  | 'pt'   // stop -> stopped, drop -> dropped
  | 'ft'   // laugh -> laughed
  | 'st'   // pass -> passed, miss -> missed
  | 'ʃt'   // wash -> washed, push -> pushed
  | 'tʃt'  // watch -> watched, reach -> reached
  // Syllabic (/ɪd/)
  | 't-id' // want -> wanted
  | 'd-id';// need -> needed

export type EdEnvironment = 1 | 2 | 3;

export interface EdDrillEnvironmentVariant {
  level: EdEnvironment;
  environmentType: 'before_vowel' | 'pre_pausal' | 'before_consonant';
  sentence: string;          // Ej. "I achieved it"
  contrastSentence: string;  // Ej. "I achieve it" (para fase 1)
  syllabified: string;       // Ej. "a-chie-vdit"
  ipa: string;               // Ej. "/əˈtʃiːv‿dɪt/"
  targetChunk: string;       // Ej. "achieved it"
}

export interface EdDrillItem {
  id: string;                // Hash determinista o slug: "ed-achieve"
  baseVerb: string;          // "achieve"
  pastVerb: string;          // "achieved"
  allophone: EdAllophone;    // "d"
  cluster: EdCluster;        // "vd"
  baseIpa: string;           // "/əˈtʃiːv/"
  pastIpa: string;           // "/əˈtʃiːvd/"
  environments: Record<EdEnvironment, EdDrillEnvironmentVariant>;
}
```

> **Nota sobre la invariante sintáctica.** La propuesta original incluía un campo `isAmbiguousContext: true`. Se elimina: un campo cuyo tipo solo admite `true` es una tautología —no puede ser `false`, así que no detecta nada ni en compilación ni en runtime—. La invariante se hace cumplir con un **test sobre el catálogo** (§7.1), no con un campo del modelo.

### 3.2. Métricas y Diagnóstico Adaptativo por Cluster
Almacenamiento en Dexie, tabla **`userEdClusterProgress`** (camelCase, como `journalEntries` / `trackedItems` / `completedLessons`; el snake_case `user_ed_cluster_progress` de la propuesta original no sigue la convención del esquema).

**Migración requerida:** el esquema va por la **v38** (`lib/db/index.ts:669`). La tabla entra como **v39**:

```ts
this.version(39).stores({
  userEdClusterProgress: 'id, userId, cluster, [userId+cluster], unlockedLevel, lastPracticedAt',
});
```

```ts
export interface UserEdClusterProgress {
  id: string;                // `${userId}:${cluster}` — clave primaria explícita
  userId: string;
  cluster: EdCluster;        // Ej. "vd"
  allophone: EdAllophone;    // "d"
  attemptsCount: number;
  accuracy: number;          // 0.0 - 1.0
  unlockedLevel: EdEnvironment; // 1, 2 o 3
  epenthesisWarningsCount: number; // Avisos de vocal parásita detectada
  lastPracticedAt: string;
}
```

**Comportamiento adaptativo:**
Si el usuario tiene un 95% de acierto en clusters silábicos `/t-id/` (*wanted*) y `/d-id/` (*needed*), el selector de ejercicios descarta esos ítems y concentra la sesión en clusters de fricativas sonoras como `/vd/` (*lived, achieved*) y `/zd/` (*used, caused*), que presentan la mayor tasa de error en hispanohablantes.

---

## 4. Mitigación de Retos Técnicos

### 4.1. Detección Heurística de Vocal Epentética (*"achieve-de"*)
- **Problema:** El usuario dice `/əˈtʃiːv.de/`. El ASR escucha la `/d/` y devuelve `"achieved"`. Marcaría acierto a pesar de que el usuario pronunció una sílaba adicional no nativa.
- **Solución acústica sin backend pesado:**
  1. Comparar la duración del audio grabado (`userAudioBlob.durationMs`) contra la duración del audio sintético de referencia (`ttsDurationMs` a velocidad 1.0).
  2. Si `userDuration > ttsDuration * 1.4` (un 40% más de tiempo relativo), se activa la bandera `suspectedEpenthesis`.
  3. **UI de feedback pedagógico:** No se suspende al usuario con un error rojo. Se muestra una sugerencia sutil en amarillo:
     > 💡 **Tip de articulación:** *Sonó un poco largo. En inglés, la "d" final se toca y se frena en seco contra el paladar; evita abrir la boca para decir un sonido "e" al final.*

### 4.2. Soporte de Reconocimiento y Fallback Honesto

> **Corrección (2026-09-13):** la premisa original de esta sección («Firefox/Safari/Brave no tienen ASR → degradar a shadowing») quedó obsoleta. Ver `lib/pronunciation/assessment/capability.ts:160-169`.

- **La puntuación NO depende del reconocedor nativo.** Los navegadores sin Web Speech usable —Firefox, Safari, Brave, Edge, Arc y prácticamente todos los móviles— se enrutan al **adaptador Gemini**, que graba el audio y lo transcribe del lado del servidor. La precondición real es **el micrófono**, no la Web Speech API.
- **Gate canónico:** `canScoreSpeech()` de `@/lib/speech/adapters/webSpeechAdapter`. El ejercicio **nunca** debe hacer early-return sobre `isSupported` crudo; ese patrón ya se corrigió en el resto de los componentes de pronunciación.
- **Fallback sin puntuación (patrón `ShadowingFallback`):** no es un componente reutilizable, es un patrón inline. Replicar el de `components/exercises/CsShadowPhraseExercise.tsx`:
  1. Derivar la bandera: `const isShadowing = !isSupported || isNetworkShadowing || evalFailed`.
  2. Renderizar la rama sin puntuación con el copy de `@/lib/speech/browser-support-message` (`SCORING_UNAVAILABLE_SHADOW_ES` para falta de soporte; mensaje de red para `errorCode === 'network'`).
  3. Salir mediante `PracticeContinueButton` → `onResult(..., { resultStatus: 'unscored' })`, o `'evaluator_failed'` si la evaluación reventó. Un intento sin puntuación **nunca** afecta accuracy/SRS/mastery.
- **No construir** un reproductor A/B propio ni una pregunta de autoevaluación nueva para este ejercicio: duplicaría el patrón existente y reintroduce el mensaje deshonesto de «tu navegador no es compatible» que ya fue eliminado del proyecto.

### 4.3. Gestión de Permisos de Micrófono
- **Bajo demanda:** No se solicita el permiso al cargar la página ni al entrar al Hub. Solo se activa al presionar el botón de "Grabar" en Fase 2.
- **Si el micrófono es denegado o no existe:**
  - Las Fases 1 (discriminación puramente auditiva) y 3 pasiva (escucha de contrastes en entornos) se mantienen 100% funcionales.

---

## 5. Integración en la Arquitectura de English Journal

### 5.1. Ubicación en Rutas y Componentes
1. **Ruta de práctica dedicada:**
   - `app/(authenticated)/practice/ed-drills/page.tsx`
   - O como selector de modo dentro de `app/(authenticated)/practice/connected-speech/page.tsx`.
2. **Componentes:**
   - `components/pronunciation/ed-drills/EdDrillSession.tsx` (Orquestador de la sesión de 3 fases)
   - `components/pronunciation/ed-drills/Phase1PerceptionCard.tsx` (Audio ciego + selección dual)
   - `components/pronunciation/ed-drills/Phase2LinkingCard.tsx` (Resilabificación visual + grabación con ASR)
   - `components/pronunciation/ed-drills/Phase3LadderCard.tsx` (Escalera de entornos 1, 2 y 3)
   - `components/pronunciation/ed-drills/ClusterProgressPills.tsx` (Visualizador de dominio por cluster: `/vd/`, `/zd/`, `/kt/`)

### 5.2. Integración en el Daily Plan (`/daily`)
- En `lib/practice/daily-plan/constants.ts`, dentro del grupo de pasos de `production`, se registra el tipo `ed_cluster_drill`.
- **Restricción de cupo:** ese archivo impone `MAX_PRODUCTION_STEPS = 1` (mantiene 1 paso de percepción + 1 de producción para que no se canibalicen). `ed_cluster_drill` **compite** por ese único slot de producción; no se añade encima. El planificador debe priorizarlo sobre el paso de producción habitual solo cuando exista evidencia de error (ver abajo), no por defecto.
- Si el usuario tiene registros de errores en verbos pasados en el Journal o fallos en oclusivas finales en Sound Lab, el planificador diario inserta un micro-paso de 2 minutos de `ed_cluster_drill`.

### 5.3. Conexión con el Journal (`/journal`)
- **Extracción de verbos del diario:**
  Cuando el usuario envía una entrada en su cuaderno (`JournalNotebookClient.tsx`), el pipeline de análisis extrae los verbos en pasado regular empleados.
- Si escribió *"I played tennis and cleaned my room"*, esos verbos (`play -> played` [/d/], `clean -> cleaned` [/nd/]) se marcan como *Verbos de tu diario* listos para practicar en el Ed Drill.

---

## 6. Inventario Inicial de Items (Seed Dataset)

| Verbo | Pasado | Alófono | Cluster | Nivel 1 (+ Vocal) | Nivel 2 (+ Pausa) | Nivel 3 (+ Consonante) |
|---|---|---|---|---|---|---|
| **achieve** | achieved | `/d/` | `/vd/` | *I achieve(d) it.* | *That's what I achieve(d).* | *I achieve(d) goals.* |
| **live** | lived | `/d/` | `/vd/` | *I live(d) in Spain.* | *Where I live(d).* | *I live(d) nearby.* |
| **use** | used | `/d/` | `/zd/` | *I use(d) an app.* | *That's what I use(d).* | *I use(d) my phone.* |
| **walk** | walked | `/t/` | `/kt/` | *I walk(ed) home.* | *That's where I walk(ed).* | *I walk(ed) fast.* |
| **stop** | stopped | `/t/` | `/pt/` | *I stop(ped) at once.* | *That's when I stop(ped).* | *I stop(ped) by.* |
| **pass** | passed | `/t/` | `/st/` | *I pass(ed) all tests.* | *That's what I pass(ed).* | *I pass(ed) exams.* |
| **clean** | cleaned | `/d/` | `/nd/` | *I clean(ed) everything.* | *That's what I clean(ed).* | *I clean(ed) rooms.* |
| **call** | called | `/d/` | `/ld/` | *I call(ed) at night.* | *That's who I call(ed).* | *I call(ed) back.* |

*(Nota: En todos los pares, tanto el presente como el pasado forman oraciones sintácticamente perfectas).*

---

## 7. Criterios de Aceptación y Verificación

1. **Invariante sintáctica (test automatizado, no revisión manual):** un test recorre el catálogo completo y falla si alguna `sentence` o `contrastSentence` contiene un adverbio temporal de una lista negra (`yesterday`, `ago`, `last …`, `every day`, `everyday`, `tomorrow`, `now`, `already`, `just`). Este criterio se escribe como test porque la revisión a ojo ya falló una vez: el ítem *walk* del seed decía *"I walk(ed) everyday"*, violando la propia invariante de la spec.
2. **Ocultamiento de texto en Fase 1:** El texto de las opciones permanece velado u oculto hasta que el audio concluye o el usuario interactúa.
3. **Resilabificación tipográfica:** Las sílabas enlazadas se renderizan con los tokens de diseño vigentes (`text-primary`, `font-mono`, `font-ipa`) sin estilos hardcodeados.
4. **Gate de puntuación correcto:** el componente decide con `canScoreSpeech()`; no existe ningún early-return sobre `isSupported` crudo. Un test cubre el caso `isSupported === false` y verifica que el ejercicio **renderiza la rama sin puntuación y permite continuar**, en vez de bloquear o desmontarse.
5. **Resistencia a fallos de micro:** Si el usuario no otorga permisos de micrófono, la sesión transiciona limpiamente al fallback sin puntuación (`resultStatus: 'unscored'`) sin congelar la app, y las Fases 1 y 3 pasiva siguen operativas.
6. **Migración Dexie:** la tabla `userEdClusterProgress` se añade como **v39** sin romper el esquema existente (v38); abrir la app con una base de datos previa no lanza `VersionError` ni pierde datos.
7. **Auditorías de proyecto:** Cumplir con `pnpm type-check`, `pnpm lint`, `pnpm test` y `pnpm audit:hard-rules`.
