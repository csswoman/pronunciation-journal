"use client";
import Button from "@/components/ui/Button";

import { useState } from "react";
import type { AITemplateId, TemplateVars } from "@/lib/types";
import { TEMPLATES } from "./TemplateCard";

const LEVELS = ["beginner", "intermediate", "upper-intermediate", "advanced"];

interface TemplateInputFormProps {
  templateId: AITemplateId;
  onSubmit: (vars: TemplateVars) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function TemplateInputForm({
  templateId,
  onSubmit,
  onBack,
  isLoading,
}: TemplateInputFormProps) {
  const [topic, setTopic] = useState("");
  const [userLevel, setUserLevel] = useState("intermediate");
  const [sentence, setSentence] = useState("");

  const template = TEMPLATES.find((t) => t.id === templateId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (templateId === "practice-questions") {
      onSubmit({ templateId, topic: topic.trim(), userLevel });
    } else if (templateId === "sentence-correction") {
      onSubmit({ templateId, sentence: sentence.trim() });
    } else if (templateId === "personalized-practice") {
      onSubmit({ templateId });
    } else if (templateId === "free-conversation") {
      onSubmit({ templateId, topic: topic.trim() });
    }
  };

  const isValid = () => {
    if (templateId === "practice-questions") return topic.trim().length > 0;
    if (templateId === "sentence-correction") return sentence.trim().length > 0;
    if (templateId === "personalized-practice") return true;
    if (templateId === "free-conversation") return topic.trim().length > 0;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={onBack}
          className="text-fg-subtle hover:text-fg-muted transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-fg">
            {template?.Icon && <template.Icon size={20} className="inline mr-1" />} {template?.title}
          </h2>
          <p className="text-sm text-fg-subtle">{template?.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(templateId === "practice-questions" || templateId === "free-conversation") && (
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                templateId === "practice-questions"
                  ? "e.g. travel, food, job interviews..."
                  : "e.g. movies, hobbies, daily routine..."
              }
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-surface-sunken text-fg placeholder:text-fg-placeholder focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isLoading}
            />
          </div>
        )}

        {templateId === "practice-questions" && (
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">
              Your Level
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <Button
                  key={lvl}
                  type="button"
                  onClick={() => setUserLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    userLevel === lvl
                      ? "bg-accent text-on-primary"
                      : "bg-surface-sunken text-fg-muted hover:bg-border-subtle"
                  }`}
                  disabled={isLoading}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          </div>
        )}

        {templateId === "sentence-correction" && (
          <div>
            <label className="block text-sm font-medium text-fg-muted mb-1">
              Your sentence
            </label>
            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Type the sentence you want corrected..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-surface-sunken text-fg placeholder:text-fg-placeholder focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              disabled={isLoading}
            />
          </div>
        )}

        {templateId === "personalized-practice" && (
          <div className="p-4 bg-success-soft rounded-xl border border-success-border">
            <p className="text-sm text-success">
              This session will be built from your pronunciation history — words you struggle with and your saved favorites. Just click Start!
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!isValid() || isLoading}
          className="w-full py-3 px-6 bg-accent hover:bg-accent-hover disabled:bg-surface-sunken text-on-primary disabled:text-fg-disabled rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-[var(--overlay-light)] border-t-on-primary rounded-full animate-spin" />
              Preparing your session...
            </>
          ) : (
            "Start Session →"
          )}
        </Button>
      </form>
    </div>
  );
}
