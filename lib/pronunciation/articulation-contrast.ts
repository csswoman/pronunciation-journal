import type {
  JawOpening,
  LipShape,
  PhonemeArticulationGuide,
  TonguePosition,
} from "@/lib/pronunciation/articulation-guide-data";

/** Articulatory dimensions that can differ between the two sounds of a contrast. */
export type ContrastDimension = "lips" | "tongue" | "jaw" | "voicing";

export interface ContrastDifference {
  dimension: ContrastDimension;
  /** Short Spanish label for the dimension, e.g. "Labios". */
  labelEs: string;
  /** Human-readable value for sound A. */
  valueA: string;
  /** Human-readable value for sound B. */
  valueB: string;
}

export interface ArticulationContrast {
  differences: ContrastDifference[];
  /** Dimensions that differ, for highlighting the relevant panels. */
  changed: Set<ContrastDimension>;
  /** One-line Spanish summary of what the learner should watch for. */
  summaryEs: string;
}

const LIP_SHAPE_ES: Record<LipShape, string> = {
  spread: "estirados",
  neutral: "neutros",
  open: "abiertos",
  rounded: "redondeados",
  pursed: "fruncidos",
  "teeth-on-lip": "dientes sobre el labio",
  closed: "cerrados",
  "tongue-between-teeth": "lengua entre dientes",
};

const TONGUE_POSITION_ES: Record<TonguePosition, string> = {
  "high-front": "alta y adelante",
  "mid-front": "media y adelante",
  "low-front": "baja y adelante",
  central: "central",
  "high-back": "alta y atrás",
  "mid-back": "media y atrás",
  "low-back": "baja y atrás",
  "tip-between-teeth": "punta entre los dientes",
  "tip-on-ridge": "punta en la encía",
  "blade-on-palate": "lámina en el paladar",
  "back-on-velum": "dorso en el velo",
  "retroflex-curl": "punta curvada atrás",
  glottal: "en la glotis",
};

const JAW_OPENING_ES: Record<JawOpening, string> = {
  narrow: "poco abierta",
  medium: "medio abierta",
  wide: "muy abierta",
};

/** Order matters: the first difference is the one surfaced as the headline cue. */
const DIMENSION_PRIORITY: ContrastDimension[] = ["tongue", "lips", "jaw", "voicing"];

function buildSummary(differences: ContrastDifference[]): string {
  if (differences.length === 0) {
    return "Ambos sonidos comparten la misma postura visible: la diferencia está en la duración y la tensión, no en la forma de la boca.";
  }

  const headline = differences[0];
  const base = `Fíjate en ${headline.labelEs.toLowerCase()}: pasa de ${headline.valueA} a ${headline.valueB}.`;

  if (differences.length === 1) return base;

  const rest = differences
    .slice(1)
    .map((diff) => diff.labelEs.toLowerCase())
    .join(" y ");

  return `${base} También cambia ${rest}.`;
}

/** Compares two articulation guides and reports only the dimensions that actually differ. */
export function getArticulationContrast(
  guideA: PhonemeArticulationGuide,
  guideB: PhonemeArticulationGuide,
): ArticulationContrast {
  const candidates: Record<ContrastDimension, ContrastDifference | null> = {
    tongue:
      guideA.tonguePosition === guideB.tonguePosition
        ? null
        : {
            dimension: "tongue",
            labelEs: "La lengua",
            valueA: TONGUE_POSITION_ES[guideA.tonguePosition],
            valueB: TONGUE_POSITION_ES[guideB.tonguePosition],
          },
    lips:
      guideA.lipShape === guideB.lipShape
        ? null
        : {
            dimension: "lips",
            labelEs: "Los labios",
            valueA: LIP_SHAPE_ES[guideA.lipShape],
            valueB: LIP_SHAPE_ES[guideB.lipShape],
          },
    jaw:
      guideA.jawOpening === guideB.jawOpening
        ? null
        : {
            dimension: "jaw",
            labelEs: "La mandíbula",
            valueA: JAW_OPENING_ES[guideA.jawOpening],
            valueB: JAW_OPENING_ES[guideB.jawOpening],
          },
    voicing:
      guideA.vocalCordsVibrate === guideB.vocalCordsVibrate
        ? null
        : {
            dimension: "voicing",
            labelEs: "La voz",
            valueA: guideA.vocalCordsVibrate ? "con vibración" : "sin vibración",
            valueB: guideB.vocalCordsVibrate ? "con vibración" : "sin vibración",
          },
  };

  const differences = DIMENSION_PRIORITY.map((dimension) => candidates[dimension]).filter(
    (diff): diff is ContrastDifference => diff !== null,
  );

  return {
    differences,
    changed: new Set(differences.map((diff) => diff.dimension)),
    summaryEs: buildSummary(differences),
  };
}
