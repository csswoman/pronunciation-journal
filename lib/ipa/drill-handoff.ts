import { HARD_FOR_SPANISH_SPEAKERS } from "@/lib/pronunciation/ipa-data";
import { getContrastsForToday } from "@/lib/phoneme-practice/queries";

/** Tokens para `?focus=` en Sound Lab (sonidos difíciles para hispanohablantes). */
export function hardSoundsFocusParam(): string {
  return HARD_FOR_SPANISH_SPEAKERS.map((symbol) => symbol.replace(/\//g, "")).join(",");
}

export function soundLabDrillHref(): string {
  return `/practice/sounds?focus=${encodeURIComponent(hardSoundsFocusParam())}`;
}

/** Repaso SRS si hay pendientes; si no, drill corto en sonidos difíciles. */
export async function resolveDrillHref(userId: string | undefined): Promise<string> {
  if (userId) {
    try {
      const due = await getContrastsForToday(userId);
      if (due.length > 0) return "/practice/review";
    } catch {
      /* fallback al focus del chart */
    }
  }
  return soundLabDrillHref();
}
