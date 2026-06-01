import type { ReactNode } from "react";

interface GrammarCardTitleProps {
  title: string;
  titleItalic?: string[];
}

/** Renders title with optional italic phrases (editorial emphasis). */
export default function GrammarCardTitle({ title, titleItalic }: GrammarCardTitleProps) {
  if (!titleItalic?.length) {
    return <h3 className="grammar-card__title">{title}</h3>;
  }

  let remaining = title;
  const parts: ReactNode[] = [];

  for (const phrase of titleItalic) {
    const idx = remaining.indexOf(phrase);
    if (idx === -1) continue;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    parts.push(
      <em key={phrase}>{phrase}</em>
    );
    remaining = remaining.slice(idx + phrase.length);
  }
  if (remaining) parts.push(remaining);

  return <h3 className="grammar-card__title">{parts.length > 0 ? parts : title}</h3>;
}
