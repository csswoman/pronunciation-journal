"use client";

import type { AIMessage } from "@/lib/types";

function extractSentenceContext(fullText: string, selected: string): string {
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  const match = sentences.find((s) =>
    s.toLowerCase().includes(selected.toLowerCase())
  );
  return match?.trim() || selected;
}

interface MessageBubbleProps {
  message: AIMessage;
  onSaveWord: (word: string, context: string) => void;
}

export default function MessageBubble({ message, onSaveWord }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const handleMouseUp = () => {
    if (isUser) return;
    const selection = window.getSelection();
    const selected = selection?.toString().trim();
    if (!selected || selected.length < 2) return;
    const wordCount = selected.split(/\s+/).length;
    if (wordCount > 4) return;
    const context = extractSentenceContext(message.content, selected);
    onSaveWord(selected, context);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Render model message — convert basic markdown to readable text
  const lines = message.content.split("\n");

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        <div
          onMouseUp={handleMouseUp}
          title="Select any word or phrase to save it"
          className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 leading-relaxed cursor-text select-text space-y-1.5"
        >
          {lines.map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-1" />;
            // Bold: **text**
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i}>
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j}>{part.slice(2, -2)}</strong>
                  ) : (
                    part
                  )
                )}
              </p>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 px-1">
          Select any word to save it to your vocabulary
        </p>
      </div>
    </div>
  );
}
