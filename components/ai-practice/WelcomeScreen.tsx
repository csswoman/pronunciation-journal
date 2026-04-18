import AIAvatar from "./AIAvatar";
import SuggestionChips from "./SuggestionChips";

const DEFAULT_SUGGESTIONS = [
  { label: "Free conversation", prompt: "Let's have a free conversation in English. You can correct my mistakes and help me improve." },
  { label: "Correct my sentence", prompt: "Please correct this sentence and explain why: I didn't went to the store yesterday." },
  { label: "Practice questions", prompt: "Ask me 5 practice questions to improve my English grammar and vocabulary." },
  { label: "Personalized practice", prompt: "Give me a personalized practice session focused on common English mistakes." },
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
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

      <div className="pl-9">
        <SuggestionChips suggestions={DEFAULT_SUGGESTIONS} onSelect={onSuggestionClick} />
      </div>
    </div>
  );
}
