export function canonicalizeTags(tags: string[]): string[] {
  const canonical = new Set<string>();
  for (const tag of tags) {
    canonical.add(tag.trim().toLowerCase().replace(/[\s_]+/g, '-'));
  }
  return [...canonical];
}
