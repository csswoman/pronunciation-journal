import { ChevronLeft, History, Plus, Sparkles, X } from "@/components/icons";
import { useState, useEffect, useRef } from "react";
import type { AIConversation } from "@/lib/types";
import { groupConversationsByDate } from "@/lib/group-by-date";
import { formatConversationTitle } from "@/lib/ai-practice/conversation-title";
import { cn } from "@/lib/cn";

export function AICoachHeader({
  pageLabel,
  showHistory,
  onNewChat,
  onToggleHistory,
  onClose,
}: {
  pageLabel?: string;
  showHistory: boolean;
  onNewChat: () => void;
  onToggleHistory: () => void;
  onClose: () => void;
}) {
  const showBadge = Boolean(pageLabel && pageLabel.trim() !== "" && pageLabel !== "AI Coach");

  return (
    <header className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 shrink-0 border-b border-border-subtle bg-surface-raised">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary shadow-xs">
          <Sparkles size={16} strokeWidth={2} aria-hidden />
        </span>
        <span className="text-label font-semibold text-fg tracking-tight">AI Coach</span>
        {showBadge && (
          <span className="text-xxs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block bg-surface-base text-fg-muted border border-border-subtle truncate max-w-[140px]">
            {pageLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <PanelIconButton onClick={onNewChat} title="Nueva conversación">
          <Plus size={16} strokeWidth={2} />
        </PanelIconButton>
        <PanelIconButton onClick={onToggleHistory} title="Historial" active={showHistory}>
          <History size={16} strokeWidth={1.8} />
        </PanelIconButton>
        <PanelIconButton onClick={onClose} title="Cerrar panel">
          <X size={18} strokeWidth={2} />
        </PanelIconButton>
      </div>
    </header>
  );
}

export function AICoachResizeHandle({
  onDragStart,
}: {
  onDragStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ajustar ancho del panel"
      onMouseDown={onDragStart}
      title="Arrastra para ajustar el ancho"
      className="absolute top-0 -left-1.5 bottom-0 w-3 cursor-col-resize group z-20 flex items-center justify-center select-none"
    >
      <div className="h-full w-0.5 bg-transparent group-hover:bg-primary/70 group-active:bg-primary transition-colors" />
    </div>
  );
}

export function AICoachMobileScrim({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      onClick={onClose}
      className="fixed inset-0 z-40 bg-surface-base/80 backdrop-blur-xs transition-opacity motion-reduce:transition-none"
    />
  );
}

function PanelIconButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      data-active={active ? "true" : undefined}
      className={cn(
        "min-h-9 min-w-9 sm:size-8 rounded-md flex items-center justify-center transition-colors cursor-pointer focus-ring",
        active
          ? "text-primary bg-primary-soft font-medium shadow-xs"
          : "text-fg-muted hover:text-fg hover:bg-surface-sunken",
      )}
    >
      {children}
    </button>
  );
}

export function ConversationHistoryPanel({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onClose,
}: {
  conversations: AIConversation[];
  activeId: number | null;
  onSelect: (conv: AIConversation) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitDelete = (id: number) => {
    onDelete(id);
    setPendingDelete(null);
    timerRef.current = null;
  };

  const handleDeleteClick = (id: number) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      if (pendingDelete !== null) onDelete(pendingDelete);
    }
    setPendingDelete(id);
    timerRef.current = setTimeout(() => commitDelete(id), 3000);
  };

  const handleUndo = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPendingDelete(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const grouped = groupConversationsByDate(conversations);
  const order = ["TODAY", "YESTERDAY", "7 DAYS", "OLDER"] as const;
  const labels: Record<(typeof order)[number], string> = {
    TODAY: "HOY",
    YESTERDAY: "AYER",
    "7 DAYS": "ÚLTIMOS 7 DÍAS",
    OLDER: "ANTERIORES",
  };
  const isEmpty = order.every((label) => grouped[label].length === 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface-raised">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border-subtle shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-caption text-fg-muted hover:text-fg transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Volver</span>
        </button>
        <span className="text-caption font-semibold text-fg ml-1">Historial</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {isEmpty ? (
          <p className="text-caption text-fg-muted text-center py-8">
            No hay conversaciones previas
          </p>
        ) : (
          order.map((label) => {
            const items = grouped[label];
            if (!items?.length) return null;
            return (
              <div key={label} className="mb-3">
                <p className="font-kicker px-3.5 py-1 text-fg-subtle text-xxs">{labels[label]}</p>
                {items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isPending = conv.id === pendingDelete;
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 px-3.5 py-2 mx-1.5 rounded-lg cursor-pointer transition-colors",
                        isActive
                          ? "bg-primary-soft text-primary font-medium"
                          : "hover:bg-surface-sunken text-fg-muted",
                      )}
                      onClick={() => !isPending && onSelect(conv)}
                    >
                      <span
                        className={cn(
                          "text-caption truncate flex-1",
                          isActive ? "text-primary" : "text-fg",
                          isPending && "opacity-50",
                        )}
                      >
                        {formatConversationTitle(conv)}
                      </span>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUndo();
                          }}
                          className="text-xxs font-medium text-primary hover:underline px-1 cursor-pointer"
                        >
                          Deshacer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (conv.id !== undefined) handleDeleteClick(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-base text-fg-subtle hover:text-error cursor-pointer"
                          title="Eliminar"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
