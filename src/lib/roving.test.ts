import { describe, expect, it } from 'vitest';
import { rovingIndex } from './roving';

describe('rovingIndex', () => {
  it('矢印で前後に動き、端は巻き戻す', () => {
    expect(rovingIndex(0, 3, 'ArrowRight')).toBe(1);
    expect(rovingIndex(2, 3, 'ArrowRight')).toBe(0);
    expect(rovingIndex(0, 3, 'ArrowLeft')).toBe(2);
    expect(rovingIndex(1, 3, 'ArrowDown')).toBe(2);
    expect(rovingIndex(1, 3, 'ArrowUp')).toBe(0);
  });

  it('Home・Endで両端へ飛ぶ', () => {
    expect(rovingIndex(1, 3, 'Home')).toBe(0);
    expect(rovingIndex(1, 3, 'End')).toBe(2);
  });

  it('移動に関係ないキーや空のリストでは null', () => {
    expect(rovingIndex(0, 3, 'Enter')).toBeNull();
    expect(rovingIndex(0, 0, 'ArrowRight')).toBeNull();
  });
});
