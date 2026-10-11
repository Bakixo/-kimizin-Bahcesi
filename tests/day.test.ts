import { describe, expect, it } from "vitest";
import { addDays, dayOf, isDay, istanbulHour, today, weekStart, weekdayIndex } from "@/lib/day";

describe("dayOf", () => {
  it("Istanbul 03:59 hâlâ önceki gün", () => {
    expect(dayOf(new Date("2026-10-11T00:59:00Z"))).toBe("2026-10-10");
  });
  it("Istanbul 04:00 yeni gün", () => {
    expect(dayOf(new Date("2026-10-11T01:00:00Z"))).toBe("2026-10-11");
  });
  it("Istanbul 23:30 aynı gün", () => {
    expect(dayOf(new Date("2026-10-11T20:30:00Z"))).toBe("2026-10-11");
  });
  it("Istanbul gece 01:30 önceki güne sayılır", () => {
    expect(dayOf(new Date("2026-10-11T22:30:00Z"))).toBe("2026-10-11");
  });
  it("today verilen ana göre çalışır", () => {
    expect(today(new Date("2026-10-11T09:00:00Z"))).toBe("2026-10-11");
  });
});

describe("takvim yardımcıları", () => {
  it("addDays ay ve yıl sınırını geçer", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("weekdayIndex pazartesiyi 0 sayar", () => {
    expect(weekdayIndex("2026-10-05")).toBe(0);
    expect(weekdayIndex("2026-10-11")).toBe(6);
  });
  it("weekStart pazartesiye döner", () => {
    expect(weekStart("2026-10-11")).toBe("2026-10-05");
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
  });
  it("istanbulHour UTC+3 verir", () => {
    expect(istanbulHour(new Date("2026-10-11T21:00:00Z"))).toBe(0);
  });
  it("isDay biçimi doğrular", () => {
    expect(isDay("2026-10-11")).toBe(true);
    expect(isDay("2026-13-40")).toBe(false);
    expect(isDay("../etc")).toBe(false);
  });
});
