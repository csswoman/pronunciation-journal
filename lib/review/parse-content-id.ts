/** Extract word_bank row id from answer_history.content_id. */
export function parseWordBankId(contentId: string): string | null {
  if (contentId.startsWith('word_bank:')) return contentId.slice('word_bank:'.length)
  if (/^[0-9a-f-]{36}$/i.test(contentId)) return contentId
  return null
}
