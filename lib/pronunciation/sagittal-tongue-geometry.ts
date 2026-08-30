import type { TonguePosition } from "@/lib/pronunciation/articulation-guide-data";

export interface TongueGeometry {
  path: string;
  contactX: number;
  contactY: number;
  label: string;
  /** True when the tongue makes a full or near-full closure against the roof. */
  isContact: boolean;
}

/**
 * Sagittal tongue shapes on a shared 240x180 canvas.
 *
 * All shapes are built from the same anatomical skeleton so that two sounds can
 * be overlaid and compared honestly:
 *   - the root is pinned at the pharyngeal wall (x≈62)
 *   - the floor runs along y≈142 to the front of the mouth (x≈135)
 *   - only the dorsum apex and the blade/tip vary between positions
 *
 * Vowel heights are spread across the full usable airway (apex y from ~84 at the
 * palate down to ~124 at the floor) rather than the anatomically literal ~14px,
 * because the diagram's job is to make the height contrast legible. The relative
 * ordering between vowels is preserved, and `clampUnderPalate` guarantees no
 * shape ever crosses the roof of the mouth.
 */

/** Pharyngeal root + floor of the mouth, shared by every shape. */
const ROOT_AND_FLOOR = "C 108,141 80,144 62,142 Z";

/** Hard palate control points, mirroring the curve drawn by SagittalDiagram. */
const PALATE = [
  { x: 176, y: 97 },
  { x: 164, y: 88 },
  { x: 143, y: 74 },
  { x: 112, y: 74 },
] as const;

/** Roof height (y) of the hard palate at a given x, by sampling its cubic. */
function palateYAt(x: number): number {
  let best = { dx: Infinity, y: 74 };
  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t;
    const px =
      u * u * u * PALATE[0].x +
      3 * u * u * t * PALATE[1].x +
      3 * u * t * t * PALATE[2].x +
      t * t * t * PALATE[3].x;
    const py =
      u * u * u * PALATE[0].y +
      3 * u * u * t * PALATE[1].y +
      3 * u * t * t * PALATE[2].y +
      t * t * t * PALATE[3].y;
    const dx = Math.abs(px - x);
    if (dx < best.dx) best = { dx, y: py };
  }
  return best.y;
}

/** Keeps a point below the roof of the mouth, leaving `clearance` units of airway. */
function clampUnderPalate(x: number, y: number, clearance: number): number {
  return Math.max(y, palateYAt(x) + clearance);
}

/**
 * Builds a tongue outline from an apex (highest point of the dorsum) and a tip.
 *
 * The apex is clamped below the palate so the tongue never crosses the roof, and
 * the tip is drawn as a rounded lobe rather than a spike.
 *
 * @param apexX      horizontal position of the dorsum's high point
 * @param apexY      vertical position of the dorsum's high point (smaller = higher)
 * @param tipX       horizontal position of the tongue tip
 * @param tipY       vertical position of the tongue tip
 * @param clearance  units of airway to leave between dorsum and palate
 */
function buildTongue(
  apexX: number,
  apexY: number,
  tipX: number,
  tipY: number,
  clearance = 6,
): string {
  const ay = clampUnderPalate(apexX, apexY, clearance);
  const ty = clampUnderPalate(tipX, tipY, clearance);

  // Rear slope: root climbs from the pharynx up to the dorsum apex.
  const rear = `M 62,142 C 70,126 ${apexX - 30},${ay + 20} ${apexX},${ay}`;
  // Front slope: the dorsum descends smoothly from the apex out to the tip.
  const front = `C ${apexX + 18},${ay + 2} ${tipX - 16},${ty - 6} ${tipX},${ty}`;
  // Rounded tip: one short arc wrapping the tip onto the underside.
  const tip = `C ${tipX + 4},${ty + 4} ${tipX + 1},${ty + 9} ${tipX - 6},${ty + 10}`;
  // Underside: sweeps back to the front of the floor without pinching.
  const under = `C ${tipX - 22},${ty + 13} 148,138 135,135`;
  return `${rear} ${front} ${tip} ${under} ${ROOT_AND_FLOOR}`;
}

/** Per-position articulation spec: apex, tip, palate clearance and contact point. */
interface TongueSpec {
  apexX: number;
  apexY: number;
  tipX: number;
  tipY: number;
  label: string;
  isContact: boolean;
  clearance?: number;
  /** Contact marker; defaults to the (clamped) dorsum apex. */
  contact?: { x: number; y: number };
}

const TONGUE_SPECS: Record<TonguePosition, TongueSpec> = {
  // ── Front vowels: apex forward, height varies ────────────────────────────
  "high-front": { apexX: 138, apexY: 76, tipX: 170, tipY: 106, label: "Lengua alta al frente", isContact: false },
  "mid-front": { apexX: 132, apexY: 104, tipX: 168, tipY: 116, label: "Lengua media frontal", isContact: false },
  "low-front": { apexX: 126, apexY: 124, tipX: 164, tipY: 128, label: "Lengua baja y plana", isContact: false },

  // ── Back vowels: apex retracted, height varies ───────────────────────────
  "high-back": { apexX: 104, apexY: 80, tipX: 156, tipY: 118, label: "Dorso elevado atrás", isContact: false },
  "mid-back": { apexX: 102, apexY: 100, tipX: 154, tipY: 122, label: "Dorso medio atrás", isContact: false },
  "low-back": { apexX: 100, apexY: 120, tipX: 152, tipY: 126, label: "Lengua baja y retraída", isContact: false },

  // ── Central ──────────────────────────────────────────────────────────────
  central: { apexX: 118, apexY: 106, tipX: 162, tipY: 120, label: "Lengua relajada al centro", isContact: false },

  // ── Consonantal closures: tip/blade reaches the roof ─────────────────────
  "tip-between-teeth": {
    apexX: 126, apexY: 100, tipX: 180, tipY: 104,
    label: "Punta entre los dientes", isContact: true, contact: { x: 178, y: 106 },
  },
  "tip-on-ridge": {
    apexX: 130, apexY: 90, tipX: 172, tipY: 96, clearance: 1,
    label: "Contacto en la encía superior", isContact: true, contact: { x: 170, y: 95 },
  },
  "blade-on-palate": {
    apexX: 132, apexY: 82, tipX: 166, tipY: 92, clearance: 1,
    label: "Lámina contra el paladar", isContact: true, contact: { x: 158, y: 84 },
  },
  "back-on-velum": {
    apexX: 104, apexY: 74, tipX: 156, tipY: 118, clearance: 0,
    label: "Cierre en el paladar blando", isContact: true, contact: { x: 104, y: 76 },
  },
  "retroflex-curl": {
    apexX: 126, apexY: 100, tipX: 150, tipY: 84,
    label: "Punta curvada hacia atrás", isContact: false, contact: { x: 147, y: 82 },
  },
  glottal: {
    apexX: 116, apexY: 110, tipX: 160, tipY: 122,
    label: "Articulación en la glotis", isContact: true, contact: { x: 56, y: 150 },
  },
};

/** Anatomical tongue shape (dorsum, blade, tip) for the sagittal diagram. */
export function getTongueGeometry(position: TonguePosition): TongueGeometry {
  const spec = TONGUE_SPECS[position] ?? TONGUE_SPECS.central;
  const clearance = spec.clearance ?? 6;
  const apexY = clampUnderPalate(spec.apexX, spec.apexY, clearance);

  // The retroflex curl cannot be expressed by the standard apex/tip skeleton:
  // its tip hooks up and back over the blade, so it carries a bespoke outline.
  const path =
    position === "retroflex-curl"
      ? "M 62,142 C 70,126 100,118 122,108 C 138,100 152,92 150,82 C 141,84 133,100 126,114 C 116,130 90,139 62,142 Z"
      : buildTongue(spec.apexX, spec.apexY, spec.tipX, spec.tipY, clearance);

  return {
    path,
    contactX: spec.contact?.x ?? spec.apexX,
    contactY: spec.contact?.y ?? apexY,
    label: spec.label,
    isContact: spec.isContact,
  };
}
