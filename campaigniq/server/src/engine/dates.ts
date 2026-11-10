// Date helpers. All dates are ISO 'YYYY-MM-DD' strings and all math is UTC (no local-time drift).

export function parseISO(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: string, days: number): string {
  const x = parseISO(d);
  x.setUTCDate(x.getUTCDate() + days);
  return toISO(x);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000);
}

export function dayOfWeek(d: string): number {
  return parseISO(d).getUTCDay(); // 0 = Sunday
}

export function monthKey(d: string): string {
  return d.slice(0, 7);
}
