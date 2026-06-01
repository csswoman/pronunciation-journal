import Link from "next/link";
import { ArrowRight, AlertTriangle, LibraryBig } from "lucide-react";
import Button from "@/components/ui/Button";
import Anchor from "@/components/ui/Anchor";
import { getWordStrength } from "@/lib/word-bank/strength";
import HomeReviewWordRow from "@/components/home/HomeReviewWordRow";
import type { WordBankEntry } from "@/lib/word-bank/types";

const PREVIEW_LIMIT = 4;

interface HomeReviewQueueCardProps {
  words?: WordBankEntry[];
  dueCount?: number;
}

export default function HomeReviewQueueCard({
  words = [],
  dueCount = 0,
}: HomeReviewQueueCardProps) {
  const preview = words.slice(0, PREVIEW_LIMIT);
  const atRisk = preview.filter((w) => getWordStrength(w) === "weak");

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <LibraryBig size={18} className="shrink-0 text-[var(--primary)]" />
          <h3
            className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            <span className="text-[var(--primary)]">{dueCount}</span> items ready to review
          </h3>
        </div>
        <Anchor
          href="/words?tab=my-words"
          icon={<ArrowRight size={14} />}
          iconPosition="right"
          className="shrink-0 text-caption"
        >
          Open Vocabulary
        </Anchor>
      </div>

      <p className="text-xs text-[var(--text-tertiary)]">Due today · {dueCount} words</p>

      {atRisk.length > 0 ? (
        <div
          className="mt-3 flex items-start gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[14px]"
          style={{
            background: "var(--warning-soft)",
            borderColor: "color-mix(in oklch, var(--warning) 30%, transparent)",
          }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <span>
            <b className="font-semibold text-[var(--warning-value)]">
              {atRisk.length} word{atRisk.length !== 1 ? "s" : ""}
            </b>{" "}
            are at risk of being forgotten. Review them today.
          </span>
        </div>
      ) : null}

      <div className="my-3 flex flex-col">
        {preview.length === 0 ? (
          <p className="py-2 text-sm text-[var(--text-tertiary)]">
            No words due yet — check back later.
          </p>
        ) : (
          preview.map((w, idx) => (
            <HomeReviewWordRow key={w.id} word={w} showDivider={idx < preview.length - 1} />
          ))
        )}
      </div>

      {dueCount > PREVIEW_LIMIT ? (
        <p className="mb-2 text-center text-xs text-[var(--text-tertiary)]">
          +{dueCount - PREVIEW_LIMIT} more in vocabulary
        </p>
      ) : null}

      <Link href="/words?tab=my-words" className="w-full">
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<ArrowRight size={15} />}
          iconPosition="right"
          className="justify-center"
          disabled={dueCount === 0}
        >
          Start review
        </Button>
      </Link>
    </div>
  );
}
