export {
  convert,
  modeLabels,
  normalizeVariants,
  summarizeChanges,
  toKyujitai,
  toShinjitai,
} from './convert';
export type { ChangeSummary, ConvertResult, Mode, Segment } from './convert';
export { allGroups, lookupChar } from './lookup';
export type { CharInfo } from './lookup';
export { decodeState, encodeState } from './share';
export type { ShareState } from './share';
export { rovingIndex } from './roving';
export { KYU_TO_SHIN_ONLY, PAIRS } from './data/kyujitai';
export { VARIANT_ENTRIES } from './data/variants';
export type { VariantEntry } from './data/variants';
