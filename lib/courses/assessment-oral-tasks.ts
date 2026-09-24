import "server-only";
import type { AssessmentOralPilotLevel } from "./assessment-oral-shared";

export interface ServerAssessmentOralTask {
  id: string;
  level: AssessmentOralPilotLevel;
  prompt: string;
  requiredPhrases: string[];
  rubricVersion: "a1-a2-pilot-v1";
}

const A1_TASKS = [
  { city: "Lima", place: "park" },
  { city: "Quito", place: "school" },
  { city: "Cusco", place: "shop" },
  { city: "Miami", place: "bus stop" },
].map(({ city, place }): ServerAssessmentOralTask => ({
  id: `a1-home-${city.toLowerCase()}-${place.replaceAll(" ", "-")}`,
  level: "a1",
  prompt: `Describe a fictional person. Ana lives in ${city}, and a ${place} is near her home. Use only these made-up details; do not include your real location or personal information. Say it in one or two short sentences.`,
  requiredPhrases: [`ana lives in ${city.toLowerCase()}`, `there is a ${place} near her home`],
  rubricVersion: "a1-a2-pilot-v1",
}));

const A2_TASKS = [
  {
    id: "museum",
    activity: "visit the museum",
    extraAction: "see the new exhibition",
  },
  {
    id: "park",
    activity: "have a picnic in the park",
    extraAction: "meet a friend",
  },
  {
    id: "cinema",
    activity: "watch a film at the cinema",
    extraAction: "go with a cousin",
  },
].map(({ id, activity, extraAction }): ServerAssessmentOralTask => ({
  id: `a2-saturday-${id}`,
  level: "a2",
  prompt: `Imagine Alex has a fictional plan for Saturday. Say: “On Saturday, Alex is going to ${activity} and ${extraAction}.” `
    + `You may use “will” instead. Use only these made-up details; do not include your own plans or personal information.`,
  requiredPhrases: ["saturday", activity, extraAction],
  rubricVersion: "a1-a2-pilot-v1",
}));

export function getAssessmentOralTasks(level: AssessmentOralPilotLevel): ServerAssessmentOralTask[] {
  return level === "a1" ? A1_TASKS : A2_TASKS;
}

export function findAssessmentOralTask(itemId: string): ServerAssessmentOralTask | null {
  return [...A1_TASKS, ...A2_TASKS].find((task) => task.id === itemId) ?? null;
}

function normalizeTranscript(transcript: string): string {
  return transcript
    .toLocaleLowerCase("en")
    .replaceAll("’", "'")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\bi'll\b/g, "i will")
    .replace(/\bthere's\b/g, "there is")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreAssessmentOralTranscript(itemId: string, transcript: string): boolean {
  const task = findAssessmentOralTask(itemId);
  if (!task) return false;
  const normalized = normalizeTranscript(transcript);
  if (normalized.length < 8) return false;

  if (task.level === "a1") {
    return task.requiredPhrases.every((phrase) => normalized.includes(phrase));
  }

  const [day, activity, detail] = task.requiredPhrases;
  const includesFuturePlan = normalized.includes(`alex is going to ${activity}`)
    || normalized.includes(`alex will ${activity}`);
  return includesFuturePlan
    && normalized.includes(day)
    && normalized.includes(activity)
    && normalized.includes(detail);
}
