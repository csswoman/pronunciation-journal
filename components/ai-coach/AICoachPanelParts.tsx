import { ChevronLeft, History, Maximize2, Minimize2, Plus, X } from "lucide-react";
import type { AIConversation } from "@/lib/types";
import { groupConversationsByDate } from "@/lib/group-by-date";

export function AICoachHeader({ pageLabel, showHistory, isFullscreen, onNewChat, onToggleHistory, onToggleFullscreen, onClose }: { pageLabel: string; showHistory: boolean; isFullscreen: boolean; onNewChat: () => void; onToggleHistory: () => void; onToggleFullscreen: () => void; onClose: () => void; }) {
  return <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0 border-b border-[var(--line-divider)]">
    <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}>✦</span><span className="text-sm font-semibold text-fg">AI Coach</span><span className="text-tiny px-2 py-0.5 rounded-full font-medium hidden sm:inline" style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-tertiary)" }}>{pageLabel}</span></div>
    <div className="flex items-center gap-0.5">
      <PanelIconButton onClick={onNewChat} title="New chat"><Plus size={14} /></PanelIconButton>
      <PanelIconButton onClick={onToggleHistory} title="Conversation history" active={showHistory}><History size={14} /></PanelIconButton>
      <PanelIconButton onClick={onToggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>{isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</PanelIconButton>
      <PanelIconButton onClick={onClose} title="Close panel"><X size={14} /></PanelIconButton>
    </div>
  </div>;
}

function PanelIconButton({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode; }) {
  return <button
    onClick={onClick}
    title={title}
    aria-label={title}
    data-active={active ? "true" : undefined}
    className={[
      "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
      active
        ? "text-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_12%,transparent)]"
        : "text-[var(--text-tertiary)] bg-transparent hover:bg-[var(--btn-regular-bg)] hover:text-[var(--text-secondary)]",
    ].join(" ")}
  >{children}</button>;
}

export function ConversationHistoryPanel({ conversations, activeId, onSelect, onDelete, onClose }: { conversations: AIConversation[]; activeId: number | null; onSelect: (conv: AIConversation) => void; onDelete: (id: number) => void; onClose: () => void; }) {
  const grouped = groupConversationsByDate(conversations);
  const order = ["TODAY", "YESTERDAY", "7 DAYS", "OLDER"] as const;
  const isEmpty = order.every((label) => grouped[label].length === 0);

  return <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--line-divider)] flex-shrink-0">
      <button onClick={onClose} className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg transition-colors"><ChevronLeft size={13} />Back</button>
      <span className="text-xs font-medium text-fg ml-1">History</span>
    </div>
    <div className="flex-1 overflow-y-auto py-2">
      {isEmpty ? <p className="text-xs text-fg-subtle text-center py-8">No conversations yet</p> : order.map((label) => {
        const items = grouped[label];
        if (!items?.length) return null;
        return <div key={label} className="mb-3">
          <p className="text-tiny font-semibold uppercase tracking-widest px-3 py-1 text-[var(--text-tertiary)]">{label}</p>
          {items.map((conv, i) => {
            const isActive = conv.id === activeId;
            return <div
              key={conv.id}
              className={[
                "group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors",
                !isActive && "hover:bg-[var(--btn-regular-bg)]",
                !isActive && i % 2 !== 0 && "bg-[var(--surface-sunken)]/40",
              ].filter(Boolean).join(" ")}
              style={isActive ? { backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)" } : undefined}
              onClick={() => onSelect(conv)}
            >
              <span className={["text-xs truncate flex-1", isActive ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"].join(" ")}>
                {typeof conv.messages.find((m) => m.role === "user")?.content === "string"
                  ? conv.messages.find((m) => m.role === "user")?.content.slice(0, 48)
                  : "Untitled conversation"}
              </span>
              <button
                onClick={(event) => { event.stopPropagation(); if (conv.id !== undefined) onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--error)]"
                title="Delete"
              ><X size={11} /></button>
            </div>;
          })}
        </div>;
      })}
    </div>
  </div>;
}
