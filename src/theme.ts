export type ThemePref = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'itaiji:theme';

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'auto';
}

/** 設定(light/dark/auto)とシステムの好みから、実際に塗るテーマを決める。 */
export function resolveTheme(pref: ThemePref, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === 'auto') return systemPrefersDark ? 'dark' : 'light';
  return pref;
}

/** auto → light → dark → auto の順で次の設定へ送る。 */
export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
}

export const themeLabels: Record<ThemePref, string> = {
  auto: 'システムに合わせる',
  light: '明',
  dark: '暗',
};
