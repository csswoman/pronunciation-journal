import type { TrackingReviewSource } from "@/lib/tracking/review-queue";

export interface ItemDetails {
  kind: "word" | "phrase" | "lesson" | "explanation";
  kicker: string;
  pastelTheme: "coral" | "butter" | "mint" | "sky";
  title: string;
  ipa: string | null;
  meaning: string;
  context: string | null;
  origin: string;
  masteryLevel: number | null;
  statusBadge: { label: string; variant: "coral" | "mint" | "sky" | "neutral" } | null;
  progressPercent: number | null;
}

export function getSourceDetails(source: TrackingReviewSource): ItemDetails {
  const { item } = source;
  const word = "word" in source ? source.word : null;
  const trackedPayload = "trackedItem" in source ? source.trackedItem.payload : null;

  const kind = item.kind;
  let kicker = "PALABRA";
  let pastelTheme: "coral" | "butter" | "mint" | "sky" = "coral";

  if (kind === "word") {
    kicker = "PALABRA";
    pastelTheme = "coral";
  } else if (kind === "phrase") {
    kicker = "FRASE";
    pastelTheme = "butter";
  } else if (kind === "explanation" || item.fromCoach) {
    kicker = "DEL COACH";
    pastelTheme = "mint";
  } else if (kind === "lesson") {
    kicker = "LECCIÓN";
    pastelTheme = "sky";
  }

  const title = item.title;

  const ipa = word?.ipa
    ? `/${word.ipa.replace(/^\/+|\/+$/g, "")}/`
    : trackedPayload && typeof trackedPayload.ipa === "string"
      ? `/${trackedPayload.ipa.replace(/^\/+|\/+$/g, "")}/`
      : null;

  const meaning =
    word?.meaning ||
    word?.translation ||
    (trackedPayload &&
      ((trackedPayload.meaning ||
        trackedPayload.translation) as string)) ||
    item.description ||
    "";

  const context =
    word?.context ||
    (trackedPayload && typeof trackedPayload.context === "string" ? trackedPayload.context : null);

  let origin = "Diccionario";
  if (item.fromCoach) {
    origin = "Coach";
  } else if (word?.source) {
    origin =
      word.source === "journal"
        ? "Diario de pronunciación"
        : word.source === "coach"
          ? "Coach"
          : word.source === "immersion"
            ? "Inmersión"
            : word.source;
  } else if (kind === "phrase") {
    origin = "Inmersión";
  } else if (kind === "lesson") {
    origin = "Mini lecciones";
  }

  let masteryLevel: number | null = null;
  let statusBadge: { label: string; variant: "coral" | "mint" | "sky" | "neutral" } | null = null;
  let progressPercent: number | null = null;

  if (item.progressLabel === "hoy") {
    statusBadge = { label: "hoy", variant: "coral" };
    masteryLevel = 3;
  } else if (
    item.progressState === "mastered" ||
    item.progressState === "legacy_mastered" ||
    item.progressLabel === "dominada" ||
    item.progressLabel === "ok"
  ) {
    statusBadge = { label: item.progressLabel || "ok", variant: "mint" };
    masteryLevel = 4;
  } else if (kind === "lesson") {
    if (item.progressLabel && item.progressLabel.includes("%")) {
      progressPercent = parseInt(item.progressLabel, 10) || 50;
    } else {
      progressPercent = 50;
    }
  } else if (word) {
    const reps = word.repetitions ?? (word.interval_days ? Math.ceil(word.interval_days / 2) : 1);
    masteryLevel = Math.min(4, Math.max(1, reps));
  } else if (kind === "phrase") {
    masteryLevel = 3;
  }

  return {
    kind,
    kicker,
    pastelTheme,
    title,
    ipa,
    meaning,
    context,
    origin,
    masteryLevel,
    statusBadge,
    progressPercent,
  };
}
