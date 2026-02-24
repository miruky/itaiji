import { KYU_TO_SHIN_ONLY, PAIRS } from './data/kyujitai';
import { VARIANT_ENTRIES } from './data/variants';

export type Mode = 'to-kyujitai' | 'to-shinjitai' | 'normalize-variants';

/** 変換結果の断片。変わった文字は from に元の文字を保持する */
export interface Segment {
  text: string;
  from?: string;
}

export interface ConvertResult {
  text: string;
  segments: Segment[];
  /** 置き換えた文字数(コードポイント単位) */
  changed: number;
}

function buildMap(entries: Iterable<readonly [string, string]>): ReadonlyMap<string, string> {
  const m = new Map<string, string>();
  for (const [from, to] of entries) m.set(from, to);
  return m;
}

const SHIN_TO_KYU = buildMap(PAIRS);

const KYU_TO_SHIN = buildMap([
  ...PAIRS.map(([shin, kyu]) => [kyu, shin] as const),
  ...KYU_TO_SHIN_ONLY,
]);

const VARIANT_TO_CANONICAL = buildMap(
  VARIANT_ENTRIES.flatMap((e) => e.variants.map((v) => [v, e.canonical] as const)),
);

const MAPS: Record<Mode, ReadonlyMap<string, string>> = {
  'to-kyujitai': SHIN_TO_KYU,
  'to-shinjitai': KYU_TO_SHIN,
  'normalize-variants': VARIANT_TO_CANONICAL,
};

export const modeLabels: Record<Mode, string> = {
  'to-kyujitai': '新字体から旧字体へ',
  'to-shinjitai': '旧字体から新字体へ',
  'normalize-variants': '異体字を通用字体へ',
};

/**
 * 1文字ずつ表を引いて置き換える。サロゲートペア(「𠮷」など)を壊さないよう
 * コードポイント単位で走査し、連続する未変換文字はひとつの断片にまとめる。
 */
export function convert(text: string, mode: Mode): ConvertResult {
  const map = MAPS[mode];
  const segments: Segment[] = [];
  let changed = 0;

  for (const ch of text) {
    const to = map.get(ch);
    if (to !== undefined && to !== ch) {
      segments.push({ text: to, from: ch });
      changed += 1;
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && last.from === undefined) {
      last.text += ch;
    } else {
      segments.push({ text: ch });
    }
  }

  return { text: segments.map((s) => s.text).join(''), segments, changed };
}

export function toKyujitai(text: string): string {
  return convert(text, 'to-kyujitai').text;
}

export function toShinjitai(text: string): string {
  return convert(text, 'to-shinjitai').text;
}

export function normalizeVariants(text: string): string {
  return convert(text, 'normalize-variants').text;
}
