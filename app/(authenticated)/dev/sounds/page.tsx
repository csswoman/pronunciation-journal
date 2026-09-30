import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Sound Lab — Dev Only',
}

export default async function SoundLabPage() {
  if (process.env.NODE_ENV === 'development') {
    const { SoundLab } = await import('@/components/dev/SoundLab')
    return <SoundLab />
  }

  notFound()
}
