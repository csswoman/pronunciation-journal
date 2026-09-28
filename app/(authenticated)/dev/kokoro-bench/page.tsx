import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Kokoro Bench — Dev Only',
}

/**
 * Temporary measurement page for Plan 039 fase A3. Not linked from any nav —
 * dev-only, same pattern as `dev/sounds`. Delete once the fase A verdict is
 * recorded in `docs/ai/local-voice-models.md` and fase B starts.
 */
export default async function KokoroBenchPage() {
  // Keep the stopped spike's worker out of the production dependency graph.
  if (process.env.NODE_ENV === 'development') {
    const { KokoroBench } = await import('@/components/dev/KokoroBench')
    return <KokoroBench />
  }

  notFound()
}
