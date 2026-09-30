import { redirect } from 'next/navigation'

// Legacy route: the word search is configured and played from the games hub.
export default function WordSearchPage() {
  redirect('/practice/games')
}
