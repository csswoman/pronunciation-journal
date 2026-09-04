# English Journal — Showcase de Producto, Pedagogía y Arquitectura Técnica
> **Guía para Landing Page, Demostraciones de Producto y Portafolio de Ingeniería**

---

## 1. El Pitch: ¿Qué es English Journal y por qué es diferente?

La gran mayoría de aplicaciones de idiomas cometen uno de dos errores:
1. **La trampa del reconocimiento pasivo (estilo Duolingo):** Te presentan 4 opciones o tarjetas de opción múltiple. Tu cerebro reconoce la palabra visualmente en una fracción de segundo, dándote una falsa sensación de dominio. Cuando intentas hablar con un nativo, te bloqueas porque tu cerebro nunca aprendió a *recuperar y articular* la estructura por sí mismo.
2. **La trampa de la conversación libre sin andamiaje:** Te ponen frente a un bot de IA a "charlar libremente", lo que genera ansiedad o te permite esconderte usando siempre el mismo vocabulario básico sin corregir tus errores fosilizados.

**English Journal** fue diseñado desde cero sobre las bases científicas de la **Adquisición de Segundas Lenguas (SLA)** (Krashen, Swain, Nation, Schmidt):
* **Producción oral forzada con restricciones lingüísticas:** No basta con saber qué significa una palabra; el sistema te pide formular una idea completa usándola en tiempo real.
* **Biología y fonética para hispanohablantes:** Enseña la biomecánica exacta de la boca para los sonidos que no existen en español y entrena el oído para el compás acentual del inglés (*stress-timed rhythm*).
* **Bucle de reincidencia de errores (*Error Recurrence Loop*):** Los fallos no te restan "vidas" ni te castigan; se clasifican pedagógicamente y se programan mediante algoritmos de repetición espaciada para reaparecer al día siguiente en un ejercicio diferente.
* **Modo Offline-First real:** Toda tu práctica, vocabulario y progreso funcionan sin conexión a internet y se sincronizan de forma transparente e idempotente al reconectarse.

---

## 2. Los 4 Pilares de Aprendizaje

### Pilar A: Habla Fluida y Producción Forzada (Output Hypothesis)
* **Producción Guiada con IA (Gemini API):** El sistema te pide responder una pregunta o expresar una situación obligándote a usar una restricción gramatical específica (ej. *past simple narrativo*, *present perfect con for/since*, *third conditional*). Un modelo de IA evalúa la semántica, gramática y pertinencia, devolviendo retroalimentación pedagógica instantánea.
* **Misiones Orales Conversacionales:** Sesiones dinámicas de 3 a 5 turnos con un objetivo conversacional claro (ej. resolver un malentendido en un hotel, negociar una fecha límite en el trabajo, dar feedback constructivo).
* **Shadowing Bimodal en el Lector:** En la herramienta de lectura comprensible (*Reader*), el alumno escucha frases leídas con entonación nativa y graba su propia imitación; el sistema evalúa la precisión acústica, transcribe la voz del usuario y mide el tiempo de respuesta.

### Pilar B: Oído Real y Fonética Fisiológica (Ear & Speech Lab)
* **Sound Lab (Laboratorio de Sonidos):** Práctica focalizada en pares mínimos (*minimal pairs*) que confunden a los hispanohablantes: `/iː/` (sheep) vs `/ɪ/` (ship), `/æ/` (cat) vs `/ʌ/` (cup), `/b/` vs `/v/`, o la `/s/` inicial sin añadir una "e" de apoyo.
* **Guías Biomecánicas de Articulación:** Explicaciones visuales exactas de posición de la lengua, apertura mandibular y sonoridad (cuerdas vocales activas o sordas).
* **Tipografía Rítmica (*Stress Timing Display*):** El español es una lengua de ritmo silábico (cada sílaba dura lo mismo); el inglés es de ritmo acentual (las sílabas tónicas marcan el pulso y las átonas se reducen). La app resalta visualmente las palabras de contenido con peso y comprime las formas débiles (*weak forms* y *schwa*).
* **Desempaquetado Acústico en Habla Conectada:** Desglose interactivo de asimilación (*did you* $\rightarrow$ /dɪdʒuː/), elisión (*next door* $\rightarrow$ /neks dɔːr/) y enlaces (*linking words*), permitiendo al usuario escuchar a velocidad normal, lenta, y practicar con autocucha inmediata.
* **Entrenador Auditivo Contenido vs. Función:** Mini-lecciones interactivas para entrenar el oído a no esperar escuchar con fuerza preposiciones y artículos, sino anclarse a los sustantivos y verbos clave.

### Pilar C: Personalización Radical y Memoria Espaciada (SRS Multi-Capa)
En lugar de un único algoritmo genérico, la aplicación orquesta 4 capas independientes de memoria espaciada (SM-2 / FSRS):
1. **SRS de Vocabulario (`word_bank`):** Distingue entre conocimiento *receptivo* (lo entiendo al leer/escuchar) y *productivo* (lo sé usar hablando).
2. **SRS de Fonemas y Contrastes (`user_contrast_progress`):** Rastrea qué pares fonéticos dominas y cuáles sigues confundiendo auditiva o articulatoriamente.
3. **SRS de Gramática y Conceptos (`topic_srs`):** Monitorea tu tasa de acierto por concepto gramatical (ej. *inversiones*, *voz pasiva*, *artículos cero*).
4. **Cola de Reincidencia de Patrones de Error (`errorRecurrenceQueue`):** Si ayer cometiste un error de concordancia sujeto-verbo en una oración hablada o en tu diario, el sistema programa automáticamente un ejercicio de reparación para hoy.

### Pilar D: El Plan Diario Adaptativo (Daily Plan)
Cada mañana, un compositor inteligente analiza tu estado en Dexie y Supabase para armar una sesión perfecta de 10 a 15 minutos:
1. Repaso de vocabulario pendiente (SRS).
2. Foco en tu fonema más débil o prescripción diagnóstica activa.
3. Ejercicio de reparación de errores reincidentes recientes.
4. Misión oral conversacional (3 días a la semana).
5. Lectura o práctica contextual con vocabulario cruzado.

---

## 3. Métricas Únicas: Cómo se Mide el Progreso Real

La pantalla de **Progreso (`/progress`)** no muestra barras de experiencia vacías, sino métricas lingüísticas reales:

* **Latencia de Habla (*Speech Latency*):** El verdadero indicador de fluidez no es un porcentaje, sino cuántos segundos o milisegundos tarda el alumno en responder oralmente a un estímulo antes de bloquearse. La app mide el tiempo medio de respuesta y proyecta la tendencia (ej. *"⏱️ 2.1s de respuesta media · 0.8s más ágil que hace dos semanas"*).
* **"Ahora puedo decir..." (*Demonstrated Production*):** Una vitrina de estructuras complejas que el alumno ha formulado con éxito por sí mismo (sin pistas de opción múltiple).
* **Matriz de Habilidades por Dominio:** Desglose multidimensional de Precisión, Vocabulario, Gramática, Pronunciación, Escucha y Velocidad.

---

## 4. Gamificación y Próximos Juegos (Roadmap Lúdico)

Para consolidar el aprendizaje sin recurrir a trucos de casino ni mecánicas extractivas, English Journal integra y proyecta minijuegos pedagógicamente fundamentados:

| Minijuego | Mecánica | Valor Pedagógico |
|---|---|---|
| **Sopa de Letras Léxica (*Word Search*)** *(Disponible)* | Búsqueda de colocaciones y palabras aprendidas en una cuadrícula interactiva. | Refuerzo ortográfico y fijación visual de vocabulario reciente. |
| **Rhythm Tap (Beat the Stress)** *(Próximamente)* | Juego de ritmo donde pulsas al compás de las palabras acentuadas en una frase hablada. | Calibra el reloj interno del estudiante hispanohablante al ritmo *stress-timed* del inglés. |
| **Acoustic Unpack Race (Audio Detective)** *(Próximamente)* | Escuchas una frase a velocidad nativa rápida y debes desempaquetar las contracciones y reducciones contra el reloj. | Elimina la frustración de "hablan demasiado rápido" entrenando el oído a descifrar *connected speech*. |
| **Fast Fluency Dash (Sprint de Producción)** *(Próximamente)* | Desafío de producción oral en cadena donde el objetivo es reducir la latencia de respuesta manteniendo la precisión. | Automatización de estructuras lingüísticas y reducción del filtro afectivo (miedo a hablar). |

---

## 5. Ficha Técnica para Reclutadores y Evaluadores de Código

Este proyecto fue construido con estándares de ingeniería de software de nivel industrial, priorizando rendimiento, integridad de datos, resiliencia offline y código declarativo limpio:

### Stack Tecnológico
* **Frontend Framework:** Next.js 16 (App Router con Server Components y Client Components estrictamente delimitados) · React 19.
* **Lenguaje:** TypeScript en modo estricto (`noImplicitAny`, sin tipos `any` no documentados).
* **Estilizado & Tokens:** Tailwind CSS v4 con un sistema de tokens semánticos en espacio de color dinámico **OKLCH** (`--hue` dinámico, soporte `.dark`, contraste accesible WCAG AA).
* **Persistencia & Offline:** **Dexie.js (IndexedDB v34)** como base de datos local y fuente de verdad en cliente, con cola de sincronización bidireccional transaccional (`syncOutbox`) hacia **Supabase (PostgreSQL)** con Row Level Security (RLS) habilitada en todas las tablas.
* **Inteligencia Artificial:** **Google Gemini API** (SDK `@google/genai` con structured outputs JSON, schemas zod, y rate-limiting controlado) consumido exclusivamente a través de endpoints seguros del backend `/api/gemini/*`.
* **Procesamiento de Audio:** Web Speech API (`webkitSpeechRecognition`) + Web Audio API nativo para reproducción a velocidad variable y visualización de forma de onda.
* **Testing & Calidad:** **Vitest** con más de 4,100 tests unitarios y de integración · ESLint 9 con guardrails arquitectónicos estrictos (límite de líneas, prohibición de imports directos de DB fuera del query layer).

### Guardrails Arquitectónicos y Scripts de Auditoría
El repositorio incluye un conjunto de scripts automáticos ejecutados en pre-push (`pnpm audit:hard-rules` y `pnpm audit:learning-loop`):
* `audit:ai-prompts`: Prohíbe cualquier prompt inline o llamada a Gemini fuera de `lib/ai-prompts.ts` y `/api/gemini/*`.
* `audit:rls`: Valida que ninguna migración cree tablas de PostgreSQL sin RLS activa y políticas explícitas de usuario.
* `lint:design-tokens`: Impide colores hexadecimales o márgenes arbitrarios fuera de la cuadrícula de tokens semánticos de 4px.
* `audit:state-duplication`: Asegura que el estado persistente viva exclusivamente en Dexie/Supabase, limitando Zustand a estado efímero de UI (modales, tabs).
* `audit:learning-loop`: Audita continuamente los más de 3,400 contenidos y las 22 capacidades de ejercicio del ecosistema.

---

## 6. Ideas de Copy y Secciones Clave para la Landing Page

### Titulares de Alto Impacto (Hero Section)
* **Principal:** *"Deja de reconocer inglés. Empieza a producirlo."*
* **Subtítulo:** *"La app de inglés que no te trata como a un niño. Entrenamiento oral forzado, fonética fisiológica para hispanohablantes y repetición espaciada inteligente que elimina tus errores de raíz."*
* **CTA Primario:** *"Hacer diagnóstico de habla gratuito"*
* **CTA Secundario:** *"Ver cómo funciona"*

### Bloques de Funcionalidad para la Landing
1. **"¿Por qué te bloqueas al hablar?"** (Comparativa visual entre el modelo pasivo de Duolingo y el modelo de producción activa forzada de English Journal).
2. **"Tu boca no está rota; solo no sabe dónde ponerse"** (Muestra de las guías biomecánicas del Sound Lab y la tipografía de ritmo acentual).
3. **"El diario que te escucha y te corrige"** (Muestra del Journal y el ciclo automático donde tus errores de escritura o habla se convierten en ejercicios al día siguiente).
4. **"Mide tu fluidez en segundos, no en estrellitas"** (Captura del gráfico de latencia de habla de la pantalla de progreso).
5. **"Aprende en el metro o en el avión"** (Icono de offline-first: tus lecciones, flashcards y progreso funcionan sin conexión y se sincronizan al volver a casa).
