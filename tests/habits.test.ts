import { describe, expect, it } from "vitest";
import { habitProgress, isToggle, nextCount, normalizeCount } from "@/lib/habits";

describe("habits", () => {
  it("hedefi 1 olan alışkanlık aç/kapa çalışır", () => {
    expect(isToggle(1)).toBe(true);
    expect(nextCount(0, 1, "inc")).toBe(1);
    expect(nextCount(1, 1, "inc")).toBe(0);
  });
  it("sayılan alışkanlık hedefi aşabilir", () => {
    expect(nextCount(8, 8, "inc")).toBe(9);
  });
  it("azaltma 0'ın altına inmez", () => {
    expect(nextCount(0, 8, "dec")).toBe(0);
    expect(nextCount(3, 8, "dec")).toBe(2);
  });
  it("normalizeCount geçersiz değerleri düzeltir", () => {
    expect(normalizeCount(-4)).toBe(0);
    expect(normalizeCount(2.7)).toBe(2);
    expect(normalizeCount(Number.NaN)).toBe(0);
    expect(normalizeCount(5000)).toBe(999);
  });
  it("habitProgress oranı 1'de keser, fazlayı ayrıca verir", () => {
    expect(habitProgress(3, 8)).toEqual({ ratio: 3 / 8, reached: false, extra: 0 });
    expect(habitProgress(10, 8)).toEqual({ ratio: 1, reached: true, extra: 2 });
  });
});
