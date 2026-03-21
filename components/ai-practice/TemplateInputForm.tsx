"use client";

import { useState } from "react";
import type { AITemplateId, Difficulty, TemplateVars } from "@/lib/types";
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
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {template?.icon} {template?.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{template?.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(templateId === "practice-questions" || templateId === "free-conversation") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>
        )}

        {templateId === "practice-questions" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Level
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUserLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    userLevel === lvl
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  disabled={isLoading}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {templateId === "sentence-correction" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your sentence
            </label>
            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Type the sentence you want corrected..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              disabled={isLoading}
            />
          </div>
        )}

        {templateId === "personalized-practice" && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              This session will be built from your pronunciation history — words you struggle with and your saved favorites. Just click Start!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid() || isLoading}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Preparing your session...
            </>
          ) : (
            "Start Session →"
          )}
        </button>
      </form>
    </div>
  );
}
