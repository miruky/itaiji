import { KYU_TO_SHIN_ONLY, PAIRS } from './data/kyujitai';
import { VARIANT_ENTRIES } from './data/variants';

export interface CharInfo {
  /** 引いた文字 */
  char: string;
  /** 同じ字のグループ(自身を含む)。先頭が通用字体・新字体 */
  group: string[];
  kind: 'kyujitai' | 'variant';
  note?: string;
}

interface GroupEntry {
  group: string[];
  kind: 'kyujitai' | 'variant';
  note?: string;
}

const INDEX: ReadonlyMap<string, GroupEntry> = (() => {
  const index = new Map<string, GroupEntry>();

  // 旧字体グループ。「弁」のように旧字体が複数あるものは1グループにまとめる
  const kyuGroups = new Map<string, string[]>();
  for (const [shin, kyu] of PAIRS) {
    const g = kyuGroups.get(shin) ?? [shin];
    g.push(kyu);
    kyuGroups.set(shin, g);
  }
  for (const [kyu, shin] of KYU_TO_SHIN_ONLY) {
    const g = kyuGroups.get(shin) ?? [shin];
    g.push(kyu);
    kyuGroups.set(shin, g);
  }
  for (const group of kyuGroups.values()) {
    const entry: GroupEntry = { group, kind: 'kyujitai' };
    for (const ch of group) index.set(ch, entry);
  }

  // 人名異体字グループ。新旧と重なる字(邊など)は異体字側の注記を優先する
  for (const e of VARIANT_ENTRIES) {
    const group = [e.canonical, ...e.variants];
    const entry: GroupEntry = { group, kind: 'variant', note: e.note };
    for (const ch of group) index.set(ch, entry);
  }

  return index;
})();

/** 1文字を字典から引く。新旧字体にも異体字にも該当しなければundefined */
export function lookupChar(char: string): CharInfo | undefined {
  const entry = INDEX.get(char);
  if (!entry) return undefined;
  return {
    char,
    group: entry.group,
    kind: entry.kind,
    ...(entry.note !== undefined ? { note: entry.note } : {}),
  };
}

/** 字典に載っている全グループ(UIの一覧表示用) */
export function allGroups(): { group: string[]; kind: 'kyujitai' | 'variant'; note?: string }[] {
  const seen = new Set<GroupEntry>();
  const out: GroupEntry[] = [];
  for (const entry of INDEX.values()) {
    if (seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
  }
  return out.map((e) => ({ ...e }));
}
