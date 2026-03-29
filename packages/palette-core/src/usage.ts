import type { PaletteUsageMap } from './types.js';

export function recordCommandUsage(usageStats: PaletteUsageMap, commandId: string, now = Date.now()): PaletteUsageMap {
  if (!String(commandId ?? '').trim()) {
    return { ...usageStats };
  }
  const current = usageStats[commandId] ?? { count: 0, lastUsed: 0 };
  return {
    ...usageStats,
    [commandId]: {
      count: current.count + 1,
      lastUsed: now,
    },
  };
}

export function cleanupUsageStats(usageStats: PaletteUsageMap, retentionMs = 90 * 24 * 60 * 60 * 1000, now = Date.now()): PaletteUsageMap {
  return Object.entries(usageStats).reduce<PaletteUsageMap>((accumulator, [commandId, stat]) => {
    if (now - stat.lastUsed <= retentionMs) {
      accumulator[commandId] = stat;
    }
    return accumulator;
  }, {});
}
