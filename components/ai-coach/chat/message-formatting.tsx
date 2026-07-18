import type { ReactNode } from 'react'

export function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|(?<![*\w])\*[^*\n]+\*(?!\w)|(?<![_\w])_[^_\n]+_(?!\w))/g)
  return parts.map((part, index) => {
    if (!part) return null
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return <strong key={index} className="font-semibold text-[var(--primary)]">{part.slice(2, -2)}</strong>
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) return <s key={index} className="text-[var(--text-tertiary)]">{part.slice(2, -2)}</s>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="rounded bg-[oklch(0_0_0_/_0.25)] px-1.5 py-0.5 font-mono text-xs text-[var(--primary)]">{part.slice(1, -1)}</code>
    if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) || (part.startsWith('_') && part.endsWith('_') && part.length > 2)) return <em key={index} className="italic text-[var(--text-primary)]">{part.slice(1, -1)}</em>
    return part
  })
}

export function renderProse(lines: string[]) {
  const elements: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*•]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*•]\s+/, ''))
      elements.push(<ul key={`ul-${index}`} className="space-y-1.5 pl-3 my-2">{items.map((item, itemIndex) => <li key={itemIndex} className="flex gap-2 leading-[1.65] text-[15px]"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--primary)] opacity-70" /><span>{renderInline(item)}</span></li>)}</ul>)
      continue
    }
    if (/^#{1,3}\s+/.test(line)) { elements.push(<p key={`h-${index}`} className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]/80">{renderInline(line.replace(/^#{1,3}\s+/, ''))}</p>); index++; continue }
    elements.push(<p key={`p-${index}`} className="text-[15px] leading-[1.65]">{renderInline(line)}</p>)
    index++
  }
  return elements
}

export function formatMessageTime(date: Date | string | undefined): string {
  if (!date) return ''
  return (typeof date === 'string' ? new Date(date) : date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function extractSentenceContext(fullText: string, selected: string): string {
  return fullText.split(/(?<=[.!?])\s+/).find((sentence) => sentence.toLowerCase().includes(selected.toLowerCase()))?.trim() || selected
}

export function extractSuggestions(text: string): string[] {
  const match = text.match(/suggestions?:\s*([\s\S]*?)(?:\n\n|$)/i)
  return match ? match[1].split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) : []
}
