import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedSaver } from "@/lib/debounce-save";

describe("createDebouncedSaver", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("hızlı ardışık değerlerden yalnızca sonuncusunu kaydeder", async () => {
    const save = vi.fn().mockResolvedValue(true);
    const saver = createDebouncedSaver({ initial: 0, save, onFail: vi.fn() });
    saver.push(1);
    saver.push(2);
    saver.push(3);
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(3);
  });

  it("hata olursa son onaylanan değerle onFail çağırır", async () => {
    const save = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const onFail = vi.fn();
    const saver = createDebouncedSaver({ initial: 0, save, onFail });
    saver.push(2);
    await vi.runAllTimersAsync();
    saver.push(5);
    await vi.runAllTimersAsync();
    expect(onFail).toHaveBeenCalledWith(2);
  });

  it("save fırlatırsa da onFail çağrılır", async () => {
    const save = vi.fn().mockRejectedValue(new Error("ağ"));
    const onFail = vi.fn();
    const saver = createDebouncedSaver({ initial: 4, save, onFail });
    saver.push(5);
    await vi.runAllTimersAsync();
    expect(onFail).toHaveBeenCalledWith(4);
  });

  it("kayıtlar sırayla gider, üst üste binmez", async () => {
    const order: number[] = [];
    const save = vi.fn(async (v: number) => {
      await new Promise((r) => setTimeout(r, 1000));
      order.push(v);
      return true;
    });
    const saver = createDebouncedSaver({ initial: 0, save, onFail: vi.fn() });
    saver.push(1);
    await vi.advanceTimersByTimeAsync(450);
    saver.push(2);
    await vi.runAllTimersAsync();
    expect(order).toEqual([1, 2]);
  });
});
