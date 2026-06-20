import type { ReviewPreviewItem } from "@/lib/home/constants";

interface ReviewQueuePreviewProps {
  items: ReviewPreviewItem[];
}

function formatIpa(ipa: string | null): string {
  if (!ipa) return "";
  return ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/|\/$/g, "")}/`;
}

export default function ReviewQueuePreview({ items }: ReviewQueuePreviewProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4">
      {items.map((item) => (
        <div key={`${item.sourceId}:${item.id}`} className="flex items-baseline gap-2">
          <p className="font-display text-base font-medium leading-tight text-[var(--text-primary)]">
            {item.text}
            {item.ipa ? (
              <span className="font-ipa ml-2 text-sm font-normal text-[var(--primary)]">
                {formatIpa(item.ipa)}
              </span>
            ) : null}
          </p>
          {item.translation ? (
            <span className="font-caption text-[var(--text-tertiary)]">{item.translation}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
