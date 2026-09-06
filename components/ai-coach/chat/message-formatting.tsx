import type { ReactNode } from 'react'

export function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|(?<![*\w])\*[^*\n]+\*(?!\w)|(?<![_\w])_[^_\n]+_(?!\w))/g)
  return parts.map((part, index) => {
    if (!part) return null
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return <strong key={index} className="font-semibold text-[var(--primary)]">{part.slice(2, -2)}</strong>
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) return <s key={index} className="text-[var(--text-tertiary)]">{part.slice(2, -2)}</s>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="rounded bg-[oklch(0_0_0_/_0.25)] px-1.5 py-0.5 font-mono text-caption text-[var(--primary)]">{part.slice(1, -1)}</code>
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
      elements.push(<ul key={`ul-${index}`} className="space-y-1.5 pl-3 my-2">{items.map((item, itemIndex) => <li key={itemIndex} className="flex gap-2 leading-[1.65] text-body-sm"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--primary)] opacity-70" /><span>{renderInline(item)}</span></li>)}</ul>)
      continue
    }
    if (/^#{1,3}\s+/.test(line)) { elements.push(<p key={`h-${index}`} className="mb-1.5 mt-4 text-caption font-semibold uppercase tracking-widest text-[var(--primary)]/80">{renderInline(line.replace(/^#{1,3}\s+/, ''))}</p>); index++; continue }
    elements.push(<p key={`p-${index}`} className="text-body-sm leading-[1.65]">{renderInline(line)}</p>)
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

/** Fallback reply prompts for turns where the coach offered no explicit suggestions. */
export function generateContextualSuggestions(text: string): Array<{ label: string; prompt: string }> {
  const lower = text.toLowerCase()

  if (lower.includes('smile') || lower.includes('happy') || lower.includes('made your day') || lower.includes('made you feel')) {
    return [
      { label: 'I had a great coffee this morning', prompt: 'I had a great cup of coffee this morning.' },
      { label: 'I talked with a good friend', prompt: 'I had a nice conversation with a good friend today.' },
      { label: 'How do I say it in English?', prompt: 'I want to share something, but how do I say it in English?' },
    ]
  }

  if (lower.includes('how are you') || lower.includes("how's your day") || lower.includes('how was your day')) {
    return [
      { label: "I'm doing well, thank you!", prompt: "I'm doing really well today, thank you! How are you?" },
      { label: "It's been a busy day", prompt: "It's been a pretty busy day for me so far." },
      { label: 'Just relaxing right now', prompt: 'Just relaxing right now and practicing my English.' },
    ]
  }

  if (lower.includes('plan') || lower.includes('weekend') || lower.includes('free time') || lower.includes('hobby')) {
    return [
      { label: 'I plan to relax at home', prompt: "I'm planning to relax at home and watch a movie." },
      { label: 'Going out with friends', prompt: "I'm planning to go out with some friends." },
      { label: 'Working on a project', prompt: "I'll be working on some personal projects." },
    ]
  }

  return [
    { label: 'Could you give me an example?', prompt: 'Could you give me an example to help me understand?' },
    { label: 'Can you rephrase that simpler?', prompt: 'Could you rephrase that in simpler English please?' },
    { label: 'How do I answer this in English?', prompt: 'How would a native speaker typically answer this question?' },
  ]
}
