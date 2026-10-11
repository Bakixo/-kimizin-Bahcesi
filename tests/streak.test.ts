import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/streak";

const T = "2026-10-11";

describe("computeStreak", () => {
  it("boş liste", () => {
    expect(computeStreak([], T)).toEqual({ current: 0, longest: 0 });
  });
  it("yalnızca bugün", () => {
    expect(computeStreak([T], T)).toEqual({ current: 1, longest: 1 });
  });
  it("bugün henüz kayıt yoksa dünden sayar", () => {
    expect(computeStreak(["2026-10-10", "2026-10-09"], T)).toEqual({ current: 2, longest: 2 });
  });
  it("boşluk seriyi böler", () => {
    expect(computeStreak([T, "2026-10-09", "2026-10-08"], T)).toEqual({ current: 1, longest: 2 });
  });
  it("en uzun seri eski olabilir, sırasız ve tekrarlı girdi", () => {
    const days = ["2026-09-03", "2026-09-01", "2026-09-02", "2026-09-02", T];
    expect(computeStreak(days, T)).toEqual({ current: 1, longest: 3 });
  });
  it("gelecek günler sayılmaz", () => {
    expect(computeStreak(["2026-10-12", T], T)).toEqual({ current: 1, longest: 1 });
  });
  it("iki gün önce biten seri güncel değildir", () => {
    expect(computeStreak(["2026-10-09"], T)).toEqual({ current: 0, longest: 1 });
  });
});
