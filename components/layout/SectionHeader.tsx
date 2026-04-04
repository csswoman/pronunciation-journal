interface SectionHeaderProps {
  title: string;
  viewAll?: () => void;
}

export default function SectionHeader({ title, viewAll }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-lg font-bold text-[var(--deep-text)] tracking-tight">
        {title}
      </h2>
      {viewAll && (
        <button
          onClick={viewAll}
          className="text-[13px] font-semibold text-[var(--primary)]
            flex items-center gap-1 transition-[gap] duration-200 hover:gap-2"
        >
          View all →
        </button>
      )}
    </div>
  );
}
