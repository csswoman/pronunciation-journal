import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

export interface DeckAuditIssue {
  code: "duplicate-option" | "invalid-answer" | "duplicate-card" | "empty-explanation";
  detail: string;
}

export function auditDeck(deck: GrammarStudyDeckData): DeckAuditIssue[] {
  const issues: DeckAuditIssue[] = [];
  const cardIds = new Set<string>();

  for (const card of deck.cards) {
    if (cardIds.has(card.id)) {
      issues.push({ code: "duplicate-card", detail: card.id });
    }
    cardIds.add(card.id);
  }

  for (const [index, question] of (deck.quiz ?? []).entries()) {
    const normalized = question.options.map((option) => option.trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      issues.push({ code: "duplicate-option", detail: `quiz ${index + 1}` });
    }
    if (question.answer < 0 || question.answer >= question.options.length) {
      issues.push({ code: "invalid-answer", detail: `quiz ${index + 1}` });
    }
    if (!question.explain?.trim()) {
      issues.push({ code: "empty-explanation", detail: `quiz ${index + 1}` });
    }
  }

  return issues;
}
