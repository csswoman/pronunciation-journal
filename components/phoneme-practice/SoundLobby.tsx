"use client";

import Link from "next/link";
import { STAGES, isStageUnlocked, overallMastery } from "@/lib/phoneme-practice/stages";
import type { StageId, StageMasteryMap } from "@/lib/phoneme-practice/stages";

interface Props {
  soundIpa: string;
  soundName: string;
  soundType?: string;
  mastery: StageMasteryMap;
  hasPairs: boolean;
  onSelectStage: (stageId: StageId) => void;
  backHref?: string;
}

export function SoundLobby({
  soundIpa,
  soundName,
  soundType,
  mastery,
  hasPairs,
  onSelectStage,
  backHref = "/practice",
}: Props) {
  const overall = overallMastery(mastery, hasPairs);
  const visibleStages = hasPairs ? STAGES : STAGES.filter((s) => s.id !== "pairs");

  const nextUnlocked = visibleStages.find((s) => {
    return isStageUnlocked(s.id, mastery, hasPairs) && mastery[s.id].pct < 80;
  });

  const completedCount = visibleStages.filter((s) => mastery[s.id].pct >= 80).length;

  return (
    <section>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)] p-6 lg:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200 hover:-translate-x-0.5"
                style={{
                  borderColor: "color-mix(in_oklch,var(--primary)_25%,var(--line-divider))",
                  color: "var(--text-secondary)",
                  background: "color-mix(in_oklch,var(--card-bg)_80%,transparent)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M10 12L6 8l4-4" />
                </svg>
                Back
              </Link>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Sound Practice
                </span>
              </div>
            </div>

            {overall > 0 && (
              <span
                className="rounded-full border px-3 py-1 text-[13px] font-medium"
                style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
              >
                {overall}% mastered
              </span>
            )}
          </div>

          <div className="max-w-2xl space-y-3">
            <div className="flex items-baseline gap-4">
              <h1 className="font-mono text-[48px] font-bold leading-none text-[var(--primary)] lg:text-[60px]">
                {soundIpa}
              </h1>
              {soundType && (
                <span className="text-[13px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
                  {soundType}
                </span>
              )}
            </div>
            <p className="text-[17px] font-semibold text-[var(--deep-text)]">{soundName}</p>
            <p className="max-w-xl text-[15px] leading-6 text-[var(--text-secondary)]">
              Work through each stage to master this sound — start with recognition, then challenge yourself with minimal pairs and dictation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaPill icon="🎯">{visibleStages.length} stages</MetaPill>
            {completedCount > 0 && (
              <MetaPill icon="✅">{completedCount} of {visibleStages.length} complete</MetaPill>
            )}
            {overall >= 80 && <MetaPill icon="🏆" accent>Sound mastered</MetaPill>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 lg:px-10 py-8 pb-14">
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <InfoPill icon="👂" label="Stage 1" value="Identify words with this sound" accent="var(--primary)" />
          <InfoPill icon="🔄" label="Stage 2" value={hasPairs ? "Distinguish minimal pairs" : "Locked — no pairs for this sound"} accent="#f4a261" />
          <InfoPill icon="🎙️" label="Stage 3" value="Dictation — hear and type" accent="#2ec4b6" />
        </div>

        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--text-tertiary)]">
            Practice stages
          </p>
          <h2 className="mt-1 mb-6 text-[18px] font-semibold tracking-tight text-[var(--deep-text)]">
            Choose a stage to practice
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {visibleStages.map((stage, i) => {
            const unlocked = isStageUnlocked(stage.id, mastery, hasPairs);
            const m = mastery[stage.id];
            const isNext = nextUnlocked?.id === stage.id;

            return (
              <button
                key={stage.id}
                disabled={!unlocked}
                onClick={() => unlocked && onSelectStage(stage.id)}
                className="group text-left rounded-xl border p-5 transition-all duration-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
                style={{
                  backgroundColor: isNext
                    ? "color-mix(in_oklch,var(--primary)_7%,var(--card-bg))"
                    : "var(--card-bg)",
                  borderColor: isNext ? "var(--primary)" : "var(--line-divider)",
                  opacity: unlocked ? 1 : 0.45,
                  cursor: unlocked ? "pointer" : "not-allowed",
                  boxShadow: isNext
                    ? "0 0 0 1px var(--primary), 0 12px 30px rgba(0,0,0,0.06)"
                    : "0 1px 3px var(--line-divider)",
                }}
              >
                {i === 0 && m.total === 0 && (
                  <span
                    className="absolute right-4 top-4 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    start here
                  </span>
                )}
                {!unlocked && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                    <LockIcon />
                  </span>
                )}

                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-2xl text-xl"
                    style={{ background: "var(--btn-regular-bg)" }}
                  >
                    <StageEmoji id={stage.id} />
                  </span>
                  <span
                    className="text-[17px] font-semibold leading-tight"
                    style={{ color: unlocked ? "var(--deep-text)" : "var(--text-tertiary)" }}
                  >
                    {stage.title}
                  </span>
                </div>

                <p className="text-[14px] leading-6 mb-4 text-[var(--text-secondary)]">
                  {stage.difficulty} · Stage {i + 1}
                </p>

                <div
                  className="w-full h-3 rounded-full overflow-hidden"
                  style={{ background: "var(--btn-regular-bg)" }}
                >
                  {m.total === 0 ? (
                    <div
                      className="h-full w-1/5 rounded-full"
                      style={{ background: "var(--line-divider)" }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${m.pct}%`, background: stageColor(stage.id) }}
                    />
                  )}
                </div>

                <p className="mt-2 text-[12px] font-medium text-[var(--text-tertiary)]">
                  {m.total === 0 ? "Not started" : `${m.pct}% mastery`}
                </p>
              </button>
            );
          })}
        </div>

        {nextUnlocked ? (
          <button
            onClick={() => onSelectStage(nextUnlocked.id)}
            className="btn-primary w-full rounded-[18px] px-5 py-4 text-[15px] font-semibold shadow-lg shadow-[color-mix(in_oklch,var(--primary)_18%,transparent)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Continue — {nextUnlocked.title}
          </button>
        ) : overall >= 80 ? (
          <div className="rounded-[18px] border border-[color-mix(in_oklch,var(--admonitions-color-tip)_20%,transparent)] bg-[color-mix(in_oklch,var(--admonitions-color-tip)_8%,transparent)] px-4 py-4 text-center">
            <p className="text-[15px] font-semibold text-[var(--admonitions-color-tip)]">
              🎉 All stages mastered — great work!
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Keep practicing to maintain your score.
            </p>
          </div>
        ) : (
          <button
            onClick={() => onSelectStage("recognition")}
            className="btn-primary w-full rounded-[18px] px-5 py-4 text-[15px] font-semibold shadow-lg shadow-[color-mix(in_oklch,var(--primary)_18%,transparent)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Start practice · Stage 1
          </button>
        )}
      </div>
    </section>
  );
}

function StageEmoji({ id }: { id: StageId }) {
  switch (id) {
    case "recognition": return <>👂</>
    case "pairs":       return <>🔄</>
    case "dictation":   return <>🎙️</>
  }
}

function stageColor(id: StageId): string {
  switch (id) {
    case "recognition": return "var(--primary)"
    case "pairs":       return "#f4a261"
    case "dictation":   return "#2ec4b6"
  }
}

function InfoPill({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl border p-4 space-y-2"
      style={{ background: "var(--card-bg)", borderColor: "var(--line-divider)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[16px] leading-none">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--text-tertiary)]">{label}</p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <p className="text-[13px] font-medium leading-snug text-[var(--deep-text)]">{value}</p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function MetaPill({ children, accent = false, icon }: { children: React.ReactNode; accent?: boolean; icon?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium"
      style={{
        borderColor: accent ? "color-mix(in_oklch,var(--primary)_35%,transparent)" : "var(--line-divider)",
        color: accent ? "var(--primary)" : "var(--text-secondary)",
        background: accent ? "color-mix(in_oklch,var(--primary)_10%,transparent)" : "color-mix(in_oklch,var(--card-bg)_60%,transparent)",
      }}
    >
      {icon && <span className="text-[12px] leading-none">{icon}</span>}
      {children}
    </span>
  );
}
