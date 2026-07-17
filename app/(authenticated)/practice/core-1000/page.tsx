import { redirect } from 'next/navigation'

/** Legacy URL — keep bookmarks working. */
export default function Core1000LegacyRedirectPage() {
  redirect('/practice/essential-words')
}
