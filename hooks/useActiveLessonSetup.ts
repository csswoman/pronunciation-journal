"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLessonById } from "@/lib/lesson-generator";
import { getLessonOffset, advanceLessonOffset, LESSON_SESSION_SIZE } from "@/lib/db";
import { emptyLessonMastery } from "@/components/lesson/LessonLobby";
import type { LessonStageId, LessonStageMasteryMap, DifficultyMode } from "@/components/lesson/LessonLobby";
import type { Lesson } from "@/lib/types";

export type LessonView = "lobby" | "session";

interface UseActiveLessonSetupReturn {
  lessonId: string;
  fullLesson: Lesson | null | undefined;
  lessonData: Lesson | null | undefined;
  view: LessonView;
  activeStage: LessonStageId;
  stageMastery: LessonStageMasteryMap;
  sessionOffset: number;
  sessionChunk: number;
  totalChunks: number;
  isDynamic: boolean;
  handleSelectStage: (stageId: LessonStageId, diff: DifficultyMode) => void;
  handleBackToLobby: () => void;
  setLessonData: (lesson: Lesson | null | undefined) => void;
  setStageMastery: React.Dispatch<React.SetStateAction<LessonStageMasteryMap>>;
  advanceOffset: () => void;
}

export function useActiveLessonSetup(
  onBackToLobby: () => void,
  setScoringThreshold: (t: number) => void,
): UseActiveLessonSetupReturn {
  const params = useParams();
  const lessonId = params.id as string;
  const staticLesson = getLessonById(lessonId);
  const isDynamic = !staticLesson && (lessonId.startsWith("pattern-") || lessonId.startsWith("sound-"));

  const [dynamicLesson, setDynamicLesson] = useState<Lesson | null | undefined>(
    isDynamic ? undefined : null
  );
  const [view, setView] = useState<LessonView>("lobby");
  const [activeStage, setActiveStage] = useState<LessonStageId>("guided");
  const [stageMastery, setStageMastery] = useState<LessonStageMasteryMap>(emptyLessonMastery());
  const [lessonData, setLessonData] = useState<Lesson | null | undefined>(undefined);
  const [sessionOffset, setSessionOffset] = useState(0);

  const fullLesson = staticLesson ?? dynamicLesson;

  useEffect(() => {
    if (!isDynamic) return;
    import("@/lib/lesson-generator-db").then(({ getDbLessonById }) =>
      getDbLessonById(lessonId).then(setDynamicLesson)
    );
  }, [lessonId, isDynamic]);

  useEffect(() => {
    if (!fullLesson) return;
    getLessonOffset(lessonId).then(setSessionOffset);
  }, [fullLesson, lessonId]);

  const totalChunks = fullLesson ? Math.ceil(fullLesson.words.length / LESSON_SESSION_SIZE) : 1;
  const sessionChunk = fullLesson ? Math.floor(sessionOffset / LESSON_SESSION_SIZE) + 1 : 1;

  function handleSelectStage(stageId: LessonStageId, diff: DifficultyMode) {
    if (!fullLesson) return;
    const baseThreshold = stageId === "speed" ? 85 : stageId === "pronunciation" ? 75 : 65;
    setScoringThreshold(diff === "master" ? Math.min(baseThreshold + 15, 95) : baseThreshold);
    import("@/lib/lesson-generator-db").then(({ sliceLessonWords }) => {
      const sliced = sliceLessonWords(fullLesson, sessionOffset, LESSON_SESSION_SIZE);
      const stageWords = sliced.words.map((w) => ({
        ...w,
        ipa: stageId === "pronunciation" || stageId === "speed" ? "" : w.ipa,
        hint: stageId === "speed" ? undefined : w.hint,
        audioUrl: stageId === "speed" ? undefined : w.audioUrl,
      }));
      setLessonData({ ...sliced, words: stageWords });
      setActiveStage(stageId);
      setView("session");
    });
  }

  function handleBackToLobby() {
    setView("lobby");
    setLessonData(undefined);
    onBackToLobby();
  }

  function advanceOffset() {
    if (isDynamic && fullLesson && fullLesson.words.length > LESSON_SESSION_SIZE) {
      advanceLessonOffset(lessonId, fullLesson.words.length).then(setSessionOffset);
    }
  }

  return {
    lessonId,
    fullLesson,
    lessonData,
    view,
    activeStage,
    stageMastery,
    sessionOffset,
    sessionChunk,
    totalChunks,
    isDynamic,
    handleSelectStage,
    handleBackToLobby,
    setLessonData,
    setStageMastery,
    advanceOffset,
  };
}
