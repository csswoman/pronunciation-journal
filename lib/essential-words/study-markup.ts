/**
 * Minimal authoring markup for Essential Words study content.
 *
 * Authors use **text** to mark the exact pedagogical focus. The compiler
 * removes markup and emits zero-based, end-exclusive ranges for the UI.
 * Write literal ** as \`\\**\`; nesting is intentionally unsupported.
 */
export interface TextHighlight {
  start: number;
  /** Exclusive character offset in `text`. */
  end: number;
}

export interface CompiledMarkedText {
  text: string;
  highlights: TextHighlight[];
}

export class StudyMarkupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudyMarkupError";
  }
}

/** Compiles one author-authored string with the narrow `**focus**` syntax. */
export function compileMarkedText(source: string): CompiledMarkedText {
  let text = "";
  let markerStart: number | undefined;
  const highlights: TextHighlight[] = [];

  for (let index = 0; index < source.length; index += 1) {
    if (source.slice(index, index + 3) === "\\**") {
      text += "**";
      index += 2;
      continue;
    }

    if (source.slice(index, index + 2) !== "**") {
      text += source[index];
      continue;
    }

    if (markerStart === undefined) {
      markerStart = text.length;
    } else {
      if (text.length === markerStart) {
        throw new StudyMarkupError("El marcado ** ** no puede estar vacío.");
      }
      highlights.push({ start: markerStart, end: text.length });
      markerStart = undefined;
    }
    index += 1;
  }

  if (markerStart !== undefined) {
    throw new StudyMarkupError("Marcador ** sin cerrar. Usa \\** para asteriscos literales.");
  }

  return { text, highlights };
}
