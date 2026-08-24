import { notFound } from 'next/navigation'
import { SoundLab } from '@/components/dev/SoundLab'

export const metadata = {
  title: 'Sound Lab — Dev Only',
}

export default function SoundLabPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <SoundLab />
}
