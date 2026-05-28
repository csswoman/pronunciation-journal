interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-sunken)] px-3 py-2.5 sm:px-4 sm:py-3 min-w-0 flex-1 sm:flex-none sm:min-w-[120px]">
      <span aria-hidden="true" className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-raised)] shrink-0">
        {icon}
      </span>
      <span className="flex flex-col leading-none gap-0.5">
        <span className="text-[15px] font-bold text-[var(--text-primary)]">{value}</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      </span>
    </div>
  );
}
