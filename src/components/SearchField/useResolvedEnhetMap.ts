import { useMemo } from 'react';
import { getEnhetHref, type TrimmedEnhet } from '~/lib/utils/enhetUtils';

type ResolvedEnhetMap = {
  /**
   * Lookup table for selection: keys are both enhet `id` and `href`, so URL
   * values can be resolved regardless of which form the caller stored.
   */
  enhetMap: ReadonlyMap<string, TrimmedEnhet>;
  /**
   * Sub-units only (those with a parent). Top-level enheter are intentionally
   * excluded from the picker list.
   */
  enhetList: readonly TrimmedEnhet[];
};

/**
 * Resolves the cache's flat enhet map into one where each enhet's `parent` is
 * the actual parent object (when an intermediate ancestor exists).
 *
 * The cutoff is intentional: a parent reference is attached only when the
 * parent itself has a parent. This hides the top-level root from the
 * displayed ancestor chain ("Kommune X / Etat Y" rather than
 * "Norge / Kommune X / Etat Y").
 */
export function useResolvedEnhetMap(
  rawEnhetMap: ReadonlyMap<string, TrimmedEnhet>,
): ResolvedEnhetMap {
  return useMemo(() => {
    // Collapse the input (which has both id and href keys per enhet) to a
    // unique-by-id map for the resolution walk.
    const rawEnhetById = new Map<string, TrimmedEnhet>();
    for (const enhet of rawEnhetMap.values()) {
      rawEnhetById.set(enhet.id, enhet);
    }

    const resolvedById = new Map<string, TrimmedEnhet>();
    const resolveEnhet = (id: string): TrimmedEnhet | undefined => {
      const existing = resolvedById.get(id);
      if (existing) {
        return existing;
      }
      const enhet = rawEnhetById.get(id);
      if (!enhet) {
        return undefined;
      }

      let parent: TrimmedEnhet | undefined;
      if (typeof enhet.parent === 'string') {
        const rawParent = rawEnhetById.get(enhet.parent);
        if (rawParent?.parent) {
          parent = resolveEnhet(rawParent.id);
        }
      } else if (enhet.parent?.parent) {
        parent = enhet.parent;
      }

      const resolvedEnhet = Object.freeze({ ...enhet, parent });
      resolvedById.set(id, resolvedEnhet);
      return resolvedEnhet;
    };

    const enhetMap = new Map<string, TrimmedEnhet>();
    const enhetList: TrimmedEnhet[] = [];
    for (const enhet of rawEnhetById.values()) {
      const resolved = resolveEnhet(enhet.id);
      if (!resolved) continue;

      enhetMap.set(enhet.id, resolved);
      const href = getEnhetHref(enhet);
      if (href !== enhet.id) {
        enhetMap.set(href, resolved);
      }
      if (enhet.parent) {
        enhetList.push(resolved);
      }
    }

    return { enhetMap, enhetList };
  }, [rawEnhetMap]);
}
