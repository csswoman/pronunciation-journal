"use client";

import type { WordResult, PhonemeAlignment } from "@/lib/types";
import { playIpaSound } from "@/lib/ipa-audio";
import ProgressBar from "@/components/ui/ProgressBar";

interface PronunciationFeedbackProps {
  wordResults: WordResult[];
  accuracy: number;
  feedback: { message: string; emoji: string; color: string };
  xpEarned: number;
}

// ── Phoneme chip — plays sound on hover ──────────────────────────────────────

function PhonemeChip({ p }: { p: PhonemeAlignment }) {
  const display = p.ipa ?? p.phoneme.toLowerCase();
  const isProblematic = p.status === "incorrect" || p.status === "missing";

  let bg = "color-mix(in srgb, var(--admonitions-color-tip) 20%, transparent)";
  let border = "var(--admonitions-color-tip)";
  let color = "var(--admonitions-color-tip)";

  if (p.status === "missing") {
    bg = "transparent";
    border = "var(--admonitions-color-warning)";
    color = "var(--admonitions-color-warning)";
  } else if (p.status === "incorrect") {
    bg = "color-mix(in srgb, var(--admonitions-color-caution) 20%, transparent)";
    border = "var(--admonitions-color-caution)";
    color = "var(--admonitions-color-caution)";
  }

  const tooltip =
    p.status === "incorrect"
      ? `heard /${p.gotIpa ?? p.got}/ — hover to hear /${display}/`
      : p.status === "missing"
      ? `missing /${display}/ — hover to hear it`
      : `/${display}/ — correct`;

  return (
    <span
      title={tooltip}
      onMouseEnter={() => p.ipa && playIpaSound(p.ipa)}
      className="inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded border select-none transition-opacity"
      style={{
        backgroundColor: bg,
        borderColor: border,
        color,
        textDecoration: p.status === "missing" ? "line-through" : "none",
        cursor: isProblematic ? "help" : "default",
      }}
    >
      /{display}/
      {isProblematic && (
        <svg className="ml-0.5 w-2.5 h-2.5 opacity-50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      )}
    </span>
  );
}

function PhonemeChips({ alignment }: { alignment: PhonemeAlignment[] }) {
  if (alignment.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {alignment.map((p, i) => <PhonemeChip key={i} p={p} />)}
    </div>
  );
}

// ── Tip builder ───────────────────────────────────────────────────────────────

function buildDetailedTip(result: WordResult): string | null {
  const alignment = result.phonemes?.alignment;
  if (!alignment || alignment.length === 0) return result.phonemes?.tip ?? null;

  const problems: string[] = [];
  for (const p of alignment) {
    const exp = p.ipa ?? `/${p.phoneme}/`;
    if (p.status === "incorrect" && p.got) {
      const got = p.gotIpa ?? `/${p.got}/`;
      problems.push(`/${exp}/ → heard /${got}/`);
    } else if (p.status === "missing") {
      problems.push(`missing /${exp}/`);
    }
  }
  if (problems.length === 0) return null;
  return problems.join(" · ");
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
}: PronunciationFeedbackProps) {
  const problemWords = wordResults.filter(
    (r) =>
      r.status !== "extra" &&
      r.phonemes?.alignment?.some((p) => p.status === "incorrect" || p.status === "missing")
  );

  return (
    <div className="w-full animate-fadeIn space-y-5">
      {/* Score */}
      <div className="text-center">
        <div className="text-5xl font-bold mb-1">
          <span className={feedback.color}>{accuracy}%</span>
        </div>
        <p className={`text-lg font-medium ${feedback.color}`}>
          {feedback.emoji} {feedback.message}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          +{xpEarned} XP
        </p>
      </div>

      {/* Accuracy bar */}
      <ProgressBar
        value={accuracy}
        height="md"
        color={
          accuracy >= 80
            ? "var(--admonitions-color-tip)"
            : accuracy >= 60
            ? "var(--admonitions-color-warning)"
            : "var(--admonitions-color-caution)"
        }
      />

      {/* Word results */}
      <div className="space-y-2">
        {wordResults.map((result, idx) => {
          const hasPhonemes = (result.phonemes?.alignment?.length ?? 0) > 0;
          const tip = buildDetailedTip(result);

          return (
            <div
              key={idx}
              className="rounded-xl px-3 py-2.5 border text-sm"
              style={{
                backgroundColor:
                  result.status === "correct"
                    ? "color-mix(in srgb, var(--admonitions-color-tip) 10%, transparent)"
                    : result.status === "incorrect"
                    ? "color-mix(in srgb, var(--admonitions-color-caution) 8%, transparent)"
                    : "color-mix(in srgb, var(--admonitions-color-warning) 8%, transparent)",
                borderColor:
                  result.status === "correct"
                    ? "color-mix(in srgb, var(--admonitions-color-tip) 25%, transparent)"
                    : result.status === "incorrect"
                    ? "color-mix(in srgb, var(--admonitions-color-caution) 25%, transparent)"
                    : "color-mix(in srgb, var(--admonitions-color-warning) 25%, transparent)",
              }}
            >
              {/* Word row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--text-primary)" }}>
                  <span>
                    {result.status === "correct" ? "✅"
                      : result.status === "incorrect" ? "❌"
                      : result.status === "missing" ? "⬜"
                      : "➕"}
                  </span>
                  <span>{result.expected || result.got}</span>
                </div>
                {result.status === "incorrect" && result.got && (
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    heard: &ldquo;{result.got}&rdquo;
                  </span>
                )}
              </div>

              {/* Phoneme chips */}
              {hasPhonemes && <PhonemeChips alignment={result.phonemes!.alignment} />}

              {/* Tip */}
              {tip && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  💡 {tip}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Sounds to practice */}
      {problemWords.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 border text-sm space-y-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <p className="font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--primary)" }}>
            Hover to hear the correct sound
          </p>
          {problemWords.map((r, i) => {
            const failed = r.phonemes!.alignment.filter(
              (p) => p.status === "incorrect" || p.status === "missing"
            );
            return (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {r.expected}:
                </span>
                {failed.map((p, j) => <PhonemeChip key={j} p={p} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
