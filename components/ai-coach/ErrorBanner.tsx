interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="mb-3 px-4 py-3 text-sm flex items-start gap-3 rounded-xl border-l-4 flex-shrink-0"
      style={{
        backgroundColor: "var(--btn-regular-bg)",
        borderColor: "var(--admonitions-color-caution)",
        color: "var(--admonitions-color-caution)",
      }}
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
