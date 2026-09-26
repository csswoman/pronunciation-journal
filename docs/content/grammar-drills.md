# Drills de gramática A1–C1 — Guía de contenido y autoría

Documentación del sistema de drills de gramática por niveles (A1 a C1): arquitectura pedagógica de 4 técnicas, matriz de especificaciones técnicas, reglas de autoría, validación Zod y generación asistida por IA.

---

## 1. Pedagogía de las 4 técnicas

Cada mazo de gramática (`GrammarDeck`) puede contener un bloque `drill` compuesto por 3 a 5 ejercicios que siguen una secuencia pedagógica progresiva desde el reconocimiento estructurado hasta la producción libre:

1. **`transform` (`sentence_transformation`)**: Manipulación activa de una estructura dada según una instrucción o palabra clave obligatoria (estilo Key Word Transformation).
2. **`build` (`reorder_words`)**: Reconstrucción de la sintaxis y el orden de constituyentes a partir de tokens o bloques de palabras mezclados.
3. **`correct` (`error_correction`)**: Detección de errores típicos de interlengua o validación de oraciones que ya son correctas (*"Está correcta"* a partir de A2).
4. **`personalize` (`personalization`)**: Transferencia comunicativa directa a la vida real del estudiante mediante marcos guiados (*frame*) o producción guiada (*open*).

---

## 2. Matriz de progresión por nivel (A1–C1)

Las especificaciones técnicas por nivel están tipadas en `DRILL_PROFILES` ([`lib/exercises/grammar-drill/profiles.ts`](../../lib/exercises/grammar-drill/profiles.ts)):

| Nivel | Intentos | Técnicas | Reorder | Already Correct | Personalización | Verificación sintáctica |
|---|---|---|---|---|---|---|
| **A1** | 2 | 4 técnicas | 4–6 tokens sueltos | 0% (siempre hay error evidente) | `frame` (1–2 slots simples: word/phrase/number) | No |
| **A2** | 2 | 4 técnicas | Oraciones con adverbios; 2 órdenes válidos | 20% (1 de cada 5) | `frame` guiado con slot estructurado | Opcional (`past_simple`, etc.) |
| **B1** | 2 | 4 técnicas | Bloques de palabras (`reorder_chunks`) | 30% | `open` (10–30 palabras) | Sí (`second_conditional`, `present_perfect`, etc.) |
| **B2** | 1 | 4 técnicas | Cláusulas con conectores complejos | 40% | `open` (15–40 palabras) | Sí (`third_conditional`, `passive_voice`, etc.) |
| **C1** | 1 | 4 técnicas | Estructuras de inversión o hendidas | 50% | `open` (20–50 palabras) | Sí (`cleft_what`, `cleft_it`, `negative_inversion`) |

---

## 3. Formato del Schema (`GrammarDrillSchema`)

El bloque `drill` reside dentro del JSON de cada mazo en `public/grammar-decks/*.json`:

```json
{
  "id": "b1-segundo-condicional",
  "level": "B1",
  "drill": {
    "deckId": "b1-segundo-condicional",
    "level": "B1",
    "reviewed": true,
    "items": [
      {
        "technique": "transform",
        "instruction": "Combina las dos oraciones en un segundo condicional usando 'if'.",
        "source": "I don't have enough money, so I don't buy a new laptop.",
        "target": "If I had enough money, I {would|'d} buy a new laptop.",
        "contractions": "equivalent"
      },
      {
        "technique": "build",
        "instruction": "Ordena los bloques para formar la oración condicional.",
        "sentence": "If we lived in London, we would visit the British Museum every weekend.",
        "mode": "reorder_chunks",
        "chunks": ["If we lived", "in London,", "we would visit", "the British Museum", "every weekend."]
      },
      {
        "technique": "correct",
        "sentence": "If she would study harder, she would pass the exam.",
        "alreadyCorrect": false,
        "error": "En la cláusula con 'if' se usa pasado simple (studied), no 'would'.",
        "correctSentence": "If she studied harder, she {would|'d} pass the exam."
      },
      {
        "technique": "personalize",
        "instruction": "¿Qué harías si ganaras la lotería mañana?",
        "mode": "open",
        "prompt": "Write a sentence about what you would do if you won the lottery tomorrow.",
        "requires": ["second_conditional"],
        "minWords": 10,
        "maxWords": 30
      }
    ]
  }
}
```

### Reglas duras de validación (`superRefine`)

1. **3 a 5 ítems**: Todo drill debe contener un mínimo de 3 y un máximo de 5 ítems.
2. **Tope de combinaciones (64)**: Toda plantilla `{a|b}` expandida no debe generar más de 64 combinaciones.
3. **No copias vacías**: En `transform`, `target` no puede ser idéntico a `source`.
4. **Palabra clave obligatoria**: Si se especifica `mustInclude`, debe aparecer en todas las variantes válidas de `target`.
5. **Consistencia de error**: Si `alreadyCorrect: true`, `error` debe ser nulo/omitido y `correctSentence` debe ser idéntico a `sentence`. Si es `false`, debe incluir explicación y corrección distinta.
6. **Integridad de detectores**: Toda regla en `requires` debe existir en el registro [`STRUCTURE_REGISTRY`](../../lib/exercises/structure-checks/index.ts).

---

## 4. Estado de revisión (`reviewed: true | false`)

- **`reviewed: true`**: El drill ha sido creado o auditado manualmente por un docente humano. Se asume verificado, pedagógicamente intachable y con plantillas de respuesta exhaustivas.
- **`reviewed: false`**: El drill fue generado automáticamente por el script de IA y aún no ha sido revisado por un humano. El frontend muestra una etiqueta sutil de *"Ejercicios nuevos"* en la pantalla de finalización del mazo ([`DeckDoneScreen.tsx`](../../components/courses/grammar-deck/DeckDoneScreen.tsx)).

---

## 5. Generación asistida con IA (`pnpm generate:grammar-drills`)

Para acelerar la creación de drills en mazos pendientes, existe el script CLI [`scripts/generate-grammar-drills.ts`](../../scripts/generate-grammar-drills.ts):

```bash
# Modo prueba (no escribe en disco)
pnpm generate:grammar-drills --dry-run --level B1

# Generar para un mazo específico
pnpm generate:grammar-drills --deck b1-segundo-condicional

# Generar hasta 5 mazos de nivel A2
pnpm generate:grammar-drills --level A2 --limit 5

# Forzar sobreescritura de drills existentes
pnpm generate:grammar-drills --deck a1-verbo-to-be --overwrite
```

### Comportamiento del script:
- Carga el contenido del mazo (`title`, `description`, `rules`, `pairs`, etc.).
- Envía el prompt estructurado [`buildGrammarDrillPrompt`](../../lib/ai-prompts.ts) a Gemini vía el SDK server-only.
- Valida la respuesta contra `GrammarDrillSchema`. Si falla, rechaza y reporta el error de validación.
- Marca los drills generados con `"reviewed": false`.
- Guarda un resumen de la ejecución en `grammar-drills-report.json`.
