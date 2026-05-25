import TemplateCard, { TEMPLATES } from "./TemplateCard";
import type { AITemplateId } from "@/lib/types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  onTemplateSelect?: (id: AITemplateId) => void;
}

export default function WelcomeScreen({ onSuggestionClick, onTemplateSelect }: WelcomeScreenProps) {
  const handleSelect = (id: AITemplateId) => {
    if (onTemplateSelect) {
      onTemplateSelect(id);
    } else {
      const t = TEMPLATES.find(t => t.id === id);
      if (t) onSuggestionClick(t.description);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="relative size-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--primary) 50%, transparent)",
          }}
        >
          <span className="text-white text-xl leading-none">✦</span>
          <span
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.25)" }}
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] m-0">
            Hi! I&apos;m your English coach.
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            What would you like to practice today?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 w-full max-w-2xl">
        {TEMPLATES.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            onSelect={handleSelect}
            recommended={t.id === "free-conversation"}
          />
        ))}
      </div>
    </div>
  );
}
