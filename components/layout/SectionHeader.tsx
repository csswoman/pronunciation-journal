import Button from "@/components/ui/Button";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  viewAll?: () => void;
  viewAllHref?: string;
}

export default function SectionHeader({ title, viewAll, viewAllHref }: SectionHeaderProps) {
  const linkClass = "text-caption font-semibold text-[var(--primary)] flex items-center gap-1 [transition:gap_var(--transition-fast,150ms_ease),color_var(--transition-fast,150ms_ease)] hover:gap-2 hover:text-[var(--primary)]";

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[var(--font-h2)]" style={{ fontWeight: 600 }}>
        {title}
      </h2>
      {viewAllHref ? (
        <Link href={viewAllHref} className={linkClass}>View all →</Link>
      ) : viewAll ? (
        <Button onClick={viewAll} className={linkClass}>View all →</Button>
      ) : null}
    </div>
  );
}


