import type { PaletteCommandItem } from './types.js';

function searchableText(item: PaletteCommandItem): string {
  return [item.name, item.description, item.desc, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function fuzzyMatch(query: string, text: string): boolean {
  if (!query.trim()) {
    return true;
  }
  const lowerQuery = query.toLowerCase();
  const lowerText = (text || '').toLowerCase();
  if (lowerText.includes(lowerQuery)) {
    return true;
  }
  const initials = lowerText
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('');
  return initials.includes(lowerQuery);
}

export function filterCommands(items: PaletteCommandItem[], query: string): PaletteCommandItem[] {
  const normalizedQuery = String(query ?? '').trim();
  if (!normalizedQuery) {
    return [...items];
  }
  return items.filter((item) => fuzzyMatch(normalizedQuery, searchableText(item)));
}
