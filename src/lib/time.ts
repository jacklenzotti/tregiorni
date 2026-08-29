export function formatMinutes(minutes: number): string {
  const clock = minutes % 1440;
  const h = Math.floor(clock / 60);
  const m = clock % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
