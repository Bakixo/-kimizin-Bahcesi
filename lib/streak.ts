import { addDays } from "./day";

export function computeStreak(activeDays: readonly string[], todayDay: string): { current: number; longest: number } {
  const days = new Set(activeDays.filter((d) => d <= todayDay));

  let cursor = days.has(todayDay) ? todayDay : addDays(todayDay, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...days].sort()) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  return { current, longest };
}
