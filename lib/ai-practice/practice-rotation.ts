import { db } from "@/lib/db";
import { selectionForRequest } from "./intent-detection";

export const PRACTICE_ANGLES = [
  "daily-life",
  "work",
  "travel",
  "profile-interests",
  "recent-errors",
] as const;

export type PracticeAngle = typeof PRACTICE_ANGLES[number];
export type PracticeFormat = "multiple-choice" | "fill-blank" | "speaking";

const FORMAT_ROTATIONS: readonly (readonly PracticeFormat[])[] = [
  ["multiple-choice", "fill-blank", "multiple-choice", "fill-blank", "speaking"],
  ["fill-blank", "multiple-choice", "fill-blank", "multiple-choice", "speaking"],
  ["multiple-choice", "fill-blank", "speaking", "multiple-choice", "fill-blank"],
];

const PREF_PREFIX = "coach-practice-rotation:";

export interface PracticeRotation {
  angle: PracticeAngle;
  formats: readonly PracticeFormat[];
}

export function choosePracticeRotation(recentAngles: readonly PracticeAngle[]): PracticeRotation {
  const blocked = new Set(recentAngles.slice(-3));
  const angle = PRACTICE_ANGLES.find((candidate) => !blocked.has(candidate)) ?? PRACTICE_ANGLES[0];
  return {
    angle,
    formats: FORMAT_ROTATIONS[recentAngles.length % FORMAT_ROTATIONS.length],
  };
}

export async function nextPracticeRotation(userId: string): Promise<PracticeRotation> {
  const key = `${PREF_PREFIX}${userId}`;
  const row = await db.practicePrefs.get(key);
  let recentAngles: PracticeAngle[] = [];
  if (row) {
    try {
      const stored: unknown = JSON.parse(row.value);
      if (Array.isArray(stored)) {
        recentAngles = stored.filter((value): value is PracticeAngle =>
          PRACTICE_ANGLES.includes(value as PracticeAngle));
      }
    } catch {
      recentAngles = [];
    }
  }
  const rotation = choosePracticeRotation(recentAngles);
  await db.practicePrefs.put({
    key,
    value: JSON.stringify([...recentAngles, rotation.angle].slice(-3)),
    updatedAt: new Date().toISOString(),
  });
  return rotation;
}

export async function rotationForCoachRequest(options: {
  text: string;
  isStarter: boolean;
  isMission: boolean;
  userId: string | null;
  anonymousAngles: readonly PracticeAngle[];
}): Promise<PracticeRotation | undefined> {
  if (options.isMission || selectionForRequest(options.text, options.isStarter).toolChoice !== "any") return undefined;
  if (!options.userId) return choosePracticeRotation(options.anonymousAngles);
  return nextPracticeRotation(options.userId).catch(() => choosePracticeRotation([]));
}
