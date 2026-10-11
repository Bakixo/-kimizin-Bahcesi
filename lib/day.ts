// Türkiye 2016'dan beri yıl boyu UTC+3 kullanıyor; yaz saati yok.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
// Gece geç saatte tutulan kayıtlar önceki güne sayılsın diye gün 04:00'te başlar.
const DAY_START_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function dayOf(instant: Date): string {
  return new Date(instant.getTime() + ISTANBUL_OFFSET_MS - DAY_START_MS).toISOString().slice(0, 10);
}

export function today(now: Date = new Date()): string {
  return dayOf(now);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

export function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function weekStart(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

export function istanbulHour(now: Date = new Date()): number {
  return new Date(now.getTime() + ISTANBUL_OFFSET_MS).getUTCHours();
}

export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
