import { speakText } from "@/lib/speech/synthesis";

export function speakWord(word: string, onEnd?: () => void): void {
  speakText(word, { onEnd });
}
