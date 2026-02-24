import { describe, expect, it } from 'vitest';
import { KYU_TO_SHIN_ONLY, PAIRS } from './data/kyujitai';
import { VARIANT_ENTRIES } from './data/variants';

const codePoints = (s: string): number => [...s].length;

describe('新旧字体対応表の整合性', () => {
  it('新字体・旧字体ともに1文字で、同じ字の組がない', () => {
    for (const [shin, kyu] of PAIRS) {
      expect(codePoints(shin)).toBe(1);
      expect(codePoints(kyu)).toBe(1);
      expect(shin).not.toBe(kyu);
    }
  });

  it('新字体側にも旧字体側にも重複がない', () => {
    const shins = PAIRS.map(([s]) => s);
    const kyus = PAIRS.map(([, k]) => k);
    expect(new Set(shins).size).toBe(shins.length);
    expect(new Set(kyus).size).toBe(kyus.length);
  });

  it('一方向対応の旧字体は双方向表と重複しない', () => {
    const kyus = new Set(PAIRS.map(([, k]) => k));
    for (const [kyu] of KYU_TO_SHIN_ONLY) {
      expect(kyus.has(kyu)).toBe(false);
    }
  });

  it('200組以上を収録している', () => {
    expect(PAIRS.length).toBeGreaterThanOrEqual(200);
  });
});

describe('異体字グループの整合性', () => {
  it('異体字に通用字体そのものを含まない', () => {
    for (const e of VARIANT_ENTRIES) {
      expect(e.variants).not.toContain(e.canonical);
      expect(e.variants.length).toBeGreaterThan(0);
      expect(e.note.length).toBeGreaterThan(0);
    }
  });

  it('異体字が複数のグループにまたがらない', () => {
    const all = VARIANT_ENTRIES.flatMap((e) => [...e.variants]);
    expect(new Set(all).size).toBe(all.length);
  });
});
