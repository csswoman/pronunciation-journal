"use client";

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
      <div className="ipa-chart__chartcard">
        <div className="ipa-chart__consonant-groups">
          {CONSONANT_ROWS.map((row) => {
            const groupPhonemes = phonemes
              .filter((p) => PHONEME_MATRIX[p.symbol]?.row === row.id)
              .sort(sortByPlace);

            if (groupPhonemes.length === 0) return null;

            return (
              <section key={row.id} className="ipa-chart__ggroup">
                <h3 className="ipa-chart__ggroup-label">{row.label}</h3>
                <div className="ipa-chart__gcells">
                  {groupPhonemes.map((phoneme) => (
                    <IPAMatrixCell
                      key={phoneme.symbol}
                      phoneme={phoneme}
                      keyword={PHONEME_MATRIX[phoneme.symbol].keyword}
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

        <div className="ipa-chart__chartfoot">
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
    <div className="ipa-chart__chartcard">
      <div className="ipa-chart__vgrid ipa-chart__vgrid--vowels">
        <div />
        {config.cols.map((col) => (
          <div key={col.id} className="ipa-chart__vgrid-ch">
            {col.label}
          </div>
        ))}

        {config.rows.map((row) => (
          <RowFragment key={row.id}>
            <div className="ipa-chart__vgrid-rl">{row.label}</div>
            {config.cols.map((col) => {
              const cellPhonemes = cellMap.get(`${row.id}|${col.id}`) ?? [];
              return (
                <div key={col.id} className="ipa-chart__vcell">
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

      <div className="ipa-chart__chartfoot">
        <span>{config.axisLabel}</span>
        <span>{phonemes.length} vocales</span>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
