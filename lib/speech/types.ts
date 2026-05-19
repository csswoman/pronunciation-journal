export interface SpeechInputResult {
  transcript: string;
  confidence?: number;
  alternatives?: string[];
  source: 'web-speech' | 'gemini';
}

export interface SpeechInputAdapter {
  isSupported(): boolean;
  start(): Promise<void>;
  stop(): Promise<SpeechInputResult>;
  abort(): void;
}
