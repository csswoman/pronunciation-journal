# Diseño: Contenido de Escucha, Palabras de Contenido y Formas Débiles

Fecha: 2026-09-02
Estado: Aprobado

## Resumen Ejecutivo
Implementación de contenidos pedagógicos y herramientas interactivas de entrenamiento auditivo basadas en la distinción de **Content Words vs. Function Words**, el rol del **Schwa (/ə/)** en el habla conectada y las **Weak Forms**. Abarca la creación de una nueva lección, el enriquecimiento de lecciones existentes, un componente interactivo de discriminación acústica y la ampliación del dataset del entrenador de habla conectada.

---

## 1. Contenidos y Lecciones Estáticas

### 1.1 Nueva Mini-Lección y Lección Completa (`slug: "better-listening-weak-forms"`)
- **Mini-lección**: `public/mini-lessons/better-listening-weak-forms.json`
  - `id`: 65 -> 66 (siguiente ID disponible).
  - `slug`: `"better-listening-weak-forms"`
  - `category`: `"listening"`
  - `level`: `"intermediate"`
  - `duration`: 6 min
  - `title`: "El Secreto de la Escucha Fluida: Palabras de Contenido y Formas Débiles"
  - `subtitle`: "Por qué los nativos no pronuncian cada palabra igual y cómo reprogramar tu oído"
  - `body`: Explicación sintética de cómo el inglés acentúa palabras clave de significado y reduce las palabras gramaticales con schwa.
  - `tip`: "Aceptación activa: las palabras gramaticales se reducen por el ritmo del idioma, no porque tengas mal oído."

- **Lección Completa**: `public/lessons/better-listening-weak-forms.json`
  - **Sección 1: La Jerarquía de las Palabras (Content vs. Function Words)**: Explicación sistemática de cómo sustantivos, verbos principales, adjetivos y adverbios transmiten el mensaje esencial, mientras preposiciones, artículos y pronombres actúan de pegamento gramatical.
  - **Sección 2: El Poder de las Palabras de Contenido**: Análisis de cómo los estudiantes comprenden la idea global captando solo las palabras acentuadas mientras las intermedias parecen esfumarse.
  - **Sección 3: Habla Conectada y la Reducción a Schwa (/ə/)**: Explicación del schwa como la vocal más frecuente en inglés y motor de la reducción fonética natural.
  - **Sección 4: Formas Débiles (Weak Forms vs. Strong Forms)**: Comparativa directa entre la pronunciación aislada de diccionario y la pronunciación conectada en una frase fluida.
  - **Sección 5: Estrategias Accionables**: Las tres pautas clave: Aceptación (comprensión del fenómeno), Entrenamiento del oído (búsqueda deliberada de reducciones) y Práctica en contexto.
  - **Ejemplos Fonéticos**: Con transcripción IPA y notas de enlace (`can` /kæn/ -> /kən/, `to` /tuː/ -> /tə/, `for` /fɔːr/ -> /fər/, etc.).
  - **Ejercicios y Quiz**: Comprobación interactiva estructurada.

### 1.2 Enriquecimiento de Lecciones Existentes
- `public/lessons/basic-listening-reductions.json`: Se incorpora contexto sobre la reducción de palabras de función a schwa como causa raíz de contracciones informales (`want to` -> `wanna`, etc.).
- `public/lessons/sentence-stress.json`: Se profundiza en la relación entre el ritmo acentual y la atenuación de las palabras funcionales.

---

## 2. Componente Interactivo: `ContentFunctionEarTrainer`
- **Ubicación**: `components/mini-lessons/ContentFunctionEarTrainer.tsx`
- **Responsabilidad**: Brindar un ejercicio guiado de discriminación auditiva y visual dentro de la lección `/mini-lessons/better-listening-weak-forms`.
- **Características**:
  - Control de audio con doble velocidad: Normal (1.0x) y Lenta (0.65x) mediante `lib/speech/synthesis.ts`.
  - Desglose de oración en tokens interactivos accesibles con teclado.
  - Modo desafío: selección de palabras de contenido vs. palabras de función.
  - Modo "Revelar mapa acústico": resalta visualmente las palabras tónicas e ilustra la reducción de vocales a schwa `/ə/`.
- **Integración**: Renderizado condicional en la página de detalle de mini-lección cuando el slug sea `better-listening-weak-forms`.

---

## 3. Ampliación del Entrenador de Habla Conectada
- **Archivo**: `lib/pronunciation/connected-speech-data.ts`
- **Ampliación de `weak-forms`**: Se incorporan 6 frases de uso real a la categoría `weak-forms`:
  1. `"We can meet at two"` (`can` -> `/kən/`, `at` -> `/ət/`)
  2. `"It's for the team"` (`for` -> `/fər/`, `the` -> `/ðə/`)
  3. `"He was ready to go"` (`was` -> `/wəz/`, `to` -> `/tə/`)
  4. `"I have to talk to them"` (`to` -> `/tə/`, `them` -> `/ðəm/`)
  5. `"From time to time"` (`from` -> `/frəm/`, `to` -> `/tə/`)
  6. `"It was more than enough"` (`than` -> `/ðən/`, `was` -> `/wəz/`)
- Permite práctica fonética en `/practice/connected-speech` con grabación, reproducción dual y autoevaluación.

---

## 4. Estándares Técnicos y Verificación
- Cumplimiento de `CLAUDE.md`: componentes con comentarios de subestructura, < 250 líneas, uso exclusivo de tokens Tailwind v4 (`tokens.css`), cero imports no autorizados de Supabase.
- Verificación con la suite de calidad:
  - `pnpm type-check`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm audit:hard-rules`
