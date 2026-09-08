import { ChevronLeft } from "@/components/icons";
import type { TabId } from "./ChatTabs";
import { MissionWorkspace } from "./missions/MissionWorkspace";
import AICoachHome from "./AICoachHome";
import ChatView from "./ChatView";
import CoachErrorState from "./CoachErrorState";
import ErrorBanner from "./ErrorBanner";
import QuotaExhaustedCard from "./QuotaExhaustedCard";
import CustomPromptPanel from "./CustomPromptPanel";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { MissionLaunch } from "@/lib/ai-practice/missions/launch";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";
import type { AIConversationMode } from "@/lib/types";

// Planned structure:
// <AICoachPanelViews>
//   renderMission()
//   renderHome()
//   renderActiveChat()
// </AICoachPanelViews>

export const QUOTA_WARN_THRESHOLD = 18;

export interface RenderMissionParams {
  activeMissionId: string;
  missionLaunch: MissionLaunch | null;
  setMissionIntentHandler: (handler: ((intentId: string) => void) | null) => void;
  messages: AIMessage[];
  isStreaming: boolean;
  quotaExhausted: boolean;
  sendMessage: (text: string) => Promise<void>;
  openSaveWordModal: (word: string, context: string) => void;
  saveSaveable: (saveable: TurnSaveable) => Promise<void>;
  saveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  changeMode: (next: AIConversationMode) => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  exitTab: TabId;
}

export function renderMission(p: RenderMissionParams) {
  return (
    <MissionWorkspace
      missionId={p.activeMissionId}
      launch={p.missionLaunch?.missionId === p.activeMissionId ? p.missionLaunch : null}
      setMissionIntentHandler={p.setMissionIntentHandler}
      messages={p.messages}
      isStreaming={p.isStreaming}
      isDisabled={p.quotaExhausted}
      onSendMessage={p.sendMessage}
      onSaveWord={p.openSaveWordModal}
      onSaveSaveable={p.saveSaveable}
      onSaveAllFromSummary={p.saveAllFromSummary}
      onToolAnswer={p.answerToolCall}
      onExitMission={() => {
        void p.changeMode("chat");
        p.setActiveTab(p.exitTab);
      }}
    />
  );
}

export interface RenderHomeParams {
  tab: "chat" | "missions";
  sendMessage: (text: string) => Promise<void>;
  changeMode: (next: AIConversationMode) => Promise<void>;
  isStreaming: boolean;
  starters: ResolvedStarter[] | null;
  startersLoading: boolean;
  noteUse: (id: StarterId, angle: string) => void;
  inputPrefill?: string;
  setInputPrefill: (v?: string) => void;
  /** A hidden turn (starter, summary) failed and left nothing on screen. */
  error?: string | null;
  quotaExhausted?: boolean;
  onRetry?: () => void;
  onDismissError?: () => void;
}

export function renderHome(p: RenderHomeParams) {
  return (
    <div className="chat-surface flex flex-1 min-h-0 flex-col overflow-hidden">
      {p.quotaExhausted ? (
        <QuotaExhaustedCard
          messages={[]}
          onNewSession={() => p.onDismissError?.()}
          onRetry={p.onRetry ? () => p.onRetry?.() : undefined}
          retrying={p.isStreaming}
        />
      ) : p.error ? (
        <CoachErrorState
          message={p.error}
          retrying={p.isStreaming}
          onRetry={() => p.onRetry?.()}
          onDismiss={() => p.onDismissError?.()}
        />
      ) : null}
      <AICoachHome
        activeTab={p.tab}
        onSendMessage={p.sendMessage}
        onSelectMission={(mId) => {
          void p.changeMode(`mission:${mId}`);
        }}
        isStreaming={p.isStreaming}
        starters={p.starters}
        startersLoading={p.startersLoading}
        onStarterUsed={p.noteUse}
        prefill={p.inputPrefill}
        onPrefillConsumed={() => p.setInputPrefill(undefined)}
      />
    </div>
  );
}

export interface RenderActiveChatParams {
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  quotaExhausted: boolean;
  resetSession: () => void;
  openSaveWordModal: (word: string, context: string) => void;
  saveSaveable: (saveable: TurnSaveable) => Promise<void>;
  saveConcept: (title: string, body: string) => Promise<void>;
  saveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
  saveTranslation: (msgIndex: number, translation: string) => void;
  inputPrefill?: string;
  setInputPrefill: (prompt?: string) => void;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  sendMessage: (text: string) => Promise<void>;
  /** Re-send the turn a transient throttle or quota bounce left pending. */
  retryLastFailedSend: () => Promise<void>;
}

export function renderActiveChat(p: RenderActiveChatParams) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle/60 bg-surface-raised/80 px-3 py-1.5 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => p.resetSession()}
          className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-base px-2.5 py-0.5 text-caption font-medium text-fg-muted hover:text-fg hover:border-border-default hover:bg-surface-sunken transition-colors cursor-pointer focus-ring active:scale-[0.98] motion-reduce:transition-none"
        >
          <ChevronLeft size={14} aria-hidden />
          <span>Volver al inicio</span>
        </button>
        <span className="text-xxs font-medium text-fg-subtle">Sesión activa</span>
      </div>
      <div
        className="chat-messages-scroll flex flex-1 min-h-0 flex-col overflow-y-auto"
        aria-live="polite"
        aria-label="Mensajes del chat"
      >
        {p.error && <ErrorBanner message={p.error} />}
        <ChatView
          messages={p.messages}
          isStreaming={p.isStreaming}
          onSaveWord={p.openSaveWordModal}
          onSaveSaveable={p.saveSaveable}
          onSaveConcept={p.saveConcept}
          onSaveAllFromSummary={p.saveAllFromSummary}
          onSaveTranslation={p.saveTranslation}
          onSuggestionClick={(prompt) => p.setInputPrefill(prompt)}
          onToolAnswer={p.answerToolCall}
          onNext={() => p.sendMessage("next")}
          onExerciseComplete={(s) => void p.sendMessage(`I just finished — ${s.correct} of ${s.total} right. How did I do?`)}
        />
      </div>
      <div className="chat-surface shrink-0 px-3 pb-3 pt-1 border-t border-border-subtle/60">
        {p.quotaExhausted && (
          <QuotaExhaustedCard
            messages={p.messages}
            onNewSession={p.resetSession}
            onRetry={() => void p.retryLastFailedSend()}
            retrying={p.isStreaming}
          />
        )}
        {!p.quotaExhausted && p.messages.length >= QUOTA_WARN_THRESHOLD && (
          <div className="flex justify-center mb-2">
            <span className="text-caption font-medium text-warning bg-warning-soft border border-warning/20 rounded-full px-3 py-0.5">
              Te estás acercando al límite de la sesión
            </span>
          </div>
        )}
        <CustomPromptPanel
          onSubmit={p.sendMessage}
          isDisabled={p.isStreaming || p.quotaExhausted}
          variant="chat"
          placeholder={p.quotaExhausted ? "Límite de sesión alcanzado" : "Escribe a tu AI Coach..."}
          prefill={p.inputPrefill}
          onPrefillConsumed={() => p.setInputPrefill(undefined)}
        />
      </div>
    </>
  );
}
