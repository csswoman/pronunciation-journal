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
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Hi! I&apos;m your English coach.{" "}
          <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--text-tertiary)" }}>
          What would you like to practice today?
        </p>
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
