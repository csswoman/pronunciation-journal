interface HomeSectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
}

export default function HomeSectionHeader({ number, title, subtitle }: HomeSectionHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-base italic text-[var(--primary)]">
          {number}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle ? (
          <span className="ml-auto text-sm text-[var(--text-tertiary)] hidden sm:inline">
            {subtitle}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-0.5 text-sm text-[var(--text-tertiary)] sm:hidden pl-[calc(1rem+0.75rem)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
