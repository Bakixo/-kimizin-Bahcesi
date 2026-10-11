type Options<T> = {
  initial: T;
  save: (value: T) => Promise<boolean>;
  onFail: (lastConfirmed: T) => void;
  delayMs?: number;
};

// Hızlı dokunuşları tek kayda indirir; kayıtları sıraya koyar, hata olursa son onaylanan değeri bildirir.
export function createDebouncedSaver<T>({ initial, save, onFail, delayMs = 400 }: Options<T>) {
  let confirmed = initial;
  let latest = initial;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queue: Promise<void> = Promise.resolve();

  function flush() {
    timer = null;
    const value = latest;
    queue = queue.then(async () => {
      const ok = await save(value).catch(() => false);
      if (ok) confirmed = value;
      else onFail(confirmed);
    });
  }

  return {
    push(value: T) {
      latest = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
  };
}
