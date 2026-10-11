export type Level = 1 | 2 | 3 | 4 | 5;

export const MOODS: readonly { value: Level; label: string }[] = [
  { value: 5, label: "Çok iyi" },
  { value: 4, label: "İyi" },
  { value: 3, label: "İdare eder" },
  { value: 2, label: "Yorgun" },
  { value: 1, label: "Zor" },
];

export const ENERGY: readonly { value: Level; label: string }[] = [
  { value: 1, label: "Pilim bitik" },
  { value: 2, label: "Biraz düşük" },
  { value: 3, label: "Orta" },
  { value: 4, label: "Canlı" },
  { value: 5, label: "Enerji dolu" },
];

export function moodLabel(value: number): string {
  return MOODS.find((m) => m.value === value)?.label ?? "";
}

export function bestWeekdayLabel(weekday: string): string {
  return `${weekday} günleri genelde daha iyi hissediyorsun.`;
}
