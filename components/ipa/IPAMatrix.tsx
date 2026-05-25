"use client";

import { PHONEME_MATRIX, getMatrixConfig, type PhonemeData } from "./data";
import IPAMatrixCell from "./IPAMatrixCell";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

export default function IPAMatrix({
  category,
  phonemes,
  selectedSymbol,
  exploredSymbols,
  playingSymbol,
  onSelect,
}: {
  category: MatrixCategory;
  phonemes: PhonemeData[];
  selectedSymbol: string;
  exploredSymbols: Set<string>;
  playingSymbol: string | null;
  onSelect: (phoneme: PhonemeData) => void;
}) {
  const config = getMatrixConfig(category);

  // Build a lookup: row|col -> phoneme[] (can be multiple, e.g. /p/ and /b/)
  const cellMap = new Map<string, PhonemeData[]>();
  for (const phoneme of phonemes) {
    const coord = PHONEME_MATRIX[phoneme.symbol];
    if (!coord) continue;
    const key = `${coord.row}|${coord.col}`;
    const arr = cellMap.get(key) ?? [];
    arr.push(phoneme);
    cellMap.set(key, arr);
  }

  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: "var(--bg-secondary, var(--card-bg))",
        borderColor: "var(--line-divider)",
      }}
    >
      <div
        className="grid gap-x-1.5 gap-y-2"
        style={{
          gridTemplateColumns: `100px repeat(${config.cols.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Header row: empty corner + column labels */}
        <div />
        {config.cols.map((col) => (
          <div
            key={col.id}
            className="text-tiny font-semibold uppercase tracking-widest text-center pb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {col.label}
          </div>
        ))}

        {/* Body rows */}
        {config.rows.map((row) => (
          <RowFragment key={row.id}>
            <div
              className="flex items-center text-tiny font-semibold uppercase tracking-widest pr-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {row.label}
            </div>
            {config.cols.map((col) => {
              const cellPhonemes = cellMap.get(`${row.id}|${col.id}`) ?? [];
              return (
                <div
                  key={col.id}
                  className="relative min-h-[72px] grid gap-px"
                  style={{
                    gridTemplateColumns:
                      cellPhonemes.length > 1
                        ? `repeat(${cellPhonemes.length}, minmax(0, 1fr))`
                        : "1fr",
                  }}
                >
                  {cellPhonemes.map((phoneme) => (
                    <IPAMatrixCell
                      key={phoneme.symbol}
                      phoneme={phoneme}
                      keyword={PHONEME_MATRIX[phoneme.symbol].keyword}
                      isSelected={selectedSymbol === phoneme.symbol}
                      isExplored={exploredSymbols.has(phoneme.symbol)}
                      isPlaying={playingSymbol === phoneme.rawSymbol}
                      onSelect={() => onSelect(phoneme)}
                    />
                  ))}
                </div>
              );
            })}
          </RowFragment>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-fg-muted">
        <span>{config.axisLabel}</span>
        <span>{phonemes.length} {category === "vowel" ? "vowels" : category === "consonant" ? "consonants" : "diphthongs"}</span>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
