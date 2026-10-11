export const HARD_DAY_MESSAGES = [
  "Bazı günler böyle, bu tamamen normal. Bugün sadece kendine nazik ol yeter.",
  "Zor bir gün bahçeni soldurmaz. Yarın yine buradayız.",
  "Bunu söyleyebilmen bile kendine özen göstermek demek. Yanındayız.",
  "Bugün yavaşlamak serbest. Bahçe acele etmez, sen de etme.",
] as const;

export const HARD_DAY_SUGGESTIONS = [
  { key: "water", text: "Bir bardak su iç, acele etmeden." },
  { key: "walk", text: "Sadece 10 dakikalık kısa bir yürüyüşe çık." },
  { key: "sleep", text: "Bu akşam biraz erken yatmayı dene." },
  { key: "music", text: "En sevdiğin şarkıyı aç ve sonuna kadar dinle." },
  { key: "breath", text: "Derin bir nefes al ve omuzlarını gevşet." },
  { key: "friend", text: "Sevdiğin birine kısa bir mesaj at." },
  { key: "tea", text: "Kendine sıcak bir bitki çayı demle." },
] as const;

export type HardDaySuggestion = (typeof HARD_DAY_SUGGESTIONS)[number];

export function findSuggestion(key: string): { key: string; text: string } {
  return HARD_DAY_SUGGESTIONS.find((s) => s.key === key) ?? HARD_DAY_SUGGESTIONS[0];
}

export function pickHardDay(previousKey: string | null, rand: () => number = Math.random) {
  const candidates = HARD_DAY_SUGGESTIONS.filter((s) => s.key !== previousKey);
  const suggestion = candidates[Math.floor(rand() * candidates.length) % candidates.length];
  const message = HARD_DAY_MESSAGES[Math.floor(rand() * HARD_DAY_MESSAGES.length) % HARD_DAY_MESSAGES.length];
  return { message, suggestion: { key: suggestion.key, text: suggestion.text } };
}
