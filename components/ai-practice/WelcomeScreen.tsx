import AIAvatar from "./AIAvatar";
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
    <div className="flex flex-col gap-5 py-4">
      <div className="flex justify-start gap-3">
        <AIAvatar />
        <div
          className="px-4 py-3 rounded-xl rounded-tl-none max-w-[80%]"
          style={{ backgroundColor: "var(--btn-regular-bg)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            Hi! I&apos;m your English coach. What would you like to practice today?
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="pl-9">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Choose how you want to practice
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Pick an option or write your own message.
          </p>
        </div>

        <div className="pl-9 grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <TemplateCard key={t.id} template={t} onSelect={handleSelect} recommended={t.id === "free-conversation"} />
          ))}
        </div>
      </div>
    </div>
  );
}
