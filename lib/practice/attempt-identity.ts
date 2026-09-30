/** UUIDv8: SHA-256 of a versioned, unambiguous identity tuple (122 hash bits). */
export async function practiceEffectId(
  userId: string, attemptId: string, entityType: string, entityId: string, effect: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(['practice-v1', userId, attemptId, entityType, entityId, effect]))
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).slice(0, 16)
  digest[6] = (digest[6] & 0x0f) | 0x80
  digest[8] = (digest[8] & 0x3f) | 0x80
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export interface PracticeAttemptReceipt {
  id: string
  userId: string
  attemptId: string
  createdAt: string
}
