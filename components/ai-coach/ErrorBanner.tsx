interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="mb-3 px-4 py-3 text-sm flex items-start gap-3 rounded-xl border-l-4 border-error bg-surface-raised text-error flex-shrink-0"
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
