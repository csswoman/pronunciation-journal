"use client";

import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import SessionComplete from "./pronunciation/SessionComplete";
import { LineResult } from "@/components/ai-coach/missions/scripted/LineResult";
import { useSyllableFeedback } from "@/hooks/useSyllableFeedback";
import { buildRemediation } from "@/lib/pronunciation/syllable-remediation";
import { pickPrimaryFix } from "@/lib/pronunciation/pick-primary-fix";
import { describePhonemeInWord } from "@/lib/pronunciation/phoneme-in-word";
import { getPhraseMetadata } from "@/lib/ai-coach/phrase-metadata";
import { usePronunciationCoach } from "./usePronunciationCoach";
import { Loader2 } from "@/components/icons";

// Planned structure:
// <PronunciationView>
//   <PronunciationProgress />
//   <SessionComplete | MainPracticeScrollArea>
//     <PhraseCard />
//     <PhoneticTipCard />
//     <AnalyzingFeedbackBanner | LineResultCard />
//   </SessionComplete>
//   <RecordingControls />
// </PronunciationView>

export default function PronunciationView() {
  const {
    activePhrase,
    analyzing,
    batchCount,
    doneInBatch,
    fetchingPhrases,
    focus,
    focusProgress,
    focusTip,
    handleMicClick,
    handleSavePractice,
    hasAnalysis,
    hasMistakes,
    ipaLoading,
    isRecording,
    speechError,
    speechSupported,
    loadMoreFromPool,
    fetchMoreWithAI,
    masteredCount,
    progressPct,
    savedWords,
    sessionDone,
    speakPhrase,
    advanceQueue,
    wordIPAs,
    wordResults,
  } = usePronunciationCoach();

  const syllableMap = useSyllableFeedback(wordResults);

  // Primera remediación aplicable (igual que en LearnerLine).
  const primaryFix = wordResults.length > 0 ? pickPrimaryFix(wordResults, syllableMap) : null;
  const remediation = primaryFix ? buildRemediation(primaryFix.culprit) : null;
  const fix = (() => {
    if (!primaryFix) return null;
    const explanation = describePhonemeInWord(primaryFix.syllableText, primaryFix.culprit);
    if (!explanation) return null;
    const phonemeIpa = remediation?.ipa ?? `/${primaryFix.culprit.ipa ?? ""}/`;
    const status: "incorrect" | "missing" = primaryFix.culprit.status === "missing" ? "missing" : "incorrect";
    return { explanation, phonemeIpa, status };
  })();

  const meta = getPhraseMetadata(activePhrase);

  const correctCount = wordResults.filter((w) => w.status === "correct").length;
  const totalCount = wordResults.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : hasMistakes ? 60 : 100;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PronunciationProgress
        current={doneInBatch}
        total={batchCount}
        mastered={masteredCount}
        pct={progressPct}
      />

      {sessionDone ? (
        <SessionComplete
          mastered={masteredCount}
          batchSize={batchCount}
          onMore={loadMoreFromPool}
          onMoreAI={fetchMoreWithAI}
          loadingMore={fetchingPhrases}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3.5 sm:px-5 py-2.5 sm:py-3.5 gap-3 sm:gap-4">
          <PhraseCard
            phrase={activePhrase}
            wordIPAs={wordIPAs}
            ipaLoading={ipaLoading}
            analyzing={analyzing}
            hasAnalysis={hasAnalysis}
            hasMistakes={hasMistakes}
            onListen={() => speakPhrase(activePhrase)}
            onSlow={() => speakPhrase(activePhrase, 0.55)}
            onListenWord={(word) => speakPhrase(word, 0.75)}
            onRepeat={() => speakPhrase(activePhrase)}
          />

          {/* Tarjeta de tip fonético (solo si no hay análisis ni está analizando) */}
          {meta.phoneticTipTitle && !analyzing && !hasAnalysis && (
            <CoachPanel
              focus={focus}
              focusTip={focusTip}
              focusProgress={focusProgress}
              savedWords={savedWords}
              onListen={(word) => speakPhrase(word, 0.75)}
              onSlow={(word) => speakPhrase(word, 0.55)}
              onSave={handleSavePractice}
              onRetry={handleMicClick}
              tipTitle={meta.phoneticTipTitle}
              tipBody={meta.phoneticTipBody}
            />
          )}

          {/* Banner de estado analizando */}
          {analyzing && (
            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5 flex flex-col items-center justify-center text-center gap-2.5 animate-pulse shadow-xs">
              <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300 font-bold text-base">
                <Loader2 size={22} className="animate-spin text-purple-600 dark:text-purple-400" />
                <span>Analizando tu pronunciación...</span>
              </div>
              <p className="text-xs text-fg-subtle m-0 max-w-md leading-relaxed">
                Evaluando tu audio palabra a palabra y comparándolo con el modelo de voz nativo.
              </p>
            </div>
          )}

          {/* Feedback completo utilizando LineResult cuando hay análisis */}
          {hasAnalysis && wordResults.length > 0 && !analyzing && (
            <div className="w-full">
              <LineResult
                score={score}
                wordResults={wordResults}
                syllableMap={syllableMap}
                fix={fix}
                remediation={remediation}
                targetText={activePhrase}
                userAudioUrl={null}
                onRetry={handleMicClick}
                onContinue={advanceQueue}
              />
            </div>
          )}

          {/* Controles de grabación */}
          <RecordingControls
            isRecording={isRecording}
            isAnalyzing={analyzing}
            error={speechError}
            isSupported={speechSupported}
            onMicClick={handleMicClick}
            onSkip={advanceQueue}
          />
        </div>
      )}
    </div>
  );
}
