import type { PaletteCommandItem, PaletteUsageMap } from './types.js';

export function sortCommandsByUsage(
  commands: PaletteCommandItem[],
  usageStats: PaletteUsageMap = {},
  query = ''
): PaletteCommandItem[] {
  if (!commands.length) {
    return [];
  }
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  return [...commands].sort((left, right) => {
    if (left.pinned && !right.pinned) return -1;
    if (!left.pinned && right.pinned) return 1;

    if (normalizedQuery) {
      const leftName = (left.name || '').toLowerCase();
      const rightName = (right.name || '').toLowerCase();
      const leftStartsWith = leftName.startsWith(normalizedQuery);
      const rightStartsWith = rightName.startsWith(normalizedQuery);
      if (leftStartsWith && !rightStartsWith) return -1;
      if (!leftStartsWith && rightStartsWith) return 1;
      return leftName.localeCompare(rightName);
    }

    const leftStats = usageStats[left.id] ?? { count: 0, lastUsed: 0 };
    const rightStats = usageStats[right.id] ?? { count: 0, lastUsed: 0 };

    const leftToday = now - leftStats.lastUsed < oneDayMs;
    const rightToday = now - rightStats.lastUsed < oneDayMs;
    if (leftToday && !rightToday) return -1;
    if (!leftToday && rightToday) return 1;

    const leftWeek = now - leftStats.lastUsed < oneWeekMs;
    const rightWeek = now - rightStats.lastUsed < oneWeekMs;
    if (leftWeek && !rightWeek) return -1;
    if (!leftWeek && rightWeek) return 1;

    if (leftStats.count !== rightStats.count) {
      return rightStats.count - leftStats.count;
    }
    return left.name.localeCompare(right.name);
  });
}
