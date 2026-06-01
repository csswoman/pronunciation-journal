export type ParsedCorrection = {
  original: string;
  corrected: string;
};

/**
 * Pulls an inline grammar correction out of coach text so it can render as a card.
 * Returns the remaining body for normal prose rendering.
 */
export function parseCorrection(text: string): {
  correction: ParsedCorrection | null;
  body: string;
} {
  const labeled = text.match(
    /\*\*(?:Original|Before):\*\*\s*["']?([\s\S]+?)["']?\s*\n+\*\*(?:Corrected|After|Fixed):\*\*\s*["']?([\s\S]+?)["']?(?:\n|$)/i,
  );
  if (labeled) {
    return strip(text, labeled[0], {
      original: labeled[1].trim(),
      corrected: labeled[2].trim(),
    });
  }

  const strikeArrow = text.match(/~~([^~]+)~~\s*(?:→|->)\s*\*\*([^*]+)\*\*/);
  if (strikeArrow) {
    return strip(text, strikeArrow[0], {
      original: strikeArrow[1].trim(),
      corrected: strikeArrow[2].trim(),
    });
  }

  const block = text.match(
    /(?:^|\n)(?:✓\s*)?(?:Small correction|Quick fix|Correction)[:.]?\s*\n+([\s\S]*?)(?=\n\n|$)/i,
  );
  if (block) {
    const inner = block[1];
    const innerStrike = inner.match(/~~([^~]+)~~\s*(?:→|->)\s*\*\*([^*]+)\*\*/);
    if (innerStrike) {
      return strip(text, block[0], {
        original: innerStrike[1].trim(),
        corrected: innerStrike[2].trim(),
      });
    }
    const innerLabeled = inner.match(
      /(?:Original|Before):\s*["']?([\s\S]+?)["']?\s*\n+(?:Corrected|After|Fixed):\s*["']?([\s\S]+?)["']?/i,
    );
    if (innerLabeled) {
      return strip(text, block[0], {
        original: innerLabeled[1].trim(),
        corrected: innerLabeled[2].trim(),
      });
    }
  }

  return { correction: null, body: text };
}

function strip(
  text: string,
  matched: string,
  correction: ParsedCorrection,
): { correction: ParsedCorrection; body: string } {
  const body = text.replace(matched, "").replace(/\n{3,}/g, "\n\n").trim();
  return { correction, body };
}
