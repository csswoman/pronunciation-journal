"use client";

import { useState } from "react";
import { Plus, Search, X, MessageCircle, UserRound, Mic, BookOpen, Target, Flame } from "lucide-react";
import Button from "@/components/ui/Button";
import type { AIConversation, AIConversationMode } from "@/lib/types";

export type ConvGroupLabel = "TODAY" | "YESTERDAY" | "7 DAYS" | "OLDER";

interface AIPracticeSidebarProps {
  grouped: Record<ConvGroupLabel, AIConversation[]>;
  onNewSession: () => void;
  onSelectConversation: (conv: AIConversation) => void;
  onDeleteConversation: (id: number) => void;
  activeConversationId: number | null;
  collapsed?: boolean;
}

const GROUP_ORDER: ConvGroupLabel[] = ["TODAY", "YESTERDAY", "7 DAYS", "OLDER"];

function modeIcon(mode: AIConversationMode | undefined) {
  if (!mode || mode === "chat") return MessageCircle;
  if (mode === "pronunciation") return Mic;
  if (mode === "lesson") return BookOpen;
  if (mode.startsWith("roleplay:")) return UserRound;
  return MessageCircle;
}

export default function AIPracticeSidebar({
  grouped,
  onNewSession,
  onSelectConversation,
  onDeleteConversation,
  activeConversationId,
  collapsed = false,
}: AIPracticeSidebarProps) {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  const isEmpty = GROUP_ORDER.every((l) => grouped[l].length === 0);

  return (
    <aside
      className={`flex-col w-52 flex-shrink-0 overflow-hidden border-r transition-all duration-200 ${collapsed ? "hidden" : "hidden md:flex"}`}
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
    >
      <div className="p-3 flex-shrink-0">
        <Button
          onClick={onNewSession}
          variant="dashed"
          size="sm"
          fullWidth
          icon={<Plus size={14} />}
        >
          New Session
        </Button>
      </div>

      <div className="px-3 pb-2 flex-shrink-0">
        <SearchInput value={search} onChange={setSearch} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isEmpty ? (
          <p className="text-xs px-2 pt-4 text-center" style={{ color: "var(--text-tertiary)" }}>
            No chats yet.
          </p>
        ) : (
          GROUP_ORDER.map((label) => {
            const convs = grouped[label].filter((c) =>
              query ? c.title.toLowerCase().includes(query) : true
            );
            if (!convs.length) return null;
            return (
              <ConvGroup key={label} label={label}>
                {convs.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                  />
                ))}
              </ConvGroup>
            );
          })
        )}
      </div>

      <CoachFooter />
    </aside>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search
        size={12}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-tertiary)" }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats..."
        className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors"
        style={{
          backgroundColor: "var(--btn-regular-bg)",
          borderColor: "var(--line-divider)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line-divider)")}
      />
    </div>
  );
}

function ConvGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p
        className="px-2 py-1 text-tiny font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function ConvItem({
  conv,
  isActive,
  onSelect,
  onDelete,
}: {
  conv: AIConversation;
  isActive: boolean;
  onSelect: (conv: AIConversation) => void;
  onDelete: (id: number) => void;
}) {
  const Icon = modeIcon(conv.mode);
  return (
    <div
      className="group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: isActive ? "var(--btn-regular-bg-active)" : "transparent" }}
      onClick={() => onSelect(conv)}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Icon size={12} className="flex-shrink-0 mr-1.5" style={{ color: "var(--text-tertiary)" }} />
      <span className="text-xs truncate flex-1" style={{ color: "var(--text-secondary)" }}>
        {conv.title || "Untitled"}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 p-0.5 rounded"
        style={{ color: "var(--text-tertiary)" }}
        onClick={(e) => { e.stopPropagation(); if (conv.id != null) onDelete(conv.id); }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        aria-label="Delete conversation"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function CoachFooter() {
  return (
    <div
      className="flex-shrink-0 border-t px-3 py-3 space-y-3"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--accent-subtle, var(--btn-regular-bg))", color: "var(--primary)" }}
        >
          <UserRound size={15} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>Your Coach</p>
          <p className="text-tiny" style={{ color: "var(--text-tertiary)" }}>English Coach</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame size={13} style={{ color: "var(--primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>7</span>
          <span className="text-tiny" style={{ color: "var(--text-tertiary)" }}>day streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={13} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>12/20</span>
          <span className="text-tiny" style={{ color: "var(--text-tertiary)" }}>goal</span>
        </div>
      </div>

      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: "60%", backgroundColor: "var(--primary)" }}
        />
      </div>
    </div>
  );
}
