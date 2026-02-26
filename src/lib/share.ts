import type { Mode } from './convert';

export interface ShareState {
  mode: Mode;
  text: string;
}

const MODES: readonly Mode[] = ['to-shinjitai', 'to-kyujitai', 'normalize-variants'];

function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

/**
 * 変換モードと本文をURLのハッシュ文字列(先頭の # は含まない)へ符号化する。
 * 本文が空のときは t を省き、短いURLにする。
 */
export function encodeState(state: ShareState): string {
  const params = new URLSearchParams();
  params.set('m', state.mode);
  if (state.text !== '') params.set('t', state.text);
  return params.toString();
}

/**
 * URLのハッシュ(先頭の # は任意)から状態を復元する。
 * 妥当なモードと本文だけを返し、壊れた値は無視する。
 */
export function decodeState(hash: string): Partial<ShareState> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw === '') return {};
  const params = new URLSearchParams(raw);
  const out: Partial<ShareState> = {};
  const m = params.get('m');
  if (m !== null && isMode(m)) out.mode = m;
  const t = params.get('t');
  if (t !== null) out.text = t;
  return out;
}
