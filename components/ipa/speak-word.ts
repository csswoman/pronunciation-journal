export function speakWord(word: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.85;
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}
