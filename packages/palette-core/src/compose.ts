import type { PaletteCommandItem, PaletteCommandSource } from './types.js';

function normalizeCommand(item: PaletteCommandItem): PaletteCommandItem {
  return {
    ...item,
    id: String(item.id ?? '').trim(),
    name: String(item.name ?? '').trim(),
    description: item.description ? String(item.description).trim() : undefined,
    desc: item.desc ? String(item.desc).trim() : undefined,
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean) : undefined,
  };
}

export function composeCommands(sources: PaletteCommandSource[]): PaletteCommandItem[] {
  const byId = new Map<string, PaletteCommandItem>();
  for (const source of sources) {
    if (source.enabled === false) {
      continue;
    }
    for (const candidate of source.items ?? []) {
      const item = normalizeCommand(candidate);
      if (!item.id || !item.name || item.enabled === false) {
        continue;
      }
      byId.set(item.id, {
        ...item,
        source: item.source ?? source.sourceId,
      });
    }
  }
  return [...byId.values()];
}
