"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import type { AIConversation } from "@/lib/types";

export type ConvGroupLabel = "TODAY" | "YESTERDAY" | "7 DAYS" | "OLDER";

interface AIPracticeSidebarProps {
  grouped: Record<ConvGroupLabel, AIConversation[]>;
  onNewSession: () => void;
  activeConversationId: number | null;
}

const GROUP_ORDER: ConvGroupLabel[] = ["TODAY", "YESTERDAY", "7 DAYS", "OLDER"];

export default function AIPracticeSidebar({
  grouped,
  onNewSession,
  activeConversationId,
}: AIPracticeSidebarProps) {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  const isEmpty = GROUP_ORDER.every((l) => grouped[l].length === 0);

  return (
    <aside
      className="hidden md:flex flex-col w-52 flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: "var(--card-bg)" }}
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
                  />
                ))}
              </ConvGroup>
            );
          })
        )}
      </div>
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
        className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function ConvItem({ conv, isActive }: { conv: AIConversation; isActive: boolean }) {
  return (
    <div
      className="group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: isActive ? "var(--btn-regular-bg-active)" : "transparent" }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span className="text-xs truncate flex-1" style={{ color: "var(--text-secondary)" }}>
        {conv.title || "Untitled"}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 p-0.5 rounded"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        aria-label="Delete conversation"
      >
        <X size={12} />
      </button>
    </div>
  );
}
