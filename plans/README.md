# Planes de implementación

Cinco series. La primera (001–004, peso y carga) está cerrada. La segunda
(005–019) sale de la auditoría pedagógica del 2026-09-18 sobre `c869029c`:
cómo se evalúa y avanza el nivel, si el contenido está conectado al ciclo de
evidencia, y qué ve el usuario que no proviene de datos reales. La tercera
(020–027) sale de la auditoría de cableado del 2026-09-22 sobre `eb4cb5d3`.
La cuarta (028–034) sale de la auditoría de conexión pedagógica del 2026-09-22
sobre `87636eca`: reparar bucles sueltos (diario → habla), resiliencia offline,
expansión del content graph a niveles A2/B1, descubrimiento de superficies y
evaluación de escucha y habla en checkpoints. Sus planes 029–034 se revisaron
contra las rutas reales antes de ejecutarse.
La quinta (035–042) prioriza el uso sostenible de modelos gratuitos: cuotas por
proyecto, prompts con salida estructurada, un AI Coach y ejercicios que llaman
menos a la IA, voces locales para entrenar el oído con muchas voces, y feedback
de pronunciación por sonido que se calcula en el dispositivo.

Cada ejecutor: lee el plan completo antes de empezar, respeta sus STOP
conditions y actualiza su fila al terminar. Los planes nuevos usan ramas
`codex/NNN-slug` desde `dev` solo si el operador pide crear una rama; no hacen
commit ni push sin instrucción explícita. Las ramas `advisor/*` de la serie 2
son históricas.

## Serie 5 — uso gratuito y resiliencia de IA (2026-09-23)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 035 | Aprovechar la IA gratuita sin agotar el servicio (fases A/B/C) | P1 | M | — | IN PROGRESS (fases A–C en código; migraciones pendientes de aplicar y validar) |
| 036 | Salida estructurada y prompts ajustados al nivel | P2 | M | 035 fase A | DONE (20 rutas JSON; eval 11/12 frente a 8/12; 5313 tests) |
| 037 | AI Coach y ejercicios más rápidos, variados y con menos llamadas a IA | P1 | L | 035 fase A | DONE (fases A, B y C) |
| 038 | Feedback de pronunciación por sonido (estilo ELSA) sin cuota de IA | P2 | L | fase A: —; fases B/C: 039 fase A | fase A DONE; fase B en curso |
| 039 | Voces locales (Kokoro) y entrenamiento de percepción con muchas voces (HVPT) | P1 | L | — | TODO |
| 040 | Las correcciones del AI Coach alimentan la cola de errores repetidos | P1 | S | — | TODO |
| 041 | Banco de ejercicios pregenerados con la cuota diaria que sobra | P2 | M–L | 035 fase B, 037 fases A/B1 | TODO |
| 042 | Botón "Esta corrección está mal" y casos de evaluación reales | P2 | S–M | 036, 040 | TODO |
| 043 | Drills de gramática A1–C1 (4 técnicas) con corrección tolerante y local | P1 | L | — (comparte pieza con 037 C1) | TODO |

Orden recomendado: **040 → 035 fase A → 037 fase A → 039 → 035 fase B → 037 fases B/C → 041 → 036 → 042 → 038 fases B/C**.
040 va primero porque es pequeño, no gasta requests y no depende de nada.
043 puede ir en cualquier momento: no gasta requests y su fase A es el paso 3 de 037 C1 (hacerla antes ahorra trabajo a 037).
La fase A de 038 (textos honestos + comparar tu grabación con el modelo) puede hacerse en cualquier momento.
Cada plan de la serie 5 termina con un **paso de documentación** (README, `CLAUDE.md`,
`ENGINEERING_STANDARDS.md`, `docs/architecture/`, `docs/README.md`): una fase no está DONE hasta actualizar
lo que cambió. 039 prepara la CSP, el Web Worker y la descarga bajo demanda que reutiliza 038. 038 fase B es un spike con puerta
de decisión sobre L2-ARCTIC (hablantes de español); la fase C solo se ejecuta si pasa.

### Backlog propuesto (sin plan todavía)

Ideas investigadas el 2026-09-23; todas gratis y sin cuota de Gemini. Convertir en plan cuando se pida.

| Idea | Recurso | Nota |
|---|---|---|
| Dictados (escuchar → escribir) corregidos en local | Kokoro (039) + oraciones de Tatoeba (CC BY 2.0 FR) o chunks propios; `lib/exercises/diff-words.ts` | El audio de Tatoeba tiene licencia por grabación, a menudo no comercial: usar Kokoro |
| Shadowing con curva de entonación (tú vs. modelo), sin nota | `lib/speech/pitch-detector.ts` + Kokoro | Solo visual hasta tener un benchmark de entonación |
| Modo voz del Coach por turnos, sin Live API | Reconocimiento del navegador → Whisper tiny.en en el navegador (transformers.js) como respaldo → Gemini texto → Kokoro | Whisper sustituye a Gemini Transcribe (~25 RPD) como fallback; depende de 037 y 039 |
| Revisión gramatical en vivo mientras se escribe en el Diario | LanguageTool (API pública gratis: 20 req/min, 75k caracteres/min; o instalarlo en tu propio servidor) | Gemini queda para naturalidad y explicaciones al guardar |
| Formas flexionadas e IPA US/UK para corregir en local | Kaikki.org (Wiktionary en JSON, CC BY-SA) | Mejora `matchesAcceptedAnswer` del Plan 037 (`went` ≈ `go`) |

035 se revisó el 2026-09-23: se recortaron Live, embeddings, Gemma, selector de voz
y reservas de TPM (diferidos). La elegibilidad gratuita de cada modelo se verifica
al ejecutar.

## Serie 4 — bucle pedagógico y progresión oral conectada (2026-09-22, `87636eca`)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 028 | Conectar restricciones de reparación del Diario a la práctica oral del Plan Diario | P1 | S | — | DONE (restricciones propagadas y priorizadas; 143 tests del Plan Diario pasan) |
| 029 | Persistir sin pérdidas la reincidencia de errores del Diario | P1 | L | — | DONE (RPC transaccional + migración aplicada en Supabase remoto el 2026-09-23) |
| 030 | Mejorar el descubrimiento de Reader, Chunks y Drills | P2 | S | — | DONE (verificación visual diferida por indicación del usuario; estilos se cambiarán después) |
| 031 | Writing Nudges: Palabras de repaso como sugerencia activa en el Diario | P2 | M | 028, 029 | DONE (vocabulario opcional y origen de repaso verificado) |
| 032 | Expandir anclas del content graph de chunks para niveles A2 y B1 | P2 | M | — | DONE (116 chunks: 36 A1, 50 A2, 30 B1) |
| 033 | Evaluar comprensión auditiva en todos los checkpoints de nivel | P2 | L | — | DONE (18 audios, scoring y feedback por nivel implementados; suite de 7 archivos pasa al 100%) |
| 034 | Incorporar evidencia oral verificable en checkpoints | P2 | L | 033 | IN PROGRESS (piloto personal A1/A2; falta confirmar una ejecución del checkpoint oral; B1–C2 diferidos) |

Orden recomendado: **028 → 029 → 033 → 034** para cerrar el bucle de reparación
y hacer que la promoción exija escucha y habla verificables. **030 y 031** pueden
programarse después según prioridad de producto; 031 depende de 028 y 029.
032 ya cubre 36 A1, 50 A2 y 30 B1 (116 chunks) en el trabajo local, conectando 80 expresiones intermedias al vocabulario y pronunciación.
Reader ya figura en el hub de práctica; 030 añadió Lectura a Aprender y Escalera
de -ed a los accesos rápidos, manteniendo el único acceso existente a Chunks.
Sus tests, type-check y lint pasan; por indicación del usuario, la verificación
visual se difiere hasta el próximo trabajo de estilos. 029 se rediseñó porque la corrección del Diario
corre en el servidor y no puede escribir en Dexie directamente.

## Serie 3 — plan diario y evidencia evaluable (2026-09-22, `eb4cb5d3`)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 020 | Progreso muestra participación en Daily sin afirmar planes completos | P1 | M | — | DONE |
| 021 | Cada respuesta de teoría cuenta una sola vez | P1 | S | — | DONE |
| 022 | La práctica externa resuelve solo targets diarios equivalentes | P1 | M | 021 | DONE |
| 023 | Los drills de -ed guardan intentos y actividad recuperable | P1 | L | 022 | DONE |
| 024 | Focus registra actividad y respuestas evaluadas | P1 | L | 021, 022 | DONE |
| 025 | El quiz de inmersión registra respuestas y su paso exacto | P2 | M | 021, 022 | DONE |
| 026 | Las habilidades dependen de la tarea evaluada | P2 | M | 021, 024 | DONE |
| 027 | Tests runtime verifican las salidas declaradas | P2 | M | 022–026 | DONE (2026-09-23; 10 superficies con escritores reales; hallazgo: quiz de cursos no es replay-safe) |

Orden recomendado: **021 → 020 → 022 → 023 → 024 → 025 → 026 → 027**.
020 puede ejecutarse en paralelo con 021. 023–025 pueden ejecutarse por separado
después de 022, pero comparten el contrato de `activity_sessions`: revisar
solapamientos antes de integrarlos. 027 se ejecuta al final para probar los
caminos de producción ya implementados.

La comprobación de catálogo actual (`node_modules/.bin/tsx.cmd
scripts/audit-learning-loop.mjs`) pasa con 4.125 entradas y 0 incidencias;
comprueba declaraciones, no llamadas runtime. Los tests focalizados de
reconciliación, actividad y evidence exits pasan (3 archivos, 13 tests). En este
checkout `pnpm audit:learning-loop` intentó reinstalar `node_modules` y abortó
sin TTY; los planes permiten usar los binarios locales existentes, dejando
constancia de esa sustitución. No se ha verificado la aplicación de migraciones
en Supabase remoto.

## Serie 2 — evaluación, progresión y contenido honesto (2026-09-18, `c869029c`)

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 005 | Eliminar datos inventados en Home, Diario, Daily, landing y enlaces rotos | P1 | M | — | DONE (rama `advisor/005-remove-fabricated-ui-data`) |
| 006 | Progreso no presenta cobertura ni volumen como dominio | P1 | S | — | DONE |
| 007 | El nivel y su procedencia solo los escribe el servidor tras re-puntuar | P1 | M | — | DONE |
| 008 | Todas las pantallas leen el nivel por `resolveLearnerLevel`; estado "desconocido" | P1 | M | — (mejor tras 007) | DONE |
| 009 | Retirar el estimador de nivel por precisión de pronunciación y la semilla B1 | P2 | S | — (mejor tras 008) | DONE |
| 010 | Home propone el checkpoint cuando el alumno está listo | P2 | M | 007, 008 | DONE (rama `advisor/010-checkpoint-readiness`) |
| 011 | Daily incluye temas vencidos; repaso de temas sin target fantasma | P2 | M | — | DONE (rama `advisor/011-daily-topic-srs`) |
| 012 | Inmersión offline-first (outbox) y en el manifest | P2 | M | — | DONE (rama `advisor/012-immersion-offline-manifest`) |
| 013 | Los 37 mazos engVid entran en la Ruta o dejan de publicarse | P1 | M | — | DONE (mazos conservados como borradores no publicados) |
| 014 | El placement de invitado llega a la cuenta; fallos visibles | P2 | S | 007 | DONE (rama `advisor/014-guest-claim`) |
| 015 | El contador de Repaso solo promete colas ejecutables | P2 | M | — | DONE |
| 016 | La vista previa del plan diario en Home refleja el plan real | P2 | M | — | DONE (Home y Daily comparten `useDailyPlan`) |
| 017 | Mini-lecciones ordenadas por nivel y candidatas del Plan diario | P3 | M | 008 | DONE |
| 018 | Mazos personales, juegos, word-rain y word-search registran actividad | P3 | L | 012 | DONE |
| 019 | SRS de chunks y frases del sistema sincroniza vía outbox | P3 | L | — | DONE |

Orden recomendado: 013 → 005 → 006 → 007 → 008 → 009 → 011 → 012 → 010 → 014 → 015 → 016 → 017 → 018 → 019.

Estados: TODO | IN PROGRESS | DONE | BLOCKED (motivo) | REJECTED (motivo).

### Dependencias

- 013 primero porque desbloquea `pnpm test` (dos de los tres archivos que
  fallan son los tests de contenido que estos mazos rompen desde `865381f8`).
- 008 asume que 007 ya movió las escrituras al servidor; puede ejecutarse
  antes, pero entonces `ProfileSettings` seguirá escribiendo por cliente.
- 010 usa la validación de checkpoint de 007 y el lector de 008.
- 014 depende de 007 si la ruta pasa a exigir `answers`.
- 018 reutiliza el patrón de "superficie de actividad" que 012 introduce en el manifest.

### Baseline de verificación (medido el 2026-09-18)

- `pnpm type-check`: exit 0.
- `pnpm audit:learning-loop`: OK, 3836 entradas, 0 issues (pero solo audita
  lo que ya está en el manifest; ver 012 y 018).
- `pnpm test`: 838 archivos pasan, **3 fallan** (17 tests):
  `lib/content/__tests__/content-integrity.test.ts` y
  `lib/courses/__tests__/content-audit.test.ts` (37 mazos huérfanos y con
  <6 tarjetas; plan 013) y
  `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
  (el mock de `@/lib/db` no exporta `ensureDbReady`, que
  `lib/learner-level/client-queries.ts` ahora importa; lo resuelve el
  propietario, no hay plan).

## Hallazgos considerados y descartados (no re-auditar)

- **Completar un mazo al llegar a la última tarjeta escribe `lesson_completions`**: permitido por el contrato (Mazos = completion); `topic-progress.ts` lo excluye del dominio. Solo era un problema de presentación (plan 006).
- **`savePracticeAnswer` actualiza word_bank y topic a la vez**: atribución multi-outcome legítima, no doble registro.
- **`SAMPLE_NOTEBOOK_DATA` en `lib/journal/notebook-types.ts`**: solo parámetro por defecto; el único caller pasa datos reales. No visible. (Borrarlo es opcional.)
- **`SAMPLE_FLASHCARDS` en `HomeEssentialWordsBody`**: arte decorativo junto a un contador real; no se presenta como datos del usuario.
- **`DEFAULT_GAPS` en `lib/focus/gap-suggestions.ts`**: fallback etiquetado `source: 'default'` y mostrado como tal. Correcto.
- **Rutas `/test` y `/dev/sounds`**: gateadas con `notFound()` en producción.
- **Pila de pronunciación**: no afirma precisión acústica; `PronunciationEvidenceDetail` lo aclara. Cumple el contrato.
- **`practice_estimate` en el CHECK SQL**: se deja en la base (sin filas); solo se retira del código (plan 009).
- **`failureFallback` de los checkpoints**: bajar de nivel al fallar es decisión de producto; anotado en 010, no planificado.
- **Consolidar los 4 stores de escritura del nivel en `setLearnerLevel`**: útil, pero después de 007/008/009; no planificado todavía.

## Serie 1 — peso y carga (2026-09-14, `7c788c6a`)

| Plan | Objetivo | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 001 | Hacer fiable la medición de chunks diferidos | P1 | M | — | DONE |
| 002 | Aislar preferencias UI del esquema Dexie | P1 | M | 001 | DONE |
| 003 | Mantener el constructor diario fuera del hub inicial | P1 | M | 001 | DONE |
| 004 | Reducir Review según atribución de módulos | P2 | M | 001 | DONE |

Descartados en la serie 1: subir `bundle-budget.json` sin medición de
navegación; excluir chunks por hash (inestable con Turbopack).
