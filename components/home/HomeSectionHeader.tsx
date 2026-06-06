interface HomeSectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  size?: "lg" | "sm";
}

export default function HomeSectionHeader({
  number,
  title,
  subtitle,
  size = "sm",
}: HomeSectionHeaderProps) {
  const numClass =
    size === "lg"
      ? "font-display text-lg italic text-[var(--primary)]"
      : "font-display text-sm italic text-[var(--primary)]";
  const titleClass =
    size === "lg"
      ? "text-2xl font-semibold tracking-tight text-[var(--text-primary)]"
      : "text-base font-medium tracking-tight text-[var(--text-secondary)]";

  return (
    <div className={size === "lg" ? "mb-5" : "mb-4"}>
      <div className="flex items-baseline gap-3">
        <span className={numClass}>{number}</span>
        <h2 className={titleClass}>{title}</h2>
        {subtitle ? (
          <span className="font-caption ml-auto hidden text-[var(--text-tertiary)] sm:inline">
            {subtitle}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="font-caption mt-0.5 pl-[calc(1rem+0.75rem)] text-[var(--text-tertiary)] sm:hidden">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
