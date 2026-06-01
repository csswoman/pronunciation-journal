import type { GrammarCardBlock } from "@/lib/courses/grammar-deck/types";
import GrammarConjugationBlock from "./blocks/GrammarConjugationBlock";
import GrammarVerbTableBlock from "./blocks/GrammarVerbTableBlock";
import GrammarContrastBlock from "./blocks/GrammarContrastBlock";
import GrammarPairsBlock from "./blocks/GrammarPairsBlock";
import GrammarRulesBlock from "./blocks/GrammarRulesBlock";

export default function GrammarCardBody({ blocks }: { blocks: GrammarCardBlock[] }) {
  return (
    <div className="grammar-card__body">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "conjugation":
            return <GrammarConjugationBlock key={i} rows={block.rows} />;
          case "verb-table":
            return <GrammarVerbTableBlock key={i} {...block} />;
          case "contrast":
            return <GrammarContrastBlock key={i} columns={block.columns} />;
          case "pairs":
            return <GrammarPairsBlock key={i} lines={block.lines} />;
          case "rules":
            return <GrammarRulesBlock key={i} rows={block.rows} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
