import type { ContentBankItem, ContentBankToolName } from "./types";
import { extractStemFromPayload } from "./stem";

export const MAX_ITEMS_PER_TOOL = 2;
export const BANK_SET_SIZE = 5;

/**
 * Pure selection function: picks up to 5 unseen items from the provided pool,
 * prioritizing items whose topic_id is in `weakTopics`, and enforcing that
 * no more than 2 items share the same `tool_name`.
 *
 * @param items Pool of available content bank items.
 * @param seenStems Set or array of normalized stems that the learner has already seen.
 * @param weakTopics List of topic IDs where the learner has weaker performance.
 */
export function pickBankSet(
  items: ContentBankItem[],
  seenStems: Set<string> | string[],
  weakTopics: string[] = [],
): ContentBankItem[] {
  const seenSet = seenStems instanceof Set ? seenStems : new Set(seenStems);
  const weakSet = new Set(weakTopics);

  const unseenItems: ContentBankItem[] = [];
  const itemStems = new Map<string, string>();

  for (const item of items) {
    if (item.quality_flags >= 3) continue;
    const stem = extractStemFromPayload(item.payload);
    if (!stem) continue;
    if (seenSet.has(stem)) continue;
    unseenItems.push(item);
    itemStems.set(item.id, stem);
  }

  const weakItems: ContentBankItem[] = [];
  const otherItems: ContentBankItem[] = [];

  for (const item of unseenItems) {
    if (weakSet.has(item.topic_id)) {
      weakItems.push(item);
    } else {
      otherItems.push(item);
    }
  }

  const prioritizedCandidates = [...weakItems, ...otherItems];
  const chosen: ContentBankItem[] = [];
  const chosenStems = new Set<string>();
  const toolCounts: Record<ContentBankToolName, number> = {
    render_multiple_choice: 0,
    render_fill_blank: 0,
    render_speaking: 0,
  };

  for (const item of prioritizedCandidates) {
    if (chosen.length >= BANK_SET_SIZE) break;

    const stem = itemStems.get(item.id);
    if (!stem || chosenStems.has(stem)) continue;

    const currentCount = toolCounts[item.tool_name] ?? 0;
    if (currentCount >= MAX_ITEMS_PER_TOOL) continue;

    chosen.push(item);
    chosenStems.add(stem);
    toolCounts[item.tool_name] = currentCount + 1;
  }

  return chosen;
}
