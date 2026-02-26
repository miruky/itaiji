/**
 * role=tablist のキーボード操作で、矢印・Home・End から移動先の位置を求める。
 * 端では巻き戻す(末尾で ArrowRight を押すと先頭へ)。該当キーでなければ null。
 */
export function rovingIndex(current: number, count: number, key: string): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
