import type {
  JawOpening,
  LipShape,
  PhonemeArticulationGuide,
} from "@/lib/pronunciation/articulation-guide-data";
import type { Difficulty } from "@/lib/pronunciation/ipa-data";
import { getTongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";

/**
 * Short captions for the articulation carousel. Each slide says one thing the
 * other slides don't: tongue slide → tongue, lips slide → lips + jaw,
 * steps slide → the full how-to.
 */

const LIP_SHAPE_LABEL: Record<LipShape, string> = {
  spread: "Estirados",
  rounded: "Redondeados",
  pursed: "Fruncidos",
  open: "Abiertos",
  closed: "Cerrados",
  "teeth-on-lip": "Dientes sobre el labio de abajo",
  "tongue-between-teeth": "Lengua entre los dientes",
  neutral: "Relajados",
};

const JAW_LABEL: Record<JawOpening, string> = {
  narrow: "boca casi cerrada",
  medium: "boca medio abierta",
  wide: "boca bien abierta",
};

/** Lip shapes where the jaw opening adds nothing to the instruction. */
const JAW_IRRELEVANT = new Set<LipShape>(["closed", "teeth-on-lip", "tongue-between-teeth"]);

const MANNER_HINT: [RegExp, string][] = [
  [/^Fricativa/i, "El aire sale rozando, sin parar"],
  [/^Oclusiva/i, "Frenas el aire y lo sueltas de golpe"],
  [/^Africada/i, "Frenas el aire y lo sueltas rozando"],
  [/^Nasal/i, "El aire sale por la nariz"],
  [/^Aproximante|^Lateral/i, "El aire pasa sin que cierres del todo"],
  [/\(tensa\)/i, "Hazla firme, con la boca tensa"],
  [/\(relajada\)/i, "Hazla suave, con la boca floja"],
  [/\(átona\)/i, "Corta y sin fuerza"],
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil para hispanohablantes",
  medium: "Necesita práctica",
  hard: "Difícil para hispanohablantes",
};

export function getLipShapeLabel(shape: LipShape): string {
  return LIP_SHAPE_LABEL[shape] ?? LIP_SHAPE_LABEL.neutral;
}

export function getTongueCaption(guide: PhonemeArticulationGuide): string {
  // Diphthong placeEs already describes the tongue's path ("De abierta a cerrada frontal").
  if (guide.glide) return guide.placeEs;
  return getTongueGeometry(guide.tonguePosition).label;
}

export function getLipsCaption(guide: PhonemeArticulationGuide): string {
  const { glide } = guide;
  if (glide) {
    if (glide.lipShape !== guide.lipShape) {
      return `${getLipShapeLabel(guide.lipShape)} → ${getLipShapeLabel(glide.lipShape).toLowerCase()}`;
    }
    return `${capitalize(JAW_LABEL[guide.jawOpening])} → ${JAW_LABEL[glide.jawOpening].replace("boca ", "")}`;
  }
  const lips = getLipShapeLabel(guide.lipShape);
  return JAW_IRRELEVANT.has(guide.lipShape) ? lips : `${lips} · ${JAW_LABEL[guide.jawOpening]}`;
}

/** One plain-language hint about how the sound is produced, or null. */
export function getMannerHint(guide: PhonemeArticulationGuide): string | null {
  return MANNER_HINT.find(([pattern]) => pattern.test(guide.mannerEs))?.[1] ?? null;
}

export function getDifficultyLabel(difficulty: Difficulty | undefined): string | null {
  return difficulty ? DIFFICULTY_LABEL[difficulty] : null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
