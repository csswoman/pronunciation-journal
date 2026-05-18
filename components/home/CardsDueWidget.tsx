export default function CardsDueWidget() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--surface-raised)] px-5 w-24 h-24">
      <span className="text-2xl font-bold text-[var(--text-tertiary)] leading-none">—</span>
      <span className="text-xs text-[var(--text-tertiary)] text-center leading-tight">no cards<br />due yet</span>
    </div>
  );
}
