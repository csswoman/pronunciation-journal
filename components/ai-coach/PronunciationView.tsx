"use client";

import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import SessionComplete from "./pronunciation/SessionComplete";
import { SpokenLineFeedback } from "@/components/pronunciation-feedback/SpokenLineFeedback";
import { PhonemeFix } from "@/components/pronunciation-feedback/PhonemeFix";
import { useSyllableFeedback } from "@/hooks/useSyllableFeedback";
import { buildRemediation } from "@/lib/pronunciation/syllable-remediation";
import { pickPrimaryFix } from "@/lib/pronunciation/pick-primary-fix";
import { describePhonemeInWord } from "@/lib/pronunciation/phoneme-in-word";
import { getPhraseMetadata } from "@/lib/ai-coach/phrase-metadata";
import { usePronunciationCoach } from "./usePronunciationCoach";

// Planned structure:
// <PronunciationView>
//   <PronunciationProgress />
//   <SessionComplete | MainPracticeScrollArea>
//     <PhraseCard />
//     <PhoneticTipCard />
//     <FeedbackSection />
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
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 gap-4 sm:gap-5">
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

          {/* Tarjeta de tip fonético */}
          {meta.phoneticTipTitle && !analyzing && (
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

          {/* Feedback detallado palabra-a-palabra cuando hay análisis */}
          {hasAnalysis && wordResults.length > 0 && !analyzing && (
            <div className="pb-1 flex flex-col gap-3">
              <SpokenLineFeedback
                wordResults={wordResults}
                syllableMap={syllableMap}
              />
              {fix && (
                <PhonemeFix
                  explanation={fix.explanation}
                  remediation={remediation}
                  phonemeIpa={fix.phonemeIpa}
                  score={hasMistakes ? 60 : 100}
                  status={fix.status}
                />
              )}
            </div>
          )}

          {/* Controles de grabación */}
          <RecordingControls
            isRecording={isRecording}
            isAnalyzing={analyzing}
            onMicClick={handleMicClick}
            onSkip={advanceQueue}
          />
        </div>
      )}
    </div>
  );
}
