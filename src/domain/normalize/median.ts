export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] ?? NaN;
  const lower = sorted[mid - 1] ?? upper;
  return sorted.length % 2 === 1 ? upper : (lower + upper) / 2;
}
