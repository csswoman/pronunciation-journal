"use client";

// Planned structure:
// <TrackingModalLayer>
//   <QuickAddModal | PhraseCaptureModal | EditWordModal | EditPhraseModal />
//   <DeleteWordDialog | DeleteExplanationDialog />
// </TrackingModalLayer>

import dynamic from "next/dynamic";
import type { useTracking } from "@/hooks/useTracking";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackedItem } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

type TrackingHookValue = ReturnType<typeof useTracking>;

interface TrackingModalState {
  showWordModal: boolean;
  showPhraseModal: boolean;
  phrase: string;
  phraseContext: string;
  editingWord: WordBankEntry | null;
  editingTrackedItem: TrackedItem | null;
  deletingWord: WordBankEntry | null;
  deletingExplanation: TrackingReviewSource | null;
}

interface TrackingModalActions {
  onAddWord: TrackingHookValue["addWord"];
  onRemoveWord: TrackingHookValue["removeWord"];
  onUpdateWord: TrackingHookValue["updateWord"];
  onEditExistingWord: (wordId: string) => void;
  onCloseWordModal: () => void;
  onClosePhraseModal: () => void;
  onChangePhrase: (value: string) => void;
  onChangePhraseContext: (value: string) => void;
  onAddPhrase: () => Promise<void>;
  onUpdateTrackedItem: (id: string, updates: { title?: string | null; payload?: Record<string, unknown> }) => Promise<void>;
  onCloseEditWord: () => void;
  onCloseEditPhrase: () => void;
  onCloseDeleteWord: () => void;
  onCloseDeleteExplanation: () => void;
  onDeleteExplanation: (source: TrackingReviewSource) => Promise<void>;
}

interface TrackingModalLayerProps {
  state: TrackingModalState;
  actions: TrackingModalActions;
}

function ModalLoadingState() {
  return <p role="status" className="sr-only">Cargando herramienta de seguimiento…</p>;
}

const QuickAddModal = dynamic(
  () => import("@/components/vocabulary/words/QuickAddModal").then((module) => module.QuickAddModal),
  { loading: ModalLoadingState },
);
const PhraseCaptureModal = dynamic(
  () => import("./PhraseCaptureModal").then((module) => module.PhraseCaptureModal),
  { loading: ModalLoadingState },
);
const EditWordModal = dynamic(
  () => import("./EditWordModal").then((module) => module.EditWordModal),
  { loading: ModalLoadingState },
);
const EditPhraseModal = dynamic(
  () => import("./EditPhraseModal").then((module) => module.EditPhraseModal),
  { loading: ModalLoadingState },
);
const DeleteWordDialog = dynamic(
  () => import("./DeleteWordDialog").then((module) => module.DeleteWordDialog),
  { loading: ModalLoadingState },
);
const DeleteExplanationDialog = dynamic(
  () => import("./DeleteExplanationDialog").then((module) => module.DeleteExplanationDialog),
  { loading: ModalLoadingState },
);

export function preloadTrackingWordCapture() {
  void import("@/components/vocabulary/words/QuickAddModal");
}

export function TrackingModalLayer({ state, actions }: TrackingModalLayerProps) {
  return (
    <>
      {state.showWordModal ? (
        <QuickAddModal
          open
          onClose={actions.onCloseWordModal}
          onSubmit={actions.onAddWord}
          onEditExisting={actions.onEditExistingWord}
          contextLabel="TRACKING"
        />
      ) : null}
      {state.showPhraseModal ? (
        <PhraseCaptureModal
          open
          value={state.phrase}
          onChange={actions.onChangePhrase}
          context={state.phraseContext}
          onContextChange={actions.onChangePhraseContext}
          onClose={actions.onClosePhraseModal}
          onSubmit={() => void actions.onAddPhrase()}
        />
      ) : null}
      {state.editingWord ? (
        <EditWordModal word={state.editingWord} onClose={actions.onCloseEditWord} onSubmit={actions.onUpdateWord} />
      ) : null}
      {state.editingTrackedItem ? (
        <EditPhraseModal trackedItem={state.editingTrackedItem} onClose={actions.onCloseEditPhrase} onSubmit={actions.onUpdateTrackedItem} />
      ) : null}
      {state.deletingWord ? (
        <DeleteWordDialog word={state.deletingWord} onClose={actions.onCloseDeleteWord} onConfirm={actions.onRemoveWord} />
      ) : null}
      {state.deletingExplanation ? (
        <DeleteExplanationDialog source={state.deletingExplanation} onClose={actions.onCloseDeleteExplanation} onConfirm={actions.onDeleteExplanation} />
      ) : null}
    </>
  );
}
