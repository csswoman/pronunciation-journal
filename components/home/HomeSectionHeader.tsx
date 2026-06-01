interface HomeSectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
}

export default function HomeSectionHeader({ number, title, subtitle }: HomeSectionHeaderProps) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span
        className="text-base italic text-[var(--primary)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {number}
      </span>
      <h2
        className="text-2xl font-medium tracking-tight text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {title}
      </h2>
      {subtitle ? (
        <span className="ml-auto text-sm text-[var(--text-tertiary)] hidden sm:inline">
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}
