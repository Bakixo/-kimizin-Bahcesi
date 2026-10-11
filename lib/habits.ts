export type HabitKind = "water" | "produce" | "regular_meals" | "walk" | "sleep" | "custom";

export const HABIT_ICONS: Record<HabitKind, string> = {
  water: "💧",
  produce: "🥕",
  regular_meals: "🍽️",
  walk: "👟",
  sleep: "🌙",
  custom: "🌱",
};

export function isToggle(target: number): boolean {
  return target === 1;
}

export function normalizeCount(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(999, Math.max(0, Math.floor(n)));
}

export function nextCount(current: number, target: number, action: "inc" | "dec"): number {
  if (action === "dec") return normalizeCount(current - 1);
  if (isToggle(target)) return current >= 1 ? 0 : 1;
  return normalizeCount(current + 1);
}

export function habitProgress(count: number, target: number): { ratio: number; reached: boolean; extra: number } {
  const c = normalizeCount(count);
  const t = Math.max(1, target);
  return { ratio: Math.min(1, c / t), reached: c >= t, extra: Math.max(0, c - t) };
}
