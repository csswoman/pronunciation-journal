"use client";

import { useEffect, useRef } from "react";

interface PreviewMessage {
  role: "ai" | "user";
  content: string;
}

interface InlineChatPreviewProps {
  messages: PreviewMessage[];
  isLoading: boolean;
}

export default function InlineChatPreview({ messages, isLoading }: InlineChatPreviewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex flex-col gap-4 px-5 py-4 max-h-52 overflow-y-auto">
        {messages.map((msg, i) =>
          msg.role === "ai" ? (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-tiny font-bold mt-0.5"
                style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
              >
                AI
              </div>
              <div
                className="text-sm leading-relaxed px-3 py-2 rounded-2xl rounded-tl-sm"
                style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-primary)" }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div
                className="text-sm leading-relaxed px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%]"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {msg.content}
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-tiny font-bold"
              style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
            >
              AI
            </div>
            <div
              className="px-3 py-3 rounded-2xl rounded-tl-sm"
              style={{ backgroundColor: "var(--btn-regular-bg)" }}
            >
              <div className="flex gap-1 items-center h-3.5">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"
                  style={{ backgroundColor: "var(--text-tertiary)" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"
                  style={{ backgroundColor: "var(--text-tertiary)" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--text-tertiary)" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
