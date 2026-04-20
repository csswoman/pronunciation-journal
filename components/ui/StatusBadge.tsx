interface StatusBadgeProps {
  ok: boolean | null;
  message: string;
}

export default function StatusBadge({ ok, message }: StatusBadgeProps) {
  if (ok === null) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-sm"
      style={{
        backgroundColor: ok ? "var(--success-bg, #dcfce7)" : "var(--error-bg, #fee2e2)",
        color: ok ? "#166534" : "#991b1b",
      }}
    >
      {message}
    </div>
  );
}
