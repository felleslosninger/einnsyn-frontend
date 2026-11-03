/**
 * One promise per key, held for `ttlMs` while its period lasts and shared by
 * concurrent callers. A new period replaces the key's entry instead of adding
 * one, and a failure is not held, so the next caller retries.
 */
export function createPeriodCache<T>(
  ttlMs: number,
  now: () => number = Date.now,
) {
  const entries = new Map<
    string,
    { period: string; expiresAt: number; value: Promise<T> }
  >();

  return (key: string, period: string, load: () => Promise<T>): Promise<T> => {
    const entry = entries.get(key);
    if (entry?.period === period && now() < entry.expiresAt) {
      return entry.value;
    }

    const value = load();
    entries.set(key, { period, expiresAt: now() + ttlMs, value });
    value.catch(() => {
      if (entries.get(key)?.value === value) {
        entries.delete(key);
      }
    });
    return value;
  };
}
