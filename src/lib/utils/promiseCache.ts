/**
 * One promise per key, held for `ttlMs` and shared by concurrent callers. A
 * different `version` replaces the key's entry, e.g. today's date for data
 * that changes daily. A failure is not held, so the next caller retries.
 */
export function createPromiseCache<T>(
  ttlMs: number,
  now: () => number = Date.now,
) {
  const entries = new Map<
    string,
    { version: string; expiresAt: number; value: Promise<T> }
  >();

  return (key: string, version: string, load: () => Promise<T>): Promise<T> => {
    const entry = entries.get(key);
    if (entry?.version === version && now() < entry.expiresAt) {
      return entry.value;
    }

    const value = load();
    entries.set(key, { version, expiresAt: now() + ttlMs, value });
    value.catch(() => {
      if (entries.get(key)?.value === value) {
        entries.delete(key);
      }
    });
    return value;
  };
}
