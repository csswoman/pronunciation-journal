// Planned structure:
// <LandingCoach>
//   copy column
//   <CoachTranscript />  — static excerpt of a real correction turn
import { LandingSection, LandingSectionHeading } from "@/components/landing/LandingSection";

export function LandingCoach() {
  return (
    <LandingSection id="coach">
      <div className="grid items-center gap-[var(--space-10)] md:grid-cols-2">
        <div>
          <LandingSectionHeading
            kicker="El coach"
            title="Te corrige y te dice por qué."
            lead="Habla contigo en español mientras practicas en inglés, porque una explicación que no entiendes no enseña nada. Cuando subes de nivel, cambia solo."
          />
        </div>

        <CoachTranscript />
      </div>
    </LandingSection>
  );
}

function CoachTranscript() {
  return (
    <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-[var(--space-5)] shadow-[var(--shadow-md)]">
      <Turn side="user" label="Tú dijiste">
        I want to <span className="font-ipa">/ʃiːt/</span> on the chair
      </Turn>

      <Turn side="coach" label="Coach">
        Casi. Dijiste <span className="font-ipa text-[var(--error-value)]">/ʃiːt/</span>{" "}
        con vocal larga. Para <em>sit</em> necesitas{" "}
        <span className="font-ipa text-[var(--success-value)]">/sɪt/</span>: más
        corta y más relajada. La lengua no llega tan arriba.
      </Turn>

      <p className="rounded-[var(--radius-lg)] bg-[var(--warning-soft)] p-[var(--space-3)] font-[var(--font-caption)] text-[var(--text-secondary)]">
        Añadido a tu práctica de mañana: contraste{" "}
        <span className="font-ipa">/ɪ/</span> frente a{" "}
        <span className="font-ipa">/iː/</span>
      </p>
    </div>
  );
}

function Turn({
  side,
  label,
  children,
}: {
  side: "user" | "coach";
  label: string;
  children: React.ReactNode;
}) {
  const isCoach = side === "coach";
  return (
    <div
      className={
        isCoach
          ? "rounded-[var(--radius-lg)] bg-[var(--primary-soft)] p-[var(--space-4)]"
          : "rounded-[var(--radius-lg)] bg-[var(--surface-sunken)] p-[var(--space-4)]"
      }
    >
      <p className="font-[var(--font-tiny)] uppercase tracking-[var(--text-tracking-kicker)] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-[var(--space-1)] font-[var(--font-body-sm)] text-[var(--text-primary)]">
        {children}
      </p>
    </div>
  );
}
