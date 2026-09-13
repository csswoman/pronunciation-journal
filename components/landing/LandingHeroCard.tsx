// Planned structure:
// <LandingHeroCard>   — static specimen of a real Essential Words entry
//   word + IPA pair (strong vs weak form)
//   sentence showing the weak form in context
//   scheduling footer (what the SRS decided)
import { cn } from "@/lib/cn";

/** Real entry from public/essential-words — "of" is #4 by frequency. */
const SPECIMEN = {
  word: "of",
  strong: "/ˈʌv/",
  weak: "/əv/",
  sentence: ["a cup", "of", "coffee"],
  spoken: "a cuppa coffee",
} as const;

export function LandingHeroCard() {
  return (
    <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-[var(--space-6)] shadow-[var(--shadow-lg)]">
      <div className="flex items-baseline justify-between">
        <p className="font-[var(--font-kicker)] uppercase tracking-[var(--text-tracking-kicker)] text-[var(--text-tertiary)]">
          Palabra 4 de 2.800
        </p>
        <span className="rounded-[var(--radius-full)] bg-[var(--accent-2-soft)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-tiny)] text-[var(--accent-2)]">
          A1
        </span>
      </div>

      <p className="mt-[var(--space-4)] font-[var(--font-h1)] text-[var(--text-primary)]">
        {SPECIMEN.word}
      </p>

      <div className="mt-[var(--space-4)] grid grid-cols-2 gap-[var(--space-3)]">
        <Form label="Forma fuerte" ipa={SPECIMEN.strong} muted />
        <Form label="Forma débil" ipa={SPECIMEN.weak} />
      </div>

      <div className="mt-[var(--space-5)] rounded-[var(--radius-lg)] bg-[var(--surface-sunken)] p-[var(--space-4)]">
        <p className="font-[var(--font-body)] text-[var(--text-primary)]">
          {SPECIMEN.sentence.map((chunk) =>
            chunk === SPECIMEN.word ? (
              <mark
                key={chunk}
                className="rounded-[var(--radius-xs)] bg-[var(--primary-100)] px-[var(--space-1)] text-[var(--primary-800)]"
              >
                {chunk}
              </mark>
            ) : (
              <span key={chunk}> {chunk} </span>
            )
          )}
        </p>
        <p className="mt-[var(--space-2)] font-[var(--font-caption)] text-[var(--text-tertiary)]">
          Suena como “{SPECIMEN.spoken}”. Por eso no lo oyes.
        </p>
      </div>

      <p className="mt-[var(--space-4)] font-[var(--font-caption)] text-[var(--text-tertiary)]">
        Acertaste 2 veces seguidas. Vuelve en 6 días.
      </p>
    </div>
  );
}

function Form({
  label,
  ipa,
  muted = false,
}: {
  label: string;
  ipa: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-[var(--space-3)]">
      <p className="font-[var(--font-tiny)] uppercase tracking-[var(--text-tracking-kicker)] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p
        className={cn(
          "font-ipa mt-[var(--space-1)] text-[var(--text-size-display-word)]",
          muted ? "text-[var(--text-tertiary)]" : "text-[var(--primary)]"
        )}
      >
        {ipa}
      </p>
    </div>
  );
}
