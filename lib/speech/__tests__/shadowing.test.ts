import { describe, it, expect } from 'vitest';
import {
  splitIntoSentences,
  detectConnectedSpeech,
  estimateSentenceSpeechDurationMs,
} from '../shadowing';

describe('shadowing utilities', () => {
  it('splits paragraph into clean sentences', () => {
    const text = 'Native speakers connect words. Do you hear it? It sounds very natural!';
    const segments = splitIntoSentences(text);

    expect(segments.length).toBe(3);
    expect(segments[0].text).toBe('Native speakers connect words.');
    expect(segments[0].wordCount).toBe(4);
    expect(segments[1].text).toBe('Do you hear it?');
    expect(segments[2].text).toBe('It sounds very natural!');
  });

  it('handles edge cases in splitting', () => {
    expect(splitIntoSentences('')).toEqual([]);
    expect(splitIntoSentences('   ')).toEqual([]);

    const single = splitIntoSentences('Just one sentence without period');
    expect(single.length).toBe(1);
    expect(single[0].text).toBe('Just one sentence without period');
  });

  it('detects connected speech opportunities', () => {
    const sentence = 'Pick it up and turn off the light.';
    const notes = detectConnectedSpeech(sentence);

    expect(notes.length).toBeGreaterThan(0);
    expect(notes.some((n) => n.includes('pick it') || n.includes('turn off'))).toBe(true);
  });

  it('estimates speech duration proportionally to rate', () => {
    const dur1 = estimateSentenceSpeechDurationMs(10, 1.0);
    const durSlow = estimateSentenceSpeechDurationMs(10, 0.5);

    expect(durSlow).toBeGreaterThan(dur1);
    expect(dur1).toBeGreaterThanOrEqual(1200);
  });
});
