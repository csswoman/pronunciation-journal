import { notFound } from 'next/navigation'
import { KokoroBench } from '@/components/dev/KokoroBench'

export const metadata = {
  title: 'Kokoro Bench — Dev Only',
}

/**
 * Temporary measurement page for Plan 039 fase A3. Not linked from any nav —
 * dev-only, same pattern as `dev/sounds`. Delete once the fase A verdict is
 * recorded in `docs/ai/local-voice-models.md` and fase B starts.
 */
export default function KokoroBenchPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <KokoroBench />
}
