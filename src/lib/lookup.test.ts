import { describe, expect, it } from 'vitest';
import { allGroups, lookupChar } from './lookup';

describe('lookupChar', () => {
  it('新字体からも旧字体からも同じグループを引ける', () => {
    const fromShin = lookupChar('学');
    const fromKyu = lookupChar('學');
    expect(fromShin?.group).toEqual(['学', '學']);
    expect(fromKyu?.group).toEqual(['学', '學']);
    expect(fromShin?.kind).toBe('kyujitai');
  });

  it('旧字体が複数ある「弁」は1グループにまとまる', () => {
    const info = lookupChar('弁');
    expect(info?.group).toEqual(['弁', '辨', '瓣', '辯']);
  });

  it('人名異体字は注記つきで引ける', () => {
    const info = lookupChar('髙');
    expect(info?.kind).toBe('variant');
    expect(info?.group).toEqual(['高', '髙']);
    expect(info?.note).toContain('はしごだか');
  });

  it('字典にない文字はundefined', () => {
    expect(lookupChar('山')).toBeUndefined();
    expect(lookupChar('あ')).toBeUndefined();
  });

  it('allGroupsは全グループを一度ずつ返す', () => {
    const groups = allGroups();
    const flat = groups.flatMap((g) => g.group);
    // 邊のように新旧と異体字の両方に属する字があるため、グループ間の重複は許す
    expect(groups.length).toBeGreaterThan(200);
    expect(flat).toContain('鹽');
    expect(flat).toContain('𠮷');
  });
});
