"use client";

import { Check, ArrowRight, ClipboardList } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";

interface TodoItem {
  id: number;
  label: string;
  tag: string;
  tagColor: string;
  minutes: number;
  done: boolean;
  icon?: string;
}

const TODO_ITEMS: TodoItem[] = [
  { id: 1, label: "Vowel sounds: /ɪ/ vs /iː/", tag: "Pronunciation", tagColor: "bg-green-100 text-green-700", minutes: 8, done: true },
  { id: 2, label: "Present Perfect vs Past Simple", tag: "Theory", tagColor: "bg-purple-100 text-purple-700", minutes: 12, done: true },
  { id: 3, label: 'Tongue twister: "She sells seashells"', tag: "Shadowing", tagColor: "bg-blue-100 text-blue-700", minutes: 6, done: false, icon: "✏️" },
  { id: 4, label: "Review 12 words (SRS)", tag: "Word Bank", tagColor: "bg-yellow-100 text-yellow-700", minutes: 5, done: false },
  { id: 5, label: "Audio of the day · BBC clip", tag: "Listening", tagColor: "bg-orange-100 text-orange-700", minutes: 10, done: false },
];

const completed = TODO_ITEMS.filter((t) => t.done).length;
const total = TODO_ITEMS.length;
const remaining = TODO_ITEMS.filter((t) => !t.done).reduce((s, t) => s + t.minutes, 0);
const progress = Math.round((completed / total) * 100);

export default function HomeTodo() {
  return (
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<ClipboardList size={18} className="text-[var(--primary)]" />}
        title="Today's plan"
        right={
          <span className="text-xs text-[var(--text-tertiary)]">
            {completed}/{total} complete
          </span>
        }
      />

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--btn-regular-bg)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--text-tertiary)] shrink-0">~{remaining} min left</span>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y divide-[var(--border-light)]">
        {TODO_ITEMS.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-3 ${item.done ? "opacity-50" : ""}`}
          >
            {/* Status indicator */}
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                ${item.done
                  ? "bg-[var(--primary)] text-white"
                  : item.icon
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]"
                }`}
            >
              {item.done ? (
                <Check size={14} strokeWidth={3} />
              ) : item.icon ? (
                <span className="text-base leading-none">{item.icon}</span>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">· {item.minutes} min</span>
              </div>
              <p className={`text-sm text-[var(--deep-text)] truncate ${item.done ? "line-through" : ""}`}>
                {item.label}
              </p>
            </div>

            {/* Action */}
            {!item.done && (
              <button className={`shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                ${item.icon
                  ? "bg-[var(--primary)] text-white hover:opacity-90"
                  : "text-[var(--text-tertiary)]"
                }`}>
                {item.icon ? (
                  <>Start <ArrowRight size={12} /></>
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
