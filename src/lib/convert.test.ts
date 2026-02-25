import { describe, expect, it } from 'vitest';
import { convert, normalizeVariants, toKyujitai, toShinjitai } from './convert';
import { PAIRS } from './data/kyujitai';

describe('新字体から旧字体へ', () => {
  it('対応表にある字だけを置き換える', () => {
    expect(toKyujitai('国家の経済と芸術')).toBe('國家の經濟と藝術');
  });

  it('かな・英数字・対応のない漢字はそのまま', () => {
    expect(toKyujitai('春はあけぼの。Spring 2026')).toBe('春はあけぼの。Spring 2026');
  });

  it('旧字体が複数ある「弁」は変換しない', () => {
    expect(toKyujitai('弁論と雄弁')).toBe('弁論と雄弁');
  });
});

describe('旧字体から新字体へ', () => {
  it('戦前の表記を現代の字体へ揃える', () => {
    expect(toShinjitai('國家の發展と藝術の價値を論ずる學者')).toBe(
      '国家の発展と芸術の価値を論ずる学者',
    );
  });

  it('「辨・瓣・辯」はいずれも「弁」へ写す', () => {
    expect(toShinjitai('辨明と花瓣と辯論')).toBe('弁明と花弁と弁論');
  });

  it('対応表の全組で 新→旧→新 の往復が成り立つ', () => {
    const shinAll = PAIRS.map(([shin]) => shin).join('');
    const kyuAll = PAIRS.map(([, kyu]) => kyu).join('');
    expect(toKyujitai(shinAll)).toBe(kyuAll);
    expect(toShinjitai(kyuAll)).toBe(shinAll);
  });
});

describe('異体字の正規化', () => {
  it('はしごだか・たつさきを通用字体へ写す', () => {
    expect(normalizeVariants('髙橋さんと山﨑さん')).toBe('高橋さんと山崎さん');
  });

  it('基本多言語面の外の「つちよし」も壊さずに写す', () => {
    expect(normalizeVariants('𠮷田さん')).toBe('吉田さん');
  });
});

describe('convertの断片', () => {
  it('変わった文字は元の字を保持し、変わらない並びはまとまる', () => {
    const r = convert('旧学校', 'to-kyujitai');
    expect(r.segments).toEqual([
      { text: '舊', from: '旧' },
      { text: '學', from: '学' },
      { text: '校' },
    ]);
    expect(r.changed).toBe(2);
    expect(r.text).toBe('舊學校');
  });

  it('変換のない文章は1断片にまとまる', () => {
    const r = convert('ひらがなだけ', 'to-kyujitai');
    expect(r.segments).toEqual([{ text: 'ひらがなだけ' }]);
    expect(r.changed).toBe(0);
  });

  it('空文字列は空の結果を返す', () => {
    const r = convert('', 'to-shinjitai');
    expect(r.segments).toEqual([]);
    expect(r.text).toBe('');
    expect(r.changed).toBe(0);
  });
});
