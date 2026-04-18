export default function AIAvatar({ className = "mt-0.5" }: { className?: string }) {
  return (
    <div
      className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${className}`}
      style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
    >
      AI
    </div>
  );
}
