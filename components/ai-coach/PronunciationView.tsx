"use client";

import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import SessionComplete from "./pronunciation/SessionComplete";
import { usePronunciationCoach } from "./usePronunciationCoach";

// Planned structure:
// <PronunciationView>
//   <PronunciationProgress />
//   <SessionComplete | PhraseCard + CoachPanel />
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
  } = usePronunciationCoach();

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
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
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
          />

          {focus && !analyzing && (
            <div className="px-4 pb-4 shrink-0">
              <CoachPanel
                focus={focus}
                focusTip={focusTip}
                focusProgress={focusProgress}
                savedWords={savedWords}
                onListen={(word) => speakPhrase(word, 0.75)}
                onSlow={(word) => speakPhrase(word, 0.55)}
                onSave={handleSavePractice}
                onRetry={handleMicClick}
              />
            </div>
          )}
        </div>
      )}

      {!sessionDone && (
        <RecordingControls
          isRecording={isRecording}
          onMicClick={handleMicClick}
          onSkip={advanceQueue}
        />
      )}
    </div>
  );
}
