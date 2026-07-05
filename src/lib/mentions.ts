// Достаёт уникальные @username из текста (для уведомлений).
export function extractMentions(text: string): string[] {
  const set = new Set<string>();
  for (const m of text.matchAll(/@([a-zA-Z0-9_]+)/g)) {
    set.add(m[1]);
  }
  return [...set];
}
