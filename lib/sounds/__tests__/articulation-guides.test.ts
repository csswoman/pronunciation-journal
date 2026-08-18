import { describe, it, expect } from 'vitest';
import {
  getArticulationGuide,
} from '../articulation-guides';

describe('articulation-guides', () => {
  it('contains comprehensive guides for major problematic phonemes', () => {
    const essential = ['/θ/', '/ð/', '/iː/', '/ɪ/', '/æ/', '/ə/', '/v/'];

    for (const p of essential) {
      const guide = getArticulationGuide(p);
      expect(guide).toBeDefined();
      expect(guide?.phoneme).toBe(p);
      expect(guide?.tonguePosition).toBeTruthy();
      expect(guide?.lipsPosition).toBeTruthy();
      expect(guide?.spanishTrap).toBeTruthy();
      expect(guide?.keyWords.length).toBeGreaterThan(0);
    }
  });

  it('normalizes phoneme queries with or without slashes', () => {
    expect(getArticulationGuide('θ')).toBeDefined();
    expect(getArticulationGuide('/θ/')).toBeDefined();
    expect(getArticulationGuide('v')).toBeDefined();
  });
});
