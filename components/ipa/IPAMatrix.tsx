"use client";

import { PHONEME_MATRIX, getMatrixConfig, type PhonemeData } from "./data";
import IPAMatrixCell from "./IPAMatrixCell";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

const ROW_LABEL_BG = "var(--bg-tertiary)";

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

  const cellMap = new Map<string, PhonemeData[]>();
  for (const phoneme of phonemes) {
    const coord = PHONEME_MATRIX[phoneme.symbol];
    if (!coord) continue;
    const key = `${coord.row}|${coord.col}`;
    const arr = cellMap.get(key) ?? [];
    arr.push(phoneme);
    cellMap.set(key, arr);
  }

  const gridTemplateColumns = `100px repeat(${config.cols.length}, minmax(0, 1fr))`;

  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{
        backgroundColor: "var(--surface-raised)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Column headers — outside the table */}
      <div
        className="grid pb-3"
        style={{ gridTemplateColumns }}
      >
        <div />
        {config.cols.map((col) => (
          <div
            key={col.id}
            className="text-tiny font-semibold uppercase tracking-widest text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="grid overflow-hidden rounded-xl border"
        style={{
          gridTemplateColumns,
          borderColor: "var(--border-subtle)",
        }}
      >
        {config.rows.map((row, rowIndex) => (
          <RowFragment key={row.id}>
            <div
              className="flex items-center text-tiny font-semibold uppercase tracking-widest px-3 py-2"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: ROW_LABEL_BG,
                borderTop:
                  rowIndex === 0 ? "none" : "1px solid var(--border-subtle)",
                borderRight: "1px solid var(--border-subtle)",
              }}
            >
              {row.label}
            </div>
            {config.cols.map((col, colIndex) => {
              const cellPhonemes = cellMap.get(`${row.id}|${col.id}`) ?? [];
              return (
                <div
                  key={col.id}
                  className="relative min-h-[72px] p-1.5 grid gap-1"
                  style={{
                    borderTop:
                      rowIndex === 0
                        ? "none"
                        : "1px solid var(--border-subtle)",
                    borderRight:
                      colIndex === config.cols.length - 1
                        ? "none"
                        : "1px solid var(--border-subtle)",
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
        <span>
          {phonemes.length}{" "}
          {category === "vowel"
            ? "vowels"
            : category === "consonant"
            ? "consonants"
            : "diphthongs"}
        </span>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
