import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  viewAll?: () => void;
  viewAllHref?: string;
}

export default function SectionHeader({ title, viewAll, viewAllHref }: SectionHeaderProps) {
  const linkClass = "text-[13px] font-semibold text-[var(--primary)] flex items-center gap-1 transition-[gap] duration-200 hover:gap-2";

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-lg font-bold text-[var(--deep-text)] tracking-tight">
        {title}
      </h2>
      {viewAllHref ? (
        <Link href={viewAllHref} className={linkClass}>View all →</Link>
      ) : viewAll ? (
        <button onClick={viewAll} className={linkClass}>View all →</button>
      ) : null}
    </div>
  );
}
