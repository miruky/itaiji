import { describe, expect, it } from 'vitest';
import { decodeState, encodeState } from './share';

describe('encodeState / decodeState', () => {
  it('モードと本文を往復できる', () => {
    const state = { mode: 'to-kyujitai' as const, text: '国家の経済' };
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it('改行や記号を含む本文も壊さない', () => {
    const text = '學問の發展\n弁論 + 雄弁';
    const decoded = decodeState(encodeState({ mode: 'to-shinjitai', text }));
    expect(decoded.text).toBe(text);
  });

  it('本文が空ならハッシュに t を含めない', () => {
    expect(encodeState({ mode: 'normalize-variants', text: '' })).toBe('m=normalize-variants');
  });

  it('先頭の # は付いていてもいなくても読める', () => {
    expect(decodeState('#m=to-kyujitai')).toEqual({ mode: 'to-kyujitai' });
    expect(decodeState('m=to-kyujitai')).toEqual({ mode: 'to-kyujitai' });
  });

  it('空ハッシュからは何も復元しない', () => {
    expect(decodeState('')).toEqual({});
    expect(decodeState('#')).toEqual({});
  });

  it('未知のモードは無視する', () => {
    expect(decodeState('m=bogus&t=国')).toEqual({ text: '国' });
  });
});
