export type MicState = "idle" | "recording" | "processing" | "done";
export type PhonemeVariant = "correct" | "close" | "failed";
export type AttemptScore = "excellent" | "acceptable" | "poor";

export interface PhonemeResult {
  phoneme: string;
  variant: PhonemeVariant;
}

export interface IpaSegment {
  text: string;
  isFocus: boolean;
}
