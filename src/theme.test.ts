import { describe, expect, it } from 'vitest';
import { isThemePref, nextThemePref, resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('明示設定はそのまま採用する', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('autoはシステムの好みに従う', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
  });
});

describe('nextThemePref', () => {
  it('auto → light → dark → auto を一巡する', () => {
    expect(nextThemePref('auto')).toBe('light');
    expect(nextThemePref('light')).toBe('dark');
    expect(nextThemePref('dark')).toBe('auto');
  });
});

describe('isThemePref', () => {
  it('既知の値だけを受け入れる', () => {
    expect(isThemePref('auto')).toBe(true);
    expect(isThemePref('light')).toBe(true);
    expect(isThemePref('dark')).toBe(true);
    expect(isThemePref('sepia')).toBe(false);
    expect(isThemePref(null)).toBe(false);
  });
});
