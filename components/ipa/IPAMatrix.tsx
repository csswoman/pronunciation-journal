"use client";

// Planned structure:
// <IPAMatrix>
//   <IPAMatrixHeader />
//   <VowelGrid | ConsonantGroups />
//   <IPAMatrixFooter />
// </IPAMatrix>

import {
  CONSONANT_PLACE_ORDER,
  CONSONANT_ROWS,
  PHONEME_MATRIX,
  getMatrixConfig,
  type ConsonantPlace,
  type PhonemeData,
} from "./data";
import IPAMatrixCell from "./IPAMatrixCell";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

function sortByPlace(a: PhonemeData, b: PhonemeData) {
  const placeA = PHONEME_MATRIX[a.symbol]?.col as ConsonantPlace | undefined;
  const placeB = PHONEME_MATRIX[b.symbol]?.col as ConsonantPlace | undefined;
  const orderA = placeA ? CONSONANT_PLACE_ORDER[placeA] : 99;
  const orderB = placeB ? CONSONANT_PLACE_ORDER[placeB] : 99;
  return orderA - orderB;
}

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

  if (category === "consonant") {
    return (
      <div className="ipa-chart__chartcard bg-surface border border-border-subtle rounded-3xl p-5 md:p-7 shadow-xs">
        {/* Header with Title & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="ts-kicker text-text-muted uppercase tracking-widest font-bold">
            CONSONANTES — PUNTO DE ARTICULACIÓN
          </h2>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-muted font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--lilac)] inline-block" />
              por practicar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--mint)] inline-block" />
              dominado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--ink)] dark:bg-[var(--paper)] inline-block" />
              abierto
            </span>
          </div>
        </div>

        <div className="ipa-chart__consonant-groups">
          {CONSONANT_ROWS.map((row) => {
            const groupPhonemes = phonemes
              .filter((p) => PHONEME_MATRIX[p.symbol]?.row === row.id)
              .sort(sortByPlace);

            if (groupPhonemes.length === 0) return null;

            return (
              <section key={row.id} className="ipa-chart__ggroup">
                <h3 className="ts-kicker text-text-muted mb-2 font-bold uppercase tracking-wider">{row.label}</h3>
                <div className="ipa-chart__gcells">
                  {groupPhonemes.map((phoneme) => (
                    <IPAMatrixCell
                      key={phoneme.symbol}
                      phoneme={phoneme}
                      keyword={PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0]}
                      isSelected={selectedSymbol === phoneme.symbol}
                      isExplored={exploredSymbols.has(phoneme.symbol)}
                      isPlaying={playingSymbol === phoneme.rawSymbol}
                      onSelect={() => onSelect(phoneme)}
                      variant="tile"
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border-subtle/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-text-muted">
          <span>{config.axisLabel}</span>
          <span>{phonemes.length} consonantes</span>
        </div>
      </div>
    );
  }

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
    <div className="ipa-chart__chartcard bg-surface border border-border-subtle rounded-3xl p-5 md:p-7 shadow-xs">
      {/* Header with Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="ts-kicker text-text-muted uppercase tracking-widest font-bold">
          DÓNDE SE ARTICULA
        </h2>
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-muted font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--lilac)] inline-block" />
            por practicar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--mint)] inline-block" />
            dominado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ink)] dark:bg-[var(--paper)] inline-block" />
            abierto
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-[100px_repeat(3,minmax(0,1fr))] sm:grid-cols-[125px_repeat(3,minmax(0,1fr))] gap-2.5 md:gap-3.5 items-center">
        {/* Column Headers */}
        <div />
        {config.cols.map((col) => (
          <div key={col.id} className="ts-label text-text-muted text-center uppercase font-bold text-xs tracking-wider py-1">
            {col.label}
          </div>
        ))}

        {/* Rows */}
        {config.rows.map((row) => (
          <RowFragment key={row.id}>
            <div className="ts-label text-text-muted uppercase font-semibold text-xs tracking-wider pr-2">
              {row.label}
            </div>
            {config.cols.map((col) => {
              const cellPhonemes = cellMap.get(`${row.id}|${col.id}`) ?? [];
              return (
                <div key={col.id} className="flex flex-col gap-2 min-h-[72px] justify-center">
                  {cellPhonemes.map((phoneme) => (
                    <IPAMatrixCell
                      key={phoneme.symbol}
                      phoneme={phoneme}
                      keyword={PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0]}
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

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-border-subtle/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-text-muted">
        <span>La posición en el cuadro indica dónde va la lengua: arriba o abajo, delante o detrás.</span>
        <span>{phonemes.length} vocales</span>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
