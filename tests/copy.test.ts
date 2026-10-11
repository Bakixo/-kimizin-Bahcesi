import { describe, expect, it } from "vitest";
import * as hardDay from "@/lib/copy/hard-day";
import * as mood from "@/lib/copy/mood";
import * as ui from "@/lib/copy/ui";

const FORBIDDEN = ["başarısız", "kaçırdın", "kötü", "yasak", "fazla yedin", "hedefin altında", "tembel", "ceza", "suçlu", "kilo"];

function collect(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (typeof value === "function") {
    for (const args of [[3, "Ada"], [0, null], [1, null], [12, "Ada"], [20, null]]) {
      try {
        collect((value as (...a: unknown[]) => unknown)(...args), out);
      } catch {
        // örnek argüman uymadıysa atla
      }
    }
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collect(v, out));
  return out;
}

describe("metinler", () => {
  const all = collect([ui, hardDay, mood]);

  it("metin havuzu boş değil", () => {
    expect(all.length).toBeGreaterThan(40);
  });

  it.each(FORBIDDEN)("'%s' ifadesi hiçbir metinde geçmez", (word) => {
    const hits = all.filter((s) => s.toLocaleLowerCase("tr").includes(word));
    expect(hits).toEqual([]);
  });

  it("pickHardDay önceki öneriyi tekrar etmez", () => {
    const first = hardDay.HARD_DAY_SUGGESTIONS[0].key;
    for (let i = 0; i < 20; i++) {
      expect(hardDay.pickHardDay(first, () => i / 20).suggestion.key).not.toBe(first);
    }
  });

  it("selam saate göre değişir ve ad yoksa adsız", () => {
    expect(ui.greeting(8, "Ada")).toContain("Ada");
    expect(ui.greeting(8, null)).not.toContain("null");
    expect(ui.greeting(8, null)).not.toBe(ui.greeting(21, null));
  });

  it("seri etiketi 0 ve 1 için yeni başlangıç der", () => {
    expect(ui.streakLabel(0)).toBe(ui.streakLabel(1));
    expect(ui.streakLabel(12)).toContain("12");
  });
});
