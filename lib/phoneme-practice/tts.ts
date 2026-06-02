export function speak(word: string, rate = 1.0): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.rate = rate
  utt.lang = 'en-US'
  window.speechSynthesis.speak(utt)
}
