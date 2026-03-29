export function normalizeInputText(text: string, whiteSpace: 'normal' | 'pre-wrap' = 'normal'): string {
  if (whiteSpace === 'pre-wrap') {
    return text.replace(/\r\n/g, '\n');
  }
  return text.replace(/\s+/g, ' ').trim();
}

export function splitWords(text: string): string[] {
  if (!text) {
    return [];
  }
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}
