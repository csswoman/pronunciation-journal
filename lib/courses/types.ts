export type CefrLevelId = "a1" | "a2" | "b1" | "b2" | "c1";

export type ElectiveTrackId = "purposes" | "business" | "connected-speech";

export type ElectiveSpineIcon = "laptop" | "briefcase" | "mic";

export type CoursePathTrackId = CefrLevelId | ElectiveTrackId;

export type CoursePathLegendIcon = "priority-max" | "priority" | "sound-lab" | "optional";

export interface CoursePathLegendItem {
  icon: CoursePathLegendIcon;
  description: string;
}

export interface RealLifeVocabItem {
  word: string;
  meaning: string;
}

export interface RealLifeScenario {
  id: string;
  title: string;
  emoji?: string;
  phrases: string[];
  vocab: RealLifeVocabItem[];
}

export type LessonPriority = 0 | 1 | 2;

export type LessonProgressState = "done" | "current" | "locked" | "available";

export type UnitProgressState = "active" | "done" | "locked";

export interface CoursePathLesson {
  /** Stable key for progress (same as `number` as string) */
  id: string;
  /** 1-based index within this track — used in URLs `/courses/study/:n` */
  number: number;
  title: string;
  /** Links to `theory_lessons.slug` when content exists */
  slug?: string;
  priority: LessonPriority;
  /** Part of the broad curriculum (p === 0), shown after priority block */
  isOptional: boolean;
  /** Connects to Sound Lab (pronunciation / audio) */
  soundLab?: boolean;
}

export interface CoursePathUnit {
  id: string;
  label: string;
  title: string;
  lessons: CoursePathLesson[];
  /** Optional block — unlocks after core unit is complete */
  isOptionalSection?: boolean;
}

export interface CoursePathLevel {
  id: CoursePathTrackId;
  spineLabel: string;
  spineSubtitle: string;
  title: string;
  hours?: string;
  units: CoursePathUnit[];
  /** Shown below C1, not in the level spine */
  isElective?: boolean;
  /** Icon in elective track header (replaces emoji badge) */
  spineIcon?: ElectiveSpineIcon;
  realLife?: RealLifeScenario[];
}

export interface CoursePathCurriculum {
  levels: CoursePathLevel[];
  electiveTracks: CoursePathLevel[];
  legend: CoursePathLegendItem[];
  why: {
    title: string;
    paragraphs: string[];
  };
}
